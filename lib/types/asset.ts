// Typy majetku firmy

export type AssetCategory = 'vehicle' | 'electronics' | 'real_estate' | 'machinery' | 'equipment' | 'other'

export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  vehicle: 'Automobil',
  electronics: 'Elektronika',
  real_estate: 'Nemovitost',
  machinery: 'Stroje',
  equipment: 'Vybavení',
  other: 'Ostatní',
}

export const ASSET_CATEGORY_ICONS: Record<AssetCategory, string> = {
  vehicle: 'Car',
  electronics: 'Laptop',
  real_estate: 'Home',
  machinery: 'Cog',
  equipment: 'Package',
  other: 'Box',
}

// Způsob pořízení
export type AcquisitionMethod = 'purchase' | 'leasing' | 'gift' | 'own_production' | 'other'

export const ACQUISITION_METHOD_LABELS: Record<AcquisitionMethod, string> = {
  purchase: 'Koupě',
  leasing: 'Leasing',
  gift: 'Dar',
  own_production: 'Vlastní výroba',
  other: 'Jiný',
}

// Odpisové skupiny
export type DepreciationGroup = '1' | '2' | '3' | '4' | '5' | '6' | 'none'

export const DEPRECIATION_GROUP_LABELS: Record<DepreciationGroup, string> = {
  '1': 'Skupina 1 (3 roky)',
  '2': 'Skupina 2 (5 let)',
  '3': 'Skupina 3 (10 let)',
  '4': 'Skupina 4 (20 let)',
  '5': 'Skupina 5 (30 let)',
  '6': 'Skupina 6 (50 let)',
  'none': 'Neodepisuje se',
}

// Stav majetku
export type AssetStatus = 'active' | 'sold' | 'disposed' | 'written_off'

export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  active: 'V užívání',
  sold: 'Prodáno',
  disposed: 'Vyřazeno',
  written_off: 'Odepsáno',
}

// Vlastní pole pro kategorii "Ostatní"
export type CustomField = {
  id: string
  label: string
  value: string
}

// Specifické údaje pro automobil
export type VehicleDetails = {
  license_plate: string      // SPZ
  brand: string              // Značka
  model: string              // Model
  year: number               // Rok výroby
  vin?: string               // VIN
  stk_until?: string         // STK platné do
  insurance_until?: string   // Pojištění do
  fuel_type?: 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'lpg' | 'cng'
  mileage?: number           // Najeto km
}

// Specifické údaje pro elektroniku
export type ElectronicsDetails = {
  device_type: string        // Typ zařízení (notebook, telefon, tiskárna...)
  brand: string              // Výrobce
  model?: string             // Model
  serial_number?: string     // Sériové číslo
  warranty_until?: string    // Záruka do
}

// Specifické údaje pro nemovitost
export type RealEstateDetails = {
  property_type: 'apartment' | 'house' | 'office' | 'warehouse' | 'land' | 'other'
  address: string            // Adresa
  area_m2?: number           // Plocha v m²
  land_registry_number?: string  // Číslo LV
  cadastral_area?: string    // Katastrální území
}

// Specifické údaje pro stroje
export type MachineryDetails = {
  machine_type: string       // Typ stroje
  brand: string              // Výrobce
  model?: string             // Model
  serial_number?: string     // Sériové číslo
  power_kw?: number          // Výkon kW
  next_service?: string      // Další servis
}

// Specifické údaje pro vybavení
export type EquipmentDetails = {
  equipment_type: string     // Typ vybavení
  brand?: string             // Výrobce
  quantity?: number          // Počet kusů
  location?: string          // Umístění
}

// Obecný majetek
export type Asset = {
  id: string
  company_id: string
  category: AssetCategory
  name: string               // Název/popis

  // Finanční údaje
  acquisition_price: number  // Pořizovací cena
  acquisition_date: string   // Datum pořízení
  acquisition_method: AcquisitionMethod
  current_value?: number     // Aktuální zůstatková hodnota

  // Odpisy
  depreciation_group: DepreciationGroup
  depreciation_start?: string  // Začátek odpisování

  // Stav
  status: AssetStatus
  disposal_date?: string     // Datum vyřazení/prodeje
  disposal_price?: number    // Prodejní cena (pokud prodáno)

  // Specifické údaje podle kategorie
  vehicle_details?: VehicleDetails
  electronics_details?: ElectronicsDetails
  real_estate_details?: RealEstateDetails
  machinery_details?: MachineryDetails
  equipment_details?: EquipmentDetails

  // Vlastní pole pro kategorii "Ostatní"
  custom_fields?: CustomField[]

  // Obecné
  notes?: string
  created_at: string
  updated_at: string
}

// Property types for real estate
export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: 'Byt',
  house: 'Dům',
  office: 'Kancelář',
  warehouse: 'Sklad',
  land: 'Pozemek',
  other: 'Jiné',
}

// Fuel types for vehicles
export const FUEL_TYPE_LABELS: Record<string, string> = {
  petrol: 'Benzín',
  diesel: 'Nafta',
  electric: 'Elektro',
  hybrid: 'Hybrid',
  lpg: 'LPG',
  cng: 'CNG',
}
