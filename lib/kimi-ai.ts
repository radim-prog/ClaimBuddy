/**
 * Kimi AI Client - OCR extrakce faktur pomocí Moonshot API
 *
 * Používá OpenAI-compatible API:
 * - Files API pro upload dokumentů
 * - Chat Completion pro OCR a strukturovanou extrakci
 *
 * Vyžaduje: MOONSHOT_API_KEY env var
 */

import OpenAI from 'openai'
import {
  type DocumentType,
  type PaymentType,
  type SupplierInfo,
  type InvoiceItem,
  type ExtractedInvoice,
  type CorrectionRecord,
  type ExtractionOptions,
  type RoundResult,
  type BankStatementResult,
  validateInvoiceStructure,
} from './types/extraction'

// Re-export all types for backward compatibility
export type {
  DocumentType,
  PaymentType,
  SupplierInfo,
  InvoiceItem,
  ExtractedInvoice,
  CorrectionRecord,
  ExtractionOptions,
  RoundResult,
  BankStatementResult,
}
export { validateInvoiceStructure }

// ============================================================================
// KNOWN ISSUES DATABASE - Specifické problémy známých dodavatelů
// ============================================================================

type KnownIssue = {
  supplierPattern: RegExp
  description: string
  fix: (invoice: Partial<ExtractedInvoice>) => Partial<ExtractedInvoice>
}

const KNOWN_ISSUES: KnownIssue[] = [
  {
    supplierPattern: /Česká pošta|Ceska posta/i,
    description: 'ČP používá nestandardní formát VS',
    fix: (invoice) => ({
      ...invoice,
      variable_symbol: invoice.variable_symbol?.replace(/\D/g, '') || invoice.variable_symbol
    })
  },
  {
    supplierPattern: /ORLEN|Benzina/i,
    description: 'ORLEN faktury mají DPH v ceně',
    fix: (invoice) => invoice
  },
  {
    supplierPattern: /Microsoft|MS Ireland/i,
    description: 'MS faktury v EUR s DPH reverse charge',
    fix: (invoice) => ({
      ...invoice,
      currency: invoice.currency === 'Kč' ? 'EUR' : invoice.currency
    })
  },
  {
    supplierPattern: /Anthropic|Stripe/i,
    description: 'SaaS faktury v USD/EUR, reverse charge',
    fix: (invoice) => ({
      ...invoice,
      payment_type: 'creditcard'
    })
  },
  {
    supplierPattern: /Slack|Atlassian|Jira|Confluence/i,
    description: 'SaaS faktury, často USD/EUR',
    fix: (invoice) => invoice
  },
  {
    supplierPattern: /MojeSidlo|Moje Sídlo/i,
    description: 'Opakující se faktury za virtuální sídlo',
    fix: (invoice) => ({
      ...invoice,
      document_type: 'receivedInvoice'
    })
  },
  {
    supplierPattern: /Ofigo|OFI GO/i,
    description: 'Faktury z účetního SW',
    fix: (invoice) => invoice
  },
  {
    supplierPattern: /Městský úřad|Mestsky urad|Magistrát/i,
    description: 'Veřejná správa, specifické VS',
    fix: (invoice) => ({
      ...invoice,
      payment_type: 'draft'
    })
  }
]

// ============================================================================
// SYSTEM PROMPTY PRO KIMI AI
// ============================================================================

// RoundResult type is now in lib/types/extraction.ts

