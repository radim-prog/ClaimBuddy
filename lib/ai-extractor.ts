/**
 * AI Extractor — Model-agnostic invoice extraction pipeline
 *
 * 3-round pipeline:
 *   Round 1: OCR text reading (GLM-OCR via ocr-client.ts)
 *   Round 2: AI structured extraction (text → ExtractedInvoice JSON)
 *   Round 3: AI reverse verification (field-by-field check)
 *
 * Supports: OpenAI, Anthropic, Google (configurable in DB)
 * Replaces the old kimi-ai.ts Kimi-specific implementation
 */

import OpenAI from 'openai'
import { OcrClient, OcrResult } from './ocr-client'
import {
  ExtractedInvoice,
  CorrectionRecord,
  RoundResult,
  ExtractionOptions,
  validateInvoiceStructure,
  type DocumentType,
  type PaymentType,
  type SupplierInfo,
  type InvoiceItem,
} from './kimi-ai'
import { supabaseAdmin } from './supabase-admin'
import { decrypt, isEncrypted } from './crypto'

// Re-export types consumers need
export type {
  ExtractedInvoice,
  CorrectionRecord,
  RoundResult,
  ExtractionOptions,
  DocumentType,
  PaymentType,
  SupplierInfo,
  InvoiceItem,
}

export type AIProvider = 'openai' | 'anthropic' | 'google'

export interface AIExtractorConfig {
  provider: AIProvider
  model: string
  apiKey: string
  ocrApiKey?: string // Z.AI API key for OCR
}

interface ExtractionSettingsRow {
  provider: AIProvider
  model: string
  api_key: string
  ocr_api_key: string | null
  is_active: boolean
}

// ============================================================================
// SYSTEM PROMPTS
// ============================================================================

const EXTRACTION_PROMPT = `You are an OCR expert for Czech accounting software. Extract structured data from the provided invoice/document text.

Return ONLY valid JSON (no markdown fences).

Required structure:
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

Rules:
1. If something is unreadable, use null
2. Prices without currency = CZK
3. Dates always YYYY-MM-DD
4. IČO and DIČ without spaces
5. VAT rate: "none" (0%), "low" (12%), "high" (21%)
6. Estimate confidence_score 0-100 based on data quality`

const VERIFICATION_PROMPT = `You are a Czech accounting document verifier. You receive extracted data and the original document text.

Your task is to REVERSE VERIFY each field against the original document:

1. document_number — Is this really the document/invoice number?
2. variable_symbol — Is the VS correct?
3. date_issued, date_tax, date_due — Are dates correct and in YYYY-MM-DD format?
4. supplier.name — Is this really the supplier name?
5. supplier.ico, supplier.dic — Verify IČO and DIČ.
6. total_without_vat, total_vat, total_with_vat — Verify amounts and math.
7. items — Verify each item.
8. If a field is null/empty, try to FIND it in the document.

Return ONLY valid JSON (no markdown fences):
{
  "verified_data": { ... complete corrected data in same format ... },
  "changes": [
    {
      "field": "field_name",
      "original": "original value",
      "corrected": "corrected value",
      "reason": "reason for correction"
    }
  ],
  "fields_not_found": ["fields that could not be verified"],
  "confidence_adjustment": number
}`

// ============================================================================
// KNOWN ISSUES DATABASE
// ============================================================================

interface KnownIssue {
  supplierPattern: RegExp
  description: string
  fix: (invoice: Partial<ExtractedInvoice>) => Partial<ExtractedInvoice>
}

const KNOWN_ISSUES: KnownIssue[] = [
  {
    supplierPattern: /Česká pošta|Ceska posta/i,
    description: 'ČP uses non-standard VS format',
    fix: (invoice) => ({
      ...invoice,
      variable_symbol: invoice.variable_symbol?.replace(/\D/g, '') || invoice.variable_symbol
    })
  },
  {
    supplierPattern: /Microsoft|MS Ireland/i,
    description: 'MS invoices in EUR with reverse charge',
    fix: (invoice) => ({
      ...invoice,
      currency: invoice.currency === 'Kč' ? 'EUR' : invoice.currency
    })
  },
  {
    supplierPattern: /Anthropic|Stripe/i,
    description: 'SaaS invoices in USD/EUR, reverse charge',
    fix: (invoice) => ({ ...invoice, payment_type: 'creditcard' })
  },
  {
    supplierPattern: /Městský úřad|Mestsky urad|Magistrát/i,
    description: 'Public administration, specific VS',
    fix: (invoice) => ({ ...invoice, payment_type: 'draft' })
  },
  {
    supplierPattern: /MojeSidlo|Moje Sídlo/i,
    description: 'Recurring virtual office invoices',
    fix: (invoice) => ({ ...invoice, document_type: 'receivedInvoice' })
  },
]

