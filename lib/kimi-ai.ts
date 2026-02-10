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


// ============================================================================
// TYPES - Datové struktury pro extrahované doklady (z document-extractor.ts)
// ============================================================================

export type DocumentType = 'receivedInvoice' | 'receipt' | 'advanceInvoice' | 'creditNote'
export type PaymentType = 'cash' | 'creditcard' | 'draft' | 'wire'

export type SupplierInfo = {
  name: string
  ico: string | null
  dic: string | null
  address: string | null
  bank_account: string | null
  bank_code: string | null
}

export type InvoiceItem = {
  description: string
  quantity: number
  unit: string
  unit_price: number
  total_price: number
  vat_rate: 'none' | 'low' | 'high'  // 0%, 12%, 21%
  vat_amount: number
}

/**
 * Hlavní struktura extrahované faktury
 */
export type ExtractedInvoice = {
  // Dokument
  document_number: string
  variable_symbol: string | null
  constant_symbol: string | null
  specific_symbol: string | null

  // Data
  date_issued: string        // YYYY-MM-DD
  date_tax: string          // YYYY-MM-DD
  date_due: string          // YYYY-MM-DD
  date_payment: string | null  // datum úhrady pokud je vidět

  // Typy
  document_type: DocumentType
  payment_type: PaymentType

  // Dodavatel
  supplier: SupplierInfo

  // Položky
  items: InvoiceItem[]

  // Součty
  total_without_vat: number
  total_vat: number
  total_with_vat: number

  // Rozpad DPH
  price_none: number        // 0% základ
  price_low: number         // 12% základ
  price_low_vat: number     // 12% DPH
  price_low_sum: number     // 12% celkem
  price_high: number        // 21% základ
  price_high_vat: number    // 21% DPH
  price_high_sum: number    // 21% celkem

  // Metadata
  description: string       // Záhlaví/popis faktury
  currency: string         // CZK, EUR, ...

  // Confidence
  confidence_score: number  // 0-100 celkové skóre
  field_confidence: {      // Skóre jednotlivých polí
    document_number: number
    date_issued: number
    date_tax: number
    date_due: number
    supplier_name: number
    ico: number
    total_with_vat: number
    vat_breakdown: number
  }

  // Provenance
  source_filename: string
  ocr_engine: string
  ocr_timestamp: string

  // Processing
  status: 'extracted' | 'validated' | 'corrected' | 'approved' | 'rejected'
  corrections?: CorrectionRecord[]
  knownIssuesApplied?: string[]
}

export type CorrectionRecord = {
  field: string
  originalValue: unknown
  correctedValue: unknown
  reason: string
  round: 1 | 2 | 3
  timestamp: string
}

export type ExtractionOptions = {
  model?: string              // Výchozí: kimi-k2.5
  temperature?: number        // Výchozí: 0.1
  maxTokens?: number          // Výchozí: 4096
  confidenceThreshold?: number // Výchozí: 0.8
}

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
      console.log(`[KimiAI] Uploading file: ${filename} (${mimeType})`)

      const fileObject = await this.client.files.create({
        file: new File([new Uint8Array(buffer)], filename, { type: mimeType }),
        purpose: 'user_data' as any
      })

      console.log(`[KimiAI] File uploaded: ${fileObject.id}`)

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
        console.log(`[KimiAI] File deleted: ${fileObject.id}`)
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
      console.log(`[KimiAI] Extracting invoice data from text (${text.length} chars)`)

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

      console.log(`[KimiAI] Extraction complete: ${fixedInvoice.document_number} (${fixedInvoice.supplier?.name})`)

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
    const text = await this.extractTextFromFile(buffer, filename, mimeType)
    const invoice = await this.extractInvoiceData(text, filename)
    return invoice
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
        console.log(`[KimiAI] Applying known issue: ${issue.description}`)
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
// UTILITY FUNCTIONS
// ============================================================================

export async function extractInvoiceFromFile(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  options?: ExtractionOptions
): Promise<ExtractedInvoice> {
  const client = new KimiAIClient(options)
  return client.extractFromFile(buffer, filename, mimeType)
}

export async function extractInvoiceFromText(
  text: string,
  filename: string = 'unknown',
  options?: ExtractionOptions
): Promise<ExtractedInvoice> {
  const client = new KimiAIClient(options)
  return client.extractInvoiceData(text, filename)
}

export function validateInvoiceStructure(
  invoice: Partial<ExtractedInvoice>
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!invoice.document_number) errors.push('Missing document_number')
  if (!invoice.date_issued) errors.push('Missing date_issued')
  if (!invoice.total_with_vat && invoice.total_with_vat !== 0) {
    errors.push('Missing total_with_vat')
  }
  if (!invoice.supplier?.name) errors.push('Missing supplier.name')

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (invoice.date_issued && !dateRegex.test(invoice.date_issued)) {
    errors.push('Invalid date_issued format (expected YYYY-MM-DD)')
  }

  if (invoice.total_with_vat !== undefined && invoice.total_with_vat < 0) {
    errors.push('total_with_vat cannot be negative')
  }

  if (invoice.total_without_vat && invoice.total_vat && invoice.total_with_vat) {
    const calculated = invoice.total_without_vat + invoice.total_vat
    const tolerance = 0.01
    if (Math.abs(calculated - invoice.total_with_vat) > tolerance) {
      errors.push(`VAT math error: ${invoice.total_without_vat} + ${invoice.total_vat} ≠ ${invoice.total_with_vat}`)
    }
  }

  return { valid: errors.length === 0, errors }
}

export function isKimiAIAvailable(): boolean {
  return !!process.env.MOONSHOT_API_KEY
}

export function getKnownIssueSuppliers(): string[] {
  return KNOWN_ISSUES.map(i => i.supplierPattern.source)
}

export function createKimiAIClient(options?: ExtractionOptions): KimiAIClient {
  return new KimiAIClient(options)
}