const OCR_SYSTEM_PROMPT = `Jsi OCR expert pro účetní software. Extrahuj data z přiložené faktury/dokladu.

Vrať POUZE validní JSON objekt bez markdown formátování (ne \`\`\`json).

Povinná struktura:
{
  "document_number": "string",
  "variable_symbol": "string|null",
  "constant_symbol": "string|null",
  "specific_symbol": "string|null",
  "date_issued": "YYYY-MM-DD",
  "date_tax": "YYYY-MM-DD",
  "date_due": "YYYY-MM-DD",
  "date_payment": "YYYY-MM-DD|null",
  "document_type": "receivedInvoice|receipt|advanceInvoice|creditNote",
  "payment_type": "cash|creditcard|draft|wire",
  "supplier": {
    "name": "string",
    "ico": "string|null",
    "dic": "string|null",
    "address": "string|null",
    "bank_account": "string|null",
    "bank_code": "string|null"
  },
  "items": [
    {
      "description": "string",
      "quantity": number,
      "unit": "string",
      "unit_price": number,
      "total_price": number,
      "vat_rate": "none|low|high",
      "vat_amount": number
    }
  ],
  "total_without_vat": number,
  "total_vat": number,
  "total_with_vat": number,
  "price_none": number,
  "price_low": number,
  "price_low_vat": number,
  "price_low_sum": number,
  "price_high": number,
  "price_high_vat": number,
  "price_high_sum": number,
  "description": "string",
  "currency": "string",
  "confidence_score": 0-100
}

Pravidla:
1. Pokud je něco nečitelné, použij null
2. Ceny bez měny = CZK
3. Datumy vždy YYYY-MM-DD
4. IČO a DIČ vyextrahuj bez mezer
5. VAT rate: "none" (0%), "low" (12%), "high" (21%)
6. Confidence score odhadni 0-100 podela kvality OCR`

const VERIFICATION_SYSTEM_PROMPT = `Jsi kontrolor účetních dokumentů. Dostaneš extrahovaná data z faktury a původní text dokumentu.

Tvým úkolem je ZPĚTNĚ OVĚŘIT každé pole proti původnímu dokumentu, pole po poli:

1. document_number — Je toto opravdu číslo dokladu/faktury? Není to interní číslo nebo jiný kód?
2. variable_symbol — Je VS správně? Ověř v dokumentu.
3. date_issued, date_tax, date_due — Jsou datumy správné a ve formátu YYYY-MM-DD?
4. supplier.name — Je to skutečně jméno dodavatele?
5. supplier.ico, supplier.dic — Ověř IČO a DIČ v dokumentu.
6. total_without_vat, total_vat, total_with_vat — Ověř částky, zkontroluj matematiku.
7. items — Ověř každou položku (popis, množství, cena).
8. Pokud je nějaké pole null/prázdné, zkus ho CÍLENĚ najít v dokumentu.

Vrať POUZE validní JSON objekt (ne \`\`\`json):
{
  "verified_data": { ... kompletní opravená data ve stejném formátu ... },
  "changes": [
    {
      "field": "název_pole",
      "original": "původní hodnota",
      "corrected": "opravená hodnota",
      "reason": "důvod opravy"
    }
  ],
  "fields_not_found": ["pole které se nepodařilo ověřit"],
  "verification_notes": "celkové poznámky k verifikaci"
}`

const REVISION_SYSTEM_PROMPT = `Jsi senior účetní revizor. Dostaneš:
1. Původní text dokumentu
2. Data po verifikaci (některá pole mohla být opravena)
3. Seznam polí, která byla změněna ve verifikačním kole (ta je třeba zvlášť zkontrolovat)

Tvým úkolem je finální kontrola jako celek:
1. Jsou opravená pole (ze seznamu změn) skutečně správně?
2. Sedí matematika? (základ + DPH = celkem, součet položek = celkem)
3. Jsou datumy konzistentní? (datum vystavení ≤ datum splatnosti)
4. Dává celý doklad smysl jako celek?
5. Je správný typ dokladu (receivedInvoice/receipt/advanceInvoice/creditNote)?

Vrať POUZE validní JSON objekt (ne \`\`\`json):
{
  "final_data": { ... finální opravená data ve stejném formátu ... },
  "changes": [
    {
      "field": "název_pole",
      "original": "hodnota z verifikace",
      "corrected": "finální hodnota",
      "reason": "důvod finální opravy"
    }
  ],
  "validation_passed": true/false,
  "revision_notes": "celkové poznámky k revizi"
}`

// ============================================================================
// KIMI AI CLIENT
// ============================================================================

export class KimiAIClient {
  private client: OpenAI | null = null
  private options: Required<ExtractionOptions>

  constructor(options: ExtractionOptions = {}) {
    const apiKey = process.env.MOONSHOT_API_KEY

    if (!apiKey) {
      console.warn('[KimiAI] MOONSHOT_API_KEY not set - client will return error')
    } else {
      this.client = new OpenAI({
        apiKey,
        baseURL: 'https://api.moonshot.cn/v1'
      })
    }

    this.options = {
      model: options.model || 'kimi-k2.5',
      temperature: options.temperature ?? 0.1,
      maxTokens: options.maxTokens || 4096,
      confidenceThreshold: options.confidenceThreshold || 0.8
    }
  }

