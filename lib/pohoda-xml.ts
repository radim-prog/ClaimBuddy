// Pohoda XML export generator for invoices
// Format: Stormware Pohoda XML dataPack v2.0
// Encoding: windows-1250 (required by Pohoda)

import type { Invoice, InvoiceItem } from './mock-data'
import type { Company } from './company-store'

const NS_DAT = 'http://www.stormware.cz/schema/version_2/data.xsd'
const NS_INV = 'http://www.stormware.cz/schema/version_2/invoice.xsd'
const NS_TYP = 'http://www.stormware.cz/schema/version_2/type.xsd'

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function vatRateTag(vatRate: number): 'high' | 'low' | 'none' {
  if (vatRate >= 20) return 'high'
  if (vatRate > 0) return 'low'
  return 'none'
}

function vatPriceElement(vatRate: number): 'priceHigh' | 'priceLow' | 'priceNone' {
  if (vatRate >= 20) return 'priceHigh'
  if (vatRate > 0) return 'priceLow'
  return 'priceNone'
}

function generateInvoiceItem(item: InvoiceItem): string {
  const vatTag = vatRateTag(item.vat_rate)
  const priceEl = vatPriceElement(item.vat_rate)
  const vatAmount = item.total_with_vat - item.total_without_vat

  return `      <inv:invoiceItem>
        <inv:text>${escapeXml(item.description)}</inv:text>
        <inv:quantity>${item.quantity}</inv:quantity>
        <inv:unit>${escapeXml(item.unit || 'ks')}</inv:unit>
        <inv:coefficient>1</inv:coefficient>
        <inv:${priceEl}>
          <typ:unitPrice>${item.unit_price.toFixed(2)}</typ:unitPrice>
          <typ:price>${item.total_without_vat.toFixed(2)}</typ:price>
          <typ:priceSum>${item.total_with_vat.toFixed(2)}</typ:priceSum>
          <typ:priceVAT>${vatAmount.toFixed(2)}</typ:priceVAT>
        </inv:${priceEl}>
        <inv:vatRate>${vatTag}</inv:vatRate>
      </inv:invoiceItem>`
}

function generateInvoiceSummary(invoice: Invoice): string {
  // Group items by VAT rate
  const groups: Record<string, { price: number; priceSum: number; priceVAT: number }> = {}

  for (const item of invoice.items) {
    const key = vatPriceElement(item.vat_rate)
    if (!groups[key]) {
      groups[key] = { price: 0, priceSum: 0, priceVAT: 0 }
    }
    groups[key].price += item.total_without_vat
    groups[key].priceSum += item.total_with_vat
    groups[key].priceVAT += (item.total_with_vat - item.total_without_vat)
  }

  let summaryParts = ''
  for (const [key, vals] of Object.entries(groups)) {
    summaryParts += `
          <inv:${key}>
            <typ:price>${vals.price.toFixed(2)}</typ:price>
            <typ:priceSum>${vals.priceSum.toFixed(2)}</typ:priceSum>
            <typ:priceVAT>${vals.priceVAT.toFixed(2)}</typ:priceVAT>
          </inv:${key}>`
  }

  return `    <inv:invoiceSummary>
      <inv:roundingDocument>
        <typ:priceRound>0.00</typ:priceRound>
      </inv:roundingDocument>
      <inv:homeCurrency>${summaryParts}
          <inv:roundingVAT>
            <typ:priceRound>0.00</typ:priceRound>
          </inv:roundingVAT>
          <inv:priceTotal>
            <typ:price>${invoice.total_without_vat.toFixed(2)}</typ:price>
            <typ:priceSum>${invoice.total_with_vat.toFixed(2)}</typ:priceSum>
            <typ:priceVAT>${invoice.total_vat.toFixed(2)}</typ:priceVAT>
          </inv:priceTotal>
      </inv:homeCurrency>
    </inv:invoiceSummary>`
}

