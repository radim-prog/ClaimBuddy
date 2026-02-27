// Number series configuration for invoices

export interface NumberSeries {
  id: string            // 'default', 'eu', custom slug
  prefix: string        // 'FV', 'INV'
  format: string        // '{prefix}-{yyyy}-{nnnn}'
  next_number: number
  active: boolean
  description?: string  // 'Tuzemske faktury'
}

export interface InvoiceItemTemplate {
  id: string
  name: string
  description: string
  unit: string
  unit_price: number
  vat_rate: number
  category?: string
  sort_order: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}