// ============================================================================
// AI EXTRACTOR CLASS
// ============================================================================

export class AIExtractor {
  private client: OpenAI
  private ocrClient: OcrClient
  private config: AIExtractorConfig

  constructor(config: AIExtractorConfig) {
    this.config = config
    this.ocrClient = new OcrClient(config.ocrApiKey)

    // All providers use OpenAI-compatible API
    const baseUrls: Record<AIProvider, string> = {
      openai: 'https://api.openai.com/v1',
      anthropic: 'https://api.anthropic.com/v1',
      google: 'https://generativelanguage.googleapis.com/v1beta/openai',
    }

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: baseUrls[config.provider],
      ...(config.provider === 'anthropic' ? {
        defaultHeaders: {
          'anthropic-version': '2023-06-01',
          'x-api-key': config.apiKey,
        }
      } : {}),
    })
  }

  /**
   * Full 3-round extraction pipeline
   */
  async extractFromFile(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    onProgress?: (step: string) => void,
  ): Promise<{ invoice: ExtractedInvoice; ocrResult: OcrResult; roundResults: RoundResult[] }> {
    const allCorrections: CorrectionRecord[] = []
    const roundResults: RoundResult[] = []

    // ── Round 1: OCR ──
    const r1Start = Date.now()
    console.log(`[AIExtractor] Round 1: OCR reading ${filename}`)
    onProgress?.('ocr')

    let ocrResult: OcrResult
    if (this.ocrClient.isAvailable()) {
      ocrResult = await this.ocrClient.processFile(buffer, mimeType)
    } else {
      // Fallback: use AI vision if OCR not available
      console.warn('[AIExtractor] OCR not available, using AI vision fallback')
      ocrResult = await this.visionFallback(buffer, mimeType)
    }

    console.log(`[AIExtractor] OCR complete: ${ocrResult.text.length} chars, ${ocrResult.num_pages} pages, ${Date.now() - r1Start}ms`)

    // ── Round 2: AI Structured Extraction ──
    const r2Start = Date.now()
    console.log(`[AIExtractor] Round 2: AI extraction from OCR text`)
    onProgress?.('ai_extraction')

    const round2Invoice = await this.aiExtract(ocrResult.text, filename)

    roundResults.push({
      round: 1, // Combined OCR+extraction as "round 1" in results
      confidence: round2Invoice.confidence_score,
      changedFields: [],
      corrections: [],
      duration_ms: Date.now() - r1Start,
    })
    roundResults.push({
      round: 2,
      confidence: round2Invoice.confidence_score,
      changedFields: [],
      corrections: [],
      duration_ms: Date.now() - r2Start,
    })
    console.log(`[AIExtractor] Round 2 complete: confidence=${round2Invoice.confidence_score}, ${Date.now() - r2Start}ms`)

    // ── Round 3: Reverse Verification ──
    const r3Start = Date.now()
    console.log(`[AIExtractor] Round 3: Reverse verification`)
    onProgress?.('ai_verification')

    const { invoice: verifiedInvoice, corrections } = await this.aiVerify(ocrResult.text, round2Invoice)
    allCorrections.push(...corrections)

    roundResults.push({
      round: 3,
      confidence: verifiedInvoice.confidence_score,
      changedFields: corrections.map(c => c.field),
      corrections,
      duration_ms: Date.now() - r3Start,
    })
    console.log(`[AIExtractor] Round 3 complete: ${corrections.length} corrections, ${Date.now() - r3Start}ms`)

    // Final validation
    const validation = validateInvoiceStructure(verifiedInvoice)
    if (!validation.valid) {
      console.warn(`[AIExtractor] Validation warnings: ${validation.errors.join(', ')}`)
    }

    const finalInvoice: ExtractedInvoice = {
      ...verifiedInvoice,
      status: allCorrections.length > 0 ? 'corrected' : 'validated',
      corrections: allCorrections,
      ocr_engine: `${this.config.provider}/${this.config.model}+glm-ocr`,
      ocr_timestamp: new Date().toISOString(),
    }

    const totalTime = roundResults.reduce((s, r) => s + r.duration_ms, 0)
    console.log(`[AIExtractor] Pipeline complete: ${allCorrections.length} corrections, confidence=${finalInvoice.confidence_score}, ${totalTime}ms`)

    return { invoice: finalInvoice, ocrResult, roundResults }
  }

  /**
   * Fast extraction (rounds 1+2 only, no verification) — for client self-service
   */
  async extractFast(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    onProgress?: (step: string) => void,
  ): Promise<{ invoice: ExtractedInvoice; ocrResult: OcrResult }> {
    onProgress?.('ocr')
    let ocrResult: OcrResult
    if (this.ocrClient.isAvailable()) {
      ocrResult = await this.ocrClient.processFile(buffer, mimeType)
    } else {
      ocrResult = await this.visionFallback(buffer, mimeType)
    }

    onProgress?.('ai_extraction')
    const invoice = await this.aiExtract(ocrResult.text, filename)
    return { invoice, ocrResult }
  }

  /**
   * Round 2: AI structured extraction from OCR text
   */
  private async aiExtract(ocrText: string, filename: string): Promise<ExtractedInvoice> {
    const response = await this.client.chat.completions.create({
      model: this.config.model,
      temperature: 0.1,
      max_tokens: 4096,
      messages: [
        { role: 'system', content: EXTRACTION_PROMPT },
        {
          role: 'user',
          content: `Extract data from this invoice:\n\n---\n${ocrText}\n---\n\nReturn only the JSON object.`
        },
      ],
    })

    const content = response.choices[0]?.message?.content || ''
    const parsed = parseJsonResponse(content)
    const invoice = normalizeInvoiceData(parsed, filename, `${this.config.provider}/${this.config.model}`)
    return applyKnownIssues(invoice)
  }

  /**
   * Round 3: AI reverse verification
   */
  private async aiVerify(
    ocrText: string,
    invoice: ExtractedInvoice,
  ): Promise<{ invoice: ExtractedInvoice; corrections: CorrectionRecord[] }> {
    const now = new Date().toISOString()
    const corrections: CorrectionRecord[] = []

    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        temperature: 0.1,
        max_tokens: 4096,
        messages: [
          { role: 'system', content: VERIFICATION_PROMPT },
          {
            role: 'user',
            content: `ORIGINAL DOCUMENT:\n---\n${ocrText}\n---\n\nEXTRACTED DATA:\n${JSON.stringify(invoice, null, 2)}\n\nVerify each field against the document.`
          },
        ],
      })

      const content = response.choices[0]?.message?.content || ''
      const parsed = parseJsonResponse(content)

      if (!parsed.verified_data) {
        return { invoice, corrections: [] }
      }

      const verifiedInvoice = normalizeInvoiceData(
        parsed.verified_data,
        invoice.source_filename,
        invoice.ocr_engine
      )
      const verifiedFixed = applyKnownIssues(verifiedInvoice)

      // Compare and record corrections
      const fieldsToCompare: Array<{ path: string; get: (inv: ExtractedInvoice) => unknown }> = [
        { path: 'document_number', get: i => i.document_number },
        { path: 'variable_symbol', get: i => i.variable_symbol },
        { path: 'date_issued', get: i => i.date_issued },
        { path: 'date_tax', get: i => i.date_tax },
        { path: 'date_due', get: i => i.date_due },
        { path: 'supplier.name', get: i => i.supplier?.name },
        { path: 'supplier.ico', get: i => i.supplier?.ico },
        { path: 'supplier.dic', get: i => i.supplier?.dic },
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
          const changeInfo = (parsed.changes || []).find((c: { field: string }) => c.field === field.path)
          corrections.push({
            field: field.path,
            originalValue: oldVal,
            correctedValue: newVal,
            reason: changeInfo?.reason || 'Changed during verification',
            round: 3,
            timestamp: now,
          })
        }
      }

      const verificationBonus = corrections.length === 0 ? 5 : Math.max(-5, 3 - corrections.length * 2)
      const newConfidence = Math.min(100, Math.max(0, invoice.confidence_score + verificationBonus))

      return {
        invoice: { ...verifiedFixed, confidence_score: newConfidence },
        corrections,
      }
    } catch (error) {
      console.error('[AIExtractor] Verification error:', error)
      return { invoice, corrections: [] }
    }
  }

  /**
   * Vision fallback when OCR is not available
   */
  private async visionFallback(buffer: Buffer, mimeType: string): Promise<OcrResult> {
    const base64 = buffer.toString('base64')
    const response = await this.client.chat.completions.create({
      model: this.config.model,
      temperature: 0.1,
      max_tokens: 4096,
      messages: [
        {
          role: 'system',
          content: 'You are an OCR assistant. Read all text from the attached document and return it in full. Preserve formatting.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
            { type: 'text', text: 'Extract all text from this document.' },
          ] as any,
        },
      ],
    })

    return {
      text: response.choices[0]?.message?.content || '',
      layout_details: [],
      pages: [],
      num_pages: 1,
    }
  }
}

