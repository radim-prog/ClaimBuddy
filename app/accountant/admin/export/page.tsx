'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertTriangle,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Building2,
  Shield,
  Lock,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  AlertCircle,
  User,
  History,
} from 'lucide-react'

// Mock clients for export
const mockClients = [
  { id: 'company-11', name: 'Horák s.r.o.', ico: '12345678', documentsCount: 234, closuresCount: 12 },
  { id: 'company-12', name: 'TechStart s.r.o.', ico: '23456789', documentsCount: 156, closuresCount: 8 },
  { id: 'company-13', name: 'ABC Company a.s.', ico: '34567890', documentsCount: 423, closuresCount: 24 },
  { id: 'company-14', name: 'XYZ Trading s.r.o.', ico: '45678901', documentsCount: 89, closuresCount: 6 },
  { id: 'company-15', name: 'Kovo Praha s.r.o.', ico: '56789012', documentsCount: 312, closuresCount: 18 },
  { id: 'company-16', name: 'Green Energy a.s.', ico: '67890123', documentsCount: 178, closuresCount: 10 },
]

// Mock export history
const mockExportHistory = [
  {
    id: 'export-1',
    client_name: 'Horák s.r.o.',
    client_id: 'company-11',
    exported_by: 'Radim Zajíček',
    exported_at: '2025-12-23T09:45:00Z',
    format: 'json',
    data_types: ['company', 'closures', 'documents'],
    file_size: '2.4 MB',
    status: 'completed',
    reason: 'Archivace dat před migrací',
  },
  {
    id: 'export-2',
    client_name: 'ABC Company a.s.',
    client_id: 'company-13',
    exported_by: 'Radim',
    exported_at: '2025-12-22T14:30:00Z',
    format: 'xlsx',
    data_types: ['company', 'closures'],
    file_size: '1.8 MB',
    status: 'completed',
    reason: 'Požadavek klienta na data',
  },
  {
    id: 'export-3',
    client_name: 'TechStart s.r.o.',
    client_id: 'company-12',
    exported_by: 'Radim Zajíček',
    exported_at: '2025-12-20T10:15:00Z',
    format: 'csv',
    data_types: ['closures'],
    file_size: '0.5 MB',
    status: 'completed',
    reason: 'Audit',
  },
]

// Data types for export
const dataTypes = [
  {
    id: 'company',
    label: 'Základní údaje firmy',
    description: 'Název, IČO, DIČ, adresa, kontakty',
    icon: Building2,
    sensitive: false,
  },
  {
    id: 'closures',
    label: 'Měsíční uzávěrky',
    description: 'Všechny uzávěrky včetně poznámek a schválení',
    icon: FileText,
    sensitive: true,
  },
  {
    id: 'documents',
    label: 'Dokumenty',
    description: 'Nahraté soubory a jejich metadata',
    icon: FileSpreadsheet,
    sensitive: true,
  },
  {
    id: 'messages',
    label: 'Zprávy a komunikace',
    description: 'Historie komunikace s klientem',
    icon: FileText,
    sensitive: true,
  },
  {
    id: 'tasks',
    label: 'Úkoly',
    description: 'Úkoly spojené s klientem',
    icon: CheckCircle2,
    sensitive: false,
  },
]

