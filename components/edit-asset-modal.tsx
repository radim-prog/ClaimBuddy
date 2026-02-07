'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Car,
  Laptop,
  Home,
  Cog,
  Package,
  Box,
  Save,
  X,
  Plus,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Asset,
  AssetCategory,
  AcquisitionMethod,
  DepreciationGroup,
  AssetStatus,
  CustomField,
  ASSET_CATEGORY_LABELS,
  ACQUISITION_METHOD_LABELS,
  DEPRECIATION_GROUP_LABELS,
  ASSET_STATUS_LABELS,
  PROPERTY_TYPE_LABELS,
  FUEL_TYPE_LABELS,
} from '@/lib/types/asset'

type EditAssetModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset: Asset | null
  companyId: string
  onSave: (asset: Asset) => void
}

const CATEGORY_ICONS: Record<AssetCategory, React.ReactNode> = {
  vehicle: <Car className="h-5 w-5" />,
  electronics: <Laptop className="h-5 w-5" />,
  real_estate: <Home className="h-5 w-5" />,
  machinery: <Cog className="h-5 w-5" />,
  equipment: <Package className="h-5 w-5" />,
  other: <Box className="h-5 w-5" />,
}

export function EditAssetModal({
  open,
  onOpenChange,
  asset,
  companyId,
  onSave,
}: EditAssetModalProps) {
  const isNew = !asset
  const [saving, setSaving] = useState(false)

  // Základní údaje
  const [category, setCategory] = useState<AssetCategory>('vehicle')
  const [name, setName] = useState('')
  const [acquisitionPrice, setAcquisitionPrice] = useState('')
  const [acquisitionDate, setAcquisitionDate] = useState('')
  const [acquisitionMethod, setAcquisitionMethod] = useState<AcquisitionMethod>('purchase')
  const [currentValue, setCurrentValue] = useState('')
  const [depreciationGroup, setDepreciationGroup] = useState<DepreciationGroup>('2')
  const [status, setStatus] = useState<AssetStatus>('active')
  const [notes, setNotes] = useState('')

  // Automobil
  const [licensePlate, setLicensePlate] = useState('')
  const [vehicleBrand, setVehicleBrand] = useState('')
  const [vehicleModel, setVehicleModel] = useState('')
  const [vehicleYear, setVehicleYear] = useState('')
  const [vin, setVin] = useState('')
  const [stkUntil, setStkUntil] = useState('')
  const [insuranceUntil, setInsuranceUntil] = useState('')
  const [fuelType, setFuelType] = useState('')
  const [mileage, setMileage] = useState('')

  // Elektronika
  const [deviceType, setDeviceType] = useState('')
  const [electronicsBrand, setElectronicsBrand] = useState('')
  const [electronicsModel, setElectronicsModel] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [warrantyUntil, setWarrantyUntil] = useState('')

  // Nemovitost
  const [propertyType, setPropertyType] = useState('office')
  const [address, setAddress] = useState('')
  const [areaM2, setAreaM2] = useState('')
  const [landRegistryNumber, setLandRegistryNumber] = useState('')
  const [cadastralArea, setCadastralArea] = useState('')

  // Stroje
  const [machineType, setMachineType] = useState('')
  const [machineryBrand, setMachineryBrand] = useState('')
  const [machineryModel, setMachineryModel] = useState('')
  const [machinerySerial, setMachinerySerial] = useState('')
  const [powerKw, setPowerKw] = useState('')
  const [nextService, setNextService] = useState('')

  // Vybavení
  const [equipmentType, setEquipmentType] = useState('')
  const [equipmentBrand, setEquipmentBrand] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [location, setLocation] = useState('')

  // Vlastní pole (pro kategorii Ostatní)
  const [customFields, setCustomFields] = useState<CustomField[]>([])

  // Inicializace při otevření
  useEffect(() => {
    if (open) {
      if (asset) {
        // Editace existujícího
        setCategory(asset.category)
        setName(asset.name)
        setAcquisitionPrice(asset.acquisition_price.toString())
        setAcquisitionDate(asset.acquisition_date)
        setAcquisitionMethod(asset.acquisition_method)
        setCurrentValue(asset.current_value?.toString() || '')
        setDepreciationGroup(asset.depreciation_group)
        setStatus(asset.status)
        setNotes(asset.notes || '')

        // Specifické údaje
        if (asset.vehicle_details) {
          setLicensePlate(asset.vehicle_details.license_plate)
          setVehicleBrand(asset.vehicle_details.brand)
          setVehicleModel(asset.vehicle_details.model)
          setVehicleYear(asset.vehicle_details.year.toString())
          setVin(asset.vehicle_details.vin || '')
          setStkUntil(asset.vehicle_details.stk_until || '')
          setInsuranceUntil(asset.vehicle_details.insurance_until || '')
          setFuelType(asset.vehicle_details.fuel_type || '')
          setMileage(asset.vehicle_details.mileage?.toString() || '')
        }

        if (asset.electronics_details) {
          setDeviceType(asset.electronics_details.device_type)
          setElectronicsBrand(asset.electronics_details.brand)
          setElectronicsModel(asset.electronics_details.model || '')
          setSerialNumber(asset.electronics_details.serial_number || '')
          setWarrantyUntil(asset.electronics_details.warranty_until || '')
        }

        if (asset.real_estate_details) {
          setPropertyType(asset.real_estate_details.property_type)
          setAddress(asset.real_estate_details.address)
          setAreaM2(asset.real_estate_details.area_m2?.toString() || '')
          setLandRegistryNumber(asset.real_estate_details.land_registry_number || '')
          setCadastralArea(asset.real_estate_details.cadastral_area || '')
        }

        if (asset.machinery_details) {
          setMachineType(asset.machinery_details.machine_type)
          setMachineryBrand(asset.machinery_details.brand)
          setMachineryModel(asset.machinery_details.model || '')
          setMachinerySerial(asset.machinery_details.serial_number || '')
          setPowerKw(asset.machinery_details.power_kw?.toString() || '')
          setNextService(asset.machinery_details.next_service || '')
        }

        if (asset.equipment_details) {
          setEquipmentType(asset.equipment_details.equipment_type)
          setEquipmentBrand(asset.equipment_details.brand || '')
          setQuantity(asset.equipment_details.quantity?.toString() || '1')
          setLocation(asset.equipment_details.location || '')
        }

        if (asset.custom_fields) {
          setCustomFields(asset.custom_fields)
        }
      } else {
        // Reset pro nový
        setCategory('vehicle')
        setName('')
        setAcquisitionPrice('')
        setAcquisitionDate(new Date().toISOString().split('T')[0])
        setAcquisitionMethod('purchase')
        setCurrentValue('')
        setDepreciationGroup('2')
        setStatus('active')
        setNotes('')
        // Reset všech specifických polí
        setLicensePlate('')
        setVehicleBrand('')
        setVehicleModel('')
        setVehicleYear(new Date().getFullYear().toString())
        setVin('')
        setStkUntil('')
        setInsuranceUntil('')
        setFuelType('')
        setMileage('')
        setDeviceType('')
        setElectronicsBrand('')
        setElectronicsModel('')
        setSerialNumber('')
        setWarrantyUntil('')
        setPropertyType('office')
        setAddress('')
        setAreaM2('')
        setLandRegistryNumber('')
        setCadastralArea('')
        setMachineType('')
        setMachineryBrand('')
        setMachineryModel('')
        setMachinerySerial('')
        setPowerKw('')
        setNextService('')
        setEquipmentType('')
        setEquipmentBrand('')
        setQuantity('1')
        setLocation('')
        setCustomFields([])
      }
    }
  }, [open, asset])

  const addCustomField = () => {
    setCustomFields([
      ...customFields,
      { id: `cf-${Date.now()}`, label: '', value: '' },
    ])
  }

  const updateCustomField = (id: string, field: 'label' | 'value', value: string) => {
    setCustomFields(
      customFields.map((cf) => (cf.id === id ? { ...cf, [field]: value } : cf))
    )
  }

  const removeCustomField = (id: string) => {
    setCustomFields(customFields.filter((cf) => cf.id !== id))
  }

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Vyplňte název majetku')
      return
    }
    if (!acquisitionPrice) {
      toast.error('Vyplňte pořizovací cenu')
      return
    }

    setSaving(true)

    const newAsset: Asset = {
      id: asset?.id || `asset-${Date.now()}`,
      company_id: companyId,
      category,
      name: name.trim(),
      acquisition_price: parseFloat(acquisitionPrice),
      acquisition_date: acquisitionDate,
      acquisition_method: acquisitionMethod,
      current_value: currentValue ? parseFloat(currentValue) : undefined,
      depreciation_group: depreciationGroup,
      status,
      notes: notes.trim() || undefined,
      created_at: asset?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Přidat specifické údaje podle kategorie
    if (category === 'vehicle') {
      newAsset.vehicle_details = {
        license_plate: licensePlate,
        brand: vehicleBrand,
        model: vehicleModel,
        year: parseInt(vehicleYear) || new Date().getFullYear(),
        vin: vin || undefined,
        stk_until: stkUntil || undefined,
        insurance_until: insuranceUntil || undefined,
        fuel_type: fuelType as any || undefined,
        mileage: mileage ? parseInt(mileage) : undefined,
      }
    } else if (category === 'electronics') {
      newAsset.electronics_details = {
        device_type: deviceType,
        brand: electronicsBrand,
        model: electronicsModel || undefined,
        serial_number: serialNumber || undefined,
        warranty_until: warrantyUntil || undefined,
      }
    } else if (category === 'real_estate') {
      newAsset.real_estate_details = {
        property_type: propertyType as any,
        address,
        area_m2: areaM2 ? parseFloat(areaM2) : undefined,
        land_registry_number: landRegistryNumber || undefined,
        cadastral_area: cadastralArea || undefined,
      }
    } else if (category === 'machinery') {
      newAsset.machinery_details = {
        machine_type: machineType,
        brand: machineryBrand,
        model: machineryModel || undefined,
        serial_number: machinerySerial || undefined,
        power_kw: powerKw ? parseFloat(powerKw) : undefined,
        next_service: nextService || undefined,
      }
    } else if (category === 'equipment') {
      newAsset.equipment_details = {
        equipment_type: equipmentType,
        brand: equipmentBrand || undefined,
        quantity: quantity ? parseInt(quantity) : undefined,
        location: location || undefined,
      }
    } else if (category === 'other') {
      newAsset.custom_fields = customFields.filter((cf) => cf.label && cf.value)
    }

    // Simulace uložení
    setTimeout(() => {
      onSave(newAsset)
      setSaving(false)
      toast.success(isNew ? 'Majetek přidán' : 'Majetek uložen')
      onOpenChange(false)
    }, 500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {CATEGORY_ICONS[category]}
            {isNew ? 'Přidat majetek' : 'Upravit majetek'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Kategorie */}
          <div className="space-y-2">
            <Label>Kategorie majetku</Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(ASSET_CATEGORY_LABELS) as AssetCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    category === cat
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  {CATEGORY_ICONS[cat]}
                  <span className="text-sm font-medium">{ASSET_CATEGORY_LABELS[cat]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Základní údaje */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Název / Popis *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="např. Škoda Octavia, MacBook Pro..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="acquisitionPrice">Pořizovací cena (Kč) *</Label>
              <Input
                id="acquisitionPrice"
                type="number"
                value={acquisitionPrice}
                onChange={(e) => setAcquisitionPrice(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="acquisitionDate">Datum pořízení</Label>
              <Input
                id="acquisitionDate"
                type="date"
                value={acquisitionDate}
                onChange={(e) => setAcquisitionDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Způsob pořízení</Label>
              <Select value={acquisitionMethod} onValueChange={(v) => setAcquisitionMethod(v as AcquisitionMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACQUISITION_METHOD_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Odpisová skupina</Label>
              <Select value={depreciationGroup} onValueChange={(v) => setDepreciationGroup(v as DepreciationGroup)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DEPRECIATION_GROUP_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentValue">Aktuální hodnota (Kč)</Label>
              <Input
                id="currentValue"
                type="number"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder="Zůstatková hodnota"
              />
            </div>

            <div className="space-y-2">
              <Label>Stav</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as AssetStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ASSET_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Specifická pole podle kategorie */}
          {category === 'vehicle' && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 flex items-center gap-2">
                <Car className="h-4 w-4" /> Údaje o vozidle
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SPZ *</Label>
                  <Input value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} placeholder="1A2 3456" />
                </div>
                <div className="space-y-2">
                  <Label>Značka *</Label>
                  <Input value={vehicleBrand} onChange={(e) => setVehicleBrand(e.target.value)} placeholder="Škoda" />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} placeholder="Octavia" />
                </div>
                <div className="space-y-2">
                  <Label>Rok výroby</Label>
                  <Input type="number" value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>VIN</Label>
                  <Input value={vin} onChange={(e) => setVin(e.target.value)} placeholder="TMBAG..." />
                </div>
                <div className="space-y-2">
                  <Label>Palivo</Label>
                  <Select value={fuelType} onValueChange={setFuelType}>
                    <SelectTrigger><SelectValue placeholder="Vyberte" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(FUEL_TYPE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>STK platné do</Label>
                  <Input type="date" value={stkUntil} onChange={(e) => setStkUntil(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Pojištění do</Label>
                  <Input type="date" value={insuranceUntil} onChange={(e) => setInsuranceUntil(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Najeto (km)</Label>
                  <Input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {category === 'electronics' && (
            <div className="space-y-4 p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900 flex items-center gap-2">
                <Laptop className="h-4 w-4" /> Údaje o elektronice
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Typ zařízení *</Label>
                  <Input value={deviceType} onChange={(e) => setDeviceType(e.target.value)} placeholder="Notebook, telefon..." />
                </div>
                <div className="space-y-2">
                  <Label>Výrobce *</Label>
                  <Input value={electronicsBrand} onChange={(e) => setElectronicsBrand(e.target.value)} placeholder="Apple, Dell..." />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input value={electronicsModel} onChange={(e) => setElectronicsModel(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Sériové číslo</Label>
                  <Input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Záruka do</Label>
                  <Input type="date" value={warrantyUntil} onChange={(e) => setWarrantyUntil(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {category === 'real_estate' && (
            <div className="space-y-4 p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 flex items-center gap-2">
                <Home className="h-4 w-4" /> Údaje o nemovitosti
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Typ nemovitosti</Label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PROPERTY_TYPE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Plocha (m²)</Label>
                  <Input type="number" value={areaM2} onChange={(e) => setAreaM2(e.target.value)} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Adresa *</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ulice, město" />
                </div>
                <div className="space-y-2">
                  <Label>Číslo LV</Label>
                  <Input value={landRegistryNumber} onChange={(e) => setLandRegistryNumber(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Katastrální území</Label>
                  <Input value={cadastralArea} onChange={(e) => setCadastralArea(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {category === 'machinery' && (
            <div className="space-y-4 p-4 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-orange-900 flex items-center gap-2">
                <Cog className="h-4 w-4" /> Údaje o stroji
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Typ stroje *</Label>
                  <Input value={machineType} onChange={(e) => setMachineType(e.target.value)} placeholder="CNC, server..." />
                </div>
                <div className="space-y-2">
                  <Label>Výrobce *</Label>
                  <Input value={machineryBrand} onChange={(e) => setMachineryBrand(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input value={machineryModel} onChange={(e) => setMachineryModel(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Sériové číslo</Label>
                  <Input value={machinerySerial} onChange={(e) => setMachinerySerial(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Výkon (kW)</Label>
                  <Input type="number" step="0.1" value={powerKw} onChange={(e) => setPowerKw(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Další servis</Label>
                  <Input type="date" value={nextService} onChange={(e) => setNextService(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {category === 'equipment' && (
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <Package className="h-4 w-4" /> Údaje o vybavení
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Typ vybavení *</Label>
                  <Input value={equipmentType} onChange={(e) => setEquipmentType(e.target.value)} placeholder="Nábytek, nářadí..." />
                </div>
                <div className="space-y-2">
                  <Label>Výrobce</Label>
                  <Input value={equipmentBrand} onChange={(e) => setEquipmentBrand(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Počet kusů</Label>
                  <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Umístění</Label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Kancelář, sklad..." />
                </div>
              </div>
            </div>
          )}

          {category === 'other' && (
            <div className="space-y-4 p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-yellow-900 flex items-center gap-2">
                  <Box className="h-4 w-4" /> Vlastní pole
                </h4>
                <Button size="sm" variant="outline" onClick={addCustomField}>
                  <Plus className="h-4 w-4 mr-1" />
                  Přidat pole
                </Button>
              </div>

              {customFields.length === 0 ? (
                <p className="text-sm text-yellow-700">
                  Přidejte vlastní pole pro evidenci specifických údajů tohoto majetku
                </p>
              ) : (
                <div className="space-y-3">
                  {customFields.map((cf) => (
                    <div key={cf.id} className="flex gap-2 items-start">
                      <div className="flex-1 space-y-1">
                        <Input
                          placeholder="Název pole"
                          value={cf.label}
                          onChange={(e) => updateCustomField(cf.id, 'label', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Input
                          placeholder="Hodnota"
                          value={cf.value}
                          onChange={(e) => updateCustomField(cf.id, 'value', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:bg-red-50"
                        onClick={() => removeCustomField(cf.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Poznámky */}
          <div className="space-y-2">
            <Label htmlFor="notes">Poznámky</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Volitelné poznámky k majetku..."
            />
          </div>
        </div>

        {/* Tlačítka */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            <X className="mr-2 h-4 w-4" />
            Zrušit
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white">
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Ukládám...' : isNew ? 'Přidat majetek' : 'Uložit změny'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
