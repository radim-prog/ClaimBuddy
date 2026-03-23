'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Inbox,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  MessageSquare,
  User,
  Calendar,
  FileText,
  HelpCircle,
  ChevronRight,
  UserPlus,
  XCircle,
  Send,
  Paperclip,
  Plus,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'

// Types matching the API
interface ClientRequest {
  id: string
  title: string
  description: string | null
  company_id: string
  company_name?: string
  category: 'document' | 'question' | 'task' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'new' | 'in_progress' | 'resolved' | 'closed'
  assigned_to: string | null
  assigned_to_name?: string
  created_by: string
  response_to_client: string | null
  internal_notes: string | null
  attachments: string[] | null
  created_at: string
  updated_at: string
}

interface Company {
  id: string
  name: string
}

// Category icons
function getCategoryIcon(category: string) {
  const icons: Record<string, typeof FileText> = {
    document: FileText,
    question: HelpCircle,
    task: FileText,
    other: MessageSquare,
  }
  return icons[category] || MessageSquare
}

// Category labels
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    document: 'Dokument',
    question: 'Dotaz',
    task: 'Úkol',
    other: 'Jiné',
  }
  return labels[category] || category
}

// Priority colors
function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  }
  return colors[priority] || colors.medium
}

// Priority labels
function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    low: 'Nízká',
    medium: 'Střední',
    high: 'Vysoká',
    urgent: 'Urgentní',
  }
  return labels[priority] || priority
}

// Status colors
function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    new: 'bg-purple-100 text-purple-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-700',
  }
  return colors[status] || colors.new
}

// Status labels
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    new: 'Nový',
    in_progress: 'Řeší se',
    resolved: 'Vyřešeno',
    closed: 'Uzavřeno',
  }
  return labels[status] || status
}

