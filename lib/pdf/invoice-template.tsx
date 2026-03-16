// Czech invoice PDF template using @react-pdf/renderer
// Generates A4 PDF with supplier/customer info, items table, VAT recap, QR code

import React from 'react'
import path from 'path'
import {
  Document,
  Page,
  View,
  Text,
  Image,
  Font,
  StyleSheet,
} from '@react-pdf/renderer'
import type { Invoice } from '@/lib/mock-data'
import type { SupplierInfo } from '@/lib/invoice-config'
import { formatDate } from '@/lib/utils'

// Register Czech-supporting font
const fontDir = path.join(process.cwd(), 'public', 'fonts')
Font.register({
  family: 'Roboto',
  fonts: [
    { src: path.join(fontDir, 'Roboto-Regular.ttf'), fontWeight: 'normal' },
    { src: path.join(fontDir, 'Roboto-Bold.ttf'), fontWeight: 'bold' },
  ],
})

// Disable hyphenation for Czech text
Font.registerHyphenationCallback(word => [word])

// Format amount Czech style: 1 234,56
function formatAmount(amount: number): string {
  return amount.toLocaleString('cs-CZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}


// Format IBAN with spaces: CZ65 0800 0000 0020 0001 4539
function formatIBAN(iban: string): string {
  return iban.replace(/(.{4})/g, '$1 ').trim()
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 9,
    padding: 40,
    color: '#1a1a1a',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#7c3aed',
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  invoiceNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
  },
  subtitle: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
  },
  // Two column layout
  twoCol: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  col: {
    flex: 1,
  },
  // Party info
  partyBox: {
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 4,
    flex: 1,
  },
  partyLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#7c3aed',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  partyName: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  partyText: {
    fontSize: 9,
    color: '#374151',
    marginBottom: 1,
  },
  // Dates row
  datesRow: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#f3f0ff',
    padding: 8,
    borderRadius: 4,
  },
  dateItem: {
    flex: 1,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 7,
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  dateValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  // Table
  table: {
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#7c3aed',
    padding: 6,
    borderRadius: 2,
  },
  tableHeaderText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    padding: 6,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    padding: 6,
    backgroundColor: '#fafafa',
  },
  // Column widths
  colNum: { width: '5%' },
  colDesc: { width: '30%' },
  colQty: { width: '10%', textAlign: 'right' },
  colUnit: { width: '7%', textAlign: 'center' },
  colPrice: { width: '13%', textAlign: 'right' },
  colVat: { width: '8%', textAlign: 'right' },
  colDisc: { width: '12%', textAlign: 'right' },
  colTotal: { width: '15%', textAlign: 'right' },
  // Totals
  totalsBox: {
    marginLeft: 'auto',
    width: '50%',
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  totalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#7c3aed',
    borderRadius: 4,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 9,
    color: '#374151',
  },
  totalValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  totalLabelFinal: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  totalValueFinal: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  // Payment section
  paymentSection: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentLabel: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 1,
  },
  paymentValue: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  paymentTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#7c3aed',
    marginBottom: 8,
  },
  // QR code
  qrBox: {
    width: 130,
    alignItems: 'center',
  },
  qrImage: {
    width: 110,
    height: 110,
  },
  qrCaption: {
    fontSize: 7,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  // Notices
  noticesSection: {
    marginBottom: 12,
  },
  noticesTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 4,
    textTransform: 'uppercase' as const,
  },
  noticeText: {
    fontSize: 7.5,
    color: '#4b5563',
    marginBottom: 3,
    paddingLeft: 8,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 7,
    color: '#9ca3af',
    textAlign: 'center',
  },
})

interface InvoicePDFProps {
  invoice: Invoice
  supplier: SupplierInfo
  qrDataUrl?: string
  notices?: string[]
  documentType?: string
}

function getDocumentTitle(documentType?: string): string {
  switch (documentType) {
    case 'payment_request': return 'VÝZVA K PLATBĚ'
    case 'proforma': return 'ZÁLOHOVÁ FAKTURA'
    case 'credit_note': return 'DOBROPIS'
    default: return 'FAKTURA – DAŇOVÝ DOKLAD'
  }
}

