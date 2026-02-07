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
 */

import { Invoice, InvoiceItem, mockCompanies } from './mock-data'

// Pohoda XML namespaces
const POHODA_NAMESPACES = {
  dat: 'http://www.stormware.cz/schema/version_2/data.xsd',
  inv: 'http://www.stormware.cz/schema/version_2/invoice.xsd',
  typ: 'http://www.stormware.cz/schema/version_2/type.xsd',
}

// XML escape function
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Format date for Pohoda (YYYY-MM-DD)
function formatPohodaDate(dateStr: string): string {
  return dateStr // Already in correct format
}

// Convert VAT rate to Pohoda format
function getVatRateType(rate: number): 'high' | 'low' | 'none' {
  if (rate >= 20) return 'high'   // 21%
  if (rate >= 10) return 'low'    // 12%
  return 'none'                    // 0%
}

/**
 * Generate XML for a single invoice item
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
 * Generate XML for a single invoice
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
 * Generate XML for multiple invoices (batch export)
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

  if (!xml.includes('inv:symVar')) {
    errors.push('Missing variable symbol (symVar)')
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
