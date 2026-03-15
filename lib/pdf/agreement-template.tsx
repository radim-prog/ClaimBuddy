// DPP/DPČ agreement PDF template using @react-pdf/renderer

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
import type { Employee } from '@/lib/types/employee'
import type { Company } from '@/app/accountant/clients/[companyId]/layout'

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

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 10,
    padding: 50,
    color: '#1a1a1a',
    lineHeight: 1.5,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 10,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 6,
    color: '#374151',
  },
  twoCol: {
    flexDirection: 'row' as const,
    gap: 20,
    marginBottom: 16,
  },
  col: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  colLabel: {
    fontSize: 8,
    color: '#9ca3af',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  colTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  colText: {
    fontSize: 9,
    color: '#4b5563',
    marginBottom: 2,
  },
  paragraph: {
    fontSize: 10,
    marginBottom: 8,
    textAlign: 'justify' as const,
  },
  listItem: {
    fontSize: 10,
    marginBottom: 4,
    paddingLeft: 12,
  },
  signatureRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginTop: 50,
  },
  signatureBlock: {
    width: '40%',
    textAlign: 'center' as const,
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#9ca3af',
    marginTop: 40,
    paddingTop: 4,
    fontSize: 9,
    color: '#6b7280',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginVertical: 12,
  },
  footer: {
    position: 'absolute' as const,
    bottom: 30,
    left: 50,
    right: 50,
    fontSize: 7,
    color: '#9ca3af',
    textAlign: 'center' as const,
  },
})

interface AgreementPDFProps {
  employee: Employee
  company: Company
  agreementDate?: string
}

export function AgreementPDF({ employee, company, agreementDate }: AgreementPDFProps) {
  const isDPP = employee.contract_type === 'dpp'
  const docTitle = isDPP ? 'DOHODA O PROVEDENÍ PRÁCE' : 'DOHODA O PRACOVNÍ ČINNOSTI'
  const lawRef = isDPP ? '§ 75 zákoníku práce' : '§ 76 zákoníku práce'
  const dateStr = agreementDate ? formatDate(agreementDate) : formatDate(new Date().toISOString())

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{docTitle}</Text>
        <Text style={styles.subtitle}>
          uzavřená dle {lawRef}, zák. č. 262/2006 Sb., zákoník práce, ve znění pozdějších předpisů
        </Text>

        {/* Parties */}
        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.colLabel}>Zaměstnavatel</Text>
            <Text style={styles.colTitle}>{company.name}</Text>
            <Text style={styles.colText}>IČO: {company.ico}</Text>
            {company.dic && <Text style={styles.colText}>DIČ: {company.dic}</Text>}
            {company.street && <Text style={styles.colText}>{company.street}</Text>}
            {(company.city || company.zip) && (
              <Text style={styles.colText}>{[company.zip, company.city].filter(Boolean).join(' ')}</Text>
            )}
            {company.managing_director && (
              <Text style={styles.colText}>Zastoupen: {company.managing_director}</Text>
            )}
          </View>
          <View style={styles.col}>
            <Text style={styles.colLabel}>Zaměstnanec</Text>
            <Text style={styles.colTitle}>{employee.first_name} {employee.last_name}</Text>
            {employee.birth_date && (
              <Text style={styles.colText}>Datum narození: {formatDate(employee.birth_date)}</Text>
            )}
            {employee.personal_id && (
              <Text style={styles.colText}>Rodné číslo: {employee.personal_id}</Text>
            )}
            {employee.address && <Text style={styles.colText}>{employee.address}</Text>}
            {employee.bank_account && (
              <Text style={styles.colText}>Bankovní účet: {employee.bank_account}</Text>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Terms */}
        <Text style={styles.sectionTitle}>I. Předmět dohody</Text>
        <Text style={styles.paragraph}>
          Zaměstnanec se zavazuje vykonávat pro zaměstnavatele práci na pozici: {employee.position}
        </Text>

        <Text style={styles.sectionTitle}>II. Doba trvání</Text>
        <Text style={styles.paragraph}>
          Dohoda se uzavírá na dobu {employee.employment_end ? 'určitou' : 'neurčitou'}
          {' '}od {formatDate(employee.employment_start)}
          {employee.employment_end ? ` do ${formatDate(employee.employment_end)}` : ''}.
        </Text>

        <Text style={styles.sectionTitle}>III. Odměna</Text>
        <Text style={styles.paragraph}>
          Za vykonanou práci náleží zaměstnanci odměna ve výši{' '}
          {employee.wage_type === 'hourly'
            ? `${(employee.hourly_rate || employee.base_salary).toLocaleString('cs-CZ')} Kč za hodinu`
            : `${employee.base_salary.toLocaleString('cs-CZ')} Kč měsíčně`
          }.
          Odměna je splatná ve výplatním termínu zaměstnavatele.
        </Text>

        {isDPP && (
          <>
            <Text style={styles.sectionTitle}>IV. Rozsah práce</Text>
            <Text style={styles.paragraph}>
              Rozsah práce nesmí u jednoho zaměstnavatele překročit 300 hodin v kalendářním roce.
              Do rozsahu práce se započítává i doba práce konaná zaměstnancem pro téhož zaměstnavatele
              na základě jiné dohody o provedení práce.
            </Text>
          </>
        )}

        {!isDPP && (
          <>
            <Text style={styles.sectionTitle}>IV. Rozsah práce</Text>
            <Text style={styles.paragraph}>
              Sjednaný rozsah pracovní doby nesmí překročit v průměru polovinu stanovené týdenní
              pracovní doby, tj. maximálně 20 hodin týdně, posuzováno za celou dobu,
              na kterou byla dohoda uzavřena, nejdéle za období 52 týdnů.
            </Text>
          </>
        )}

        <Text style={styles.sectionTitle}>V. Místo výkonu práce</Text>
        <Text style={styles.paragraph}>
          Místem výkonu práce je: {company.street ? `${company.street}, ${company.city || ''}` : company.city || 'sídlo zaměstnavatele'}.
        </Text>

        <Text style={styles.sectionTitle}>VI. Závěrečná ustanovení</Text>
        <Text style={styles.listItem}>
          1. Tuto dohodu lze zrušit dohodou smluvních stran ke sjednanému dni.
        </Text>
        <Text style={styles.listItem}>
          2. Tuto dohodu lze jednostranně zrušit z jakéhokoli důvodu nebo bez uvedení důvodu
          s 15denní výpovědní dobou, která začíná dnem doručení druhé smluvní straně.
        </Text>
        <Text style={styles.listItem}>
          3. Tato dohoda je vyhotovena ve 2 stejnopisech, z nichž každá strana obdrží po jednom.
        </Text>
        <Text style={styles.listItem}>
          4. Práva a povinnosti touto dohodou neupravené se řídí zákoníkem práce.
        </Text>

        {/* Signatures */}
        <View style={styles.signatureRow}>
          <View style={styles.signatureBlock}>
            <Text style={{ fontSize: 9, color: '#6b7280' }}>V _____________ dne {dateStr}</Text>
            <Text style={styles.signatureLine}>Zaměstnavatel</Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text style={{ fontSize: 9, color: '#6b7280' }}>V _____________ dne {dateStr}</Text>
            <Text style={styles.signatureLine}>Zaměstnanec</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Vygenerováno systémem Účetní OS &bull; {dateStr}
        </Text>
      </Page>
    </Document>
  )
}
