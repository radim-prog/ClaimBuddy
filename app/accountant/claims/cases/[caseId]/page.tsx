'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  CreditCard,
  Settings,
  ChevronDown,
  Upload,
  Trash2,
  Download,
  Plus,
  MessageSquare,
  Activity,
  User,
  Building2,
  Calendar,
  MapPin,
  Hash,
  DollarSign,
  Flag,
  StickyNote,
  ShieldAlert,
  FileImage,
  Star,
  FileBadge,
  Mail,
  Scale,
  FileX,
  Gavel,
  HeartPulse,
  AlertTriangle,
  ScrollText,
  PenTool,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

import type {
  InsuranceCase,
  InsuranceCaseDocument,
  InsuranceCaseEvent,
  InsurancePayment,
  InsuranceCaseStatus,
  PaymentType,
} from '@/lib/types/insurance'
import {
  insuranceStatusLabel,
  insuranceStatusColor,
  insuranceTypeLabel,
  priorityLabel,
  priorityColor,
  documentTypeLabel,
  paymentTypeLabel,
} from '@/lib/types/insurance'

// --------------- Helpers ---------------

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return 'právě teď'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `před ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `před ${hours} h`
  const days = Math.floor(hours / 24)
  return `před ${days} dny`
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatCZK(amount: number | null | undefined): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(amount)
}

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// --------------- Event type icon ---------------

function EventIcon({ eventType }: { eventType: string }) {
  const cls = 'h-4 w-4'
  switch (eventType) {
    case 'created': return <Plus className={cls} />
    case 'status_changed': return <Activity className={cls} />
    case 'document_uploaded': return <Upload className={cls} />
    case 'document_deleted': return <Trash2 className={cls} />
    case 'payment_added': return <CreditCard className={cls} />
    case 'note_added': return <MessageSquare className={cls} />
    case 'assigned': return <User className={cls} />
    case 'deadline_set': return <Calendar className={cls} />
    case 'priority_changed': return <Flag className={cls} />
    default: return <Activity className={cls} />
  }
}

// Document type icon
function DocTypeIcon({ type }: { type: string }) {
  const cls = 'h-4 w-4 flex-shrink-0 text-muted-foreground'
  switch (type) {
    case 'photo': return <FileImage className={cls} />
    case 'expert_report': return <Scale className={cls} />
    case 'correspondence': return <Mail className={cls} />
    case 'decision': return <Gavel className={cls} />
    case 'police_report': return <ShieldAlert className={cls} />
    case 'medical_report': return <HeartPulse className={cls} />
    case 'power_of_attorney': return <FileBadge className={cls} />
    case 'claim_report': return <AlertTriangle className={cls} />
    case 'invoice': return <FileX className={cls} />
    default: return <FileText className={cls} />
  }
}

// --------------- Status list ---------------

const ALL_STATUSES: InsuranceCaseStatus[] = [
  'new', 'gathering_docs', 'submitted', 'under_review',
  'additional_info', 'partially_approved', 'approved',
  'rejected', 'appealed', 'closed', 'cancelled',
]

// --------------- Main Component ---------------

interface CaseDetailData {
  case: InsuranceCase
  documents: InsuranceCaseDocument[]
  events: InsuranceCaseEvent[]
  payments: InsurancePayment[]
}

interface SimpleUser {
  id: string
  name: string
}

export default function CaseDetailPage({ params }: { params: Promise<{ caseId: string }> }) {
  const router = useRouter()
  const [caseId, setCaseId] = useState<string | null>(null)
  const [data, setData] = useState<CaseDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('timeline')

  // Status dropdown
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [changingStatus, setChangingStatus] = useState(false)
  const statusDropdownRef = useRef<HTMLDivElement>(null)

  // Note form
  const [noteText, setNoteText] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  // Document upload
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Review request
  const [requestingReview, setRequestingReview] = useState(false)

  // Payment form
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_type: 'partial' as PaymentType,
    payment_date: new Date().toISOString().split('T')[0],
    reference: '',
    note: '',
  })
  const [addingPayment, setAddingPayment] = useState(false)

  // Settings tab
  const [users, setUsers] = useState<SimpleUser[]>([])
  const [settingsForm, setSettingsForm] = useState({
    assigned_to: '',
    priority: '',
    deadline: '',
  })
  const [savingSettings, setSavingSettings] = useState(false)

  // Delete confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Contracts (signing jobs linked to this case)
  const [contracts, setContracts] = useState<any[]>([])
  const [loadingContracts, setLoadingContracts] = useState(false)
  const [generatingContract, setGeneratingContract] = useState<string | null>(null)

  // --------------- Resolve params ---------------

  useEffect(() => {
    params.then(p => setCaseId(p.caseId))
  }, [params])

  // --------------- Fetch data ---------------

  const fetchData = useCallback(async () => {
    if (!caseId) return
    try {
      const res = await fetch(`/api/claims/cases/${caseId}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Nepodařilo se načíst případ')
      }
      const json: CaseDetailData = await res.json()
      setData(json)
      setSettingsForm({
        assigned_to: json.case.assigned_to || '',
        priority: json.case.priority,
        deadline: json.case.deadline ? json.case.deadline.split('T')[0] : '',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Nepodařilo se načíst případ'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [caseId])

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users')
      if (!res.ok) return
      const json = await res.json()
      setUsers(json.users || [])
    } catch {
      // silent — users are optional
    }
  }, [])

  const fetchContracts = useCallback(async () => {
    if (!caseId) return
    setLoadingContracts(true)
    try {
      const res = await fetch(`/api/accountant/claims/${caseId}/generate-contract`)
      if (res.ok) {
        const json = await res.json()
        setContracts(json.jobs || [])
      }
    } catch { /* silent */ }
    finally { setLoadingContracts(false) }
  }, [caseId])

  useEffect(() => {
    if (caseId) {
      fetchData()
      fetchUsers()
      fetchContracts()
    }
  }, [caseId, fetchData, fetchUsers, fetchContracts])

  const handleGenerateContract = async (type: 'contract' | 'power_of_attorney') => {
    if (!caseId) return
    setGeneratingContract(type)
    try {
      const res = await fetch(`/api/accountant/claims/${caseId}/generate-contract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Generování se nezdařilo')
      }
      toast.success(type === 'contract' ? 'Příkazní smlouva vygenerována' : 'Plná moc vygenerována')
      fetchContracts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Chyba')
    } finally {
      setGeneratingContract(null)
    }
  }

  // Close status dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setShowStatusDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // --------------- Actions ---------------

  const handleStatusChange = async (newStatus: InsuranceCaseStatus) => {
    if (!caseId || !data) return
    setChangingStatus(true)
    setShowStatusDropdown(false)
    try {
      const res = await fetch(`/api/claims/cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Nepodařilo se změnit status')
      }
      toast.success(`Status změněn na: ${insuranceStatusLabel(newStatus)}`)
      await fetchData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Nepodařilo se změnit status'
      toast.error(msg)
    } finally {
      setChangingStatus(false)
    }
  }

  const handleAddNote = async () => {
    if (!caseId || !noteText.trim()) return
    setAddingNote(true)
    try {
      const res = await fetch(`/api/claims/cases/${caseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_note', note: noteText.trim() }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Nepodařilo se přidat poznámku')
      }
      toast.success('Poznámka přidána')
      setNoteText('')
      await fetchData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Nepodařilo se přidat poznámku'
      toast.error(msg)
    } finally {
      setAddingNote(false)
    }
  }

  const handleDocumentUpload = async (file: File) => {
    if (!caseId) return
    setUploadingDoc(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`/api/claims/cases/${caseId}/documents`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Nepodařilo se nahrát dokument')
      }
      toast.success('Dokument byl nahrán')
      await fetchData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Nepodařilo se nahrát dokument'
      toast.error(msg)
    } finally {
      setUploadingDoc(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDocumentDelete = async (docId: string) => {
    if (!caseId || !confirm('Opravdu chcete smazat tento dokument?')) return
    try {
      const res = await fetch(`/api/claims/cases/${caseId}/documents/${docId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Nepodařilo se smazat dokument')
      }
      toast.success('Dokument byl smazán')
      await fetchData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Nepodařilo se smazat dokument'
      toast.error(msg)
    }
  }

  const handleAddPayment = async () => {
    if (!caseId) return
    const amount = parseFloat(paymentForm.amount)
    if (!paymentForm.amount || isNaN(amount) || amount <= 0) {
      toast.error('Zadejte platnou částku')
      return
    }
    setAddingPayment(true)
    try {
      const res = await fetch(`/api/claims/cases/${caseId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          payment_type: paymentForm.payment_type,
          payment_date: paymentForm.payment_date,
          reference: paymentForm.reference || undefined,
          note: paymentForm.note || undefined,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Nepodařilo se přidat platbu')
      }
      toast.success('Platba byla přidána')
      setPaymentForm({
        amount: '',
        payment_type: 'partial',
        payment_date: new Date().toISOString().split('T')[0],
        reference: '',
        note: '',
      })
      await fetchData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Nepodařilo se přidat platbu'
      toast.error(msg)
    } finally {
      setAddingPayment(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!caseId) return
    setSavingSettings(true)
    try {
      const payload: Record<string, unknown> = {}
      if (settingsForm.assigned_to) payload.assigned_to = settingsForm.assigned_to
      if (settingsForm.priority) payload.priority = settingsForm.priority
      if (settingsForm.deadline) payload.deadline = settingsForm.deadline
      const res = await fetch(`/api/claims/cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Nepodařilo se uložit nastavení')
      }
      toast.success('Nastavení bylo uloženo')
      await fetchData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Nepodařilo se uložit nastavení'
      toast.error(msg)
    } finally {
      setSavingSettings(false)
    }
  }

  const handleDeleteCase = async () => {
    if (!caseId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/claims/cases/${caseId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Nepodařilo se smazat případ')
      }
      toast.success('Případ byl smazán')
      router.push('/accountant/claims/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Nepodařilo se smazat případ'
      toast.error(msg)
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  // --------------- Loading / Error states ---------------

  if (!caseId || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error || 'Případ nenalezen'}</span>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zpět
        </Button>
      </div>
    )
  }

  const { case: insuranceCase, documents, events, payments } = data
  const canDelete = insuranceCase.status === 'new'

  // Payments summary
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)

  // Sorted events (newest first)
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  // --------------- Render ---------------

  return (
    <div className="space-y-6 pb-10">

      {/* ===== HEADER ===== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Left: back + case info */}
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground -ml-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Zpět na seznam
          </Button>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-blue-700 dark:text-blue-400">
              {insuranceCase.case_number}
            </h1>
            <Badge className={insuranceStatusColor(insuranceCase.status)}>
              {insuranceStatusLabel(insuranceCase.status)}
            </Badge>
            <span className={`text-sm font-medium ${priorityColor(insuranceCase.priority)}`}>
              <Flag className="inline h-3 w-3 mr-1" />
              {priorityLabel(insuranceCase.priority)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {insuranceCase.company && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {insuranceCase.company.name}
              </span>
            )}
            {insuranceCase.insurance_company && (
              <span className="flex items-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5" />
                {insuranceCase.insurance_company.name}
              </span>
            )}
          </div>
        </div>

        {/* Right: action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status change dropdown */}
          <div className="relative" ref={statusDropdownRef}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStatusDropdown(v => !v)}
              disabled={changingStatus}
            >
              {changingStatus ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Activity className="mr-2 h-3.5 w-3.5" />
              )}
              Změnit status
              <ChevronDown className="ml-1 h-3.5 w-3.5" />
            </Button>
            {showStatusDropdown && (
              <div className="absolute right-0 mt-1 w-56 z-50 rounded-lg border bg-popover shadow-md py-1">
                {ALL_STATUSES.map(s => (
                  <button
                    key={s}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2 ${
                      s === insuranceCase.status ? 'font-semibold' : ''
                    }`}
                    onClick={() => handleStatusChange(s)}
                  >
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${insuranceStatusColor(s)}`}>
                      {insuranceStatusLabel(s)}
                    </span>
                    {s === insuranceCase.status && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={() => setActiveTab('settings')}>
            <Settings className="mr-2 h-3.5 w-3.5" />
            Upravit
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={requestingReview}
            onClick={async () => {
              setRequestingReview(true)
              try {
                const res = await fetch('/api/claims/reviews/request', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ case_id: caseId }),
                })
                const data = await res.json()
                if (res.ok && data.url) {
                  await navigator.clipboard.writeText(data.url)
                  alert('Odkaz pro hodnocení byl zkopírován do schránky.')
                } else if (res.status === 409) {
                  alert('Pro tento spis již existuje aktivní žádost o hodnocení.')
                } else {
                  alert(data.error || 'Nepodařilo se vytvořit žádost.')
                }
              } catch {
                alert('Nepodařilo se vytvořit žádost o hodnocení.')
              } finally {
                setRequestingReview(false)
              }
            }}
          >
            {requestingReview ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Star className="mr-2 h-3.5 w-3.5" />
            )}
            Požádat o hodnocení
          </Button>

          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:hover:bg-red-900/20"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Smazat
            </Button>
          )}
        </div>
      </div>

      {/* Delete confirmation banner */}
      {showDeleteConfirm && (
        <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">Opravdu chcete smazat tento případ? Tato akce je nevratná.</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleting}
            >
              Zrušit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDeleteCase}
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Smazat
            </Button>
          </div>
        </div>
      )}

      {/* ===== INFO PANEL ===== */}
      <Card>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">

            {/* Typ pojištění */}
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Typ pojištění</p>
                <p className="text-sm font-medium">{insuranceTypeLabel(insuranceCase.insurance_type)}</p>
              </div>
            </div>

            {/* Číslo pojistky */}
            <div className="flex items-start gap-2">
              <Hash className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Číslo pojistky</p>
                <p className="text-sm font-medium">{insuranceCase.policy_number || '—'}</p>
              </div>
            </div>

            {/* Číslo škody */}
            <div className="flex items-start gap-2">
              <Hash className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Číslo škody</p>
                <p className="text-sm font-medium">{insuranceCase.claim_number || '—'}</p>
              </div>
            </div>

            {/* Datum události */}
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Datum události</p>
                <p className="text-sm font-medium">{formatDate(insuranceCase.event_date)}</p>
              </div>
            </div>

            {/* Místo události */}
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Místo události</p>
                <p className="text-sm font-medium">{insuranceCase.event_location || '—'}</p>
              </div>
            </div>

            {/* Zpracovatel */}
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Zpracovatel</p>
                <p className="text-sm font-medium">
                  {insuranceCase.assigned_user?.name || '—'}
                </p>
              </div>
            </div>

            {/* Nárokovaná částka */}
            <div className="flex items-start gap-2">
              <DollarSign className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Nárokovaná částka</p>
                <p className="text-sm font-medium">{formatCZK(insuranceCase.claimed_amount)}</p>
              </div>
            </div>

            {/* Schválená částka */}
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Schválená částka</p>
                <p className="text-sm font-medium">{formatCZK(insuranceCase.approved_amount)}</p>
              </div>
            </div>

            {/* Vyplacená částka */}
            <div className="flex items-start gap-2">
              <CreditCard className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Vyplacená částka</p>
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  {formatCZK(insuranceCase.paid_amount)}
                </p>
              </div>
            </div>

            {/* Deadline */}
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Deadline</p>
                <p className="text-sm font-medium">{formatDate(insuranceCase.deadline)}</p>
              </div>
            </div>

            {/* Vytvořeno */}
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Vytvořeno</p>
                <p className="text-sm font-medium">{formatDate(insuranceCase.created_at)}</p>
              </div>
            </div>

            {/* Tagy */}
            {insuranceCase.tags && insuranceCase.tags.length > 0 && (
              <div className="flex items-start gap-2">
                <Hash className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Tagy</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {insuranceCase.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Popis události — full width */}
            {insuranceCase.event_description && (
              <div className="flex items-start gap-2 md:col-span-2 lg:col-span-3">
                <FileText className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Popis události</p>
                  <p className="text-sm mt-0.5 whitespace-pre-wrap">{insuranceCase.event_description}</p>
                </div>
              </div>
            )}

            {/* Poznámka — full width */}
            {insuranceCase.note && (
              <div className="flex items-start gap-2 md:col-span-2 lg:col-span-3">
                <StickyNote className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Poznámka</p>
                  <p className="text-sm mt-0.5 whitespace-pre-wrap">{insuranceCase.note}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ===== TABS ===== */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="timeline" className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Dokumenty
            {documents.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1">{documents.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5" />
            Platby
            {payments.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1">{payments.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="contracts" className="flex items-center gap-1.5">
            <ScrollText className="h-3.5 w-3.5" />
            Smlouvy
            {contracts.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1">{contracts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-1.5">
            <Settings className="h-3.5 w-3.5" />
            Nastavení
          </TabsTrigger>
        </TabsList>

        {/* ======== Tab: Timeline ======== */}
        <TabsContent value="timeline" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-0">
              {sortedEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">Zatím žádné události</p>
                </div>
              ) : (
                <div className="divide-y">
                  {sortedEvents.map(event => (
                    <div key={event.id} className="flex items-start gap-3 px-5 py-4 hover:bg-muted/40 transition-colors">
                      <div className="mt-0.5 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <EventIcon eventType={event.event_type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{event.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{event.actor}</span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground" title={event.created_at}>
                            {timeAgo(event.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add note form */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                Přidat poznámku
              </h3>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Napište poznámku k případu..."
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
              <div className="flex justify-end mt-2">
                <Button
                  size="sm"
                  onClick={handleAddNote}
                  disabled={addingNote || !noteText.trim()}
                >
                  {addingNote ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-3.5 w-3.5" />
                  )}
                  Přidat
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======== Tab: Dokumenty ======== */}
        <TabsContent value="documents" className="mt-4 space-y-4">
          {/* Upload area */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Upload className="h-4 w-4 text-blue-600" />
                  Nahrát dokument
                </h3>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) handleDocumentUpload(file)
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingDoc}
                  >
                    {uploadingDoc ? (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-3.5 w-3.5" />
                    )}
                    {uploadingDoc ? 'Nahrávám...' : 'Vybrat soubor'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents list */}
          <Card>
            <CardContent className="p-0">
              {documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">Žádné dokumenty</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Nahrajte dokumenty k případu pomocí tlačítka výše.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Název</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead>Velikost</TableHead>
                      <TableHead>Nahráno</TableHead>
                      <TableHead className="text-right">Akce</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map(doc => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DocTypeIcon type={doc.document_type} />
                            <span className="font-medium text-sm truncate max-w-[200px]">{doc.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {documentTypeLabel(doc.document_type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatFileSize(doc.file_size)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(doc.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Stáhnout"
                              asChild
                            >
                              <a href={`/api/claims/cases/${caseId}/documents/${doc.id}/download`} download>
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Smazat"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={() => handleDocumentDelete(doc.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======== Tab: Platby ======== */}
        <TabsContent value="payments" className="mt-4 space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Celkem nárokováno</p>
                <p className="text-xl font-bold mt-1">{formatCZK(insuranceCase.claimed_amount)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Celkem vyplaceno</p>
                <p className="text-xl font-bold mt-1 text-green-700 dark:text-green-400">{formatCZK(totalPaid)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Payments table */}
          <Card>
            <CardContent className="p-0">
              {payments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CreditCard className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">Žádné platby</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead className="text-right">Částka</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Poznámka</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map(payment => (
                      <TableRow key={payment.id}>
                        <TableCell className="text-sm">{formatDate(payment.payment_date)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {paymentTypeLabel(payment.payment_type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-sm">
                          {formatCZK(payment.amount)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {payment.reference || '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[160px] truncate">
                          {payment.note || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Add payment form */}
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                <Plus className="h-4 w-4 text-blue-600" />
                Přidat platbu
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="payment-amount">Částka (Kč) *</Label>
                  <Input
                    id="payment-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={paymentForm.amount}
                    onChange={e => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Typ platby *</Label>
                  <Select
                    value={paymentForm.payment_type}
                    onValueChange={v => setPaymentForm(prev => ({ ...prev, payment_type: v as PaymentType }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="partial">Částečné plnění</SelectItem>
                      <SelectItem value="full">Plné plnění</SelectItem>
                      <SelectItem value="advance">Záloha</SelectItem>
                      <SelectItem value="refund">Vrácení</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="payment-date">Datum platby *</Label>
                  <Input
                    id="payment-date"
                    type="date"
                    value={paymentForm.payment_date}
                    onChange={e => setPaymentForm(prev => ({ ...prev, payment_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="payment-ref">Reference</Label>
                  <Input
                    id="payment-ref"
                    placeholder="Číslo převodu, VS..."
                    value={paymentForm.reference}
                    onChange={e => setPaymentForm(prev => ({ ...prev, reference: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
                  <Label htmlFor="payment-note">Poznámka</Label>
                  <Input
                    id="payment-note"
                    placeholder="Volitelná poznámka..."
                    value={paymentForm.note}
                    onChange={e => setPaymentForm(prev => ({ ...prev, note: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button
                  size="sm"
                  onClick={handleAddPayment}
                  disabled={addingPayment || !paymentForm.amount}
                >
                  {addingPayment ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-3.5 w-3.5" />
                  )}
                  Přidat platbu
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======== Tab: Nastavení ======== */}
        <TabsContent value="settings" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-5 space-y-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Přiřazení a termíny
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Assigned to */}
                <div className="space-y-1.5">
                  <Label>Zpracovatel</Label>
                  {users.length > 0 ? (
                    <Select
                      value={settingsForm.assigned_to || 'none'}
                      onValueChange={v => setSettingsForm(prev => ({ ...prev, assigned_to: v === 'none' ? '' : v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Nepřiřazeno" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nepřiřazeno</SelectItem>
                        {users.map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder="ID zpracovatele"
                      value={settingsForm.assigned_to}
                      onChange={e => setSettingsForm(prev => ({ ...prev, assigned_to: e.target.value }))}
                    />
                  )}
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                  <Label>Priorita</Label>
                  <Select
                    value={settingsForm.priority || 'normal'}
                    onValueChange={v => setSettingsForm(prev => ({ ...prev, priority: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Nízká</SelectItem>
                      <SelectItem value="normal">Normální</SelectItem>
                      <SelectItem value="high">Vysoká</SelectItem>
                      <SelectItem value="urgent">Urgentní</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Deadline */}
                <div className="space-y-1.5">
                  <Label htmlFor="settings-deadline">Deadline</Label>
                  <Input
                    id="settings-deadline"
                    type="date"
                    value={settingsForm.deadline}
                    onChange={e => setSettingsForm(prev => ({ ...prev, deadline: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                >
                  {savingSettings ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                  )}
                  Uložit nastavení
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger zone */}
          {canDelete && (
            <Card className="border-red-200 dark:border-red-900">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-3">
                  Nebezpečná zóna
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Smazat případ</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Lze smazat pouze nové případy (status: Nový). Akce je nevratná.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Smazat případ
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ======== Tab: Contracts ======== */}
        <TabsContent value="contracts" className="mt-4 space-y-4">
          {/* Generate buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => handleGenerateContract('contract')}
              disabled={!!generatingContract}
            >
              {generatingContract === 'contract' ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <ScrollText className="mr-2 h-3.5 w-3.5" />
              )}
              Vygenerovat příkazní smlouvu
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleGenerateContract('power_of_attorney')}
              disabled={!!generatingContract}
            >
              {generatingContract === 'power_of_attorney' ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <PenTool className="mr-2 h-3.5 w-3.5" />
              )}
              Vygenerovat plnou moc
            </Button>
          </div>

          {/* Contract list */}
          {loadingContracts ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : contracts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <ScrollText className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">Zatím žádné smlouvy</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Vygenerujte příkazní smlouvu nebo plnou moc
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {contracts.map((job: any) => (
                <Card key={job.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {job.document_type === 'power_of_attorney' ? (
                            <PenTool className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <ScrollText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                          <span className="font-medium text-sm truncate">{job.document_name}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          <span>{formatDate(job.created_at)}</span>
                          {job.signers?.length > 0 && (
                            <span>{job.signers.length} podepisující</span>
                          )}
                        </div>
                      </div>
                      <Badge className={
                        job.status === 'signed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                        job.status === 'pending' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                        job.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }>
                        {job.status === 'draft' ? 'Koncept' :
                         job.status === 'pending' ? 'Čeká na podpis' :
                         job.status === 'signed' ? 'Podepsáno' :
                         job.status === 'rejected' ? 'Zamítnuto' :
                         job.status === 'expired' ? 'Vypršelo' :
                         job.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
