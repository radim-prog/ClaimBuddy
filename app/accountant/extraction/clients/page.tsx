'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'
import { toast } from 'sonner'
import {
  Building2,
  Search,
  Filter,
  Upload,
  ScanLine,
  Loader2,
  FileText,
  Camera,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'

type ClientInfo = {
  id: string
  name: string
  ico: string
  total: number
  uploaded: number
  extracted: number
  approved: number
  errors: number
}

type FilterType = 'all' | 'has_docs' | 'unextracted' | 'unapproved' | 'errors'

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'Všichni klienti' },
  { value: 'has_docs', label: 'S doklady' },
  { value: 'unextracted', label: 'Nevytěžené' },
  { value: 'unapproved', label: 'Neschválené' },
  { value: 'errors', label: 'S chybami' },
]

export default function ExtractionClientsPage() {
  const { userId } = useAccountantUser()
  const [clients, setClients] = useState<ClientInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('has_docs')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [extracting, setExtracting] = useState(false)
  const [extractProgress, setExtractProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingCompanyId, setUploadingCompanyId] = useState<string | null>(null)

  const fetchClients = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    try {
      const res = await fetch(`/api/extraction/clients?filter=${filter}`, {
        headers: { 'x-user-id': userId },
      })
      if (res.ok) {
        const data = await res.json()
        setClients(data.clients || [])
      } else {
        setError('Chyba při načítání klientů')
      }
    } catch {
      setError('Nepodařilo se načíst klienty')
    } finally {
      setLoading(false)
    }
  }, [userId, filter])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const filteredClients = clients.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.ico?.includes(search)
  )

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selectedIds.size === filteredClients.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredClients.map(c => c.id)))
    }
  }

  const handleBatchExtract = async () => {
    if (selectedIds.size === 0) return

    setExtracting(true)
    setExtractProgress(10)

    try {
      // Get all unextracted document IDs for selected companies
      const res = await fetch('/api/extraction/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || '',
        },
        body: JSON.stringify({
          companyIds: Array.from(selectedIds),
          fastMode: false,
        }),
      })

      setExtractProgress(90)
      const data = await res.json()

      if (data.success) {
        toast.success(`Odesláno ${data.submitted} dokladů ke zpracování`)
        setSelectedIds(new Set())
        fetchClients()
      } else {
        toast.error(data.error || 'Chyba při odesílání')
      }
    } catch {
      toast.error('Chyba připojení')
    } finally {
      setExtracting(false)
      setExtractProgress(0)
    }
  }

  const handleCameraCapture = (companyId: string) => {
    setUploadingCompanyId(companyId)
    fileInputRef.current?.click()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !uploadingCompanyId || !userId) return

    const uploaded = []
    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('companyId', uploadingCompanyId)
      formData.append('priority', 'high')

      try {
        const res = await fetch('/api/extraction/extract', {
          method: 'POST',
          headers: { 'x-user-id': userId },
          body: formData,
        })
        if (res.ok) uploaded.push(file.name)
      } catch {
        // continue with next file
      }
    }

    if (uploaded.length > 0) {
      toast.success(`${uploaded.length} dokladů nahráno a vytěženo`)
      fetchClients()
    }

    setUploadingCompanyId(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-4">
      {/* Hidden camera input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        capture="environment"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Hledat klienta..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1">
            {filterOptions.map(f => (
              <Button
                key={f.value}
                variant={filter === f.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f.value)}
                className="text-xs hidden sm:flex"
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{selectedIds.size} vybráno</span>
            <Button
              onClick={handleBatchExtract}
              disabled={extracting}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {extracting ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Zpracovávám...</>
              ) : (
                <><ScanLine className="h-4 w-4 mr-1" /> Vytěžit vybrané</>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {extracting && (
        <Progress value={extractProgress} className="h-2" />
      )}

      {/* Client List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">Žádní klienti v tomto filtru</p>
          <p className="text-sm mt-1">Zkuste změnit filtr nebo vyhledávání</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Select all */}
          <div className="flex items-center gap-2 px-2">
            <input
              type="checkbox"
              checked={selectedIds.size === filteredClients.length && filteredClients.length > 0}
              onChange={selectAll}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-xs text-muted-foreground">Vybrat vše ({filteredClients.length})</span>
          </div>

          {filteredClients.map((client) => (
            <Card key={client.id} className="overflow-hidden">
              <div className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedIds.has(client.id)}
                  onChange={() => toggleSelect(client.id)}
                  className="h-4 w-4 rounded border-gray-300 flex-shrink-0"
                />

                <a
                  href={`/accountant/extraction/clients/${client.id}`}
                  className="flex items-center gap-3 flex-1 text-left min-w-0"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate hover:text-blue-600 transition-colors">{client.name}</p>
                    {client.ico && <p className="text-xs text-muted-foreground">IČ: {client.ico}</p>}
                  </div>
                </a>

                {/* Stats badges */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {client.uploaded > 0 && (
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                      <Upload className="h-3 w-3 mr-0.5" />{client.uploaded}
                    </Badge>
                  )}
                  {client.extracted > 0 && (
                    <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                      <FileText className="h-3 w-3 mr-0.5" />{client.extracted}
                    </Badge>
                  )}
                  {client.approved > 0 && (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                      <CheckCircle2 className="h-3 w-3 mr-0.5" />{client.approved}
                    </Badge>
                  )}
                  {client.errors > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className="h-3 w-3 mr-0.5" />{client.errors}
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleCameraCapture(client.id) }}
                    title="Fotit doklady"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                  <button
                    onClick={() => setExpandedId(expandedId === client.id ? null : client.id)}
                    className="p-1 text-muted-foreground"
                  >
                    {expandedId === client.id ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded: document list would go here */}
              {expandedId === client.id && (
                <div className="px-4 pb-4 border-t bg-muted/20">
                  <div className="pt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Doklady klienta</p>
                      <Button size="sm" variant="outline" onClick={() => handleCameraCapture(client.id)}>
                        <Camera className="h-3.5 w-3.5 mr-1" />
                        Fotit doklady
                      </Button>
                    </div>
                    <div className="grid grid-cols-4 gap-3 text-center text-xs">
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                        <p className="text-lg font-bold text-amber-600">{client.uploaded}</p>
                        <p className="text-muted-foreground">Nahrané</p>
                      </div>
                      <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                        <p className="text-lg font-bold text-blue-600">{client.extracted}</p>
                        <p className="text-muted-foreground">Vytěžené</p>
                      </div>
                      <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
                        <p className="text-lg font-bold text-green-600">{client.approved}</p>
                        <p className="text-muted-foreground">Schválené</p>
                      </div>
                      <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
                        <p className="text-lg font-bold text-red-600">{client.errors}</p>
                        <p className="text-muted-foreground">Chyby</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
