// Czech travel diary (kniha jízd) PDF template using @react-pdf/renderer
// Formal layout: company header, vehicle info, legal rates, monthly trip tables, summaries

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
import { BASIC_RATES_PER_KM, DECREE_FUEL_PRICES, type VehicleCategory } from '@/lib/types/travel'

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

// ── Types ──

export interface TravelBookTrip {
  trip_date: string
  departure_time: string | null
  arrival_time: string | null
  origin: string
  destination: string
  purpose: string
  distance_km: number
  is_round_trip: boolean
  odometer_start: number | null
  odometer_end: number | null
  basic_rate_per_km: number | null
  fuel_price_per_unit: number | null
  reimbursement: number | null
}

export interface TravelBookData {
  company_name: string
  company_ico: string | null
  company_address: string | null
  vehicle_name: string
  vehicle_license_plate: string
  vehicle_category: VehicleCategory
  vehicle_fuel_type: string
  vehicle_fuel_consumption: number | null
  driver_name: string | null
  period_start: string // YYYY-MM
  period_end: string
  trips: TravelBookTrip[]
  total_km: number
  total_reimbursement: number
  generated_at: string
}

// ── Helpers ──

function fmt(n: number): string {
  return n.toLocaleString('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(d: string): string {
  const [y, m, day] = d.split('-')
  return `${day}.${m}.${y}`
}

function fmtMonth(m: string): string {
  const MONTHS = ['', 'Leden', 'Unor', 'Brezen', 'Duben', 'Kveten', 'Cerven',
    'Cervenec', 'Srpen', 'Zari', 'Rijen', 'Listopad', 'Prosinec']
  const [y, mo] = m.split('-').map(Number)
  return `${MONTHS[mo]} ${y}`
}

function groupByMonth(trips: TravelBookTrip[]): Record<string, TravelBookTrip[]> {
  const groups: Record<string, TravelBookTrip[]> = {}
  for (const t of trips) {
    const m = t.trip_date.slice(0, 7)
    if (!groups[m]) groups[m] = []
    groups[m].push(t)
  }
  return groups
}

// ── Styles ──

const s = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 8,
    padding: 30,
    paddingBottom: 50,
    color: '#1a1a1a',
  },
  // Header
  header: {
    borderBottomWidth: 2,
    borderBottomColor: '#7c3aed',
    paddingBottom: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7c3aed',
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerCol: {
    flex: 1,
  },
  label: {
    fontSize: 7,
    color: '#6b7280',
    marginBottom: 1,
  },
  value: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  // Legal rates box
  ratesBox: {
    backgroundColor: '#f3f0ff',
    padding: 6,
    borderRadius: 3,
    marginBottom: 10,
    flexDirection: 'row',
    gap: 20,
  },
  rateItem: {
    fontSize: 7,
    color: '#4c1d95',
  },
  // Month section
  monthTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 10,
    marginBottom: 4,
    backgroundColor: '#f9fafb',
    padding: 4,
    borderRadius: 2,
  },
  // Table
  table: {
    marginBottom: 6,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#7c3aed',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 7,
    paddingVertical: 3,
    paddingHorizontal: 2,
  },
  tableRow: {
    flexDirection: 'row',
    fontSize: 7,
    paddingVertical: 2,
    paddingHorizontal: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  tableRowAlt: {
    backgroundColor: '#fafafa',
  },
  // Column widths
  colDate: { width: '9%' },
  colTime: { width: '8%' },
  colFrom: { width: '14%' },
  colTo: { width: '14%' },
  colPurpose: { width: '17%' },
  colKm: { width: '6%', textAlign: 'right' },
  colRT: { width: '4%', textAlign: 'center' },
  colOdoStart: { width: '8%', textAlign: 'right' },
  colOdoEnd: { width: '8%', textAlign: 'right' },
  colReimb: { width: '12%', textAlign: 'right' },
  // Summary
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderTopWidth: 1,
    borderTopColor: '#7c3aed',
    marginTop: 2,
  },
  summaryLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    marginRight: 8,
  },
  summaryValue: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: '#9ca3af',
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb',
    paddingTop: 4,
  },
  // Grand total
  grandTotal: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f3f0ff',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#7c3aed',
  },
  grandTotalTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#7c3aed',
    marginBottom: 4,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  grandTotalLabel: {
    fontSize: 9,
    color: '#374151',
  },
  grandTotalValue: {
    fontSize: 9,
    fontWeight: 'bold',
  },
})

// ── Components ──

function TripTableHeader() {
  return (
    <View style={s.tableHeader}>
      <Text style={s.colDate}>Datum</Text>
      <Text style={s.colTime}>Cas</Text>
      <Text style={s.colFrom}>Odkud</Text>
      <Text style={s.colTo}>Kam</Text>
      <Text style={s.colPurpose}>Ucel</Text>
      <Text style={s.colKm}>km</Text>
      <Text style={s.colRT}>ZP</Text>
      <Text style={s.colOdoStart}>Tach.Z</Text>
      <Text style={s.colOdoEnd}>Tach.K</Text>
      <Text style={s.colReimb}>Nahrada Kc</Text>
    </View>
  )
}