  isAvailable(): boolean {
    return !!this.client
  }

  async extractTextFromFile(
    buffer: Buffer,
    filename: string,
    mimeType: string
  ): Promise<string> {
    if (!this.client) {
      throw new Error(
        'MOONSHOT_API_KEY not configured. ' +
        'Set MOONSHOT_API_KEY environment variable to enable Kimi AI extraction.'
      )
    }

    try {

      const fileObject = await this.client.files.create({
        file: new File([new Uint8Array(buffer)], filename, { type: mimeType }),
        purpose: 'user_data' as any
      })


      const response = await this.client.chat.completions.create({
        model: this.options.model,
        temperature: this.options.temperature,
        max_tokens: this.options.maxTokens,
        messages: [
          {
            role: 'system',
            content: 'Jsi OCR asistent. Přečti text z přiloženého dokumentu a vrať ho v plné délce. Zachovej formátování.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'file',
                file_url: {
                  url: `https://api.moonshot.cn/v1/files/${fileObject.id}`
                }
              },
              {
                type: 'text',
                text: `Extrahuj veškerý text z této faktury. Název souboru: ${filename}`
              }
            ] as any
          }
        ]
      })

      const extractedText = response.choices[0]?.message?.content || ''

      try {
        await (this.client.files as any).del(fileObject.id)
      } catch (cleanupError) {
        console.warn(`[KimiAI] Failed to delete file ${fileObject.id}:`, cleanupError)
      }

