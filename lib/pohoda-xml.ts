// @ts-nocheck
/**
 * Pohoda XML Generator (mXML 2.0)
 *
 * Generuje XML soubory pro import faktur do Pohody.
 * Dokumentace: https://www.stormware.cz/pohoda/xml/
 *
 * Použití:
 * - Pro klienty kteří nemají mPohoda API
 * - Pro hromadný export faktur
 * - Pro univerzální import do jakékoliv Pohody
 * - Podpora vydaných i přijatých faktur
 */

import { ExtractedInvoice, InvoiceItem as ExtractedInvoiceItem } from './kimi-ai'

// Types for issued invoices (from invoicing.ts structure)
export type Invoice = {
  id: string
  invoice_number: string
  company_id: string
  company_name: string
  variable_symbol: string
  constant_symbol?: string
  specific_symbol?: string
  issue_date: string
  tax_date: string
  due_date: string
  payment_date?: string
  description?: string
  items: Array<{
    id: string
    description: string
    quantity: number
    unit: string
    unit_price: number
    vat_rate: number
    total_price: number
  }>
  total_without_vat: number
  total_vat: number
  total_with_vat: number
  currency?: string
  payment_type?: string
  status?: string
  pohoda_id?: string | null
  created_at?: string
  updated_at?: string
}

// Pohoda XML namespaces - mXML 2.0
const POHODA_NAMESPACES = {
  dat: 'http://www.stormware.cz/schema/version_2/data.xsd',
  inv: 'http://www.stormware.cz/schema/version_2/invoice.xsd',
  typ: 'http://www.stormware.cz/schema/version_2/type.xsd',
}

// XML escape function
function escapeXml(unsafe: string): string {
  if (!unsafe) return ''
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Format date for Pohoda (YYYY-MM-DD)
function formatPohodaDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  // Pokud je už ve správném formátu, vrať jak je
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  // Pokus se převést z jiného formátu
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return ''
    return date.toISOString().split('T')[0]
  } catch {
    return ''
  }
}

// Convert VAT rate to Pohoda format
function getVatRateType(rate: number | string): 'high' | 'low' | 'none' {
  const rateNum = typeof rate === 'string' ? parseFloat(rate) : rate
  if (rateNum >= 20) return 'high'   // 21%
  if (rateNum >= 10) return 'low'    // 12%
  return 'none'                       // 0%
}

// Map document-extractor VAT rate to Pohoda format
function mapVatRate(rate: 'none' | 'low' | 'high'): 'high' | 'low' | 'none' {
  switch (rate) {
    case 'high': return 'high'
    case 'low': return 'low'
    case 'none':
    default: return 'none'
  }
}

// Map payment type to Pohoda payment type
function mapPaymentType(type: string | null | undefined): string {
  switch (type?.toLowerCase()) {
    case 'cash': return 'Hotově'
    case 'creditcard': return 'Karta'
    case 'draft': return 'Složenka'
    case 'wire':
    default: return 'Příkaz'
  }
}

// Format bank account for Pohoda
function formatBankAccount(account: string | null | undefined, code: string | null | undefined): string {
  if (!account) return ''
  const cleanAccount = account.replace(/\s/g, '').replace(/-/g, '')
  if (code) {
    return `${cleanAccount}/${code}`
  }
  return cleanAccount
}

// Generate invoice item XML for issued invoices with proper VAT
function generateIssuedItemXml(item: Invoice['items'][0]): string {
  const vatRate = getVatRateType(item.vat_rate)
  const vatAmount = item.total_price * (item.vat_rate / 100)

  return `
        <inv:invoiceItem>
          <inv:text>${escapeXml(item.description)}</inv:text>
          <inv:quantity>${item.quantity}</inv:quantity>
          <inv:unit>${escapeXml(item.unit)}</inv:unit>
          <inv:rateVAT>${vatRate}</inv:rateVAT>
          <inv:homeCurrency>
            <typ:unitPrice>${item.unit_price.toFixed(2)}</typ:unitPrice>
            <typ:price>${item.total_price.toFixed(2)}</typ:price>
            <typ:priceVAT>${vatAmount.toFixed(2)}</typ:priceVAT>
          </inv:homeCurrency>
        </inv:invoiceItem>`
}

