// PDF templates for Dohodari module: DPP/DPC agreements, timesheets, income confirmations

import React from 'react'
import path from 'path'
import {
  Document,
  Page,
  View,
  Text,
  Font,
  StyleSheet,
} from '@react-pdf/renderer'
import type { Dohoda, DohodaMesic } from '@/lib/types/dohodari'
import { DOHODA_TYPE_LABELS, INSURANCE_THRESHOLD, MAX_HOURS } from '@/lib/types/dohodari'

// Register Czech-supporting font
const fontDir = path.join(process.cwd(), 'public', 'fonts')
Font.register({
  family: 'Roboto',
  fonts: [
    { src: path.join(fontDir, 'Roboto-Regular.ttf'), fontWeight: 'normal' },
    { src: path.join(fontDir, 'Roboto-Bold.ttf'), fontWeight: 'bold' },
  ],
})
Font.registerHyphenationCallback(word => [word])

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('cs-CZ')
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(amount)
}

type CompanyInfo = {
  name: string
  ico: string
  dic?: string | null
  address?: string | null
  city?: string | null
  zip?: string | null
}

const s = StyleSheet.create({
  page: { fontFamily: 'Roboto', fontSize: 10, padding: 50, color: '#1a1a1a', lineHeight: 1.5 },
  title: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 10, textAlign: 'center', color: '#6b7280', marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', marginTop: 16, marginBottom: 6, color: '#374151' },
  twoCol: { flexDirection: 'row' as const, gap: 20, marginBottom: 16 },
  col: { flex: 1, padding: 12, backgroundColor: '#f9fafb', borderRadius: 4 },
  colLabel: { fontSize: 8, color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 },
  row: { flexDirection: 'row' as const, justifyContent: 'space-between', marginBottom: 2 },
  label: { color: '#6b7280', fontSize: 9 },
  value: { fontWeight: 'bold', fontSize: 9 },
  paragraph: { marginBottom: 8, textAlign: 'justify' as const },
  signatureRow: { flexDirection: 'row' as const, justifyContent: 'space-between', marginTop: 40 },
  signatureBox: { width: '45%', borderTopWidth: 1, borderTopColor: '#d1d5db', paddingTop: 8, textAlign: 'center' as const },
  tableHeader: { flexDirection: 'row' as const, backgroundColor: '#f3f4f6', padding: 6, fontWeight: 'bold', fontSize: 9 },
  tableRow: { flexDirection: 'row' as const, padding: 6, borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb', fontSize: 9 },
  tableTotalRow: { flexDirection: 'row' as const, padding: 6, fontWeight: 'bold', fontSize: 9, backgroundColor: '#eef2ff' },
  cellWide: { flex: 2 },
  cell: { flex: 1, textAlign: 'right' as const },
  cellLeft: { flex: 1 },
  footer: { position: 'absolute' as const, bottom: 30, left: 50, right: 50, fontSize: 7, color: '#9ca3af', textAlign: 'center' as const },
})

// ============================================
// 1. DOHODA PDF — Agreement contract
// ============================================

export function DohodaPDF({ dohoda, company }: { dohoda: Dohoda; company: CompanyInfo }) {
  const emp = dohoda.employee
  const isDPP = dohoda.typ === 'dpp'
  const paragraph = isDPP ? '75' : '76'

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>{DOHODA_TYPE_LABELS[dohoda.typ]}</Text>
        <Text style={s.subtitle}>
          uzavřená dle § {paragraph} zákona č. 262/2006 Sb., zákoníku práce, v platném znění
        </Text>

        {/* Parties */}
        <View style={s.twoCol}>
          <View style={s.col}>
            <Text style={s.colLabel}>Zaměstnavatel</Text>
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>{company.name}</Text>
            <Text>IČO: {company.ico}</Text>
            {company.dic && <Text>DIČ: {company.dic}</Text>}
            {company.address && <Text>{company.address}</Text>}
            {(company.city || company.zip) && <Text>{[company.zip, company.city].filter(Boolean).join(' ')}</Text>}
          </View>
          <View style={s.col}>
            <Text style={s.colLabel}>Zaměstnanec</Text>
            {emp ? (
              <>
                <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>{emp.first_name} {emp.last_name}</Text>
                {emp.birth_date && <Text>Narozen/a: {formatDate(emp.birth_date)}</Text>}
                {emp.personal_id && <Text>RČ: {emp.personal_id.substring(0, 6)}/**</Text>}
                {emp.address && <Text>{emp.address}</Text>}
              </>
            ) : (
              <Text>—</Text>
            )}
          </View>
        </View>

        {/* Terms */}
        <Text style={s.sectionTitle}>Předmět dohody</Text>
        <View style={s.row}>
          <Text style={s.label}>Druh práce:</Text>
          <Text style={s.value}>{dohoda.popis_prace || '—'}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Místo výkonu:</Text>
          <Text style={s.value}>{dohoda.misto_vykonu || 'sídlo zaměstnavatele'}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Odměna:</Text>
          <Text style={s.value}>{formatCurrency(dohoda.sazba)} / hodina</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Maximální rozsah:</Text>
          <Text style={s.value}>{MAX_HOURS[dohoda.typ].label}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Platnost od:</Text>
          <Text style={s.value}>{formatDate(dohoda.platnost_od)}</Text>
        </View>
        {dohoda.platnost_do && (
          <View style={s.row}>
            <Text style={s.label}>Platnost do:</Text>
            <Text style={s.value}>{formatDate(dohoda.platnost_do)}</Text>
          </View>
        )}

        {/* Legal text */}
        <Text style={s.sectionTitle}>Ujednání</Text>
        <Text style={s.paragraph}>
          1. Zaměstnavatel se zavazuje přidělovat zaměstnanci práci podle této dohody, platit mu za vykonanou práci odměnu a vytvářet podmínky pro plnění jeho pracovních úkolů.
        </Text>
        <Text style={s.paragraph}>
          2. Zaměstnanec se zavazuje konat práci osobně, svědomitě a dodržovat povinnosti vyplývající z této dohody a z právních předpisů vztahujících se k jím vykonávané práci.
        </Text>
        <Text style={s.paragraph}>
          3. Odměna je splatná po vykonání práce a předložení výkazu odpracovaných hodin, a to v nejbližším výplatním termínu zaměstnavatele.
        </Text>
        {isDPP && (
          <Text style={s.paragraph}>
            4. Celkový rozsah práce, na který se tato dohoda uzavírá, nesmí překročit 300 hodin v kalendářním roce u jednoho zaměstnavatele.
          </Text>
        )}
        {!isDPP && (
          <Text style={s.paragraph}>
            4. Sjednaný rozsah pracovní doby nesmí překročit v průměru 20 hodin týdně za celé období, na které byla dohoda uzavřena.
          </Text>
        )}
        <Text style={s.paragraph}>
          5. Tato dohoda může být zrušena dohodou smluvních stran nebo jednostrannou výpovědí z jakéhokoliv důvodu s 15denní výpovědní dobou.
        </Text>

        {/* Signatures */}
        <View style={s.signatureRow}>
          <View style={s.signatureBox}>
            <Text style={{ marginBottom: 4 }}>V .................... dne ..................</Text>
            <Text style={{ marginTop: 20 }}>Za zaměstnavatele</Text>
          </View>
          <View style={s.signatureBox}>
            <Text style={{ marginBottom: 4 }}>V .................... dne ..................</Text>
            <Text style={{ marginTop: 20 }}>Zaměstnanec</Text>
          </View>
        </View>

        <Text style={s.footer}>
          {DOHODA_TYPE_LABELS[dohoda.typ]} — Vygenerováno systémem UčetníApp
        </Text>
      </Page>
    </Document>
  )
}

// ============================================
// 2. VYKAZ PRACE PDF — Monthly timesheet
// ============================================

export function VykazPracePDF({ dohoda, company, vykaz }: { dohoda: Dohoda; company: CompanyInfo; vykaz: DohodaMesic }) {
  const emp = dohoda.employee
  const periodLabel = vykaz.period // 'YYYY-MM'

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>Výkaz práce</Text>
        <Text style={s.subtitle}>
          {DOHODA_TYPE_LABELS[dohoda.typ]} — období {periodLabel}
        </Text>

        {/* Header info */}
        <View style={s.twoCol}>
          <View style={s.col}>
            <Text style={s.colLabel}>Zaměstnavatel</Text>
            <Text style={{ fontWeight: 'bold' }}>{company.name}</Text>
            <Text>IČO: {company.ico}</Text>
          </View>
          <View style={s.col}>
            <Text style={s.colLabel}>Zaměstnanec</Text>
            <Text style={{ fontWeight: 'bold' }}>{emp ? `${emp.first_name} ${emp.last_name}` : '—'}</Text>
          </View>
        </View>

        {/* Summary table */}
        <Text style={s.sectionTitle}>Souhrn</Text>
        <View style={s.tableHeader}>
          <Text style={s.cellWide}>Položka</Text>
          <Text style={s.cell}>Částka</Text>
        </View>
        <View style={s.tableRow}>
          <Text style={s.cellWide}>Odpracované hodiny</Text>
          <Text style={s.cell}>{vykaz.hodiny} hod</Text>
        </View>
        <View style={s.tableRow}>
          <Text style={s.cellWide}>Sazba za hodinu</Text>
          <Text style={s.cell}>{formatCurrency(dohoda.sazba)}</Text>
        </View>
        <View style={s.tableTotalRow}>
          <Text style={s.cellWide}>Hrubá mzda</Text>
          <Text style={s.cell}>{formatCurrency(vykaz.hruba_mzda)}</Text>
        </View>

        {/* Deductions */}
        {(vykaz.socialni_zamestnanec > 0 || vykaz.zdravotni_zamestnanec > 0) && (
          <>
            <Text style={[s.sectionTitle, { marginTop: 12 }]}>Odvody zaměstnance</Text>
            {vykaz.socialni_zamestnanec > 0 && (
              <View style={s.tableRow}>
                <Text style={s.cellWide}>Sociální pojištění (7,1%)</Text>
                <Text style={s.cell}>-{formatCurrency(vykaz.socialni_zamestnanec)}</Text>
              </View>
            )}
            {vykaz.zdravotni_zamestnanec > 0 && (
              <View style={s.tableRow}>
                <Text style={s.cellWide}>Zdravotní pojištění (4,5%)</Text>
                <Text style={s.cell}>-{formatCurrency(vykaz.zdravotni_zamestnanec)}</Text>
              </View>
            )}
          </>
        )}
        <View style={s.tableRow}>
          <Text style={s.cellWide}>Daň ({vykaz.typ_dane === 'srazkova' ? 'srážková 15%' : 'zálohová'})</Text>
          <Text style={s.cell}>-{formatCurrency(Math.max(0, vykaz.dan))}</Text>
        </View>
        {vykaz.sleva_poplatnik > 0 && (
          <View style={s.tableRow}>
            <Text style={s.cellWide}>Sleva na dani</Text>
            <Text style={s.cell}>{formatCurrency(vykaz.sleva_poplatnik)}</Text>
          </View>
        )}
        <View style={s.tableTotalRow}>
          <Text style={s.cellWide}>Čistá mzda k výplatě</Text>
          <Text style={s.cell}>{formatCurrency(vykaz.cista_mzda)}</Text>
        </View>

        {/* Employer cost */}
        <Text style={[s.sectionTitle, { marginTop: 12 }]}>Náklady zaměstnavatele</Text>
        <View style={s.tableRow}>
          <Text style={s.cellWide}>Hrubá mzda</Text>
          <Text style={s.cell}>{formatCurrency(vykaz.hruba_mzda)}</Text>
        </View>
        {vykaz.socialni_zamestnavatel > 0 && (
          <View style={s.tableRow}>
            <Text style={s.cellWide}>Sociální pojištění (24,8%)</Text>
            <Text style={s.cell}>{formatCurrency(vykaz.socialni_zamestnavatel)}</Text>
          </View>
        )}
        {vykaz.zdravotni_zamestnavatel > 0 && (
          <View style={s.tableRow}>
            <Text style={s.cellWide}>Zdravotní pojištění (9%)</Text>
            <Text style={s.cell}>{formatCurrency(vykaz.zdravotni_zamestnavatel)}</Text>
          </View>
        )}
        <View style={s.tableTotalRow}>
          <Text style={s.cellWide}>Celkové náklady zaměstnavatele</Text>
          <Text style={s.cell}>{formatCurrency(vykaz.naklady_zamestnavatel)}</Text>
        </View>

        {/* Signatures */}
        <View style={s.signatureRow}>
          <View style={s.signatureBox}>
            <Text>Zaměstnavatel</Text>
          </View>
          <View style={s.signatureBox}>
            <Text>Zaměstnanec</Text>
          </View>
        </View>

        <Text style={s.footer}>
          Výkaz práce — {periodLabel} — Vygenerováno systémem UčetníApp
        </Text>
      </Page>
    </Document>
  )
}

// ============================================
// 3. POTVRZENI PRIJMU PDF — Income confirmation
// ============================================

export function PotvrzeniPrijmuPDF({ dohoda, company, vykazy }: { dohoda: Dohoda; company: CompanyInfo; vykazy: DohodaMesic[] }) {
  const emp = dohoda.employee
  const sorted = [...vykazy].sort((a, b) => a.period.localeCompare(b.period))

  const totalGross = sorted.reduce((sum, v) => sum + v.hruba_mzda, 0)
  const totalTax = sorted.reduce((sum, v) => sum + Math.max(0, v.dan), 0)
  const totalSocial = sorted.reduce((sum, v) => sum + v.socialni_zamestnanec, 0)
  const totalHealth = sorted.reduce((sum, v) => sum + v.zdravotni_zamestnanec, 0)
  const totalNet = sorted.reduce((sum, v) => sum + v.cista_mzda, 0)

  const periodFrom = sorted[0]?.period || '—'
  const periodTo = sorted[sorted.length - 1]?.period || '—'

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>Potvrzení o příjmu</Text>
        <Text style={s.subtitle}>
          Pro účely daňového přiznání — období {periodFrom} až {periodTo}
        </Text>

        {/* Header */}
        <View style={s.twoCol}>
          <View style={s.col}>
            <Text style={s.colLabel}>Zaměstnavatel</Text>
            <Text style={{ fontWeight: 'bold' }}>{company.name}</Text>
            <Text>IČO: {company.ico}</Text>
            {company.dic && <Text>DIČ: {company.dic}</Text>}
            {company.address && <Text>{company.address}</Text>}
          </View>
          <View style={s.col}>
            <Text style={s.colLabel}>Poplatník</Text>
            {emp ? (
              <>
                <Text style={{ fontWeight: 'bold' }}>{emp.first_name} {emp.last_name}</Text>
                {emp.birth_date && <Text>Narozen/a: {formatDate(emp.birth_date)}</Text>}
                {emp.personal_id && <Text>RČ: {emp.personal_id.substring(0, 6)}/**</Text>}
                {emp.address && <Text>{emp.address}</Text>}
              </>
            ) : (
              <Text>—</Text>
            )}
          </View>
        </View>

        <Text style={s.sectionTitle}>Typ pracovněprávního vztahu</Text>
        <Text style={s.paragraph}>
          {DOHODA_TYPE_LABELS[dohoda.typ]} — sazba {formatCurrency(dohoda.sazba)}/hod
        </Text>

        {/* Monthly breakdown table */}
        <Text style={s.sectionTitle}>Přehled příjmů po měsících</Text>
        <View style={s.tableHeader}>
          <Text style={s.cellLeft}>Měsíc</Text>
          <Text style={s.cell}>Hrubý příjem</Text>
          <Text style={s.cell}>Sražená daň</Text>
          <Text style={s.cell}>Sociální</Text>
          <Text style={s.cell}>Zdravotní</Text>
          <Text style={s.cell}>Čistý příjem</Text>
        </View>
        {sorted.map((v) => (
          <View key={v.id} style={s.tableRow}>
            <Text style={s.cellLeft}>{v.period}</Text>
            <Text style={s.cell}>{formatCurrency(v.hruba_mzda)}</Text>
            <Text style={s.cell}>{formatCurrency(Math.max(0, v.dan))}</Text>
            <Text style={s.cell}>{formatCurrency(v.socialni_zamestnanec)}</Text>
            <Text style={s.cell}>{formatCurrency(v.zdravotni_zamestnanec)}</Text>
            <Text style={s.cell}>{formatCurrency(v.cista_mzda)}</Text>
          </View>
        ))}
        <View style={s.tableTotalRow}>
          <Text style={s.cellLeft}>CELKEM</Text>
          <Text style={s.cell}>{formatCurrency(totalGross)}</Text>
          <Text style={s.cell}>{formatCurrency(totalTax)}</Text>
          <Text style={s.cell}>{formatCurrency(totalSocial)}</Text>
          <Text style={s.cell}>{formatCurrency(totalHealth)}</Text>
          <Text style={s.cell}>{formatCurrency(totalNet)}</Text>
        </View>

        {/* Legal notice */}
        <Text style={[s.paragraph, { marginTop: 20 }]}>
          Toto potvrzení je vystaveno na žádost zaměstnance pro účely podání daňového přiznání
          za příslušné zdaňovací období.
        </Text>

        {/* Signature */}
        <View style={[s.signatureRow, { marginTop: 30 }]}>
          <View style={s.signatureBox}>
            <Text style={{ marginBottom: 4 }}>V .................... dne ..................</Text>
            <Text style={{ marginTop: 20 }}>Razítko a podpis zaměstnavatele</Text>
          </View>
          <View style={{ width: '45%' }} />
        </View>

        <Text style={s.footer}>
          Potvrzení o příjmu — Vygenerováno systémem UčetníApp
        </Text>
      </Page>
    </Document>
  )
}
