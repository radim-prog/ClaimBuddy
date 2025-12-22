'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Car,
  Laptop,
  Home,
  Cog,
  Package,
  Box,
  Plus,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Calendar,
  Banknote,
  AlertTriangle,
} from 'lucide-react'
import {
  Asset,
  AssetCategory,
  ASSET_CATEGORY_LABELS,
  ACQUISITION_METHOD_LABELS,
  DEPRECIATION_GROUP_LABELS,
  ASSET_STATUS_LABELS,
  PROPERTY_TYPE_LABELS,
  FUEL_TYPE_LABELS,
} from '@/lib/types/asset'
import { EditAssetModal } from './edit-asset-modal'

type AssetsSectionProps = {
  companyId: string
  assets: Asset[]
  onAssetsChange?: (assets: Asset[]) => void
}

const CATEGORY_ICONS: Record<AssetCategory, React.ReactNode> = {
  vehicle: <Car className="h-5 w-5" />,
  electronics: <Laptop className="h-5 w-5" />,
  real_estate: <Home className="h-5 w-5" />,
  machinery: <Cog className="h-5 w-5" />,
  equipment: <Package className="h-5 w-5" />,
  other: <Box className="h-5 w-5" />,
}

const CATEGORY_COLORS: Record<AssetCategory, string> = {
  vehicle: 'bg-blue-100 text-blue-700',
  electronics: 'bg-purple-100 text-purple-700',
  real_estate: 'bg-green-100 text-green-700',
  machinery: 'bg-orange-100 text-orange-700',
  equipment: 'bg-gray-100 text-gray-700',
  other: 'bg-yellow-100 text-yellow-700',
}