// ============================================================================
// FACTORY — Load config from DB or env
// ============================================================================

let cachedConfig: AIExtractorConfig | null = null
let configTimestamp = 0
const CONFIG_TTL = 60_000 // 1 minute cache

export async function getExtractorConfig(): Promise<AIExtractorConfig> {
  const now = Date.now()
  if (cachedConfig && now - configTimestamp < CONFIG_TTL) {
    return cachedConfig
  }

  // Try DB first
  try {
    const { data } = await supabaseAdmin
      .from('extraction_settings')
      .select('provider, model, api_key, ocr_api_key, is_active')
      .eq('is_active', true)
      .single()

    if (data) {
      const row = data as ExtractionSettingsRow
      const apiKey = row.api_key && isEncrypted(row.api_key)
        ? decrypt(row.api_key)
        : row.api_key
      const ocrKey = row.ocr_api_key && isEncrypted(row.ocr_api_key)
        ? decrypt(row.ocr_api_key)
        : row.ocr_api_key
      cachedConfig = {
        provider: row.provider,
        model: row.model,
        apiKey: apiKey,
        ocrApiKey: ocrKey || undefined,
      }
      configTimestamp = now
      return cachedConfig
    }
  } catch {
    // Table might not exist yet — fall through to env
  }

  // Fallback to env
  const provider = (process.env.AI_EXTRACTION_PROVIDER || 'openai') as AIProvider
  const model = process.env.AI_EXTRACTION_MODEL || 'gpt-4o-mini'
  const apiKey = provider === 'openai'
    ? process.env.OPENAI_API_KEY || ''
    : provider === 'anthropic'
      ? process.env.ANTHROPIC_API_KEY || ''
      : process.env.GOOGLE_CLOUD_API_KEY || ''

  cachedConfig = {
    provider,
    model,
    apiKey,
    ocrApiKey: process.env.ZAI_API_KEY,
  }
  configTimestamp = now
  return cachedConfig
}