function TripRow({ trip, idx }: { trip: TravelBookTrip; idx: number }) {
  const rowStyle = idx % 2 === 1 ? [s.tableRow, s.tableRowAlt] : s.tableRow
  return (
    <View style={rowStyle} wrap={false}>
      <Text style={s.colDate}>{fmtDate(trip.trip_date)}</Text>
      <Text style={s.colTime}>
        {(trip.departure_time || '').slice(0, 5)}-{(trip.arrival_time || '').slice(0, 5)}
      </Text>
      <Text style={s.colFrom}>{trip.origin}</Text>
      <Text style={s.colTo}>{trip.destination}</Text>
      <Text style={s.colPurpose}>{trip.purpose}</Text>
      <Text style={s.colKm}>{trip.distance_km}</Text>
      <Text style={s.colRT}>{trip.is_round_trip ? 'A/Z' : ''}</Text>
      <Text style={s.colOdoStart}>{trip.odometer_start?.toLocaleString('cs-CZ') || ''}</Text>
      <Text style={s.colOdoEnd}>{trip.odometer_end?.toLocaleString('cs-CZ') || ''}</Text>
      <Text style={s.colReimb}>{trip.reimbursement ? fmt(trip.reimbursement) : ''}</Text>
    </View>
  )
}

function MonthSummary({ trips }: { trips: TravelBookTrip[] }) {
  const totalKm = trips.reduce((s, t) => {
    return s + ((t.odometer_end || 0) - (t.odometer_start || 0))
  }, 0)
  const totalReimb = trips.reduce((s, t) => s + (t.reimbursement || 0), 0)

  return (
    <View style={s.summaryRow}>
      <Text style={s.summaryLabel}>Celkem: {trips.length} cest</Text>
      <Text style={s.summaryLabel}>{totalKm.toLocaleString('cs-CZ')} km</Text>
      <Text style={s.summaryValue}>{fmt(totalReimb)} Kc</Text>
    </View>
  )
}

// ── Main Document ──

export function TravelBookDocument({ data }: { data: TravelBookData }) {
  const monthGroups = groupByMonth(data.trips)
  const months = Object.keys(monthGroups).sort()

  const basicRate = BASIC_RATES_PER_KM[data.vehicle_category] || BASIC_RATES_PER_KM.car
  const fuelKey = data.vehicle_fuel_type === 'hybrid' ? 'petrol' : data.vehicle_fuel_type
  const fuelPrice = DECREE_FUEL_PRICES[fuelKey]?.price || DECREE_FUEL_PRICES.petrol.price

  return (
    <Document>
      {/* Title page / header on first page */}
      <Page size="A4" orientation="landscape" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Kniha jizd</Text>
          <View style={s.headerRow}>
            <View style={s.headerCol}>
              <Text style={s.label}>Firma</Text>
              <Text style={s.value}>{data.company_name}</Text>
              {data.company_ico && <Text style={{ fontSize: 8, color: '#6b7280' }}>IC: {data.company_ico}</Text>}
              {data.company_address && <Text style={{ fontSize: 8, color: '#6b7280' }}>{data.company_address}</Text>}
            </View>
            <View style={s.headerCol}>
              <Text style={s.label}>Vozidlo</Text>
              <Text style={s.value}>{data.vehicle_name} ({data.vehicle_license_plate})</Text>
              <Text style={{ fontSize: 8, color: '#6b7280' }}>
                Spotreba: {data.vehicle_fuel_consumption || '?'} l/100km
              </Text>
            </View>
            <View style={s.headerCol}>
              <Text style={s.label}>Ridic</Text>
              <Text style={s.value}>{data.driver_name || 'Neuvedeno'}</Text>
              <Text style={s.label}>Obdobi</Text>
              <Text style={s.value}>{data.period_start} az {data.period_end}</Text>
            </View>
          </View>
        </View>

        {/* Legal rates */}
        <View style={s.ratesBox}>
          <Text style={s.rateItem}>Zakl. sazba: {basicRate} Kc/km (vyhl. 573/2025 Sb.)</Text>
          <Text style={s.rateItem}>Prumerna cena PHM: {fuelPrice} Kc/l ({DECREE_FUEL_PRICES[fuelKey]?.label || 'Benzin'})</Text>
          <Text style={s.rateItem}>Spotreba: {data.vehicle_fuel_consumption || '?'} l/100km</Text>
        </View>

        {/* Monthly tables */}
        {months.map(month => {
          const trips = monthGroups[month]
          return (
            <View key={month} wrap={false}>
              <Text style={s.monthTitle}>{fmtMonth(month)} ({trips.length} cest)</Text>
              <View style={s.table}>
                <TripTableHeader />
                {trips.map((trip, idx) => (
                  <TripRow key={idx} trip={trip} idx={idx} />
                ))}
                <MonthSummary trips={trips} />
              </View>
            </View>
          )
        })}

        {/* Grand total */}
        <View style={s.grandTotal}>
          <Text style={s.grandTotalTitle}>Celkovy prehled</Text>
          <View style={s.grandTotalRow}>
            <Text style={s.grandTotalLabel}>Celkem cest:</Text>
            <Text style={s.grandTotalValue}>{data.trips.length}</Text>
          </View>
          <View style={s.grandTotalRow}>
            <Text style={s.grandTotalLabel}>Celkem km:</Text>
            <Text style={s.grandTotalValue}>{data.total_km.toLocaleString('cs-CZ')} km</Text>
          </View>
          <View style={s.grandTotalRow}>
            <Text style={s.grandTotalLabel}>Celkova nahrada:</Text>
            <Text style={[s.grandTotalValue, { color: '#7c3aed' }]}>{fmt(data.total_reimbursement)} Kc</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text>Kniha jizd — {data.company_name} — {data.vehicle_license_plate}</Text>
          <Text>Vygenerovano: {data.generated_at ? fmtDate(data.generated_at.split('T')[0]) : ''}</Text>
          <Text render={({ pageNumber, totalPages }) => `Strana ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
