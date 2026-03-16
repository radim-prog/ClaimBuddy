/**
 * Fuel Extractor — parses fuel/gas station receipts from OCR data
 *
 * Auto-detects fuel documents by matching keywords (station names, fuel types)
 * and extracts: date, liters, price_per_liter, total_price, odometer, station_name.
 */

// ── Known fuel station patterns ──

const FUEL_STATION_PATTERNS = [
  /\b(shell)\b/i,
  /\b(mol)\b/i,
  /\b(omv)\b/i,
  /\b(benzina)\b/i,
  /\b(orlen)\b/i,
  /\b(eni)\b/i,
  /\b(agip)\b/i,
  /\b(lukoil)\b/i,
  /\b(tank\s*ono)\b/i,
  /\b(eurooil)\b/i,
  /\b(robin\s*oil)\b/i,
  /\b(čepro)\b/i,
  /\b(globus)\b/i,
  /\b(tesco)\b/i,
  /\b(albert)\b/i,
  /\b(penny)\b/i,
  /\b(makro)\b/i,
  /\b(pump)/i,
  /čerpací\s+stanice/i,
  /\bcs\b.*\b(phm|nafta|benzin)\b/i,
]

const FUEL_TYPE_PATTERNS = [
  /\b(nafta|diesel)\b/i,
  /\b(natural\s*95|benzin\s*95|ba\s*95)\b/i,
  /\b(natural\s*98|benzin\s*98|ba\s*98)\b/i,
  /\b(lpg)\b/i,
  /\b(cng)\b/i,
  /\b(phm)\b/i,
  /\b(motorov[áý]\s*nafta)\b/i,
  /\b(pohonné?\s*hmoty?)\b/i,
  /\b(adblue)\b/i,
]

const FUEL_RECEIPT_KEYWORDS = [
  /\b(litr[ůuy]?|l\b)/i,
  /\b(kč\/?l|czk\/?l)\b/i,
  /\b(stojan|výdejní)\b/i,
  /\b(spotřební\s+daň)\b/i,
]

// ── Types ──

export interface ExtractedFuelData {
  log_date: string          // YYYY-MM-DD
  liters: number
  price_per_liter: number | null
  total_price: number | null
  odometer: number | null
  station_name: string | null
  fuel_type: string | null
  confidence: number        // 0.0 - 1.0
  raw_ocr_fields: Record<string, unknown>
}

export interface FuelDetectionResult {
  document_id: string
  is_fuel_document: boolean
  confidence: number
  extracted: ExtractedFuelData | null
  detection_reasons: string[]
}

// ── Detection ──

/**
 * Checks if a document is likely a fuel receipt based on OCR data and metadata.
 */
export function detectFuelDocument(
  documentId: string,
  ocrData: Record<string, unknown> | null,
  supplierName: string | null,
  documentType: string | null,
): FuelDetectionResult {
  const reasons: string[] = []
  let score = 0

  // Flatten OCR data to searchable text
  const ocrText = flattenOcrText(ocrData)
  const allText = [ocrText, supplierName || ''].join(' ')

  // Check station name patterns
  for (const pattern of FUEL_STATION_PATTERNS) {
    if (pattern.test(allText)) {
      score += 0.3
      reasons.push(`Station match: ${pattern.source}`)
      break
    }
  }

  // Check fuel type keywords
  for (const pattern of FUEL_TYPE_PATTERNS) {
    if (pattern.test(allText)) {
      score += 0.25
      reasons.push(`Fuel type: ${pattern.source}`)
      break
    }
  }

  // Check receipt-specific keywords (liters, price/l)
  let keywordMatches = 0
  for (const pattern of FUEL_RECEIPT_KEYWORDS) {
    if (pattern.test(allText)) {
      keywordMatches++
    }
  }
  if (keywordMatches > 0) {
    score += Math.min(keywordMatches * 0.15, 0.3)
    reasons.push(`${keywordMatches} receipt keywords`)
  }

  // Document type hint
  if (documentType === 'receipt' || documentType === 'cash_receipt') {
    score += 0.1
    reasons.push('Receipt document type')
  }

  // Has liters-like numbers in OCR
  const litersMatch = allText.match(/(\d+[.,]\d{1,2})\s*(?:l\b|litr)/i)
  if (litersMatch) {
    score += 0.15
    reasons.push(`Liters value found: ${litersMatch[1]}`)
  }

  const isFuel = score >= 0.4
  const confidence = Math.min(score, 1.0)

  let extracted: ExtractedFuelData | null = null
  if (isFuel && ocrData) {
    extracted = extractFuelData(ocrData, ocrText, supplierName)
  }

  return {
    document_id: documentId,
    is_fuel_document: isFuel,
    confidence: Math.round(confidence * 100) / 100,
    extracted,
    detection_reasons: reasons,
  }
}