export function AssetsSection({ companyId, assets, onAssetsChange }: AssetsSectionProps) {
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)

  const toggleExpand = (id: string) => {
    setExpandedAsset(expandedAsset === id ? null : id)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ')
  }

  const handleSaveAsset = (asset: Asset) => {
    if (onAssetsChange) {
      const existingIndex = assets.findIndex((a) => a.id === asset.id)
      if (existingIndex >= 0) {
        const updated = [...assets]
        updated[existingIndex] = asset
        onAssetsChange(updated)
      } else {
        onAssetsChange([...assets, asset])
      }
    }
    setEditingAsset(null)
    setIsAddingNew(false)
  }

  const handleDeleteAsset = (assetId: string) => {
    if (onAssetsChange && confirm('Opravdu chcete smazat tento majetek?')) {
      onAssetsChange(assets.filter((a) => a.id !== assetId))
    }
  }

  // Rozdělit majetek na aktivní a vyřazený
  const activeAssets = assets.filter((a) => a.status === 'active')
  const inactiveAssets = assets.filter((a) => a.status !== 'active')

  // Spočítat celkovou hodnotu
  const totalValue = activeAssets.reduce((sum, a) => sum + (a.current_value || a.acquisition_price), 0)

  const renderAssetDetails = (asset: Asset) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Finanční údaje */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-gray-700 border-b pb-1">Finanční údaje</h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Pořizovací cena:</span>
              <span className="font-medium">{formatCurrency(asset.acquisition_price)}</span>
            </div>
            {asset.current_value !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-500">Zůstatková hodnota:</span>
                <span className="font-medium">{formatCurrency(asset.current_value)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Způsob pořízení:</span>
              <span>{ACQUISITION_METHOD_LABELS[asset.acquisition_method]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Odpisová skupina:</span>
              <span>{DEPRECIATION_GROUP_LABELS[asset.depreciation_group]}</span>
            </div>
          </div>
        </div>

        {/* Specifické údaje podle kategorie */}
        {asset.category === 'vehicle' && asset.vehicle_details && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700 border-b pb-1">Vozidlo</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">SPZ:</span>
                <span className="font-mono">{asset.vehicle_details.license_plate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Značka/Model:</span>
                <span>{asset.vehicle_details.brand} {asset.vehicle_details.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Rok:</span>
                <span>{asset.vehicle_details.year}</span>
              </div>
              {asset.vehicle_details.fuel_type && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Palivo:</span>
                  <span>{FUEL_TYPE_LABELS[asset.vehicle_details.fuel_type]}</span>
                </div>
              )}
              {asset.vehicle_details.mileage && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Najeto:</span>
                  <span>{asset.vehicle_details.mileage.toLocaleString('cs-CZ')} km</span>
                </div>
              )}
            </div>
          </div>
        )}

        {asset.category === 'vehicle' && asset.vehicle_details && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700 border-b pb-1">Termíny</h4>
            <div className="text-sm space-y-1">
              {asset.vehicle_details.vin && (
                <div className="flex justify-between">
                  <span className="text-gray-500">VIN:</span>
                  <span className="font-mono text-xs">{asset.vehicle_details.vin}</span>
                </div>
              )}
              {asset.vehicle_details.stk_until && (
                <div className="flex justify-between">
                  <span className="text-gray-500">STK do:</span>
                  <span>{formatDate(asset.vehicle_details.stk_until)}</span>
                </div>
              )}
              {asset.vehicle_details.insurance_until && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Pojištění do:</span>
                  <span>{formatDate(asset.vehicle_details.insurance_until)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {asset.category === 'electronics' && asset.electronics_details && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700 border-b pb-1">Elektronika</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Typ:</span>
                <span>{asset.electronics_details.device_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Výrobce:</span>
                <span>{asset.electronics_details.brand}</span>
              </div>
              {asset.electronics_details.model && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Model:</span>
                  <span>{asset.electronics_details.model}</span>
                </div>
              )}
              {asset.electronics_details.serial_number && (
                <div className="flex justify-between">
                  <span className="text-gray-500">S/N:</span>
                  <span className="font-mono text-xs">{asset.electronics_details.serial_number}</span>
                </div>
              )}
              {asset.electronics_details.warranty_until && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Záruka do:</span>
                  <span>{formatDate(asset.electronics_details.warranty_until)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {asset.category === 'real_estate' && asset.real_estate_details && (
          <div className="space-y-2 col-span-2">
            <h4 className="font-medium text-sm text-gray-700 border-b pb-1">Nemovitost</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Typ:</span>
                <span>{PROPERTY_TYPE_LABELS[asset.real_estate_details.property_type]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Adresa:</span>
                <span>{asset.real_estate_details.address}</span>
              </div>
              {asset.real_estate_details.area_m2 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Plocha:</span>
                  <span>{asset.real_estate_details.area_m2} m²</span>
                </div>
              )}
              {asset.real_estate_details.land_registry_number && (
                <div className="flex justify-between">
                  <span className="text-gray-500">LV:</span>
                  <span>{asset.real_estate_details.land_registry_number}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {asset.category === 'machinery' && asset.machinery_details && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700 border-b pb-1">Stroj</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Typ:</span>
                <span>{asset.machinery_details.machine_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Výrobce:</span>
                <span>{asset.machinery_details.brand}</span>
              </div>
              {asset.machinery_details.model && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Model:</span>
                  <span>{asset.machinery_details.model}</span>
                </div>
              )}
              {asset.machinery_details.power_kw && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Výkon:</span>
                  <span>{asset.machinery_details.power_kw} kW</span>
                </div>
              )}
            </div>
          </div>
        )}

        {asset.category === 'equipment' && asset.equipment_details && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700 border-b pb-1">Vybavení</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Typ:</span>
                <span>{asset.equipment_details.equipment_type}</span>
              </div>
              {asset.equipment_details.brand && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Výrobce:</span>
                  <span>{asset.equipment_details.brand}</span>
                </div>
              )}
              {asset.equipment_details.quantity && asset.equipment_details.quantity > 1 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Počet:</span>
                  <span>{asset.equipment_details.quantity} ks</span>
                </div>
              )}
              {asset.equipment_details.location && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Umístění:</span>
                  <span>{asset.equipment_details.location}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {asset.category === 'other' && asset.custom_fields && asset.custom_fields.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700 border-b pb-1">Vlastní údaje</h4>
            <div className="text-sm space-y-1">
              {asset.custom_fields.map((cf) => (
                <div key={cf.id} className="flex justify-between">
                  <span className="text-gray-500">{cf.label}:</span>
                  <span>{cf.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderAssetCard = (asset: Asset, isInactive = false) => (
    <div
      key={asset.id}
      className={`border rounded-lg overflow-hidden transition-all ${
        isInactive ? 'border-gray-200 opacity-60' : 'border-gray-200'
      }`}
    >
      {/* Hlavní řádek */}
      <div
        className={`p-4 cursor-pointer hover:bg-gray-50`}
        onClick={() => toggleExpand(asset.id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${CATEGORY_COLORS[asset.category]}`}>
              {CATEGORY_ICONS[asset.category]}
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {asset.name}
                {isInactive && (
                  <Badge variant="outline" className="ml-2 text-gray-500">
                    {ASSET_STATUS_LABELS[asset.status]}
                  </Badge>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {ASSET_CATEGORY_LABELS[asset.category]} • Pořízeno {formatDate(asset.acquisition_date)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Hodnota */}
            <div className="text-right hidden md:block">
              <div className="font-semibold text-gray-900">
                {formatCurrency(asset.current_value || asset.acquisition_price)}
              </div>
              {asset.current_value && asset.current_value < asset.acquisition_price && (
                <div className="text-xs text-gray-500">
                  z {formatCurrency(asset.acquisition_price)}
                </div>
              )}
            </div>

            {/* Expand icon */}
            {expandedAsset === asset.id ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Rozbalený detail */}
      {expandedAsset === asset.id && (
        <div className="border-t bg-gray-50 p-4">
          {renderAssetDetails(asset)}

          {/* Poznámky */}
          {asset.notes && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-medium text-sm text-gray-700 mb-1">Poznámky</h4>
              <p className="text-sm text-gray-600">{asset.notes}</p>
            </div>
          )}

          {/* Akce */}
          <div className="mt-4 pt-4 border-t flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                setEditingAsset(asset)
              }}
            >
              <Edit2 className="h-4 w-4 mr-1" />
              Upravit
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteAsset(asset.id)
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Smazat
            </Button>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Car className="h-5 w-5 text-purple-600" />
            Majetek firmy
            {activeAssets.length > 0 && (
              <span className="text-sm font-normal text-gray-500">
                ({activeAssets.length} položek • {formatCurrency(totalValue)})
              </span>
            )}
          </CardTitle>
          <Button size="sm" variant="default" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => setIsAddingNew(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Přidat majetek
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {assets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Car className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="mb-2">Zatím žádný evidovaný majetek</p>
            <p className="text-sm text-gray-400">
              Automobily, nemovitosti, stroje, vybavení a další dlouhodobý majetek
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Aktivní majetek */}
            {activeAssets.map((asset) => renderAssetCard(asset))}

            {/* Vyřazený majetek */}
            {inactiveAssets.length > 0 && (
              <>
                <div className="pt-4 mt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">
                    Vyřazený majetek ({inactiveAssets.length})
                  </h4>
                  {inactiveAssets.map((asset) => renderAssetCard(asset, true))}
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>

      {/* Modal pro editaci/přidání */}
      {(editingAsset || isAddingNew) && (
        <EditAssetModal
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setEditingAsset(null)
              setIsAddingNew(false)
            }
          }}
          asset={editingAsset}
          companyId={companyId}
          onSave={handleSaveAsset}
        />
      )}
    </Card>
  )
}