export async function createExtractor(): Promise<AIExtractor> {
  const config = await getExtractorConfig()
  return new AIExtractor(config)
}

/**
 * Drop-in replacement for extractInvoiceFromFile from kimi-ai.ts
 */
export async function extractInvoice(
  buffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<ExtractedInvoice> {
  const extractor = await createExtractor()
  const { invoice } = await extractor.extractFromFile(buffer, filename, mimeType)
  return invoice
}

/**
 * Fast extraction (rounds 1+2 only) — for client self-service
 */
export async function extractInvoiceFast(
  buffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<{ invoice: ExtractedInvoice; ocrResult: OcrResult }> {
  const extractor = await createExtractor()
  return extractor.extractFast(buffer, filename, mimeType)
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function parseJsonResponse(text: string): any {
  let clean = text.trim()
  if (clean.startsWith('```json')) clean = clean.slice(7)
  else if (clean.startsWith('```')) clean = clean.slice(3)
  if (clean.endsWith('```')) clean = clean.slice(0, -3)
  clean = clean.trim()

  try {
    return JSON.parse(clean)
  } catch (error) {
    console.error('[AIExtractor] JSON parse error:', error)
    console.error('[AIExtractor] Raw:', text.substring(0, 500))
    throw new Error('Failed to parse JSON from AI response')
  }
}

function normalizeInvoiceData(data: any, filename: string, engine: string): ExtractedInvoice {
  const now = new Date().toISOString()

  const fieldConfidence = {
    document_number: data.document_number ? 100 : 0,
    date_issued: data.date_issued ? 100 : 0,
    date_tax: data.date_tax ? 100 : 0,
    date_due: data.date_due ? 100 : 0,
    supplier_name: data.supplier?.name ? 100 : 0,
    ico: data.supplier?.ico ? 100 : 0,
    total_with_vat: data.total_with_vat !== undefined ? 100 : 0,
    vat_breakdown: (data.price_low !== undefined && data.price_high !== undefined) ? 100 : 0,
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
      name: data.supplier?.name || null,
      ico: data.supplier?.ico || null,
      dic: data.supplier?.dic || null,
      address: data.supplier?.address || null,
      bank_account: data.supplier?.bank_account || null,
      bank_code: data.supplier?.bank_code || null,
    },
    items: Array.isArray(data.items) ? data.items.map((item: any) => ({
      description: item.description || '',
      quantity: Number(item.quantity) || 1,
      unit: item.unit || 'ks',
      unit_price: Number(item.unit_price) || 0,
      total_price: Number(item.total_price) || 0,
      vat_rate: item.vat_rate || 'high',
      vat_amount: Number(item.vat_amount) || 0,
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
    ocr_engine: engine,
    ocr_timestamp: now,
    status: 'extracted',
  }
}

function applyKnownIssues(invoice: ExtractedInvoice): ExtractedInvoice {
  const supplierName = invoice.supplier?.name || ''
  const issuesApplied: string[] = []
  let fixed = { ...invoice }

  for (const issue of KNOWN_ISSUES) {
    if (issue.supplierPattern.test(supplierName)) {
      fixed = { ...fixed, ...issue.fix(fixed) }
      issuesApplied.push(issue.description)
    }
  }

  return { ...fixed, knownIssuesApplied: issuesApplied }
}