// ── Extraction ──

function extractFuelData(
  ocrData: Record<string, unknown>,
  ocrText: string,
  supplierName: string | null,
): ExtractedFuelData {
  const raw: Record<string, unknown> = {}

  // Extract date
  const dateStr = extractDate(ocrData, ocrText)
  raw.date_raw = dateStr

  // Extract liters
  const liters = extractLiters(ocrText)
  raw.liters_raw = liters?.raw

  // Extract price per liter
  const pricePerLiter = extractPricePerLiter(ocrText)
  raw.price_per_liter_raw = pricePerLiter?.raw

  // Extract total price
  const totalPrice = extractTotalPrice(ocrData, ocrText)
  raw.total_price_raw = totalPrice?.raw

  // Extract odometer
  const odometer = extractOdometer(ocrText)
  raw.odometer_raw = odometer?.raw

  // Extract station name
  const stationName = extractStationName(ocrText, supplierName)

  // Extract fuel type
  const fuelType = extractFuelType(ocrText)

  // Calculate confidence based on extracted fields
  let confidence = 0.3 // base for being detected as fuel
  if (dateStr) confidence += 0.15
  if (liters) confidence += 0.2
  if (totalPrice || pricePerLiter) confidence += 0.15
  if (odometer) confidence += 0.1
  if (stationName) confidence += 0.1

  return {
    log_date: dateStr || new Date().toISOString().split('T')[0],
    liters: liters?.value || 0,
    price_per_liter: pricePerLiter?.value || null,
    total_price: totalPrice?.value || null,
    odometer: odometer?.value || null,
    station_name: stationName,
    fuel_type: fuelType,
    confidence: Math.round(Math.min(confidence, 1.0) * 100) / 100,
    raw_ocr_fields: raw,
  }
}

// ── Field Extractors ──

function extractDate(ocrData: Record<string, unknown>, ocrText: string): string | null {
  // Try structured OCR fields first
  const structured = ocrData as Record<string, unknown>
  for (const key of ['date_issued', 'date', 'datum', 'date_tax', 'invoice_date']) {
    const val = structured[key]
    if (typeof val === 'string' && val.match(/\d{4}-\d{2}-\d{2}/)) {
      return val
    }
  }

  // Parse Czech date formats: DD.MM.YYYY, DD/MM/YYYY
  const datePatterns = [
    /(\d{1,2})[./](\d{1,2})[./](20\d{2})/,
    /(20\d{2})-(\d{2})-(\d{2})/,
  ]

  for (const pattern of datePatterns) {
    const match = ocrText.match(pattern)
    if (match) {
      if (pattern.source.startsWith('(20')) {
        return `${match[1]}-${match[2]}-${match[3]}`
      }
      const day = match[1].padStart(2, '0')
      const month = match[2].padStart(2, '0')
      const year = match[3]
      return `${year}-${month}-${day}`
    }
  }

  return null
}

function extractLiters(text: string): { value: number; raw: string } | null {
  // Pattern: number followed by l/litr/litrů
  const patterns = [
    /(\d+[.,]\d{1,3})\s*(?:l\b|litr[ůuy]?)/i,
    /(?:množství|mnozstvi|objem)\s*:?\s*(\d+[.,]\d{1,3})/i,
    /(\d+[.,]\d{1,3})\s*(?:l\b)\s/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const value = parseFloat(match[1].replace(',', '.'))
      if (value > 0 && value < 500) { // sanity check
        return { value, raw: match[0] }
      }
    }
  }
  return null
}