function generateAddress(prefix: string, data: { name?: string; company?: string; ico?: string; dic?: string; address?: string; street?: string; city?: string; zip?: string }): string {
  const name = data.company || data.name || ''
  // Parse address string "Street, ZIP City" if needed
  let street = data.street || ''
  let city = data.city || ''
  let zip = data.zip || ''

  if (!street && data.address) {
    const parts = data.address.split(',').map(s => s.trim())
    if (parts.length >= 2) {
      street = parts[0]
      const cityPart = parts[parts.length - 1]
      const zipMatch = cityPart.match(/^(\d{3}\s?\d{2})\s+(.+)$/)
      if (zipMatch) {
        zip = zipMatch[1].replace(/\s/g, '')
        city = zipMatch[2]
      } else {
        city = cityPart
      }
    } else {
      street = data.address
    }
  }

  return `      <${prefix}>
        <typ:address>
          <typ:company>${escapeXml(name)}</typ:company>
          <typ:street>${escapeXml(street)}</typ:street>
          <typ:city>${escapeXml(city)}</typ:city>
          <typ:postCode>${escapeXml(zip)}</typ:postCode>${data.ico ? `
          <typ:ico>${escapeXml(data.ico)}</typ:ico>` : ''}${data.dic ? `
          <typ:dic>${escapeXml(data.dic)}</typ:dic>` : ''}
        </typ:address>
      </${prefix}>`
}

function generateInvoiceXml(invoice: Invoice, supplier?: Company | null): string {
  const itemId = `FA_${invoice.invoice_number.replace(/[^a-zA-Z0-9]/g, '_')}`

  const supplierBlock = supplier
    ? generateAddress('inv:myIdentity', {
        company: supplier.name,
        ico: supplier.ico,
        dic: supplier.dic || undefined,
        street: supplier.address?.street,
        city: supplier.address?.city,
        zip: supplier.address?.zip,
      })
    : ''

  const customerBlock = invoice.customer
    ? generateAddress('inv:partnerIdentity', {
        name: invoice.customer.name,
        ico: invoice.customer.ico,
        dic: invoice.customer.dic,
        address: invoice.customer.address,
      })
    : ''

  const items = invoice.items.map(generateInvoiceItem).join('\n')
  const summary = generateInvoiceSummary(invoice)

  return `  <dat:dataPackItem id="${escapeXml(itemId)}" version="2.0">
    <inv:invoice version="2.0">
    <inv:invoiceHeader>
      <inv:invoiceType>issuedInvoice</inv:invoiceType>
      <inv:number>
        <typ:numberRequested>${escapeXml(invoice.invoice_number)}</typ:numberRequested>
      </inv:number>
      <inv:symVar>${escapeXml(invoice.variable_symbol || invoice.invoice_number)}</inv:symVar>
      <inv:date>${invoice.issue_date}</inv:date>
      <inv:dateOfTaxRecord>${invoice.tax_date || invoice.issue_date}</inv:dateOfTaxRecord>
      <inv:dueDate>${invoice.due_date}</inv:dueDate>
      <inv:currency>
        <typ:currencyId>CZK</typ:currencyId>
      </inv:currency>
      <inv:classificationVAT>inland</inv:classificationVAT>
      <inv:text>Faktura ${escapeXml(invoice.invoice_number)}</inv:text>
${supplierBlock}
${customerBlock}
    </inv:invoiceHeader>
    <inv:invoiceDetail>
${items}
    </inv:invoiceDetail>
${summary}
    </inv:invoice>
  </dat:dataPackItem>`
}

export function generatePohodaXml(invoices: Invoice[], supplierCompany?: Company | null): string {
  const ico = supplierCompany?.ico || '00000000'
  const dataPackItems = invoices.map(inv => generateInvoiceXml(inv, supplierCompany)).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<dat:dataPack
  xmlns:dat="${NS_DAT}"
  xmlns:inv="${NS_INV}"
  xmlns:typ="${NS_TYP}"
  id="EXPORT_${new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)}"
  ico="${escapeXml(ico)}"
  application="UcetniOS"
  version="2.0"
  note="Export faktur z Účetní OS">
${dataPackItems}
</dat:dataPack>`
}