export default function ClientRequestsPage() {
  const { userId } = useAccountantUser()
  
  // State for requests
  const [requests, setRequests] = useState<ClientRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  
  // State for create dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  
  // Create form state
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    company_id: '',
    category: 'document' as 'document' | 'question' | 'task' | 'other',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  })
  
  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterClient, setFilterClient] = useState<string>('all')
  
  // Detail dialog state
  const [selectedRequest, setSelectedRequest] = useState<ClientRequest | null>(null)
  const [responseText, setResponseText] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Fetch requests
  const fetchRequests = async () => {
    if (!userId) return
    
    try {
      setIsLoading(true)
      const res = await fetch('/api/requests', {
        headers: {
          'x-user-id': userId,
        },
      })
      if (!res.ok) throw new Error('Nepodařilo se načíst požadavky')
      const data = await res.json()
      setRequests(data.requests || [])
    } catch (error) {
      console.error('Fetch requests error:', error)
      toast.error('Nepodařilo se načíst požadavky')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch companies for create dialog
  const fetchCompanies = async () => {
    if (!userId) return
    
    try {
      const res = await fetch('/api/accountant/companies', {
        headers: {
          'x-user-id': userId,
        },
      })
      if (!res.ok) throw new Error('Nepodařilo se načíst klienty')
      const data = await res.json()
      setCompanies(data.companies || [])
    } catch (error) {
      console.error('Fetch companies error:', error)
      toast.error('Nepodařilo se načíst klienty')
    }
  }

  // Initial load
  useEffect(() => {
    if (userId) {
      fetchRequests()
      fetchCompanies()
    }
  }, [userId])

  // Create new request
  const handleCreateRequest = async () => {
    if (!newRequest.title || !newRequest.company_id) {
      toast.error('Název a klient jsou povinné')
      return
    }

    try {
      setIsCreating(true)
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify(newRequest),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Nepodařilo se vytvořit požadavek')
      }

      toast.success('Požadavek byl vytvořen')
      setShowCreateDialog(false)
      setNewRequest({
        title: '',
        description: '',
        company_id: '',
        category: 'document',
        priority: 'medium',
      })
      await fetchRequests()
    } catch (error: any) {
      console.error('Create request error:', error)
      toast.error(error.message || 'Nepodařilo se vytvořit požadavek')
    } finally {
      setIsCreating(false)
    }
  }

  // Update request
  const updateRequest = async (id: string, updates: Partial<ClientRequest>) => {
    try {
      setIsUpdating(true)
      const res = await fetch(`/api/requests/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify(updates),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Nepodařilo se aktualizovat požadavek')
      }

      const data = await res.json()
      
      // Update local state
      setRequests(prev => prev.map(r => r.id === id ? { ...r, ...data.request } : r))
      if (selectedRequest?.id === id) {
        setSelectedRequest({ ...selectedRequest, ...data.request })
      }
      
      return data.request
    } catch (error: any) {
      console.error('Update request error:', error)
      toast.error(error.message || 'Nepodařilo se aktualizovat požadavek')
      throw error
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle status change
  const handleStatusChange = async (requestId: string, newStatus: string) => {
    try {
      await updateRequest(requestId, { status: newStatus as ClientRequest['status'] })
      toast.success(`Status změněn na "${getStatusLabel(newStatus)}"`)
    } catch {
      // Error already handled in updateRequest
    }
  }

  // Handle send response
  const handleSendResponse = async () => {
    if (!selectedRequest || !responseText.trim()) return

    try {
      const newStatus = selectedRequest.status === 'new' ? 'in_progress' : selectedRequest.status
      await updateRequest(selectedRequest.id, {
        response_to_client: responseText,
        status: newStatus,
      })
      setResponseText('')
      toast.success('Odpověď odeslána klientovi')
    } catch {
      // Error already handled
    }
  }

  // Handle add internal note
  const handleAddInternalNote = async () => {
    if (!selectedRequest || !internalNote.trim()) return

    try {
      const existingNotes = selectedRequest.internal_notes || ''
      const newNotes = existingNotes
        ? `${existingNotes}\\n\\n[${new Date().toLocaleString('cs-CZ')}] ${internalNote}`
        : `[${new Date().toLocaleString('cs-CZ')}] ${internalNote}`

      await updateRequest(selectedRequest.id, { internal_notes: newNotes })
      setInternalNote('')
      toast.success('Interní poznámka přidána')
    } catch {
      // Error already handled
    }
  }

  // Handle self-assign
  const handleSelfAssign = async () => {
    if (!selectedRequest) return

    try {
      await updateRequest(selectedRequest.id, {
        assigned_to: userId,
        status: 'in_progress',
      })
      setShowAssignDialog(false)
      toast.success('Požadavek přiřazen vám')
    } catch {
      // Error already handled
    }
  }

  // Get unique clients for filter
  const clients = useMemo(() => {
    const clientMap = new Map<string, string>()
    requests.forEach(r => {
      const company = companies.find(c => c.id === r.company_id)
      if (company) {
        clientMap.set(r.company_id, company.name)
      }
    })
    return Array.from(clientMap.entries()).map(([id, name]) => ({ id, name }))
  }, [requests, companies])

  // Filtered requests
  const filteredRequests = useMemo(() => {
    let result = [...requests]

    if (filterStatus !== 'all') {
      result = result.filter(r => r.status === filterStatus)
    }
    if (filterPriority !== 'all') {
      result = result.filter(r => r.priority === filterPriority)
    }
    if (filterClient !== 'all') {
      result = result.filter(r => r.company_id === filterClient)
    }

    // Sort by priority (urgent first) then by date
    const priorityOrder: Record<string, number> = {
      urgent: 0,
      high: 1,
      medium: 2,
      low: 3,
    }
    return result.sort((a, b) => {
      // Active requests first
      const aActive = !['resolved', 'closed'].includes(a.status)
      const bActive = !['resolved', 'closed'].includes(b.status)
      if (aActive !== bActive) return aActive ? -1 : 1

      // Then by priority
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }

      // Then by date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [requests, filterStatus, filterPriority, filterClient])

  // My assigned requests
  const myRequests = useMemo(() => {
    return requests.filter(r =>
      r.assigned_to === userId &&
      !['resolved', 'closed'].includes(r.status)
    )
  }, [requests, userId])

  // Unassigned requests
  const unassignedRequests = useMemo(() => {
    return requests.filter(r =>
      !r.assigned_to &&
      !['resolved', 'closed'].includes(r.status)
    )
  }, [requests])

  // Stats
  const stats = useMemo(() => {
    return {
      new: requests.filter(r => r.status === 'new').length,
      inProgress: requests.filter(r => r.status === 'in_progress').length,
      urgent: requests.filter(r => r.priority === 'urgent' && !['resolved', 'closed'].includes(r.status)).length,
      resolved: requests.filter(r => r.status === 'resolved').length,
      total: requests.length,
    }
  }, [requests])

  // Get company name for display
  const getCompanyName = (companyId: string) => {
    return companies.find(c => c.id === companyId)?.name || 'Neznámý klient'
  }

  // Empty state component
  const EmptyState = ({ onCreate }: { onCreate: () => void }) => (
    <Card className="py-16">
      <CardContent className="flex flex-col items-center justify-center text-center">
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
          <Inbox className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold font-display mb-2">Zatím nemáte žádné požadavky</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Vytvořte první požadavek pro klienta. Požadavky slouží ke komunikaci a sledování úkolů.
        </p>
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Vytvořit požadavek
        </Button>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Požadavky klientů</h1>
          <p className="text-muted-foreground">
            Správa a zpracování požadavků od klientů
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nový požadavek
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-xl">
                <Inbox className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.new}</p>
                <p className="text-sm text-muted-foreground">Nové</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-xl">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-sm text-muted-foreground">Řeší se</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-xl">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.urgent}</p>
                <p className="text-sm text-muted-foreground">Urgentní</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-xl">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.resolved}</p>
                <p className="text-sm text-muted-foreground">Vyřešeno</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Celkem</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Všechny požadavky</TabsTrigger>
          <TabsTrigger value="my" className="gap-2">
            Moje
            {myRequests.length > 0 && (
              <Badge variant="secondary" className="ml-1">{myRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unassigned" className="gap-2">
            Nepřiřazené
            {unassignedRequests.length > 0 && (
              <Badge variant="destructive" className="ml-1">{unassignedRequests.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Všechny</SelectItem>
                      <SelectItem value="new">Nové</SelectItem>
                      <SelectItem value="in_progress">Řeší se</SelectItem>
                      <SelectItem value="resolved">Vyřešeno</SelectItem>
                      <SelectItem value="closed">Uzavřeno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Priorita:</span>
                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Všechny</SelectItem>
                      <SelectItem value="urgent">Urgentní</SelectItem>
                      <SelectItem value="high">Vysoká</SelectItem>
                      <SelectItem value="medium">Střední</SelectItem>
                      <SelectItem value="low">Nízká</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Klient:</span>
                  <Select value={filterClient} onValueChange={setFilterClient}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Všichni</SelectItem>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Request list */}
          {isLoading ? (
            <Card>
              <CardContent className="py-16 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : filteredRequests.length === 0 ? (
            <EmptyState onCreate={() => setShowCreateDialog(true)} />
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Priorita</TableHead>
                    <TableHead>Klient</TableHead>
                    <TableHead>Požadavek</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead>Přiřazeno</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Datum</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map(request => {
                    const CategoryIcon = getCategoryIcon(request.category)
                    return (
                      <TableRow
                        key={request.id}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800/50"
                        onClick={() => setSelectedRequest(request)}
                      >
                        <TableCell>
                          <Badge className={getPriorityColor(request.priority)}>
                            {getPriorityLabel(request.priority)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{getCompanyName(request.company_id)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="line-clamp-1">{request.title}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CategoryIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <span>{getCategoryLabel(request.category)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {request.assigned_to_name ? (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span>{request.assigned_to_name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusLabel(request.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-500 dark:text-gray-400">
                          {new Date(request.created_at).toLocaleDateString('cs-CZ')}
                        </TableCell>
                        <TableCell>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="my" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Moje přiřazené požadavky</CardTitle>
              <CardDescription>
                Požadavky, které jsou přiřazeny vám k vyřešení
              </CardDescription>
            </CardHeader>
            {isLoading ? (
              <CardContent className="py-8 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            ) : myRequests.length === 0 ? (
              <CardContent className="text-center text-muted-foreground py-8">
                Zatím žádné přiřazené požadavky
              </CardContent>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Priorita</TableHead>
                    <TableHead>Klient</TableHead>
                    <TableHead>Požadavek</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Datum</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myRequests.map(request => (
                    <TableRow
                      key={request.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800/50"
                      onClick={() => setSelectedRequest(request)}
                    >
                      <TableCell>
                        <Badge className={getPriorityColor(request.priority)}>
                          {getPriorityLabel(request.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{getCompanyName(request.company_id)}</TableCell>
                      <TableCell>{request.title}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(request.status)}>
                          {getStatusLabel(request.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {new Date(request.created_at).toLocaleDateString('cs-CZ')}
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="unassigned" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Nepřiřazené požadavky
              </CardTitle>
              <CardDescription>
                Nové požadavky, které zatím nikdo nepřevzal
              </CardDescription>
            </CardHeader>
            {isLoading ? (
              <CardContent className="py-8 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            ) : unassignedRequests.length === 0 ? (
              <CardContent className="text-center text-muted-foreground py-8">
                Všechny požadavky jsou přiřazeny
              </CardContent>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Priorita</TableHead>
                    <TableHead>Klient</TableHead>
                    <TableHead>Požadavek</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead className="w-[100px]">Datum</TableHead>
                    <TableHead className="w-[120px]">Akce</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unassignedRequests.map(request => {
                    const CategoryIcon = getCategoryIcon(request.category)
                    return (
                      <TableRow key={request.id}>
                        <TableCell>
                          <Badge className={getPriorityColor(request.priority)}>
                            {getPriorityLabel(request.priority)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{getCompanyName(request.company_id)}</TableCell>
                        <TableCell>
                          <button
                            className="text-left hover:text-blue-600"
                            onClick={() => setSelectedRequest(request)}
                          >
                            {request.title}
                          </button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CategoryIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <span>{getCategoryLabel(request.category)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-500 dark:text-gray-400">
                          {new Date(request.created_at).toLocaleDateString('cs-CZ')}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedRequest(request)
                              setShowAssignDialog(true)
                            }}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Převzít
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Request Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nový požadavek</DialogTitle>
            <DialogDescription>
              Vytvořte nový požadavek pro klienta. Vyplňte následující údaje.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Název požadavku *</Label>
              <Input
                id="title"
                value={newRequest.title}
                onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
                placeholder="např. Chybí faktura za leden"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Klient *</Label>
              <Select 
                value={newRequest.company_id} 
                onValueChange={(value) => setNewRequest(prev => ({ ...prev, company_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte klienta..." />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Kategorie *</Label>
              <Select 
                value={newRequest.category} 
                onValueChange={(value) => setNewRequest(prev => ({ ...prev, category: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="document">Doklad</SelectItem>
                  <SelectItem value="question">Dotaz</SelectItem>
                  <SelectItem value="task">Úkol</SelectItem>
                  <SelectItem value="other">Jiné</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priorita</Label>
              <Select 
                value={newRequest.priority} 
                onValueChange={(value) => setNewRequest(prev => ({ ...prev, priority: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Nízká</SelectItem>
                  <SelectItem value="medium">Střední</SelectItem>
                  <SelectItem value="high">Vysoká</SelectItem>
                  <SelectItem value="urgent">Urgentní</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Popis</Label>
              <Textarea
                id="description"
                value={newRequest.description}
                onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailní popis požadavku..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={isCreating}>
              Zrušit
            </Button>
            <Button 
              onClick={handleCreateRequest} 
              disabled={isCreating || !newRequest.title || !newRequest.company_id}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Vytvářím...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Vytvořit požadavek
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Detail Dialog */}
      <Dialog open={!!selectedRequest && !showAssignDialog} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedRequest && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-xl">{selectedRequest.title}</DialogTitle>
                    <DialogDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {getCompanyName(selectedRequest.company_id)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(selectedRequest.created_at).toLocaleDateString('cs-CZ')}
                      </span>
                    </DialogDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getPriorityColor(selectedRequest.priority)}>
                      {getPriorityLabel(selectedRequest.priority)}
                    </Badge>
                    <Badge className={getStatusColor(selectedRequest.status)}>
                      {getStatusLabel(selectedRequest.status)}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Description */}
                <div>
                  <h4 className="font-semibold mb-2">Popis požadavku</h4>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p className="whitespace-pre-wrap">{selectedRequest.description || 'Bez popisu'}</p>
                  </div>
                </div>

                {/* Attachments */}
                {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Přílohy</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedRequest.attachments.map((file, i) => (
                        <Badge key={i} variant="outline" className="gap-1">
                          <Paperclip className="h-3 w-3" />
                          {file}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assignment */}
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Přiřazeno:</span>
                    <span className="ml-2 font-medium">
                      {selectedRequest.assigned_to_name || 'Nepřiřazeno'}
                    </span>
                  </div>
                  {!selectedRequest.assigned_to && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAssignDialog(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Převzít
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Response to client */}
                <div>
                  <h4 className="font-semibold mb-2">Odpověď klientovi</h4>
                  {selectedRequest.response_to_client && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-3">
                      <p className="text-sm whitespace-pre-wrap">{selectedRequest.response_to_client}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Napište odpověď klientovi..."
                      rows={3}
                      className="flex-1"
                    />
                    <Button onClick={handleSendResponse} disabled={!responseText.trim() || isUpdating}>
                      <Send className="h-4 w-4 mr-1" />
                      Odeslat
                    </Button>
                  </div>
                </div>

                {/* Internal notes */}
                <div>
                  <h4 className="font-semibold mb-2">Interní poznámky</h4>
                  {selectedRequest.internal_notes && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg mb-3 border border-yellow-200">
                      <p className="text-sm whitespace-pre-wrap">{selectedRequest.internal_notes}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Textarea
                      value={internalNote}
                      onChange={(e) => setInternalNote(e.target.value)}
                      placeholder="Přidat interní poznámku (neviditelné pro klienta)..."
                      rows={2}
                      className="flex-1"
                    />
                    <Button variant="outline" onClick={handleAddInternalNote} disabled={!internalNote.trim() || isUpdating}>
                      Přidat
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex justify-between">
                  <div className="flex gap-2">
                    <Select
                      value={selectedRequest.status}
                      onValueChange={(value) => handleStatusChange(selectedRequest.id, value)}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Nový</SelectItem>
                        <SelectItem value="in_progress">Řeší se</SelectItem>
                        <SelectItem value="resolved">Vyřešeno</SelectItem>
                        <SelectItem value="closed">Uzavřeno</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleStatusChange(selectedRequest.id, 'closed')}
                      disabled={isUpdating}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Uzavřít
                    </Button>
                    <Button
                      onClick={() => handleStatusChange(selectedRequest.id, 'resolved')}
                      disabled={isUpdating}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Označit jako vyřešeno
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Self-Assign Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Převzít požadavek</DialogTitle>
            <DialogDescription>
              Chcete převzít tento požadavek k vyřešení?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Zrušit
            </Button>
            <Button onClick={handleSelfAssign} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Převzít požadavek
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