/**
 * Generate XML for a single invoice item (extracted/received invoice)
 */
function generateExtractedItemXml(item: ExtractedInvoiceItem): string {
  return `
        <inv:invoiceItem>
          <inv:text>${escapeXml(item.description)}</inv:text>
          <inv:quantity>${item.quantity}</inv:quantity>
          <inv:unit>${escapeXml(item.unit)}</inv:unit>
          <inv:rateVAT>${mapVatRate(item.vat_rate)}</inv:rateVAT>
          <inv:homeCurrency>
            <typ:unitPrice>${item.unit_price.toFixed(2)}</typ:unitPrice>
            <typ:price>${item.total_price.toFixed(2)}</typ:price>
            <typ:priceVAT>${item.vat_amount.toFixed(2)}</typ:priceVAT>
          </inv:homeCurrency>
        </inv:invoiceItem>`
}

/**
 * Calculate VAT breakdown for issued invoices from items
 */
function calculateIssuedVatBreakdown(items: Invoice['items']): {
  priceNone: number
  priceLow: number
  priceLowVat: number
  priceHigh: number
  priceHighVat: number
} {
  let priceNone = 0
  let priceLow = 0
  let priceLowVat = 0
  let priceHigh = 0
  let priceHighVat = 0

  for (const item of items) {
    const rate = item.vat_rate
    if (rate >= 20) {
      priceHigh += item.total_price
      priceHighVat += item.total_price * (rate / 100)
    } else if (rate >= 10) {
      priceLow += item.total_price
      priceLowVat += item.total_price * (rate / 100)
    } else {
      priceNone += item.total_price
    }
  }

  return {
    priceNone,
    priceLow,
    priceLowVat,
    priceHigh,
    priceHighVat
  }
}

/**
 * Generate XML for issued invoice (vydaná faktura)
 */
export function generateInvoiceXml(
  invoice: Invoice,
  companyIco: string = '',
  companyData?: {
    city?: string | null
    street?: string | null
    zip?: string | null
    ico?: string | null
    dic?: string | null
  }
): string {
  const itemsXml = invoice.items?.map(generateIssuedItemXml).join('') || ''
  const vatBreakdown = calculateIssuedVatBreakdown(invoice.items || [])

  return `<?xml version="1.0" encoding="Windows-1250"?>
<dat:dataPack xmlns:dat="${POHODA_NAMESPACES.dat}"
              xmlns:inv="${POHODA_NAMESPACES.inv}"
              xmlns:typ="${POHODA_NAMESPACES.typ}"
              id="export-${invoice.id}"
              ico="${escapeXml(companyIco)}"
              version="2.0">
  <dat:dataPackItem id="${invoice.id}" version="2.0">
    <inv:invoice version="2.0">
      <inv:invoiceHeader>
        <inv:invoiceType>issuedInvoice</inv:invoiceType>
        <inv:number>
          <typ:numberRequested>${escapeXml(invoice.invoice_number)}</typ:numberRequested>
        </inv:number>
        <inv:symVar>${escapeXml(invoice.variable_symbol || '')}</inv:symVar>
        ${invoice.constant_symbol ? `<inv:symConst>${escapeXml(invoice.constant_symbol)}</inv:symConst>` : ''}
        ${invoice.specific_symbol ? `<inv:symSpec>${escapeXml(invoice.specific_symbol)}</inv:symSpec>` : ''}
        <inv:date>${formatPohodaDate(invoice.issue_date)}</inv:date>
        <inv:dateTax>${formatPohodaDate(invoice.tax_date)}</inv:dateTax>
        <inv:dateDue>${formatPohodaDate(invoice.due_date)}</inv:dateDue>
        ${invoice.payment_date ? `<inv:datePayment>${formatPohodaDate(invoice.payment_date)}</inv:datePayment>` : ''}
        <inv:text>${escapeXml(invoice.description || `Účetní služby - ${invoice.company_name}`)}</inv:text>
        <inv:partnerIdentity>
          <typ:address>
            <typ:company>${escapeXml(invoice.company_name)}</typ:company>
            ${companyData?.street ? `<typ:street>${escapeXml(companyData.street)}</typ:street>` : ''}
            ${companyData?.city ? `<typ:city>${escapeXml(companyData.city)}</typ:city>` : ''}
            ${companyData?.zip ? `<typ:zip>${escapeXml(companyData.zip)}</typ:zip>` : ''}
            ${companyData?.ico ? `<typ:ico>${escapeXml(companyData.ico)}</typ:ico>` : ''}
            ${companyData?.dic ? `<typ:dic>${escapeXml(companyData.dic)}</typ:dic>` : ''}
          </typ:address>
        </inv:partnerIdentity>
        <inv:paymentType>
          <typ:ids>${mapPaymentType(invoice.payment_type)}</typ:ids>
        </inv:paymentType>
        <inv:isSent>true</inv:isSent>
        <inv:isReceived>false</inv:isReceived>
      </inv:invoiceHeader>
      <inv:invoiceDetail>${itemsXml}
      </inv:invoiceDetail>
      <inv:invoiceSummary>
        <inv:homeCurrency>
          <typ:priceNone>${vatBreakdown.priceNone.toFixed(2)}</typ:priceNone>
          <typ:priceLow>${vatBreakdown.priceLow.toFixed(2)}</typ:priceLow>
          <typ:priceLowVAT>${vatBreakdown.priceLowVat.toFixed(2)}</typ:priceLowVAT>
          <typ:priceLowSum>${(vatBreakdown.priceLow + vatBreakdown.priceLowVat).toFixed(2)}</typ:priceLowSum>
          <typ:priceHigh>${vatBreakdown.priceHigh.toFixed(2)}</typ:priceHigh>
          <typ:priceHighVAT>${vatBreakdown.priceHighVat.toFixed(2)}</typ:priceHighVAT>
          <typ:priceHighSum>${(vatBreakdown.priceHigh + vatBreakdown.priceHighVat).toFixed(2)}</typ:priceHighSum>
          <typ:price3>0.00</typ:price3>
          <typ:price3VAT>0.00</typ:price3VAT>
          <typ:price3Sum>0.00</typ:price3Sum>
          <typ:round>
            <typ:priceRound>0.00</typ:priceRound>
          </typ:round>
        </inv:homeCurrency>
      </inv:invoiceSummary>
    </inv:invoice>
  </dat:dataPackItem>
</dat:dataPack>`
}

