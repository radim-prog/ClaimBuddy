import Anthropic from '@anthropic-ai/sdk'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DocumentType = 'receivedInvoice' | 'issuedInvoice' | 'receipt' | 'advanceInvoice'

export type PaymentType = 'cash' | 'creditcard' | 'draft'

export type SupplierInfo = {
  company: string
  street: string
  city: string
  zip_code: string
  ico: string
  dic: string
  country: string
  phone: string
  email: string
  bank_account: string
  bank_code: string
}

export type InvoiceItem = {
  text: string
  quantity: number
  unit: string
  unit_price: number
  price: number
  vat_rate: 0 | 12 | 21
  vat_amount: number
  price_with_vat: number
  code: string
}

export type ExtractedInvoice = {
  document_number: string
  variable_symbol: string
  constant_symbol: string
  date_issued: string
  date_received: string
  date_due: string
  date_taxable: string
  document_type: DocumentType
  payment_type: PaymentType
  supplier: SupplierInfo
  items: InvoiceItem[]
  total_without_vat: number
  total_vat: number
  total_with_vat: number
  price_none: number
  vat_none: number
  sum_none: number
  price_low: number
  vat_low: number
  sum_low: number
  price_high: number
  vat_high: number
  sum_high: number
  description: string
  currency: string
  confidence_score: number
  source_filename: string
}

export type ValidationResult = {
  is_valid: boolean
  corrections: { field: string; original: unknown; corrected: unknown; reason: string }[]
  warnings: string[]
  confidence_scores: Record<string, number>
  corrected_data: Partial<ExtractedInvoice>
}

export type FieldFix = {
  field_name: string
  original_value: unknown
  fixed_value: unknown
  fix_location: string
  confidence: number
  fix_applied: boolean
}

export type FieldStatus = {
  status: 'ok' | 'fixed' | 'warning' | 'error'
  original_value: unknown
  final_value: unknown
  message: string
}

export type ProcessingResult = {
  final_data: ExtractedInvoice
  fields_status: Record<string, FieldStatus>
  processing_log: string[]
}

// ---------------------------------------------------------------------------
// Anthropic client (lazy singleton)
// ---------------------------------------------------------------------------

const MODEL = 'claude-sonnet-4-20250514'

function getClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }
  return new Anthropic({ apiKey: key })
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

export const EXTRACTION_PROMPT = `Jsi expertní systém na extrakci dat z českých účetních dokladů (faktury, paragony, zálohové faktury).

PRAVIDLA:
- Číslo dokladu (document_number) vždy čti Z OBSAHU DOKUMENTU, nikdy z názvu souboru.
- IČO musí mít přesně 8 číslic. Pokud vidíš méně, doplň nuly zleva.
- Všechna data uvádej ve formátu YYYY-MM-DD.
- Sazby DPH jsou v ČR: 0 %, 12 % (snížená) a 21 % (základní). Jiné sazby nepoužívej.
- Pokud pole neexistuje na dokladu, vrať prázdný string nebo 0 pro čísla.
- Variabilní symbol (variable_symbol) je často shodný s číslem dokladu, ale nemusí být.
- Měnu uváděj ISO kódem (CZK, EUR, USD).
- Typ dokladu (document_type) urči z kontextu: receivedInvoice, issuedInvoice, receipt, advanceInvoice.
- Typ platby (payment_type): cash, creditcard, draft (převod).
- Základ DPH rozlož na tři sazby:
  - price_none / vat_none / sum_none (osvobozeno, 0 %)
  - price_low / vat_low / sum_low (snížená, 12 %)
  - price_high / vat_high / sum_high (základní, 21 %)
- confidence_score je tvůj odhad kvality extrakce 0.0 - 1.0.

Vrať POUZE validní JSON (bez markdown code bloků, bez komentářů) s touto strukturou:

{
  "document_number": "",
  "variable_symbol": "",
  "constant_symbol": "",
  "date_issued": "",
  "date_received": "",
  "date_due": "",
  "date_taxable": "",
  "document_type": "",
  "payment_type": "",
  "supplier": {
    "company": "",
    "street": "",
    "city": "",
    "zip_code": "",
    "ico": "",
    "dic": "",
    "country": "",
    "phone": "",
    "email": "",
    "bank_account": "",
    "bank_code": ""
  },
  "items": [
    {
      "text": "",
      "quantity": 0,
      "unit": "",
      "unit_price": 0,
      "price": 0,
      "vat_rate": 0,
      "vat_amount": 0,
      "price_with_vat": 0,
      "code": ""
    }
  ],
  "total_without_vat": 0,
  "total_vat": 0,
  "total_with_vat": 0,
  "price_none": 0,
  "vat_none": 0,
  "sum_none": 0,
  "price_low": 0,
  "vat_low": 0,
  "sum_low": 0,
  "price_high": 0,
  "vat_high": 0,
  "sum_high": 0,
  "description": "",
  "currency": "CZK",
  "confidence_score": 0,
  "source_filename": ""
}`