export default function ExportPage() {
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>(['company'])
  const [exportFormat, setExportFormat] = useState<string>('json')
  const [exportReason, setExportReason] = useState<string>('')
  const [confirmExport, setConfirmExport] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)

  const filteredClients = useMemo(() => {
    if (!searchQuery) return mockClients
    const query = searchQuery.toLowerCase()
    return mockClients.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.ico.includes(query)
    )
  }, [searchQuery])

  const selectedClientData = mockClients.find(c => c.id === selectedClient)

  const handleDataTypeToggle = (typeId: string) => {
    setSelectedDataTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(t => t !== typeId)
        : [...prev, typeId]
    )
  }

  const handleExport = async () => {
    if (!selectedClient || selectedDataTypes.length === 0 || !exportReason || !confirmExport) {
      return
    }

    setIsExporting(true)
    // Simulate export
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsExporting(false)
    setExportSuccess(true)

    // Reset after showing success
    setTimeout(() => {
      setExportSuccess(false)
      setSelectedClient('')
      setSelectedDataTypes(['company'])
      setExportReason('')
      setConfirmExport(false)
    }, 3000)
  }

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'json': return FileJson
      case 'xlsx': return FileSpreadsheet
      case 'csv': return FileText
      default: return FileText
    }
  }

  const canExport = selectedClient &&
    selectedDataTypes.length > 0 &&
    exportReason.length >= 10 &&
    confirmExport

  return (
    <div className="space-y-6">
      {/* Security Warning */}
      <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-red-900 mb-2">Bezpečnostní upozornění - Export citlivých dat</h4>
              <div className="text-sm text-red-800 space-y-2">
                <p>
                  <strong>Export dat klienta je citlivá operace.</strong> Všechny exporty jsou logovány a můžou být předmětem auditu.
                </p>
                <ul className="list-disc ml-4 space-y-1 text-red-700">
                  <li>Export je povolen pouze pro administrátory</li>
                  <li>Každý export je zaznamenán včetně IP adresy a důvodu</li>
                  <li>Exportovaná data obsahují citlivé informace klientů</li>
                  <li>Neoprávněný export může vést k disciplinárním opatřením</li>
                  <li>Export je možný pouze s uvedením důvodu</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export dat klienta
            </CardTitle>
            <CardDescription>Vyberte klienta a data k exportu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {exportSuccess ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Export dokončen</h3>
                <p className="text-gray-600 dark:text-gray-300">Soubor byl úspěšně stažen. Export byl zalogován.</p>
              </div>
            ) : (
              <>
                {/* Client Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">1. Vyberte klienta</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Hledat podle názvu nebo IČO..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {filteredClients.map((client) => (
                      <div
                        key={client.id}
                        onClick={() => setSelectedClient(client.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedClient === client.id
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className={`h-4 w-4 ${
                            selectedClient === client.id ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                          <div>
                            <p className="font-medium text-sm">{client.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">IČO: {client.ico}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedClient && (
                  <>
                    {/* Data Types */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">2. Vyberte data k exportu</Label>
                      <div className="space-y-2">
                        {dataTypes.map((type) => {
                          const Icon = type.icon
                          return (
                            <div
                              key={type.id}
                              className={`p-3 rounded-lg border ${
                                selectedDataTypes.includes(type.id)
                                  ? 'bg-blue-50 border-blue-300'
                                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  id={type.id}
                                  checked={selectedDataTypes.includes(type.id)}
                                  onCheckedChange={() => handleDataTypeToggle(type.id)}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                    <Label htmlFor={type.id} className="font-medium cursor-pointer">
                                      {type.label}
                                    </Label>
                                    {type.sensitive && (
                                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 text-xs">
                                        <Lock className="h-3 w-3 mr-1" />
                                        Citlivé
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{type.description}</p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Export Format */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">3. Formát exportu</Label>
                      <div className="flex gap-3">
                        {[
                          { id: 'json', label: 'JSON', icon: FileJson, desc: 'Strojově čitelný' },
                          { id: 'xlsx', label: 'Excel', icon: FileSpreadsheet, desc: 'Tabulkový formát' },
                          { id: 'csv', label: 'CSV', icon: FileText, desc: 'Univerzální' },
                        ].map((format) => {
                          const Icon = format.icon
                          return (
                            <div
                              key={format.id}
                              onClick={() => setExportFormat(format.id)}
                              className={`flex-1 p-3 rounded-lg border cursor-pointer transition-colors text-center ${
                                exportFormat === format.id
                                  ? 'bg-blue-50 border-blue-300'
                                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700'
                              }`}
                            >
                              <Icon className={`h-6 w-6 mx-auto mb-1 ${
                                exportFormat === format.id ? 'text-blue-600' : 'text-gray-400'
                              }`} />
                              <p className="font-medium text-sm">{format.label}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{format.desc}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">4. Důvod exportu *</Label>
                      <Input
                        placeholder="Uveďte důvod exportu (min. 10 znaků)..."
                        value={exportReason}
                        onChange={(e) => setExportReason(e.target.value)}
                        className={exportReason.length > 0 && exportReason.length < 10 ? 'border-red-300' : ''}
                      />
                      {exportReason.length > 0 && exportReason.length < 10 && (
                        <p className="text-xs text-red-600">Důvod musí mít alespoň 10 znaků</p>
                      )}
                    </div>

                    {/* Confirmation */}
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="confirm"
                          checked={confirmExport}
                          onCheckedChange={(checked) => setConfirmExport(checked as boolean)}
                        />
                        <Label htmlFor="confirm" className="text-sm text-red-800 cursor-pointer">
                          <strong>Potvrzuji</strong>, že mám oprávnění k exportu těchto dat a jsem si vědom/a,
                          že tato akce bude zalogována včetně mého jména, IP adresy a důvodu.
                          Beru na vědomí, že neoprávněný export je porušením bezpečnostních pravidel.
                        </Label>
                      </div>
                    </div>

                    {/* Export Button */}
                    <Button
                      onClick={handleExport}
                      disabled={!canExport || isExporting}
                      className="w-full bg-red-600 hover:bg-red-700"
                      size="lg"
                    >
                      {isExporting ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Exportuji...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Exportovat data klienta {selectedClientData?.name}
                        </>
                      )}
                    </Button>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Export Summary & History */}
        <div className="space-y-6">
          {/* Export Preview */}
          {selectedClient && selectedDataTypes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Eye className="h-5 w-5" />
                  Náhled exportu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Klient</p>
                    <p className="font-medium">{selectedClientData?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">IČO: {selectedClientData?.ico}</p>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Data k exportu</p>
                    <div className="space-y-1">
                      {selectedDataTypes.map(typeId => {
                        const type = dataTypes.find(t => t.id === typeId)
                        return type ? (
                          <Badge key={typeId} variant="outline" className="mr-1">
                            {type.label}
                          </Badge>
                        ) : null
                      })}
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Formát</p>
                    <p className="font-medium uppercase">{exportFormat}</p>
                  </div>

                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2 text-yellow-700 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>Export bude zalogován</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-5 w-5" />
                Historie exportů
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockExportHistory.map((exp) => {
                  const FormatIcon = getFormatIcon(exp.format)
                  return (
                    <div key={exp.id} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-medium text-sm">{exp.client_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(exp.exported_at)}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          <FormatIcon className="h-3 w-3 mr-1" />
                          {exp.format.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                        <User className="h-3 w-3" />
                        <span>{exp.exported_by}</span>
                        <span className="text-gray-400">|</span>
                        <span>{exp.file_size}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">"{exp.reason}"</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
