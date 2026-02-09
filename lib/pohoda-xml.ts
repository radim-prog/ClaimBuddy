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
 * - NOVĚ: Podpora přijatých faktur (receivedInvoice)
 */

import { Invoice, InvoiceItem, mockCompanies } from './mock-data'
import { ExtractedInvoice, InvoiceItem as ExtractedInvoiceItem } from './document-extractor'

// Pohoda XML namespaces - ROZŠÍŘENO pro receivedInvoice
const POHODA_NAMESPACES = {
  dat: 'http://www.stormware.cz/schema/version_2/data.xsd',
  inv: 'http://www.stormware.cz/schema/version_2/invoice.xsd',
  typ: 'http://www.stormware.cz/schema/version_2/type.xsd',
  vch: 'http://www.stormware.cz/schema/version_2/voucher.xsd',
  pro: 'http://www.stormware.cz/schema/version_2/prodejka.xsd',
  int: 'http://www.stormware.cz/schema/version_2/intDoc.xsd',
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
function formatPohodaDate(dateStr: string): string {
  if (!dateStr) return ''
  // Pokud je už ve správném formátu, vrať jak je
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  // Pokus se převést z jiného formátu
  try {
    const date = new Date(dateStr)
    return date.toISOString().split('T')[0]
  } catch {
    return dateStr
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
function mapVatRate(rate: 'none' | 'low' | 'high' | number): 'high' | 'low' | 'none' {
  if (typeof rate === 'number') {
    if (rate >= 21) return 'high'
    if (rate >= 12) return 'low'
    return 'none'
  }
  switch (rate) {
    case 'high': return 'high'
    case 'low': return 'low'
    case 'none':
    default: return 'none'
  }
}

// Map payment type to Pohoda payment type
function mapPaymentType(type: string): string {
  switch (type?.toLowerCase()) {
    case 'cash': return 'Hotově'
    case 'creditcard': return 'Karta'
    case 'draft': return 'Složenka'
    case 'wire':
    default: return 'Příkaz'
  }
}

// Format bank account for Pohoda
function formatBankAccount(account: string | null, code: string | null): string {
  if (!account) return ''
  const cleanAccount = account.replace(/\s/g, '').replace(/-/g, '')
  if (code) {
    return `${cleanAccount}/${code}`
  }
  return cleanAccount
}

/**
 * Generate XML for a single invoice item (issued invoice)
 */
function generateInvoiceItemXml(item: InvoiceItem): string {
  return `
        <inv:invoiceItem>
          <inv:text>${escapeXml(item.description)}</inv:text>
          <inv:quantity>${item.quantity}</inv:quantity>
          <inv:unit>${escapeXml(item.unit)}</inv:unit>
          <inv:rateVAT>${getVatRateType(item.vat_rate)}</inv:rateVAT>
          <inv:homeCurrency>
            <typ:unitPrice>${item.unit_price}</typ:unitPrice>
          </inv:homeCurrency>
        </inv:invoiceItem>`
}

/**
 * Generate XML for a single invoice item (extracted/received invoice)
 */
function generateExtractedItemXml(item: ExtractedInvoiceItem): string {
  return `
        <inv:invoiceItem>
          <inv:text>${escapeXml(item.text)}</inv:text>
          <inv:quantity>${item.quantity}</inv:quantity>
          <inv:unit>${escapeXml(item.unit)}</inv:unit>
          <inv:rateVAT>${mapVatRate(item.vat_rate)}</inv:rateVAT>
          <inv:homeCurrency>
            <typ:unitPrice>${item.unit_price}</typ:unitPrice>
            <typ:price>${item.price}</typ:price>
            <typ:priceVAT>${item.vat_amount}</typ:priceVAT>
          </inv:homeCurrency>
        </inv:invoiceItem>`
}

/**
 * Generate XML for a single issued invoice (původní funkce)
 */
export function generateInvoiceXml(invoice: Invoice): string {
  // Find company data for address
  const company = mockCompanies.find(c => c.id === invoice.company_id)

  const itemsXml = invoice.items.map(generateInvoiceItemXml).join('')

  return `<?xml version="1.0" encoding="Windows-1250"?>
<dat:dataPack xmlns:dat="${POHODA_NAMESPACES.dat}"
              xmlns:inv="${POHODA_NAMESPACES.inv}"
              xmlns:typ="${POHODA_NAMESPACES.typ}"
              id="export-${invoice.id}"
              ico="${escapeXml(company?.ico || '')}"
              version="2.0">
  <dat:dataPackItem id="${invoice.id}" version="2.0">
    <inv:invoice version="2.0">
      <inv:invoiceHeader>
        <inv:invoiceType>issuedInvoice</inv:invoiceType>
        <inv:number>
          <typ:numberRequested>${escapeXml(invoice.invoice_number)}</typ:numberRequested>
        </inv:number>
        <inv:symVar>${escapeXml(invoice.variable_symbol)}</inv:symVar>
        <inv:date>${formatPohodaDate(invoice.issue_date)}</inv:date>
        <inv:dateTax>${formatPohodaDate(invoice.tax_date)}</inv:dateTax>
        <inv:dateDue>${formatPohodaDate(invoice.due_date)}</inv:dateDue>
        <inv:text>Účetní služby - ${escapeXml(invoice.company_name)}</inv:text>
        <inv:partnerIdentity>
          <typ:address>
            <typ:company>${escapeXml(invoice.company_name)}</typ:company>
            ${company?.city ? `<typ:city>${escapeXml(company.city)}</typ:city>` : ''}
            ${company?.street ? `<typ:street>${escapeXml(company.street)}</typ:street>` : ''}
            ${company?.zip ? `<typ:zip>${escapeXml(company.zip)}</typ:zip>` : ''}
            ${company?.ico ? `<typ:ico>${escapeXml(company.ico)}</typ:ico>` : ''}
            ${company?.dic ? `<typ:dic>${escapeXml(company.dic)}</typ:dic>` : ''}
          </typ:address>
        </inv:partnerIdentity>
        <inv:paymentType>
          <typ:ids>Příkaz</typ:ids>
        </inv:paymentType>
      </inv:invoiceHeader>
      <inv:invoiceDetail>${itemsXml}
      </inv:invoiceDetail>
      <inv:invoiceSummary>
        <inv:homeCurrency>
          <typ:priceNone>${invoice.total_without_vat}</typ:priceNone>
          <typ:priceLow>0</typ:priceLow>
          <typ:priceHighSum>${invoice.total_with_vat}</typ:priceHighSum>
        </inv:homeCurrency>
      </inv:invoiceSummary>
    </inv:invoice>
  </dat:dataPackItem>
</dat:dataPack>`
}

/**
 * ============================================================================
 * NOVÁ FUNKCE: Generate XML for received invoice (přijatá faktura)
 * ============================================================================
 * 
 * Generuje XML pro přijaté faktury z OCR extrakce.
 * Podporuje správný rozpad DPH a všechny potřebné namespace.
 */
export function generateReceivedInvoiceXml(
  invoice: ExtractedInvoice,
  companyIco: string = '',
  companyDic: string = ''
): string {
  const itemsXml = invoice.items.map(generateExtractedItemXml).join('')

  // Určení typu dokladu
  let invoiceType = 'receivedInvoice'
  if (invoice.document_type === 'receipt') {
    invoiceType = 'receivedReceipt'
  } else if (invoice.document_type === 'advanceInvoice') {
    invoiceType = 'receivedAdvanceInvoice'
  }

  // Formát bankovního účtu
  const bankAccount = formatBankAccount(
    invoice.supplier?.bank_account,
    invoice.supplier?.bank_code
  )

  // Sestavení adresy dodavatele
  const addressLines: string[] = []
  if (invoice.supplier?.street) {
    addressLines.push(`<typ:street>${escapeXml(invoice.supplier.street)}</typ:street>`)
  }
  if (invoice.supplier?.city) {
    addressLines.push(`<typ:city>${escapeXml(invoice.supplier.city)}</typ:city>`)
  }
  if (invoice.supplier?.zip_code) {
    addressLines.push(`<typ:zip>${escapeXml(invoice.supplier.zip_code)}</typ:zip>`)
  }

  return `<?xml version="1.0" encoding="Windows-1250"?>
<dat:dataPack xmlns:dat="${POHODA_NAMESPACES.dat}"
              xmlns:inv="${POHODA_NAMESPACES.inv}"
              xmlns:typ="${POHODA_NAMESPACES.typ}"
              xmlns:vch="${POHODA_NAMESPACES.vch}"
              xmlns:pro="${POHODA_NAMESPACES.pro}"
              xmlns:int="${POHODA_NAMESPACES.int}"
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
        <inv:date>${formatPohodaDate(invoice.date_issued)}</inv:date>
        <inv:dateTax>${formatPohodaDate(invoice.date_taxable)}</inv:dateTax>
        <inv:dateDue>${formatPohodaDate(invoice.date_due)}</inv:dateDue>
        ${(invoice as any).date_payment ? `<inv:datePayment>${formatPohodaDate((invoice as any).date_payment)}</inv:datePayment>` : ''}
        <inv:text>${escapeXml(invoice.description || `Faktura ${invoice.document_number}`)}</inv:text>
        <inv:partnerIdentity>
          <typ:address>
            <typ:company>${escapeXml(invoice.supplier?.company || 'Neznámý dodavatel')}</typ:company>
            ${addressLines.join('')}
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
            <typ:unitPrice>${invoice.total_without_vat}</typ:unitPrice>
            <typ:price>${invoice.total_without_vat}</typ:price>
          </inv:homeCurrency>
        </inv:invoiceItem>`}
      </inv:invoiceDetail>
      <inv:invoiceSummary>
        <inv:homeCurrency>
          <!-- Rozpad DPH podle sazeb -->
          <typ:priceNone>${invoice.price_none || 0}</typ:priceNone>
          <typ:priceLow>${invoice.price_low || 0}</typ:priceLow>
          <typ:priceLowVAT>${invoice.vat_low || 0}</typ:priceLowVAT>
          <typ:priceLowSum>${invoice.sum_low || (invoice.price_low || 0) + (invoice.vat_low || 0)}</typ:priceLowSum>
          <typ:priceHigh>${invoice.price_high || 0}</typ:priceHigh>
          <typ:priceHighVAT>${invoice.vat_high || 0}</typ:priceHighVAT>
          <typ:priceHighSum>${invoice.sum_high || (invoice.price_high || 0) + (invoice.vat_high || 0)}</typ:priceHighSum>
          <typ:price3>0</typ:price3>
          <typ:price3VAT>0</typ:price3VAT>
          <typ:price3Sum>0</typ:price3Sum>
          <!-- Celkem -->
          <typ:round>
            <typ:priceRound>0</typ:priceRound>
          </typ:round>
        </inv:homeCurrency>
        <inv:foreignCurrency>
          <typ:currency>
            <typ:ids>${escapeXml(invoice.currency || 'CZK')}</typ:ids>
          </typ:currency>
          <typ:priceSum>${invoice.total_with_vat}</typ:priceSum>
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
    const itemsXml = invoice.items.map(generateExtractedItemXml).join('')
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
        <inv:dateTax>${formatPohodaDate(invoice.date_taxable)}</inv:dateTax>
        <inv:dateDue>${formatPohodaDate(invoice.date_due)}</inv:dateDue>
        <inv:text>${escapeXml(invoice.description || `Faktura ${invoice.document_number}`)}</inv:text>
        <inv:partnerIdentity>
          <typ:address>
            <typ:company>${escapeXml(invoice.supplier?.company || 'Neznámý dodavatel')}</typ:company>
            ${invoice.supplier?.street ? `<typ:street>${escapeXml(invoice.supplier.street)}</typ:street>` : ''}
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
            <typ:unitPrice>${invoice.total_without_vat}</typ:unitPrice>
          </inv:homeCurrency>
        </inv:invoiceItem>`}
      </inv:invoiceDetail>
      <inv:invoiceSummary>
        <inv:homeCurrency>
          <typ:priceNone>${invoice.price_none || 0}</typ:priceNone>
          <typ:priceLow>${invoice.price_low || 0}</typ:priceLow>
          <typ:priceLowVAT>${invoice.vat_low || 0}</typ:priceLowVAT>
          <typ:priceLowSum>${invoice.sum_low || 0}</typ:priceLowSum>
          <typ:priceHigh>${invoice.price_high || 0}</typ:priceHigh>
          <typ:priceHighVAT>${invoice.vat_high || 0}</typ:priceHighVAT>
          <typ:priceHighSum>${invoice.sum_high || 0}</typ:priceHighSum>
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
 * Generate XML for multiple invoices (batch export) - původní funkce
 */
export function generateBatchXml(invoices: Invoice[], companyIco: string = ''): string {
  const dataPackItems = invoices.map(invoice => {
    const company = mockCompanies.find(c => c.id === invoice.company_id)
    const itemsXml = invoice.items.map(generateInvoiceItemXml).join('')

    return `
  <dat:dataPackItem id="${invoice.id}" version="2.0">
    <inv:invoice version="2.0">
      <inv:invoiceHeader>
        <inv:invoiceType>issuedInvoice</inv:invoiceType>
        <inv:number>
          <typ:numberRequested>${escapeXml(invoice.invoice_number)}</typ:numberRequested>
        </inv:number>
        <inv:symVar>${escapeXml(invoice.variable_symbol)}</inv:symVar>
        <inv:date>${formatPohodaDate(invoice.issue_date)}</inv:date>
        <inv:dateTax>${formatPohodaDate(invoice.tax_date)}</inv:dateTax>
        <inv:dateDue>${formatPohodaDate(invoice.due_date)}</inv:dateDue>
        <inv:text>Účetní služby - ${escapeXml(invoice.company_name)}</inv:text>
        <inv:partnerIdentity>
          <typ:address>
            <typ:company>${escapeXml(invoice.company_name)}</typ:company>
            ${company?.city ? `<typ:city>${escapeXml(company.city)}</typ:city>` : ''}
            ${company?.street ? `<typ:street>${escapeXml(company.street)}</typ:street>` : ''}
            ${company?.zip ? `<typ:zip>${escapeXml(company.zip)}</typ:zip>` : ''}
            ${company?.ico ? `<typ:ico>${escapeXml(company.ico)}</typ:ico>` : ''}
            ${company?.dic ? `<typ:dic>${escapeXml(company.dic)}</typ:dic>` : ''}
          </typ:address>
        </inv:partnerIdentity>
        <inv:paymentType>
          <typ:ids>Příkaz</typ:ids>
        </inv:paymentType>
      </inv:invoiceHeader>
      <inv:invoiceDetail>${itemsXml}
      </inv:invoiceDetail>
      <inv:invoiceSummary>
        <inv:homeCurrency>
          <typ:priceNone>${invoice.total_without_vat}</typ:priceNone>
          <typ:priceLow>0</typ:priceLow>
          <typ:priceHighSum>${invoice.total_with_vat}</typ:priceHighSum>
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

  if (!xml.includes('dat:dataPack')) {
    errors.push('Missing dataPack element')
  }

  if (!xml.includes('inv:invoice')) {
    errors.push('Missing invoice element')
  }

  // Check for required invoice fields
  if (!xml.includes('inv:invoiceType')) {
    errors.push('Missing invoiceType')
  }

  // Check invoice type
  const hasReceivedType = xml.includes('receivedInvoice') || 
                          xml.includes('receivedReceipt') ||
                          xml.includes('receivedAdvanceInvoice')
  const hasIssuedType = xml.includes('issuedInvoice')

  if (!hasReceivedType && !hasIssuedType) {
    warnings.push('Unknown or missing invoice type')
  }

  // Warnings
  if (!xml.includes('inv:partnerIdentity')) {
    warnings.push('Missing partner identity - may cause import issues')
  }

  if (!xml.includes('typ:ico')) {
    warnings.push('Missing ICO in partner address')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Create ZIP file with XML exports
 * Note: In production, use a proper ZIP library like jszip
 */
export function createExportZipContent(invoices: Invoice[]): {
  files: Array<{ name: string; content: string }>
} {
  const files = invoices.map(invoice => ({
    name: `${invoice.invoice_number}.xml`,
    content: generateInvoiceXml(invoice),
  }))

  // Add a batch file with all invoices
  if (invoices.length > 1) {
    files.push({
      name: 'all-invoices.xml',
      content: generateBatchXml(invoices),
    })
  }

  return { files }
}

/**
 * Create ZIP content for received invoices
 */
export function createReceivedExportZipContent(
  invoices: ExtractedInvoice[]
): {
  files: Array<{ name: string; content: string }>
} {
  const files = invoices.map((invoice, index) => ({
    name: `${invoice.document_number?.replace(/\s+/g, '_') || `faktura-${index}`}.xml`,
    content: generateReceivedInvoiceXml(invoice),
  }))

  // Add a batch file with all invoices
  if (invoices.length > 1) {
    files.push({
      name: 'all-received-invoices.xml',
      content: generateReceivedBatchXml(invoices),
    })
  }

  return { files }
}