export const VALIDATION_PROMPT = `Jsi validační systém pro českou účetní agendu. Dostaneš obrázek dokladu a již extrahovaná data v JSON.

Tvým úkolem je POROVNAT každé pole extrahovaných dat s tím, co skutečně vidíš na obrázku. Projdi tento checklist:

1. ČÍSLO DOKLADU - souhlasí s číslem vytištěným na dokladu? (NE s názvem souboru)
2. IČO - je přesně 8 číslic? Souhlasí s dokladem?
3. DIČ - formát CZxxxxxxxxx? Souhlasí s dokladem?
4. DODAVATEL - název firmy, adresa, PSČ, město - vše souhlasí?
5. ADRESA - ulice, město, PSČ - souhlasí s dokladem?
6. DATUM VYSTAVENÍ - souhlasí? Formát YYYY-MM-DD?
7. DATUM SPLATNOSTI - souhlasí?
8. DUZP (datum uskutečnění zdanitelného plnění) - souhlasí?
9. POLOŽKY - počet, texty, množství, ceny, sazby DPH - vše souhlasí?
10. CELKOVÁ CENA BEZ DPH - souhlasí součet položek i s celkovou částkou na dokladu?
11. CELKOVÁ DPH - souhlasí výpočet?
12. CELKOVÁ CENA S DPH - souhlasí?
13. ROZPAD DPH - odpovídají price_none/low/high skutečnosti?
14. PLATEBNÍ ÚDAJE - typ platby, bankovní účet, variabilní symbol?
15. VARIABILNÍ SYMBOL - souhlasí s dokladem?

Pro každé pole uveď confidence 0.0 - 1.0.

Vrať POUZE validní JSON (bez markdown code bloků):

{
  "is_valid": true/false,
  "corrections": [
    {
      "field": "název pole",
      "original": "původní hodnota",
      "corrected": "opravená hodnota",
      "reason": "důvod opravy"
    }
  ],
  "warnings": ["seznam upozornění na podezřelé hodnoty"],
  "confidence_scores": {
    "document_number": 0.95,
    "supplier.ico": 0.90
  },
  "corrected_data": {}
}`

export const TARGETED_FIX_PROMPT_TEMPLATE = `Jsi opravný systém pro extrakci dat z českých účetních dokladů.

Potřebuji opravit konkrétní pole z extrahovaného dokladu.

POLE K OPRAVĚ: {{FIELD_NAME}}
AKTUÁLNÍ HODNOTA: {{CURRENT_VALUE}}
DŮVOD OPRAVY: {{ERROR_REASON}}
{{KNOWN_ISSUES_SECTION}}

Podívej se PEČLIVĚ na obrázek dokladu a najdi správnou hodnotu pro toto pole.

Pravidla:
- IČO = přesně 8 číslic (doplň nuly zleva pokud chybí)
- DIČ = CZ + IČO (pro české subjekty)
- Data ve formátu YYYY-MM-DD
- Sazby DPH: 0 %, 12 %, 21 %
- Hledej hodnotu přímo na dokladu, ne v názvu souboru

Vrať POUZE validní JSON (bez markdown code bloků):

{
  "field_name": "{{FIELD_NAME}}",
  "original_value": "{{CURRENT_VALUE}}",
  "fixed_value": null,
  "fix_location": "kde na dokladu jsi hodnotu našel",
  "confidence": 0.0,
  "fix_applied": false
}`

// ---------------------------------------------------------------------------
// Known Issues Database
// ---------------------------------------------------------------------------