function extractPricePerLiter(text: string): { value: number; raw: string } | null {
  const patterns = [
    /(\d+[.,]\d{2,3})\s*(?:kč\/?l|czk\/?l)/i,
    /(?:cena\/?l|cena\s+za\s+l)\s*:?\s*(\d+[.,]\d{2,3})/i,
    /(?:jedn\.?\s*cena|j\.c\.)\s*:?\s*(\d+[.,]\d{2,3})/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const raw = match[1] || match[2]
      const value = parseFloat(raw.replace(',', '.'))
      if (value > 10 && value < 100) { // CZK/l sanity
        return { value, raw: match[0] }
      }
    }
  }
  return null
}

function extractTotalPrice(ocrData: Record<string, unknown>, text: string): { value: number; raw: string } | null {
  // Try structured fields
  for (const key of ['total_with_vat', 'total_amount', 'total', 'celkem']) {
    const val = ocrData[key]
    if (typeof val === 'number' && val > 0) {
      return { value: val, raw: `${key}: ${val}` }
    }
    if (typeof val === 'string') {
      const num = parseFloat(val.replace(/\s/g, '').replace(',', '.'))
      if (!isNaN(num) && num > 0) return { value: num, raw: `${key}: ${val}` }
    }
  }

  // Text patterns
  const patterns = [
    /(?:celkem|total|k\s*[úu]hrad[eě]|celkov[áa]\s+cena)\s*:?\s*(\d[\d\s]*[.,]?\d*)\s*(?:kč|czk)?/i,
    /(\d[\d\s]*[.,]\d{2})\s*(?:kč|czk)\s*$/im,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const value = parseFloat(match[1].replace(/\s/g, '').replace(',', '.'))
      if (value > 50 && value < 50000) {
        return { value, raw: match[0] }
      }
    }
  }
  return null
}

function extractOdometer(text: string): { value: number; raw: string } | null {
  const patterns = [
    /(?:tachometr|stav\s+km|km\s+stav|odometer|nájezd)\s*:?\s*(\d{3,7})/i,
    /(\d{4,7})\s*km\b/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const value = parseInt(match[1])
      if (value > 100 && value < 9999999) {
        return { value, raw: match[0] }
      }
    }
  }
  return null
}

function extractStationName(text: string, supplierName: string | null): string | null {
  if (supplierName) return supplierName

  for (const pattern of FUEL_STATION_PATTERNS) {
    const match = text.match(pattern)
    if (match) return match[0].trim()
  }
  return null
}

function extractFuelType(text: string): string | null {
  for (const pattern of FUEL_TYPE_PATTERNS) {
    const match = text.match(pattern)
    if (match) return match[0].trim()
  }
  return null
}

// ── Helpers ──

function flattenOcrText(ocrData: Record<string, unknown> | null): string {
  if (!ocrData) return ''

  const parts: string[] = []

  function walk(obj: unknown) {
    if (typeof obj === 'string') {
      parts.push(obj)
    } else if (typeof obj === 'number') {
      parts.push(String(obj))
    } else if (Array.isArray(obj)) {
      obj.forEach(walk)
    } else if (obj && typeof obj === 'object') {
      Object.values(obj).forEach(walk)
    }
  }

  walk(ocrData)
  return parts.join(' ')
}

/**
 * Batch-detect fuel documents from a list of documents.
 * Returns only those identified as fuel receipts.
 */
export function batchDetectFuelDocuments(
  documents: Array<{
    id: string
    ocr_data: Record<string, unknown> | null
    supplier_name: string | null
    type: string | null
  }>
): FuelDetectionResult[] {
  return documents
    .map(doc => detectFuelDocument(doc.id, doc.ocr_data, doc.supplier_name, doc.type))
    .filter(result => result.is_fuel_document)
    .sort((a, b) => b.confidence - a.confidence)
}