/**
 * Generate XML for received invoice (přijatá faktura)
 */
export function generateReceivedInvoiceXml(
  invoice: ExtractedInvoice,
  companyIco: string = ''
): string {
  const itemsXml = invoice.items?.map(generateExtractedItemXml).join('') || ''

  // Určení typu dokladu
  let invoiceType = 'receivedInvoice'
  if (invoice.document_type === 'receipt') {
    invoiceType = 'receivedReceipt'
  } else if (invoice.document_type === 'advanceInvoice') {
    invoiceType = 'receivedAdvanceInvoice'
  } else if (invoice.document_type === 'creditNote') {
    invoiceType = 'receivedCreditNote'
  }

  // Formát bankovního účtu
  const bankAccount = formatBankAccount(
    invoice.supplier?.bank_account,
    invoice.supplier?.bank_code
  )

  return `<?xml version="1.0" encoding="Windows-1250"?>
<dat:dataPack xmlns:dat="${POHODA_NAMESPACES.dat}"
              xmlns:inv="${POHODA_NAMESPACES.inv}"
              xmlns:typ="${POHODA_NAMESPACES.typ}"
              id="received-${invoice.document_number?.replace(/\s/g, '-') || Date.now()}"
              ico="${escapeXml(companyIco)}"
              version="2.0">
  <dat:dataPackItem id="${invoice.document_number || `ext-${Date.now()}`}" version="2.0">
    <inv:invoice version="2.0">
      <inv:invoiceHeader>
        <inv:invoiceType>${invoiceType}</inv:invoiceType>
        <inv:number>
          <typ:numberRequested>${escapeXml(invoice.document_number)}</typ:numberRequested>
        </inv:number>
        ${invoice.variable_symbol ? `<inv:symVar>${escapeXml(invoice.variable_symbol)}</inv:symVar>` : ''}
        ${invoice.constant_symbol ? `<inv:symConst>${escapeXml(invoice.constant_symbol)}</inv:symConst>` : ''}
        ${invoice.specific_symbol ? `<inv:symSpec>${escapeXml(invoice.specific_symbol)}</inv:symSpec>` : ''}
        <inv:date>${formatPohodaDate(invoice.date_issued)}</inv:date>
        <inv:dateTax>${formatPohodaDate(invoice.date_tax)}</inv:dateTax>
        <inv:dateDue>${formatPohodaDate(invoice.date_due)}</inv:dateDue>
        ${invoice.date_payment ? `<inv:datePayment>${formatPohodaDate(invoice.date_payment)}</inv:datePayment>` : ''}
        <inv:text>${escapeXml(invoice.description || `Faktura ${invoice.document_number}`)}</inv:text>
        <inv:partnerIdentity>
          <typ:address>
            <typ:company>${escapeXml(invoice.supplier?.name || 'Neznámý dodavatel')}</typ:company>
            ${invoice.supplier?.address ? `<typ:street>${escapeXml(invoice.supplier.address)}</typ:street>` : ''}
            ${invoice.supplier?.ico ? `<typ:ico>${escapeXml(invoice.supplier.ico)}</typ:ico>` : ''}
            ${invoice.supplier?.dic ? `<typ:dic>${escapeXml(invoice.supplier.dic)}</typ:dic>` : ''}
          </typ:address>
          ${bankAccount ? `
          <typ:account>
            <typ:ids>${escapeXml(bankAccount)}</typ:ids>
          </typ:account>` : ''}
        </inv:partnerIdentity>
        <inv:paymentType>
          <typ:ids>${mapPaymentType(invoice.payment_type)}</typ:ids>
        </inv:paymentType>
        <inv:isSent>false</inv:isSent>
        <inv:isReceived>true</inv:isReceived>
      </inv:invoiceHeader>
      <inv:invoiceDetail>${itemsXml || `
        <inv:invoiceItem>
          <inv:text>${escapeXml(invoice.description || 'Položka faktury')}</inv:text>
          <inv:quantity>1</inv:quantity>
          <inv:unit>ks</inv:unit>
          <inv:rateVAT>${mapVatRate(invoice.price_high > 0 ? 'high' : invoice.price_low > 0 ? 'low' : 'none')}</inv:rateVAT>
          <inv:homeCurrency>
            <typ:unitPrice>${invoice.total_without_vat.toFixed(2)}</typ:unitPrice>
            <typ:price>${invoice.total_without_vat.toFixed(2)}</typ:price>
            <typ:priceVAT>${invoice.total_vat.toFixed(2)}</typ:priceVAT>
          </inv:homeCurrency>
        </inv:invoiceItem>`}
      </inv:invoiceDetail>
      <inv:invoiceSummary>
        <inv:homeCurrency>
          <typ:priceNone>${(invoice.price_none || 0).toFixed(2)}</typ:priceNone>
          <typ:priceLow>${(invoice.price_low || 0).toFixed(2)}</typ:priceLow>
          <typ:priceLowVAT>${(invoice.price_low_vat || 0).toFixed(2)}</typ:priceLowVAT>
          <typ:priceLowSum>${(invoice.price_low_sum || (invoice.price_low || 0) + (invoice.price_low_vat || 0)).toFixed(2)}</typ:priceLowSum>
          <typ:priceHigh>${(invoice.price_high || 0).toFixed(2)}</typ:priceHigh>
          <typ:priceHighVAT>${(invoice.price_high_vat || 0).toFixed(2)}</typ:priceHighVAT>
          <typ:priceHighSum>${(invoice.price_high_sum || (invoice.price_high || 0) + (invoice.price_high_vat || 0)).toFixed(2)}</typ:priceHighSum>
          <typ:price3>0.00</typ:price3>
          <typ:price3VAT>0.00</typ:price3VAT>
          <typ:price3Sum>0.00</typ:price3Sum>
          <typ:round>
            <typ:priceRound>0.00</typ:priceRound>
          </typ:round>
        </inv:homeCurrency>
        <inv:foreignCurrency>
          <typ:currency>
            <typ:ids>${escapeXml(invoice.currency || 'CZK')}</typ:ids>
          </typ:currency>
          <typ:priceSum>${invoice.total_with_vat.toFixed(2)}</typ:priceSum>
        </inv:foreignCurrency>
      </inv:invoiceSummary>
    </inv:invoice>
  </dat:dataPackItem>
</dat:dataPack>`
}