      return extractedText

    } catch (error) {
      console.error('[KimiAI] extractTextFromFile error:', error)
      throw error
    }
  }

  async extractInvoiceData(
    text: string,
    filename: string = 'unknown'
  ): Promise<ExtractedInvoice> {
    if (!this.client) {
      throw new Error(
        'MOONSHOT_API_KEY not configured. ' +
        'Set MOONSHOT_API_KEY environment variable to enable Kimi AI extraction.'
      )
    }

    try {

      const response = await this.client.chat.completions.create({
        model: this.options.model,
        temperature: this.options.temperature,
        max_tokens: this.options.maxTokens,
        messages: [
          {
            role: 'system',
            content: OCR_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: `Extrahuj data z této faktury:

---
${text}
---

Vrať pouze JSON objekt podle specifikace.`
          }
        ]
      })

      const content = response.choices[0]?.message?.content || ''
      const extracted = this.parseJson(content)
      const invoice = this.normalizeInvoiceData(extracted, filename)
      const fixedInvoice = this.applyKnownIssues(invoice)


      return fixedInvoice

    } catch (error) {
      console.error('[KimiAI] extractInvoiceData error:', error)
      throw error
    }
  }

  async extractFromFile(
    buffer: Buffer,
    filename: string,
    mimeType: string
  ): Promise<ExtractedInvoice> {
    return this.extractWithRounds(buffer, filename, mimeType)
  }

  /**
   * 3-round extraction pipeline:
   * Round 1: Full extraction (text + JSON)
   * Round 2: Field-by-field reverse verification against original document
   * Round 3: Holistic revision of the complete result
   */
  async extractWithRounds(
    buffer: Buffer,
    filename: string,
    mimeType: string
  ): Promise<ExtractedInvoice> {
    const allCorrections: CorrectionRecord[] = []
    const roundResults: RoundResult[] = []

    // ── Round 1: Full extraction ──
    const r1Start = Date.now()
    const text = await this.extractTextFromFile(buffer, filename, mimeType)
    const round1Invoice = await this.extractInvoiceData(text, filename)

    roundResults.push({
      round: 1,
      confidence: round1Invoice.confidence_score,
      changedFields: [],
      corrections: [],
      duration_ms: Date.now() - r1Start,
    })

    // ── Round 2: Field-by-field reverse verification ──
    const r2Start = Date.now()
    const { invoice: round2Invoice, corrections: r2Corrections } =
      await this.verifyFieldByField(text, round1Invoice)

    allCorrections.push(...r2Corrections)
    roundResults.push({
      round: 2,
      confidence: round2Invoice.confidence_score,
      changedFields: r2Corrections.map(c => c.field),
      corrections: r2Corrections,
      duration_ms: Date.now() - r2Start,
    })

    // ── Round 3: Holistic revision ──
    const r3Start = Date.now()
    const changedInR2 = r2Corrections.map(c => c.field)
    const { invoice: round3Invoice, corrections: r3Corrections } =
      await this.reviseAsWhole(text, round2Invoice, changedInR2)

    allCorrections.push(...r3Corrections)
    roundResults.push({
      round: 3,
      confidence: round3Invoice.confidence_score,
      changedFields: r3Corrections.map(c => c.field),
      corrections: r3Corrections,
      duration_ms: Date.now() - r3Start,
    })

    // Final structural validation
    const validation = validateInvoiceStructure(round3Invoice)
    if (!validation.valid) {
      console.warn(`[KimiAI] Final validation warnings: ${validation.errors.join(', ')}`)
    }

    // Build final result
    const finalStatus = allCorrections.length > 0 ? 'corrected' : 'validated'
    const finalInvoice: ExtractedInvoice = {
      ...round3Invoice,
      status: finalStatus as ExtractedInvoice['status'],
      corrections: allCorrections,
    }

    // Attach round results as metadata
    ;(finalInvoice as any).roundResults = roundResults

    const totalTime = roundResults.reduce((s, r) => s + r.duration_ms, 0)

    return finalInvoice
  }

  /**
   * Round 2: Verify each extracted field against the original document text
   */
  private async verifyFieldByField(
    originalText: string,
    invoice: ExtractedInvoice
  ): Promise<{ invoice: ExtractedInvoice; corrections: CorrectionRecord[] }> {
    if (!this.client) throw new Error('MOONSHOT_API_KEY not configured')

    const now = new Date().toISOString()
    const corrections: CorrectionRecord[] = []

    try {
      const response = await this.client.chat.completions.create({
        model: this.options.model,
        temperature: this.options.temperature,
        max_tokens: this.options.maxTokens,
        messages: [
          { role: 'system', content: VERIFICATION_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `PŮVODNÍ DOKUMENT:\n---\n${originalText}\n---\n\nEXTRAHOVANÁ DATA (Kolo 1):\n${JSON.stringify(invoice, null, 2)}\n\nZkontroluj každé pole zpětně v dokumentu a vrať opravený JSON.`
          }
        ]
      })

      const content = response.choices[0]?.message?.content || ''
      const parsed = this.parseJson(content)

      if (!parsed.verified_data) {
        console.warn('[KimiAI] Round 2: No verified_data in response, keeping Round 1 result')
        return { invoice, corrections: [] }
      }

      // Normalize the verified data
      const verifiedInvoice = this.normalizeInvoiceData(parsed.verified_data, invoice.source_filename)
      const verifiedFixed = this.applyKnownIssues(verifiedInvoice)

      // Compare and record corrections
      const fieldsToCompare: Array<{ path: string; get: (inv: ExtractedInvoice) => unknown }> = [
        { path: 'document_number', get: i => i.document_number },
        { path: 'variable_symbol', get: i => i.variable_symbol },
        { path: 'constant_symbol', get: i => i.constant_symbol },
        { path: 'date_issued', get: i => i.date_issued },
        { path: 'date_tax', get: i => i.date_tax },
        { path: 'date_due', get: i => i.date_due },
        { path: 'supplier.name', get: i => i.supplier?.name },
        { path: 'supplier.ico', get: i => i.supplier?.ico },
        { path: 'supplier.dic', get: i => i.supplier?.dic },
        { path: 'supplier.bank_account', get: i => i.supplier?.bank_account },
        { path: 'total_without_vat', get: i => i.total_without_vat },
        { path: 'total_vat', get: i => i.total_vat },
        { path: 'total_with_vat', get: i => i.total_with_vat },
        { path: 'currency', get: i => i.currency },
        { path: 'payment_type', get: i => i.payment_type },
        { path: 'document_type', get: i => i.document_type },
      ]

      for (const field of fieldsToCompare) {
        const oldVal = field.get(invoice)
        const newVal = field.get(verifiedFixed)
        if (String(oldVal ?? '') !== String(newVal ?? '')) {
          const changeInfo = (parsed.changes || []).find((c: any) => c.field === field.path)
          corrections.push({
            field: field.path,
            originalValue: oldVal,
            correctedValue: newVal,
            reason: changeInfo?.reason || 'Changed during verification',
            round: 2,
            timestamp: now,
          })
        }
      }

      // Recalculate confidence: higher if verification confirmed original values
      const totalFields = fieldsToCompare.length
      const changedFields = corrections.length
      const verificationBonus = changedFields === 0 ? 10 : Math.max(-5, 5 - changedFields * 2)
      const newConfidence = Math.min(100, Math.max(0, invoice.confidence_score + verificationBonus))

      return {
        invoice: { ...verifiedFixed, confidence_score: newConfidence, status: 'validated' },
        corrections,
      }
    } catch (error) {
      console.error('[KimiAI] Round 2 verification error:', error)
      // On error, return original with no corrections
      return { invoice, corrections: [] }
    }
  }

  /**
   * Round 3: Holistic revision - check the complete result as a whole
   */
  private async reviseAsWhole(
    originalText: string,
    invoice: ExtractedInvoice,
    changedFieldsInR2: string[]
  ): Promise<{ invoice: ExtractedInvoice; corrections: CorrectionRecord[] }> {
    if (!this.client) throw new Error('MOONSHOT_API_KEY not configured')

    const now = new Date().toISOString()
    const corrections: CorrectionRecord[] = []

    try {
      const changesNote = changedFieldsInR2.length > 0
        ? `\n\nPOLE ZMĚNĚNÁ VE VERIFIKACI (zvlášť zkontroluj):\n${changedFieldsInR2.map(f => `- ${f}`).join('\n')}`
        : '\n\nŽádná pole nebyla změněna ve verifikaci — data potvrzena.'

      const response = await this.client.chat.completions.create({
        model: this.options.model,
        temperature: this.options.temperature,
        max_tokens: this.options.maxTokens,
        messages: [
          { role: 'system', content: REVISION_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `PŮVODNÍ DOKUMENT:\n---\n${originalText}\n---\n\nDATA PO VERIFIKACI (Kolo 2):\n${JSON.stringify(invoice, null, 2)}${changesNote}\n\nProveď finální revizi celého dokladu.`
          }
        ]
      })

      const content = response.choices[0]?.message?.content || ''
      const parsed = this.parseJson(content)

      if (!parsed.final_data) {
        console.warn('[KimiAI] Round 3: No final_data in response, keeping Round 2 result')
        return { invoice, corrections: [] }
      }

      const finalInvoice = this.normalizeInvoiceData(parsed.final_data, invoice.source_filename)
      const finalFixed = this.applyKnownIssues(finalInvoice)

      // Compare Round 2 vs Round 3
      const fieldsToCompare: Array<{ path: string; get: (inv: ExtractedInvoice) => unknown }> = [
        { path: 'document_number', get: i => i.document_number },
        { path: 'variable_symbol', get: i => i.variable_symbol },
        { path: 'date_issued', get: i => i.date_issued },
        { path: 'date_tax', get: i => i.date_tax },
        { path: 'date_due', get: i => i.date_due },
        { path: 'supplier.name', get: i => i.supplier?.name },
        { path: 'supplier.ico', get: i => i.supplier?.ico },
        { path: 'total_without_vat', get: i => i.total_without_vat },
        { path: 'total_vat', get: i => i.total_vat },
        { path: 'total_with_vat', get: i => i.total_with_vat },
      ]

      for (const field of fieldsToCompare) {
        const oldVal = field.get(invoice)
        const newVal = field.get(finalFixed)
        if (String(oldVal ?? '') !== String(newVal ?? '')) {
          const changeInfo = (parsed.changes || []).find((c: any) => c.field === field.path)
          corrections.push({
            field: field.path,
            originalValue: oldVal,
            correctedValue: newVal,
            reason: changeInfo?.reason || 'Changed during revision',
            round: 3,
            timestamp: now,
          })
        }
      }

      // Final confidence: boost if no changes in round 3 (stable result)
      const revisionBonus = corrections.length === 0 ? 5 : -2
      const newConfidence = Math.min(100, Math.max(0, invoice.confidence_score + revisionBonus))

      const finalStatus = corrections.length > 0 ? 'corrected' : 'validated'

      return {
        invoice: { ...finalFixed, confidence_score: newConfidence, status: finalStatus as ExtractedInvoice['status'] },
        corrections,
      }
    } catch (error) {
      console.error('[KimiAI] Round 3 revision error:', error)
      return { invoice, corrections: [] }
    }
  }

  private parseJson(text: string): any {
    let clean = text.trim()

    if (clean.startsWith('```json')) {
      clean = clean.slice(7)
    } else if (clean.startsWith('```')) {
      clean = clean.slice(3)
    }

    if (clean.endsWith('```')) {
      clean = clean.slice(0, -3)
    }

    clean = clean.trim()

    try {
      return JSON.parse(clean)
    } catch (error) {
      console.error('[KimiAI] JSON parse error:', error)
      console.error('[KimiAI] Raw content:', text.substring(0, 500))
      throw new Error('Failed to parse JSON from Kimi response')
    }
  }

  private normalizeInvoiceData(
    data: any,
    filename: string
  ): ExtractedInvoice {
    const now = new Date().toISOString()

    const fieldConfidence = {
      document_number: data.document_number ? 100 : 0,
      date_issued: data.date_issued ? 100 : 0,
      date_tax: data.date_tax ? 100 : 0,
      date_due: data.date_due ? 100 : 0,
      supplier_name: data.supplier?.name ? 100 : 0,
      ico: data.supplier?.ico ? 100 : 0,
      total_with_vat: data.total_with_vat !== undefined ? 100 : 0,
      vat_breakdown: (data.price_low !== undefined && data.price_high !== undefined) ? 100 : 0
    }

    return {
      document_number: data.document_number || '',
      variable_symbol: data.variable_symbol || null,
      constant_symbol: data.constant_symbol || null,
      specific_symbol: data.specific_symbol || null,
      date_issued: data.date_issued || now.split('T')[0],
      date_tax: data.date_tax || data.date_issued || now.split('T')[0],
      date_due: data.date_due || data.date_issued || now.split('T')[0],
      date_payment: data.date_payment || null,
      document_type: data.document_type || 'receivedInvoice',
      payment_type: data.payment_type || 'wire',
      supplier: {
        name: data.supplier?.name || 'Neznámý dodavatel',
        ico: data.supplier?.ico || null,
        dic: data.supplier?.dic || null,
        address: data.supplier?.address || null,
        bank_account: data.supplier?.bank_account || null,
        bank_code: data.supplier?.bank_code || null
      },
      items: Array.isArray(data.items) ? data.items.map((item: any) => ({
        description: item.description || '',
        quantity: Number(item.quantity) || 1,
        unit: item.unit || 'ks',
        unit_price: Number(item.unit_price) || 0,
        total_price: Number(item.total_price) || 0,
        vat_rate: item.vat_rate || 'high',
        vat_amount: Number(item.vat_amount) || 0
      })) : [],
      total_without_vat: Number(data.total_without_vat) || 0,
      total_vat: Number(data.total_vat) || 0,
      total_with_vat: Number(data.total_with_vat) || 0,
      price_none: Number(data.price_none) || 0,
      price_low: Number(data.price_low) || 0,
      price_low_vat: Number(data.price_low_vat) || 0,
      price_low_sum: Number(data.price_low_sum) || 0,
      price_high: Number(data.price_high) || 0,
      price_high_vat: Number(data.price_high_vat) || 0,
      price_high_sum: Number(data.price_high_sum) || 0,
      description: data.description || '',
      currency: data.currency || 'CZK',
      confidence_score: Number(data.confidence_score) || 50,
      field_confidence: data.field_confidence || fieldConfidence,
      source_filename: filename,
      ocr_engine: `kimi-${this.options.model}`,
      ocr_timestamp: now,
      status: 'extracted'
    }
  }

  private applyKnownIssues(invoice: ExtractedInvoice): ExtractedInvoice {
    const supplierName = invoice.supplier?.name || ''
    const issuesApplied: string[] = []

    let fixed = { ...invoice }

    for (const issue of KNOWN_ISSUES) {
      if (issue.supplierPattern.test(supplierName)) {
        fixed = { ...fixed, ...issue.fix(fixed) }
        issuesApplied.push(issue.description)
      }
    }

    return {
      ...fixed,
      knownIssuesApplied: issuesApplied
    }
  }
}