export function InvoicePDF({ invoice, supplier, qrDataUrl, notices, documentType }: InvoicePDFProps) {
  // Group items by VAT rate for recap
  const vatRecap = new Map<number, { base: number; vat: number; total: number }>()
  for (const item of invoice.items) {
    const rate = item.vat_rate || 0
    const existing = vatRecap.get(rate) || { base: 0, vat: 0, total: 0 }
    existing.base += item.total_without_vat
    existing.vat += item.total_with_vat - item.total_without_vat
    existing.total += item.total_with_vat
    vatRecap.set(rate, existing)
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {supplier.logo_url && (
              <Image src={supplier.logo_url} style={{ width: 120, maxHeight: 60, objectFit: 'contain' }} />
            )}
            <View>
              <Text style={styles.title}>{getDocumentTitle(documentType)}</Text>
              <Text style={styles.subtitle}>Vystaveno v systému Účetní OS</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
            <Text style={styles.subtitle}>
              VS: {invoice.variable_symbol}
            </Text>
          </View>
        </View>

        {/* Supplier + Customer */}
        <View style={styles.twoCol}>
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>Dodavatel</Text>
            <Text style={styles.partyName}>{supplier.name}</Text>
            <Text style={styles.partyText}>IČO: {supplier.ico}</Text>
            <Text style={styles.partyText}>DIČ: {supplier.dic}</Text>
            <Text style={styles.partyText}>{supplier.address}</Text>
            <Text style={styles.partyText}>{supplier.zip} {supplier.city}</Text>
          </View>
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>Odběratel</Text>
            <Text style={styles.partyName}>
              {invoice.customer?.name || invoice.company_name}
            </Text>
            {invoice.customer?.ico && (
              <Text style={styles.partyText}>IČO: {invoice.customer.ico}</Text>
            )}
            {invoice.customer?.dic && (
              <Text style={styles.partyText}>DIČ: {invoice.customer.dic}</Text>
            )}
            {invoice.customer?.address && (
              <Text style={styles.partyText}>{invoice.customer.address}</Text>
            )}
          </View>
        </View>

        {/* Dates */}
        <View style={styles.datesRow}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Datum vystavení</Text>
            <Text style={styles.dateValue}>{formatDate(invoice.issue_date)}</Text>
          </View>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Datum splatnosti</Text>
            <Text style={styles.dateValue}>{formatDate(invoice.due_date)}</Text>
          </View>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>DUZP</Text>
            <Text style={styles.dateValue}>{formatDate(invoice.tax_date)}</Text>
          </View>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Variabilní symbol</Text>
            <Text style={styles.dateValue}>{invoice.variable_symbol}</Text>
          </View>
        </View>

        {/* Items table */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colNum]}>#</Text>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>Popis</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Mn.</Text>
            <Text style={[styles.tableHeaderText, styles.colUnit]}>Jed.</Text>
            <Text style={[styles.tableHeaderText, styles.colPrice]}>Cena/jed.</Text>
            <Text style={[styles.tableHeaderText, styles.colVat]}>DPH</Text>
            <Text style={[styles.tableHeaderText, styles.colDisc]}>Sleva</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Celkem</Text>
          </View>
          {/* Rows */}
          {invoice.items.map((item, i) => (
            <View key={item.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={styles.colNum}>{i + 1}</Text>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colUnit}>{item.unit || 'ks'}</Text>
              <Text style={styles.colPrice}>{formatAmount(item.unit_price)}</Text>
              <Text style={styles.colVat}>{item.vat_rate}%</Text>
              <Text style={styles.colDisc}>
                {item.discount_value
                  ? item.discount_type === 'percent'
                    ? `${item.discount_value}%`
                    : `${formatAmount(item.discount_value)} Kč`
                  : '-'
                }
              </Text>
              <Text style={styles.colTotal}>{formatAmount(item.total_with_vat)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsBox}>
          {Array.from(vatRecap.entries()).map(([rate, data]) => (
            <View key={rate} style={styles.totalRow}>
              <Text style={styles.totalLabel}>Základ DPH {rate}%</Text>
              <Text style={styles.totalValue}>{formatAmount(data.base)} Kč</Text>
            </View>
          ))}
          {Array.from(vatRecap.entries()).map(([rate, data]) => (
            <View key={`vat-${rate}`} style={styles.totalRow}>
              <Text style={styles.totalLabel}>DPH {rate}%</Text>
              <Text style={styles.totalValue}>{formatAmount(data.vat)} Kč</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Celkem bez DPH</Text>
            <Text style={styles.totalValue}>
              {formatAmount(invoice.total_without_vat)} Kč
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>DPH celkem</Text>
            <Text style={styles.totalValue}>
              {formatAmount(invoice.total_vat)} Kč
            </Text>
          </View>
          {(invoice.discount_total != null && invoice.discount_total > 0) && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: '#dc2626' }]}>Sleva celkem</Text>
              <Text style={[styles.totalValue, { color: '#dc2626' }]}>
                -{formatAmount(invoice.discount_total)} Kč
              </Text>
            </View>
          )}
          <View style={styles.totalRowFinal}>
            <Text style={styles.totalLabelFinal}>CELKEM K ÚHRADĚ</Text>
            <Text style={styles.totalValueFinal}>
              {formatAmount(invoice.total_with_vat)} Kč
            </Text>
          </View>
        </View>

        {/* Payment + QR */}
        <View style={styles.paymentSection}>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentTitle}>Platební údaje</Text>
            <Text style={styles.paymentLabel}>Číslo účtu</Text>
            <Text style={styles.paymentValue}>{supplier.bankAccount}</Text>
            <Text style={styles.paymentLabel}>IBAN</Text>
            <Text style={styles.paymentValue}>{formatIBAN(supplier.iban)}</Text>
            <Text style={styles.paymentLabel}>Variabilní symbol</Text>
            <Text style={styles.paymentValue}>{invoice.variable_symbol}</Text>
            <Text style={styles.paymentLabel}>Částka k úhradě</Text>
            <Text style={styles.paymentValue}>
              {formatAmount(invoice.total_with_vat)} Kč
            </Text>
          </View>
          {qrDataUrl && (
            <View style={styles.qrBox}>
              <Image src={qrDataUrl} style={styles.qrImage} />
              <Text style={styles.qrCaption}>QR Platba (SPAYD)</Text>
            </View>
          )}
          {supplier.signature_url && (
            <View style={{ alignItems: 'center', marginLeft: 10 }}>
              <Image src={supplier.signature_url} style={{ width: 100, maxHeight: 50, objectFit: 'contain' }} />
              <Text style={{ fontSize: 6, color: '#9ca3af', marginTop: 2 }}>Razítko / podpis</Text>
            </View>
          )}
        </View>

        {/* Notices */}
        {notices && notices.length > 0 && (
          <View style={styles.noticesSection}>
            <Text style={styles.noticesTitle}>Upozornění</Text>
            {notices.map((text, i) => (
              <Text key={i} style={styles.noticeText}>• {text}</Text>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {supplier.name} | IČO: {supplier.ico} | {supplier.registration}
            {supplier.web ? ` | ${supplier.web}` : ''}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