/**
 * Generate batch XML for multiple received invoices
 */
export function generateReceivedBatchXml(
  invoices: ExtractedInvoice[],
  companyIco: string = ''
): string {
  const dataPackItems = invoices.map((invoice, index) => {
    const itemsXml = invoice.items?.map(generateExtractedItemXml).join('') || ''
    const bankAccount = formatBankAccount(
      invoice.supplier?.bank_account,
      invoice.supplier?.bank_code
    )

    return `
  <dat:dataPackItem id="${invoice.document_number || `item-${index}`}" version="2.0">
    <inv:invoice version="2.0">
      <inv:invoiceHeader>
        <inv:invoiceType>receivedInvoice</inv:invoiceType>
        <inv:number>
          <typ:numberRequested>${escapeXml(invoice.document_number)}</typ:numberRequested>
        </inv:number>
        ${invoice.variable_symbol ? `<inv:symVar>${escapeXml(invoice.variable_symbol)}</inv:symVar>` : ''}
        <inv:date>${formatPohodaDate(invoice.date_issued)}</inv:date>
        <inv:dateTax>${formatPohodaDate(invoice.date_tax)}</inv:dateTax>
        <inv:dateDue>${formatPohodaDate(invoice.date_due)}</inv:dateDue>
        <inv:text>${escapeXml(invoice.description || `Faktura ${invoice.document_number}`)}</inv:text>
        <inv:partnerIdentity>
          <typ:address>
            <typ:company>${escapeXml(invoice.supplier?.name || 'Neznámý dodavatel')}</typ:company>
            ${invoice.supplier?.address ? `<typ:street>${escapeXml(invoice.supplier.address)}</typ:street>` : ''}
            ${invoice.supplier?.ico ? `<typ:ico>${escapeXml(invoice.supplier.ico)}</typ:ico>` : ''}
            ${invoice.supplier?.dic ? `<typ:dic>${escapeXml(invoice.supplier.dic)}</typ:dic>` : ''}
          </typ:address>
          ${bankAccount ? `
          <typ:account>
            <typ:ids>${escapeXml(bankAccount)}</typ:ids>
          </typ:account>` : ''}
        </inv:partnerIdentity>
        <inv:paymentType>
          <typ:ids>${mapPaymentType(invoice.payment_type)}</typ:ids>
        </inv:paymentType>
        <inv:isSent>false</inv:isSent>
        <inv:isReceived>true</inv:isReceived>
      </inv:invoiceHeader>
      <inv:invoiceDetail>${itemsXml || `
        <inv:invoiceItem>
          <inv:text>Celkem</inv:text>
          <inv:quantity>1</inv:quantity>
          <inv:unit>ks</inv:unit>
          <inv:homeCurrency>
            <typ:unitPrice>${invoice.total_without_vat.toFixed(2)}</typ:unitPrice>
            <typ:price>${invoice.total_without_vat.toFixed(2)}</typ:price>
          </inv:homeCurrency>
        </inv:invoiceItem>`}
      </inv:invoiceDetail>
      <inv:invoiceSummary>
        <inv:homeCurrency>
          <typ:priceNone>${(invoice.price_none || 0).toFixed(2)}</typ:priceNone>
          <typ:priceLow>${(invoice.price_low || 0).toFixed(2)}</typ:priceLow>
          <typ:priceLowVAT>${(invoice.price_low_vat || 0).toFixed(2)}</typ:priceLowVAT>
          <typ:priceLowSum>${(invoice.price_low_sum || (invoice.price_low || 0) + (invoice.price_low_vat || 0)).toFixed(2)}</typ:priceLowSum>
          <typ:priceHigh>${(invoice.price_high || 0).toFixed(2)}</typ:priceHigh>
          <typ:priceHighVAT>${(invoice.price_high_vat || 0).toFixed(2)}</typ:priceHighVAT>
          <typ:priceHighSum>${(invoice.price_high_sum || (invoice.price_high || 0) + (invoice.price_high_vat || 0)).toFixed(2)}</typ:priceHighSum>
        </inv:homeCurrency>
      </inv:invoiceSummary>
    </inv:invoice>
  </dat:dataPackItem>`
  }).join('')

  return `<?xml version="1.0" encoding="Windows-1250"?>
<dat:dataPack xmlns:dat="${POHODA_NAMESPACES.dat}"
              xmlns:inv="${POHODA_NAMESPACES.inv}"
              xmlns:typ="${POHODA_NAMESPACES.typ}"
              id="received-batch-${Date.now()}"
              ico="${escapeXml(companyIco)}"
              version="2.0">${dataPackItems}
</dat:dataPack>`
}