// ============================================================================
// BANK STATEMENT EXTRACTION
// ============================================================================

const BANK_STATEMENT_SYSTEM_PROMPT = `Jsi OCR expert pro české bankovní výpisy. Extrahuj transakce z přiloženého bankovního výpisu.

Podporované banky: Česká spořitelna, ČSOB, Komerční banka, Fio banka, mBank, Raiffeisen, Moneta, Air Bank, UniCredit.

Vrať POUZE validní JSON objekt bez markdown formátování (ne \`\`\`json).

Povinná struktura:
{
  "account_number": "string",
  "bank_code": "string",
  "statement_number": "string|null",
  "period_from": "YYYY-MM-DD",
  "period_to": "YYYY-MM-DD",
  "opening_balance": number,
  "closing_balance": number,
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "amount": number,
      "currency": "CZK",
      "variable_symbol": "string|null",
      "constant_symbol": "string|null",
      "counterparty_account": "string|null",
      "counterparty_name": "string|null",
      "description": "string"
    }
  ]
}

Pravidla:
1. Příjmy = kladné číslo, výdaje = záporné číslo
2. Datumy vždy YYYY-MM-DD
3. Variabilní symbol extrahuj bez mezer a předpon (VS:, v.s.)
4. Pokud je něco nečitelné, použij null
5. Counterparty_name = jméno protistrany transakce
6. Zachovej všechny transakce, nic nevynechávej`

