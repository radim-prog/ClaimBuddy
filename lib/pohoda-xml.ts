// Pohoda XML export generator for invoices, bank documents, and vouchers
// Format: Stormware Pohoda XML dataPack v2.0
// Encoding: windows-1250 (required by Pohoda)

import type { Invoice, InvoiceItem } from './mock-data'
import type { Company } from './company-store'

const NS_DAT = 'http://www.stormware.cz/schema/version_2/data.xsd'
const NS_INV = 'http://www.stormware.cz/schema/version_2/invoice.xsd'
const NS_TYP = 'http://www.stormware.cz/schema/version_2/type.xsd'
const NS_BNK = 'http://www.stormware.cz/schema/version_2/bank.xsd'
const NS_INT = 'http://www.stormware.cz/schema/version_2/intDoc.xsd'

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

// --- Received invoices (extracted documents) ---

export type ExtractedDocumentForExport = {
  id: string
  document_number: string | null
  variable_symbol: string | null
  constant_symbol: string | null
  date_issued: string | null
  date_due: string | null
  date_tax: string | null
  supplier_name: string | null
  supplier_ico: string | null
  supplier_dic: string | null
  supplier_address: string | null
  supplier_bank_account: string | null
  total_without_vat: number | null
  total_vat: number | null
  total_with_vat: number | null
  currency: string
  payment_type: string | null
  items: Array<{
    description: string; quantity: number; unit: string
    unit_price: number; vat_rate: number | string
    total_without_vat: number; total_with_vat: number
  }>
}

function normalizeVatRate(rate: number | string): number {
  if (typeof rate === 'string') {
    if (rate === 'high') return 21
    if (rate === 'low') return 12
    if (rate === 'none') return 0
    return parseFloat(rate) || 0
  }
  return rate
}

function mapPaymentType(type: string | null): string {
  if (!type) return 'Příkazem'
  const lower = type.toLowerCase()
  if (lower.includes('cash') || lower.includes('hotov')) return 'Hotově'
  if (lower.includes('card') || lower.includes('kart')) return 'Kartou'
  return 'Příkazem'
}