/**
 * Generate XML for multiple issued invoices (batch export)
 */
export function generateBatchXml(
  invoices: Invoice[],
  companyIco: string = '',
  companyDataMap?: Map<string, { city?: string | null; street?: string | null; zip?: string | null; ico?: string | null; dic?: string | null }>
): string {
  const dataPackItems = invoices.map(invoice => {
    const companyData = companyDataMap?.get(invoice.company_id)
    const itemsXml = invoice.items?.map(generateIssuedItemXml).join('') || ''
    const vatBreakdown = calculateIssuedVatBreakdown(invoice.items || [])

    return `
  <dat:dataPackItem id="${invoice.id}" version="2.0">
    <inv:invoice version="2.0">
      <inv:invoiceHeader>
        <inv:invoiceType>issuedInvoice</inv:invoiceType>
        <inv:number>
          <typ:numberRequested>${escapeXml(invoice.invoice_number)}</typ:numberRequested>
        </inv:number>
        <inv:symVar>${escapeXml(invoice.variable_symbol || '')}</inv:symVar>
        ${invoice.constant_symbol ? `<inv:symConst>${escapeXml(invoice.constant_symbol)}</inv:symConst>` : ''}
        ${invoice.specific_symbol ? `<inv:symSpec>${escapeXml(invoice.specific_symbol)}</inv:symSpec>` : ''}
        <inv:date>${formatPohodaDate(invoice.issue_date)}</inv:date>
        <inv:dateTax>${formatPohodaDate(invoice.tax_date)}</inv:dateTax>
        <inv:dateDue>${formatPohodaDate(invoice.due_date)}</inv:dateDue>
        <inv:text>${escapeXml(invoice.description || `Účetní služby - ${invoice.company_name}`)}</inv:text>
        <inv:partnerIdentity>
          <typ:address>
            <typ:company>${escapeXml(invoice.company_name)}</typ:company>
            ${companyData?.street ? `<typ:street>${escapeXml(companyData.street)}</typ:street>` : ''}
            ${companyData?.city ? `<typ:city>${escapeXml(companyData.city)}</typ:city>` : ''}
            ${companyData?.zip ? `<typ:zip>${escapeXml(companyData.zip)}</typ:zip>` : ''}
            ${companyData?.ico ? `<typ:ico>${escapeXml(companyData.ico)}</typ:ico>` : ''}
            ${companyData?.dic ? `<typ:dic>${escapeXml(companyData.dic)}</typ:dic>` : ''}
          </typ:address>
        </inv:partnerIdentity>
        <inv:paymentType>
          <typ:ids>${mapPaymentType(invoice.payment_type)}</typ:ids>
        </inv:paymentType>
        <inv:isSent>true</inv:isSent>
        <inv:isReceived>false</inv:isReceived>
      </inv:invoiceHeader>
      <inv:invoiceDetail>${itemsXml}
      </inv:invoiceDetail>
      <inv:invoiceSummary>
        <inv:homeCurrency>
          <typ:priceNone>${vatBreakdown.priceNone.toFixed(2)}</typ:priceNone>
          <typ:priceLow>${vatBreakdown.priceLow.toFixed(2)}</typ:priceLow>
          <typ:priceLowVAT>${vatBreakdown.priceLowVat.toFixed(2)}</typ:priceLowVAT>
          <typ:priceLowSum>${(vatBreakdown.priceLow + vatBreakdown.priceLowVat).toFixed(2)}</typ:priceLowSum>
          <typ:priceHigh>${vatBreakdown.priceHigh.toFixed(2)}</typ:priceHigh>
          <typ:priceHighVAT>${vatBreakdown.priceHighVat.toFixed(2)}</typ:priceHighVAT>
          <typ:priceHighSum>${(vatBreakdown.priceHigh + vatBreakdown.priceHighVat).toFixed(2)}</typ:priceHighSum>
          <typ:price3>0.00</typ:price3>
          <typ:price3VAT>0.00</typ:price3VAT>
          <typ:price3Sum>0.00</typ:price3Sum>
        </inv:homeCurrency>
      </inv:invoiceSummary>
    </inv:invoice>
  </dat:dataPackItem>`
  }).join('')

  return `<?xml version="1.0" encoding="Windows-1250"?>
<dat:dataPack xmlns:dat="${POHODA_NAMESPACES.dat}"
              xmlns:inv="${POHODA_NAMESPACES.inv}"
              xmlns:typ="${POHODA_NAMESPACES.typ}"
              id="batch-export-${Date.now()}"
              ico="${escapeXml(companyIco)}"
              version="2.0">${dataPackItems}
</dat:dataPack>`
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate Pohoda XML (basic validation)
 */
export function validatePohodaXml(xml: string): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check for required elements
  if (!xml.includes('<?xml')) {
    errors.push('Missing XML declaration')
  }

  if (!xml.includes('<dat:dataPack')) {
    errors.push('Missing dataPack element')
  }

  if (!xml.includes('<inv:invoice')) {
    errors.push('Missing invoice element')
  }

  // Check for required invoice fields
  if (!xml.includes('<inv:invoiceType>')) {
    errors.push('Missing invoiceType')
  }

  // Check invoice type
  const hasReceivedType = xml.includes('receivedInvoice') ||
                          xml.includes('receivedReceipt') ||
                          xml.includes('receivedAdvanceInvoice') ||
                          xml.includes('receivedCreditNote')
  const hasIssuedType = xml.includes('issuedInvoice')

  if (!hasReceivedType && !hasIssuedType) {
    warnings.push('Unknown or missing invoice type')
  }

  // Check for proper namespaces
  if (!xml.includes('xmlns:dat=')) {
    errors.push('Missing dat namespace')
  }
  if (!xml.includes('xmlns:inv=')) {
    errors.push('Missing inv namespace')
  }
  if (!xml.includes('xmlns:typ=')) {
    errors.push('Missing typ namespace')
  }

  // Warnings
  if (!xml.includes('<inv:partnerIdentity>')) {
    warnings.push('Missing partner identity - may cause import issues')
  }

  if (!xml.includes('<typ:ico>')) {
    warnings.push('Missing ICO in partner address')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Create ZIP file content with XML exports for issued invoices
 * Note: In production, use a proper ZIP library like jszip
 */
export function createExportZipContent(
  invoices: Invoice[],
  companyIco: string = '',
  companyDataMap?: Map<string, { city?: string | null; street?: string | null; zip?: string | null; ico?: string | null; dic?: string | null }>
): {
  files: Array<{ name: string; content: string }>
} {
  const files = invoices.map(invoice => ({
    name: `${invoice.invoice_number.replace(/\//g, '_')}.xml`,
    content: generateInvoiceXml(invoice, companyIco, companyDataMap?.get(invoice.company_id)),
  }))

  // Add a batch file with all invoices
  if (invoices.length > 1) {
    files.push({
      name: 'all-invoices.xml',
      content: generateBatchXml(invoices, companyIco, companyDataMap),
    })
  }

  return { files }
}

/**
 * Create ZIP content for received invoices
 */
export function createReceivedExportZipContent(
  invoices: ExtractedInvoice[],
  companyIco: string = ''
): {
  files: Array<{ name: string; content: string }>
} {
  const files = invoices.map((invoice, index) => ({
    name: `${invoice.document_number?.replace(/\s+/g, '_').replace(/\//g, '_') || `faktura-${index}`}.xml`,
    content: generateReceivedInvoiceXml(invoice, companyIco),
  }))

  // Add a batch file with all invoices
  if (invoices.length > 1) {
    files.push({
      name: 'all-received-invoices.xml',
      content: generateReceivedBatchXml(invoices, companyIco),
    })
  }

  return { files }
}