// BankStatementResult type is now in lib/types/extraction.ts

/**
 * Extract bank statement data from a file using Kimi AI OCR
 */
export async function extractBankStatement(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<BankStatementResult> {
  const client = new KimiAIClient()

  if (!client.isAvailable()) {
    throw new Error('MOONSHOT_API_KEY not configured')
  }


  // Step 1: Extract text from file
  const text = await client.extractTextFromFile(buffer, fileName, mimeType)

  // Step 2: Parse bank statement data
  const openai = new OpenAI({
    apiKey: process.env.MOONSHOT_API_KEY!,
    baseURL: 'https://api.moonshot.cn/v1',
  })

  const response = await openai.chat.completions.create({
    model: 'kimi-k2.5',
    temperature: 0.1,
    max_tokens: 8192,
    messages: [
      { role: 'system', content: BANK_STATEMENT_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Extrahuj transakce z tohoto bankovního výpisu:\n\n---\n${text}\n---\n\nVrať pouze JSON objekt podle specifikace.`,
      },
    ],
  })

  const content = response.choices[0]?.message?.content || ''
  let clean = content.trim()
  if (clean.startsWith('```json')) clean = clean.slice(7)
  else if (clean.startsWith('```')) clean = clean.slice(3)
  if (clean.endsWith('```')) clean = clean.slice(0, -3)
  clean = clean.trim()

  const parsed = JSON.parse(clean) as BankStatementResult

  // Normalize transactions
  parsed.transactions = (parsed.transactions || []).map(tx => ({
    date: tx.date || parsed.period_from || new Date().toISOString().split('T')[0],
    amount: Number(tx.amount) || 0,
    currency: tx.currency || 'CZK',
    variable_symbol: tx.variable_symbol?.replace(/\D/g, '') || null,
    constant_symbol: tx.constant_symbol || null,
    counterparty_account: tx.counterparty_account || null,
    counterparty_name: tx.counterparty_name || null,
    description: tx.description || '',
  }))

  return parsed
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export async function extractInvoiceFromFile(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  options?: ExtractionOptions
): Promise<ExtractedInvoice> {
  const client = new KimiAIClient(options)
  return client.extractWithRounds(buffer, filename, mimeType)
}

export async function extractInvoiceFromText(
  text: string,
  filename: string = 'unknown',
  options?: ExtractionOptions
): Promise<ExtractedInvoice> {
  const client = new KimiAIClient(options)
  return client.extractInvoiceData(text, filename)
}

// validateInvoiceStructure is now in lib/types/extraction.ts

export function isKimiAIAvailable(): boolean {
  return !!process.env.MOONSHOT_API_KEY
}

export function getKnownIssueSuppliers(): string[] {
  return KNOWN_ISSUES.map(i => i.supplierPattern.source)
}

export function createKimiAIClient(options?: ExtractionOptions): KimiAIClient {
  return new KimiAIClient(options)
}
