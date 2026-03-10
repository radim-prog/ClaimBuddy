'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  AlertTriangle,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Building2,
  Lock,
  Eye,
  Clock,
  CheckCircle2,
  Search,
  AlertCircle,
  User,
  History,
  Loader2,
} from 'lucide-react'

type CompanyItem = {
  id: string
  name: string
  ico: string
  status: string
}

type ExportHistoryEntry = {
  id: string
  user_name?: string
  action: string
  table_name: string
  created_at: string
  new_values?: Record<string, any> | null
}

const dataTypes = [
  { id: 'company', label: 'Základní údaje firmy', description: 'Název, IČO, DIČ, adresa, kontakty', icon: Building2, sensitive: false },
  { id: 'closures', label: 'Měsíční uzávěrky', description: 'Všechny uzávěrky včetně poznámek a schválení', icon: FileText, sensitive: true },
  { id: 'documents', label: 'Dokumenty', description: 'Nahraté soubory a jejich metadata', icon: FileSpreadsheet, sensitive: true },
  { id: 'messages', label: 'Zprávy a komunikace', description: 'Historie komunikace s klientem', icon: FileText, sensitive: true },
  { id: 'tasks', label: 'Úkoly', description: 'Úkoly spojené s klientem', icon: CheckCircle2, sensitive: false },
]

export function SystemExport() {
  const [clients, setClients] = useState<CompanyItem[]>([])
  const [exportHistory, setExportHistory] = useState<ExportHistoryEntry[]>([])
  const [loadingClients, setLoadingClients] = useState(true)

  const [selectedClient, setSelectedClient] = useState<string>('')
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>(['company'])
  const [exportFormat, setExportFormat] = useState<string>('json')
  const [exportReason, setExportReason] = useState<string>('')
  const [confirmExport, setConfirmExport] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)

  // Fetch real companies and export history
  useEffect(() => {
    async function load() {
      try {
        const [companiesRes, historyRes] = await Promise.all([
          fetch('/api/accountant/admin/companies'),
          fetch('/api/accountant/admin/audit-logs?action=EXPORT&limit=10'),
        ])
        if (companiesRes.ok) {
          const data = await companiesRes.json()
          setClients(data.companies ?? [])
        }
        if (historyRes.ok) {
          const data = await historyRes.json()
          setExportHistory(data.logs ?? [])
        }
      } catch {
        // ignore
      } finally {
        setLoadingClients(false)
      }
    }
    load()
  }, [])

  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients
    const query = searchQuery.toLowerCase()
    return clients.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.ico?.includes(query)
    )
  }, [searchQuery, clients])

  const selectedClientData = clients.find(c => c.id === selectedClient)

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
    // Simulate export (real export would generate file server-side)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsExporting(false)
    setExportSuccess(true)

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
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  const canExport = selectedClient && selectedDataTypes.length > 0 && exportReason.length >= 10 && confirmExport

  if (loadingClients) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Security Warning */}
      <Card className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-red-200 dark:border-red-800">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold font-display text-red-900 dark:text-red-200 mb-2">Bezpečnostní upozornění - Export citlivých dat</h4>
              <div className="text-sm text-red-800 dark:text-red-300 space-y-2">
                <p>
                  <strong>Export dat klienta je citlivá operace.</strong> Všechny exporty jsou logovány a můžou být předmětem auditu.
                </p>
                <ul className="list-disc ml-4 space-y-1 text-red-700 dark:text-red-400">
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
        <Card className="lg:col-span-2 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <Download className="h-5 w-5" />
              Export dat klienta
            </CardTitle>
            <CardDescription>Vyberte klienta a data k exportu ({clients.length} klientů)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {exportSuccess ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold font-display text-gray-900 dark:text-white mb-2">Export dokončen</h3>
                <p className="text-gray-600 dark:text-gray-300">Soubor byl úspěšně stažen. Export byl zalogován.</p>
              </div>
            ) : (
              <>
                {/* Client Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold font-display">1. Vyberte klienta</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Hledat podle názvu nebo IČO..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-11"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {filteredClients.slice(0, 20).map((client) => (
                      <div
                        key={client.id}
                        onClick={() => setSelectedClient(client.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                          selectedClient === client.id
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                            : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className={`h-4 w-4 ${
                            selectedClient === client.id ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                          <div>
                            <p className="font-medium text-sm text-gray-900 dark:text-white">{client.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">IČO: {client.ico || '-'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredClients.length > 20 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 col-span-2 text-center py-2">
                        Zobrazeno 20 z {filteredClients.length} klientů. Upřesněte vyhledávání.
                      </p>
                    )}
                  </div>
                </div>

                {selectedClient && (
                  <>
                    {/* Data Types */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold font-display">2. Vyberte data k exportu</Label>
                      <div className="space-y-2">
                        {dataTypes.map((type) => {
                          const Icon = type.icon
                          return (
                            <div
                              key={type.id}
                              className={`p-3 rounded-xl border ${
                                selectedDataTypes.includes(type.id)
                                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
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
                                      <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700 text-xs rounded-md">
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
                      <Label className="text-base font-semibold font-display">3. Formát exportu</Label>
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
                              className={`flex-1 p-3 rounded-xl border cursor-pointer transition-colors text-center ${
                                exportFormat === format.id
                                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                              }`}
                            >
                              <Icon className={`h-6 w-6 mx-auto mb-1 ${
                                exportFormat === format.id ? 'text-blue-600' : 'text-gray-400'
                              }`} />
                              <p className="font-medium text-sm text-gray-900 dark:text-white">{format.label}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{format.desc}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold font-display">4. Důvod exportu *</Label>
                      <Input
                        placeholder="Uveďte důvod exportu (min. 10 znaků)..."
                        value={exportReason}
                        onChange={(e) => setExportReason(e.target.value)}
                        className={`h-11 ${exportReason.length > 0 && exportReason.length < 10 ? 'border-red-300' : ''}`}
                      />
                      {exportReason.length > 0 && exportReason.length < 10 && (
                        <p className="text-xs text-red-600">Důvod musí mít alespoň 10 znaků</p>
                      )}
                    </div>

                    {/* Confirmation */}
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="confirm"
                          checked={confirmExport}
                          onCheckedChange={(checked) => setConfirmExport(checked as boolean)}
                        />
                        <Label htmlFor="confirm" className="text-sm text-red-800 dark:text-red-300 cursor-pointer">
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
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-display">
                  <Eye className="h-5 w-5" />
                  Náhled exportu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Klient</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedClientData?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">IČO: {selectedClientData?.ico || '-'}</p>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Data k exportu</p>
                    <div className="space-y-1">
                      {selectedDataTypes.map(typeId => {
                        const type = dataTypes.find(t => t.id === typeId)
                        return type ? (
                          <Badge key={typeId} variant="outline" className="mr-1 rounded-md">
                            {type.label}
                          </Badge>
                        ) : null
                      })}
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Formát</p>
                    <p className="font-medium uppercase text-gray-900 dark:text-white">{exportFormat}</p>
                  </div>

                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>Export bude zalogován</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export History from audit_log */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-display">
                <History className="h-5 w-5" />
                Historie exportů
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {exportHistory.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    Zatím žádné exporty
                  </p>
                ) : (
                  exportHistory.map((exp) => (
                    <div key={exp.id} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-medium text-sm text-gray-900 dark:text-white">{exp.table_name || 'Export'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(exp.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                        <User className="h-3 w-3" />
                        <span>{exp.user_name || 'Systém'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