export const KNOWN_ISSUES_DATABASE: Record<string, { ico: string; dic: string; notes: string }> = {
  'Česká pošta': {
    ico: '47114983',
    dic: 'CZ47114983',
    notes: 'Česká pošta, s.p. IČO bývá špatně čteno z paragonů (rozmazané). Správné IČO: 47114983.',
  },
  'ORLEN': {
    ico: '49710257',
    dic: 'CZ49710257',
    notes: 'ORLEN Unipetrol RPA (dříve Benzina / Orlen). Účtenky z čerpadel mívají malé rozlišení. IČO: 49710257.',
  },
  'BENZINA': {
    ico: '49710257',
    dic: 'CZ49710257',
    notes: 'BENZINA (nyní ORLEN). Stejné IČO jako ORLEN: 49710257. Staré účtenky mohou mít ještě název Benzina.',
  },
  'Microsoft': {
    ico: '',
    dic: 'IE8256796U',
    notes: 'Microsoft Ireland Operations Ltd. Zahraniční subjekt - irské DIČ. Fakturuje v EUR. Nemá české IČO.',
  },
  'Anthropic': {
    ico: '',
    dic: '',
    notes: 'Anthropic, PBC. Americká firma, nemá české IČO ani DIČ. Fakturuje v USD.',
  },
  'Slack': {
    ico: '',
    dic: 'IE3848637KH',
    notes: 'Slack Technologies Limited (Ireland). Zahraniční subjekt - irské DIČ. Fakturuje v EUR/USD.',
  },
  'Městský úřad': {
    ico: '',
    dic: '',
    notes: 'Městské/obecní úřady - IČO se liší podle města. Ověř na dokladu. Obvykle nejsou plátci DPH.',
  },
  'MojeSidlo': {
    ico: '05765846',
    dic: 'CZ05765846',
    notes: 'MojeSídlo s.r.o. Virtuální sídla a administrativní služby. IČO: 05765846.',
  },
  'Ofigo': {
    ico: '06099297',
    dic: 'CZ06099297',
    notes: 'Ofigo s.r.o. Kancelářské služby a virtuální sídla. IČO: 06099297.',
  },
}

// ---------------------------------------------------------------------------
// Helper: call Claude Vision API
// ---------------------------------------------------------------------------

async function callVision(
  imageBase64: string,
  systemPrompt: string,
  userText: string,
): Promise<string> {
  const client = getClient()

  const mediaType = detectMediaType(imageBase64)

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: userText,
          },
        ],
      },
    ],
    system: systemPrompt,
  })

  const block = response.content.find((b) => b.type === 'text')
  if (!block || block.type !== 'text') {
    throw new Error('Claude API returned no text content')
  }
  return block.text
}

function detectMediaType(base64: string): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' {
  // Check first bytes of base64 for magic numbers
  if (base64.startsWith('/9j/')) return 'image/jpeg'
  if (base64.startsWith('iVBOR')) return 'image/png'
  if (base64.startsWith('UklGR')) return 'image/webp'
  if (base64.startsWith('R0lGO')) return 'image/gif'
  // Default to jpeg if we cannot detect
  return 'image/jpeg'
}

function parseJsonResponse<T>(raw: string): T {
  // Strip markdown code blocks if Claude returned them despite instructions
  let cleaned = raw.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
  }
  return JSON.parse(cleaned) as T
}

function buildTargetedFixPrompt(
  fieldName: string,
  currentValue: unknown,
  errorReason: string,
  supplierName?: string,
): string {
  let knownIssuesSection = ''
  if (supplierName) {
    const match = findKnownIssue(supplierName)
    if (match) {
      knownIssuesSection = `\nZNÁMÝ PROBLÉM PRO TOHOTO DODAVATELE:\n${match.notes}\nZnámé IČO: ${match.ico || 'N/A'}\nZnámé DIČ: ${match.dic || 'N/A'}\n`
    }
  }

  return TARGETED_FIX_PROMPT_TEMPLATE
    .replaceAll('{{FIELD_NAME}}', fieldName)
    .replaceAll('{{CURRENT_VALUE}}', String(currentValue ?? ''))
    .replaceAll('{{ERROR_REASON}}', errorReason)
    .replaceAll('{{KNOWN_ISSUES_SECTION}}', knownIssuesSection)
}