function generateReceivedItem(item: ExtractedDocumentForExport['items'][0]): string {
  const vatRate = normalizeVatRate(item.vat_rate)
  const vatTag = vatRateTag(vatRate)
  const priceEl = vatPriceElement(vatRate)
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

function generateReceivedSummary(doc: ExtractedDocumentForExport): string {
  const groups: Record<string, { price: number; priceSum: number; priceVAT: number }> = {}

  if (doc.items.length > 0) {
    for (const item of doc.items) {
      const key = vatPriceElement(normalizeVatRate(item.vat_rate))
      if (!groups[key]) groups[key] = { price: 0, priceSum: 0, priceVAT: 0 }
      groups[key].price += item.total_without_vat
      groups[key].priceSum += item.total_with_vat
      groups[key].priceVAT += (item.total_with_vat - item.total_without_vat)
    }
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

  const totalBase = doc.total_without_vat ?? 0
  const totalWithVat = doc.total_with_vat ?? 0
  const totalVat = doc.total_vat ?? 0

  return `    <inv:invoiceSummary>
      <inv:roundingDocument>
        <typ:priceRound>0.00</typ:priceRound>
      </inv:roundingDocument>
      <inv:homeCurrency>${summaryParts}
          <inv:roundingVAT>
            <typ:priceRound>0.00</typ:priceRound>
          </inv:roundingVAT>
          <inv:priceTotal>
            <typ:price>${totalBase.toFixed(2)}</typ:price>
            <typ:priceSum>${totalWithVat.toFixed(2)}</typ:priceSum>
            <typ:priceVAT>${totalVat.toFixed(2)}</typ:priceVAT>
          </inv:priceTotal>
      </inv:homeCurrency>
    </inv:invoiceSummary>`
}

function generateReceivedInvoiceXml(
  doc: ExtractedDocumentForExport,
  clientCompany?: { name: string; ico: string; dic?: string; address?: string }
): string {
  const docNum = doc.document_number || doc.id.slice(0, 8)
  const itemId = `PF_${docNum.replace(/[^a-zA-Z0-9]/g, '_')}`

  // myIdentity = client (who receives the invoice)
  const myIdentityBlock = clientCompany
    ? generateAddress('inv:myIdentity', {
        company: clientCompany.name,
        ico: clientCompany.ico,
        dic: clientCompany.dic,
        address: clientCompany.address,
      })
    : ''

  // partnerIdentity = supplier (who issued the invoice)
  const partnerBlock = doc.supplier_name
    ? generateAddress('inv:partnerIdentity', {
        name: doc.supplier_name,
        ico: doc.supplier_ico || undefined,
        dic: doc.supplier_dic || undefined,
        address: doc.supplier_address || undefined,
      })
    : ''

  const items = doc.items.length > 0
    ? doc.items.map(generateReceivedItem).join('\n')
    : ''
  const summary = generateReceivedSummary(doc)
  const paymentType = mapPaymentType(doc.payment_type)

  const accountElement = doc.supplier_bank_account
    ? `\n      <inv:account>\n        <typ:accountNo>${escapeXml(doc.supplier_bank_account)}</typ:accountNo>\n      </inv:account>`
    : ''

  return `  <dat:dataPackItem id="${escapeXml(itemId)}" version="2.0">
    <inv:invoice version="2.0">
    <inv:invoiceHeader>
      <inv:invoiceType>receivedInvoice</inv:invoiceType>
      <inv:number>
        <typ:numberRequested>${escapeXml(docNum)}</typ:numberRequested>
      </inv:number>
      <inv:symVar>${escapeXml(doc.variable_symbol || docNum)}</inv:symVar>${doc.constant_symbol ? `
      <inv:symConst>${escapeXml(doc.constant_symbol)}</inv:symConst>` : ''}
      <inv:date>${doc.date_issued || new Date().toISOString().slice(0, 10)}</inv:date>
      <inv:dateTax>${doc.date_tax || doc.date_issued || new Date().toISOString().slice(0, 10)}</inv:dateTax>
      <inv:dueDate>${doc.date_due || doc.date_issued || new Date().toISOString().slice(0, 10)}</inv:dueDate>
      <inv:paymentType>
        <typ:paymentType>${escapeXml(paymentType)}</typ:paymentType>
      </inv:paymentType>${accountElement}
      <inv:currency>
        <typ:currencyId>${escapeXml(doc.currency || 'CZK')}</typ:currencyId>
      </inv:currency>
      <inv:classificationVAT>inland</inv:classificationVAT>
      <inv:text>Přijatá faktura ${escapeXml(docNum)}</inv:text>
${myIdentityBlock}
${partnerBlock}
    </inv:invoiceHeader>${items ? `
    <inv:invoiceDetail>
${items}
    </inv:invoiceDetail>` : ''}
${summary}
    </inv:invoice>
  </dat:dataPackItem>`
}

export function generatePohodaXmlFromDocuments(
  documents: ExtractedDocumentForExport[],
  clientCompany?: { name: string; ico: string; dic?: string; address?: string }
): string {
  const ico = clientCompany?.ico || '00000000'
  const dataPackItems = documents.map(doc => generateReceivedInvoiceXml(doc, clientCompany)).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<dat:dataPack
  xmlns:dat="${NS_DAT}"
  xmlns:inv="${NS_INV}"
  xmlns:typ="${NS_TYP}"
  id="EXPORT_${new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)}"
  ico="${escapeXml(ico)}"
  application="UcetniOS"
  version="2.0"
  note="Export přijatých faktur z Účetní OS">
${dataPackItems}
</dat:dataPack>`
}

// ============================================================
// BANK DOCUMENTS (bankovní doklady)
// ============================================================

export type BankDocumentForExport = {
  id: string
  transaction_date: string
  amount: number
  variable_symbol?: string | null
  constant_symbol?: string | null
  specific_symbol?: string | null
  counterparty_name?: string | null
  counterparty_account?: string | null
  counterparty_bank_code?: string | null
  description?: string | null
  period?: string | null
}

export type BankDocumentInvoiceLink = {
  invoice_number: string
  variable_symbol?: string | null
  amount: number
}

/**
 * Generate Pohoda XML for a bank income/expense document.
 * Maps to bnk:bank element in Pohoda schema.
 */
function generateBankDocumentItem(
  tx: BankDocumentForExport,
  bankAccount?: { accountNo: string; bankCode: string } | null,
  index: number = 0
): string {
  const itemId = `BNK_${index}_${tx.id.slice(-6)}`
  const isIncome = tx.amount > 0
  const absAmount = Math.abs(tx.amount)
  const docType = isIncome ? 'receipt' : 'expense'

  const accountElement = bankAccount
    ? `      <bnk:bankAccount>
        <typ:accountNo>${escapeXml(bankAccount.accountNo)}</typ:accountNo>
        <typ:bankCode>${escapeXml(bankAccount.bankCode)}</typ:bankCode>
      </bnk:bankAccount>`
    : ''

  const partnerAccountElement = tx.counterparty_account
    ? `      <bnk:partnerIdentity>
        <typ:address>
          <typ:company>${escapeXml(tx.counterparty_name || '')}</typ:company>
        </typ:address>
      </bnk:partnerIdentity>
      <bnk:paymentAccount>
        <typ:accountNo>${escapeXml(tx.counterparty_account)}</typ:accountNo>${tx.counterparty_bank_code ? `
        <typ:bankCode>${escapeXml(tx.counterparty_bank_code)}</typ:bankCode>` : ''}
      </bnk:paymentAccount>`
    : ''

  return `  <dat:dataPackItem id="${escapeXml(itemId)}" version="2.0">
    <bnk:bank version="2.0">
      <bnk:bankHeader>
        <bnk:bankType>${docType}</bnk:bankType>
${accountElement}
        <bnk:dateStatement>${tx.transaction_date}</bnk:dateStatement>
        <bnk:datePayment>${tx.transaction_date}</bnk:datePayment>${tx.variable_symbol ? `
        <bnk:symVar>${escapeXml(tx.variable_symbol)}</bnk:symVar>` : ''}${tx.constant_symbol ? `
        <bnk:symConst>${escapeXml(tx.constant_symbol)}</bnk:symConst>` : ''}${tx.specific_symbol ? `
        <bnk:symSpec>${escapeXml(tx.specific_symbol)}</bnk:symSpec>` : ''}
${partnerAccountElement}
        <bnk:text>${escapeXml(tx.description || (isIncome ? 'Příjem' : 'Výdaj'))}</bnk:text>
      </bnk:bankHeader>
      <bnk:bankDetail>
        <bnk:bankItem>
          <bnk:text>${escapeXml(tx.description || '')}</bnk:text>
          <bnk:homeCurrency>
            <typ:unitPrice>${absAmount.toFixed(2)}</typ:unitPrice>
          </bnk:homeCurrency>
        </bnk:bankItem>
      </bnk:bankDetail>
      <bnk:bankSummary>
        <bnk:homeCurrency>
          <typ:priceNone>${absAmount.toFixed(2)}</typ:priceNone>
        </bnk:homeCurrency>
      </bnk:bankSummary>
    </bnk:bank>
  </dat:dataPackItem>`
}

/**
 * Generate Pohoda XML for bank document liquidation (párování s fakturou).
 * Links a bank transaction to an existing invoice.
 */
function generateBankLiquidationItem(
  tx: BankDocumentForExport,
  invoice: BankDocumentInvoiceLink,
  bankAccount?: { accountNo: string; bankCode: string } | null
): string {
  const itemId = `BNK_LIQ_${tx.id.slice(0, 8)}`
  const isIncome = tx.amount > 0
  const absAmount = Math.abs(tx.amount)

  const accountElement = bankAccount
    ? `      <bnk:bankAccount>
        <typ:accountNo>${escapeXml(bankAccount.accountNo)}</typ:accountNo>
        <typ:bankCode>${escapeXml(bankAccount.bankCode)}</typ:bankCode>
      </bnk:bankAccount>`
    : ''

  return `  <dat:dataPackItem id="${escapeXml(itemId)}" version="2.0">
    <bnk:bank version="2.0">
      <bnk:bankHeader>
        <bnk:bankType>${isIncome ? 'receipt' : 'expense'}</bnk:bankType>
${accountElement}
        <bnk:dateStatement>${tx.transaction_date}</bnk:dateStatement>
        <bnk:datePayment>${tx.transaction_date}</bnk:datePayment>
        <bnk:symVar>${escapeXml(invoice.variable_symbol || invoice.invoice_number)}</bnk:symVar>
        <bnk:text>Likvidace faktury ${escapeXml(invoice.invoice_number)}</bnk:text>
      </bnk:bankHeader>
      <bnk:bankDetail>
        <bnk:bankItem>
          <bnk:text>Úhrada faktury ${escapeXml(invoice.invoice_number)}</bnk:text>
          <bnk:homeCurrency>
            <typ:unitPrice>${absAmount.toFixed(2)}</typ:unitPrice>
          </bnk:homeCurrency>
        </bnk:bankItem>
      </bnk:bankDetail>
      <bnk:bankSummary>
        <bnk:homeCurrency>
          <typ:priceNone>${absAmount.toFixed(2)}</typ:priceNone>
        </bnk:homeCurrency>
      </bnk:bankSummary>
    </bnk:bank>
  </dat:dataPackItem>`
}

/**
 * Generate Pohoda XML export for bank documents (příjmy/výdaje).
 */
export function generateBankDocumentXml(
  transactions: BankDocumentForExport[],
  ico: string,
  bankAccount?: { accountNo: string; bankCode: string } | null
): string {
  const dataPackItems = transactions
    .map((tx, i) => generateBankDocumentItem(tx, bankAccount, i))
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<dat:dataPack
  xmlns:dat="${NS_DAT}"
  xmlns:bnk="${NS_BNK}"
  xmlns:typ="${NS_TYP}"
  id="EXPORT_BNK_${new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)}"
  ico="${escapeXml(ico)}"
  application="UcetniOS"
  version="2.0"
  note="Export bankovních dokladů z Účetní OS">
${dataPackItems}
</dat:dataPack>`
}

/**
 * Generate Pohoda XML export for bank liquidation (párování transakcí s fakturami).
 */
export function generateBankLiquidationXml(
  pairs: Array<{ transaction: BankDocumentForExport; invoice: BankDocumentInvoiceLink }>,
  ico: string,
  bankAccount?: { accountNo: string; bankCode: string } | null
): string {
  const dataPackItems = pairs
    .map(({ transaction, invoice }) => generateBankLiquidationItem(transaction, invoice, bankAccount))
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<dat:dataPack
  xmlns:dat="${NS_DAT}"
  xmlns:bnk="${NS_BNK}"
  xmlns:typ="${NS_TYP}"
  id="EXPORT_LIQ_${new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)}"
  ico="${escapeXml(ico)}"
  application="UcetniOS"
  version="2.0"
  note="Export likvidace banky z Účetní OS">
${dataPackItems}
</dat:dataPack>`
}

// ============================================================
// CASH VOUCHERS (PPD/VPD pokladní doklady)
// ============================================================

export type CashVoucherForExport = {
  id: string
  doc_type: 'PPD' | 'VPD'
  doc_number: string
  transaction_date: string
  amount: number
  description?: string | null
  counterparty_name?: string | null
  counterparty_ico?: string | null
  vat_rate?: number
}

/**
 * Generate Pohoda XML for a single PPD/VPD cash voucher.
 * Uses intDoc:intDoc (interní doklad) element — Pohoda's standard for cash documents.
 */
function generateVoucherItem(cashTx: CashVoucherForExport): string {
  const itemId = `${cashTx.doc_type}_${cashTx.doc_number.replace(/[^a-zA-Z0-9]/g, '_')}`
  const isPPD = cashTx.doc_type === 'PPD'

  const vatRate = cashTx.vat_rate ?? 0
  const vatTag = vatRateTag(vatRate)
  const priceEl = vatPriceElement(vatRate)

  let base: number, vat: number
  if (vatRate > 0) {
    base = Math.round((cashTx.amount / (1 + vatRate / 100)) * 100) / 100
    vat = Math.round((cashTx.amount - base) * 100) / 100
  } else {
    base = cashTx.amount
    vat = 0
  }

  const partnerBlock = cashTx.counterparty_name
    ? `      <int:partnerIdentity>
        <typ:address>
          <typ:company>${escapeXml(cashTx.counterparty_name)}</typ:company>${cashTx.counterparty_ico ? `
          <typ:ico>${escapeXml(cashTx.counterparty_ico)}</typ:ico>` : ''}
        </typ:address>
      </int:partnerIdentity>`
    : ''

  return `  <dat:dataPackItem id="${escapeXml(itemId)}" version="2.0">
    <int:intDoc version="2.0">
      <int:intDocHeader>
        <int:intDocType>${isPPD ? 'receipt' : 'expense'}</int:intDocType>
        <int:number>
          <typ:numberRequested>${escapeXml(cashTx.doc_number)}</typ:numberRequested>
        </int:number>
        <int:date>${cashTx.transaction_date}</int:date>
        <int:dateTax>${cashTx.transaction_date}</int:dateTax>
        <int:text>${escapeXml(cashTx.description || (isPPD ? 'Příjmový pokladní doklad' : 'Výdajový pokladní doklad'))}</int:text>
${partnerBlock}
        <int:classificationVAT>inland</int:classificationVAT>
      </int:intDocHeader>
      <int:intDocDetail>
        <int:intDocItem>
          <int:text>${escapeXml(cashTx.description || cashTx.doc_number)}</int:text>
          <int:quantity>1</int:quantity>
          <int:${priceEl}>
            <typ:unitPrice>${base.toFixed(2)}</typ:unitPrice>
            <typ:price>${base.toFixed(2)}</typ:price>
            <typ:priceSum>${cashTx.amount.toFixed(2)}</typ:priceSum>
            <typ:priceVAT>${vat.toFixed(2)}</typ:priceVAT>
          </int:${priceEl}>
          <int:vatRate>${vatTag}</int:vatRate>
        </int:intDocItem>
      </int:intDocDetail>
      <int:intDocSummary>
        <int:homeCurrency>
          <int:${priceEl}>
            <typ:price>${base.toFixed(2)}</typ:price>
            <typ:priceSum>${cashTx.amount.toFixed(2)}</typ:priceSum>
            <typ:priceVAT>${vat.toFixed(2)}</typ:priceVAT>
          </int:${priceEl}>
        </int:homeCurrency>
      </int:intDocSummary>
    </int:intDoc>
  </dat:dataPackItem>`
}

/**
 * Generate Pohoda XML export for PPD/VPD cash vouchers.
 */
export function generateVoucherXml(
  vouchers: CashVoucherForExport[],
  ico: string
): string {
  const dataPackItems = vouchers.map(generateVoucherItem).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<dat:dataPack
  xmlns:dat="${NS_DAT}"
  xmlns:int="${NS_INT}"
  xmlns:typ="${NS_TYP}"
  id="EXPORT_PPD_${new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)}"
  ico="${escapeXml(ico)}"
  application="UcetniOS"
  version="2.0"
  note="Export pokladních dokladů z Účetní OS">
${dataPackItems}
</dat:dataPack>`
}