function findKnownIssue(supplierName: string): { ico: string; dic: string; notes: string } | null {
  const nameLower = supplierName.toLowerCase()
  for (const [key, value] of Object.entries(KNOWN_ISSUES_DATABASE)) {
    if (nameLower.includes(key.toLowerCase()) || key.toLowerCase().includes(nameLower)) {
      return value
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Round 1: Extraction
// ---------------------------------------------------------------------------

export async function extractRound1(imageBase64: string): Promise<ExtractedInvoice> {
  const raw = await callVision(
    imageBase64,
    EXTRACTION_PROMPT,
    'Extrahuj všechna data z tohoto účetního dokladu. Vrať JSON.',
  )
  return parseJsonResponse<ExtractedInvoice>(raw)
}

// ---------------------------------------------------------------------------
// Round 2: Validation
// ---------------------------------------------------------------------------

export async function validateRound2(
  imageBase64: string,
  extracted: ExtractedInvoice,
): Promise<ValidationResult> {
  const userText = `Zde jsou extrahovaná data ke kontrole:\n\n${JSON.stringify(extracted, null, 2)}\n\nPorovnej je s obrázkem dokladu a proveď validaci dle checklistu.`
  const raw = await callVision(imageBase64, VALIDATION_PROMPT, userText)
  return parseJsonResponse<ValidationResult>(raw)
}

// ---------------------------------------------------------------------------
// Round 3: Targeted field fix
// ---------------------------------------------------------------------------

export async function fixFieldRound3(
  imageBase64: string,
  fieldName: string,
  currentValue: unknown,
  errorReason: string,
  supplierName?: string,
): Promise<FieldFix> {
  const prompt = buildTargetedFixPrompt(fieldName, currentValue, errorReason, supplierName)
  const raw = await callVision(
    imageBase64,
    prompt,
    `Oprav pole "${fieldName}" z tohoto dokladu.`,
  )
  return parseJsonResponse<FieldFix>(raw)
}

// ---------------------------------------------------------------------------
// Full 3-round pipeline
// ---------------------------------------------------------------------------

export async function extractDocument(
  imageData: Buffer,
  filename: string,
): Promise<ProcessingResult> {
  const log: string[] = []
  const fieldsStatus: Record<string, FieldStatus> = {}

  const imageBase64 = imageData.toString('base64')

  // ---- Round 1: Extraction ----
  log.push(`[Round 1] Spouštím extrakci z dokumentu: ${filename}`)
  let extracted: ExtractedInvoice
  try {
    extracted = await extractRound1(imageBase64)
    extracted.source_filename = filename
    log.push(`[Round 1] Extrakce dokončena. Confidence: ${extracted.confidence_score}`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    log.push(`[Round 1] CHYBA extrakce: ${msg}`)
    throw new Error(`Extraction failed: ${msg}`)
  }

  // ---- Round 2: Validation ----
  log.push('[Round 2] Spouštím validaci extrahovaných dat...')
  let validation: ValidationResult
  try {
    validation = await validateRound2(imageBase64, extracted)
    log.push(
      `[Round 2] Validace dokončena. Platné: ${validation.is_valid}, Oprav: ${validation.corrections.length}, Varování: ${validation.warnings.length}`,
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    log.push(`[Round 2] CHYBA validace: ${msg}. Pokračuji s daty z Round 1.`)
    // If validation fails, return round 1 data with warning statuses
    for (const key of Object.keys(extracted)) {
      fieldsStatus[key] = {
        status: 'warning',
        original_value: (extracted as Record<string, unknown>)[key],
        final_value: (extracted as Record<string, unknown>)[key],
        message: 'Validace selhala - pole nebylo ověřeno.',
      }
    }
    return { final_data: extracted, fields_status: fieldsStatus, processing_log: log }
  }

  // Apply corrections from round 2 directly
  const correctedData = { ...extracted }
  for (const correction of validation.corrections) {
    setNestedField(correctedData, correction.field, correction.corrected)
    log.push(
      `[Round 2] Oprava: ${correction.field}: "${String(correction.original)}" -> "${String(correction.corrected)}" (${correction.reason})`,
    )
  }

  // Merge any corrected_data returned by validation
  if (validation.corrected_data) {
    for (const [key, value] of Object.entries(validation.corrected_data)) {
      if (value !== undefined && value !== null) {
        setNestedField(correctedData, key, value)
      }
    }
  }

  // ---- Round 3: Targeted fixes for low-confidence or errored fields ----
  const fieldsToFix: { field: string; reason: string }[] = []

  // Collect fields with low confidence
  if (validation.confidence_scores) {
    for (const [field, confidence] of Object.entries(validation.confidence_scores)) {
      if (confidence < 0.7) {
        fieldsToFix.push({
          field,
          reason: `Nízká confidence (${confidence}) z validace.`,
        })
      }
    }
  }

  // Also attempt fix for any corrections that have complex nested fields
  for (const correction of validation.corrections) {
    const alreadyQueued = fieldsToFix.some((f) => f.field === correction.field)
    if (!alreadyQueued) {
      fieldsToFix.push({
        field: correction.field,
        reason: correction.reason,
      })
    }
  }

  log.push(`[Round 3] Polí k opravě: ${fieldsToFix.length}`)

  const supplierName = correctedData.supplier?.company || ''

  for (const { field, reason } of fieldsToFix) {
    const currentValue = getNestedField(correctedData, field)
    log.push(`[Round 3] Opravuji pole "${field}" (aktuální: "${String(currentValue)}")...`)

    try {
      const fix = await fixFieldRound3(imageBase64, field, currentValue, reason, supplierName)
      log.push(
        `[Round 3] Výsledek pro "${field}": fixed_value="${String(fix.fixed_value)}", confidence=${fix.confidence}, applied=${fix.fix_applied}`,
      )

      if (fix.fix_applied && fix.confidence >= 0.6) {
        setNestedField(correctedData, field, fix.fixed_value)
        fieldsStatus[field] = {
          status: 'fixed',
          original_value: (extracted as Record<string, unknown>)[field],
          final_value: fix.fixed_value,
          message: `Opraveno v Round 3: ${fix.fix_location}. Confidence: ${fix.confidence}`,
        }
      } else {
        fieldsStatus[field] = {
          status: 'warning',
          original_value: (extracted as Record<string, unknown>)[field],
          final_value: currentValue,
          message: `Pokus o opravu nedostatečný (confidence: ${fix.confidence}). ${reason}`,
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      log.push(`[Round 3] CHYBA při opravě "${field}": ${msg}`)
      fieldsStatus[field] = {
        status: 'error',
        original_value: (extracted as Record<string, unknown>)[field],
        final_value: currentValue,
        message: `Opravu se nepodařilo provést: ${msg}`,
      }
    }
  }

  // Fill in remaining field statuses as "ok"
  const allTopLevelFields = [
    'document_number',
    'variable_symbol',
    'constant_symbol',
    'date_issued',
    'date_received',
    'date_due',
    'date_taxable',
    'document_type',
    'payment_type',
    'supplier',
    'items',
    'total_without_vat',
    'total_vat',
    'total_with_vat',
    'price_none',
    'vat_none',
    'sum_none',
    'price_low',
    'vat_low',
    'sum_low',
    'price_high',
    'vat_high',
    'sum_high',
    'description',
    'currency',
    'confidence_score',
    'source_filename',
  ]

  for (const field of allTopLevelFields) {
    if (!fieldsStatus[field]) {
      const confidence = validation.confidence_scores?.[field]
      fieldsStatus[field] = {
        status: 'ok',
        original_value: (extracted as Record<string, unknown>)[field],
        final_value: (correctedData as Record<string, unknown>)[field],
        message: confidence !== undefined ? `Confidence: ${confidence}` : 'Bez opravy.',
      }
    }
  }

  // Add validation warnings to log
  for (const warning of validation.warnings) {
    log.push(`[Warning] ${warning}`)
  }

  log.push('[Done] Zpracování dokončeno.')

  return {
    final_data: correctedData,
    fields_status: fieldsStatus,
    processing_log: log,
  }
}

// ---------------------------------------------------------------------------
// Utility: nested field access (supports "supplier.ico" style paths)
// ---------------------------------------------------------------------------

function getNestedField(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined
    }
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

function setNestedField(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.')
  let current: Record<string, unknown> = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    if (
      current[part] === null ||
      current[part] === undefined ||
      typeof current[part] !== 'object'
    ) {
      current[part] = {}
    }
    current = current[part] as Record<string, unknown>
  }
  current[parts[parts.length - 1]] = value
}
