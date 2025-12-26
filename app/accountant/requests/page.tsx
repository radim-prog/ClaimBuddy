'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
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
  Phone,
  Calculator,
  Wallet,
  HelpCircle,
  ChevronRight,
  Eye,
  UserPlus,
  XCircle,
  Send,
  Paperclip,
} from 'lucide-react'
import {
  mockClientRequests,
  mockUsers,
  getClientRequests,
  getClientRequestsByAssignee,
  getUnassignedClientRequests,
  getActiveClientRequests,
  getClientRequestStats,
  getRequestCategoryLabel,
  getRequestPriorityLabel,
  getRequestStatusLabel,
  updateClientRequest,
  ClientRequest,
  ClientRequestStatus,
  ClientRequestPriority,
  ClientRequestCategory,
  MOCK_CONFIG,
} from '@/lib/mock-data'
import { toast } from 'sonner'

// Category icons
function getCategoryIcon(category: ClientRequestCategory) {
  const icons: Record<ClientRequestCategory, typeof FileText> = {
    accounting: Calculator,
    tax: Wallet,
    payroll: User,
    consulting: HelpCircle,
    documents: FileText,
    other: MessageSquare,
  }
  return icons[category]
}

// Priority colors
function getPriorityColor(priority: ClientRequestPriority): string {
  const colors: Record<ClientRequestPriority, string> = {
    low: 'bg-gray-100 text-gray-700',
    normal: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  }
  return colors[priority]
}

// Status colors
function getStatusColor(status: ClientRequestStatus): string {
  const colors: Record<ClientRequestStatus, string> = {
    new: 'bg-purple-100 text-purple-700',
    reviewed: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }
  return colors[status]
}

export default function ClientRequestsPage() {
  const [selectedRequest, setSelectedRequest] = useState<ClientRequest | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterClient, setFilterClient] = useState<string>('all')
  const [responseText, setResponseText] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [assignTo, setAssignTo] = useState<string>('')

  // Get stats
  const stats = useMemo(() => getClientRequestStats(), [])

  // Get accountants for assignment
  const accountants = useMemo(() => {
    return mockUsers.filter(u => u.role === 'accountant' || u.role === 'assistant')
  }, [])

  // Get unique clients for filter
  const clients = useMemo(() => {
    const clientMap = new Map<string, string>()
    mockClientRequests.forEach(r => {
      clientMap.set(r.client_id, r.client_name)
    })
    return Array.from(clientMap.entries()).map(([id, name]) => ({ id, name }))
  }, [])

  // Filtered requests
  const filteredRequests = useMemo(() => {
    let requests = [...mockClientRequests]

    if (filterStatus !== 'all') {
      requests = requests.filter(r => r.status === filterStatus)
    }
    if (filterPriority !== 'all') {
      requests = requests.filter(r => r.priority === filterPriority)
    }
    if (filterClient !== 'all') {
      requests = requests.filter(r => r.client_id === filterClient)
    }

    // Sort by priority (urgent first) then by date
    const priorityOrder: Record<ClientRequestPriority, number> = {
      urgent: 0,
      high: 1,
      normal: 2,
      low: 3,
    }
    return requests.sort((a, b) => {
      // Active requests first
      const aActive = !['completed', 'rejected'].includes(a.status)
      const bActive = !['completed', 'rejected'].includes(b.status)
      if (aActive !== bActive) return aActive ? -1 : 1

      // Then by priority
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }

      // Then by date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [filterStatus, filterPriority, filterClient])

  // My assigned requests
  const myRequests = useMemo(() => {
    return mockClientRequests.filter(r =>
      r.assigned_to === MOCK_CONFIG.CURRENT_USER_ID &&
      !['completed', 'rejected'].includes(r.status)
    )
  }, [])

  // Unassigned requests
  const unassignedRequests = useMemo(() => getUnassignedClientRequests(), [])

  // Handle status change
  const handleStatusChange = (requestId: string, newStatus: ClientRequestStatus) => {
    updateClientRequest(requestId, { status: newStatus })
    if (selectedRequest?.id === requestId) {
      setSelectedRequest({ ...selectedRequest, status: newStatus })
    }
    toast.success(`Status změněn na "${getRequestStatusLabel(newStatus)}"`)
  }

  // Handle send response
  const handleSendResponse = () => {
    if (!selectedRequest || !responseText.trim()) return

    updateClientRequest(selectedRequest.id, {
      response_to_client: responseText,
      status: selectedRequest.status === 'new' ? 'reviewed' : selectedRequest.status,
    })
    setSelectedRequest({
      ...selectedRequest,
      response_to_client: responseText,
      status: selectedRequest.status === 'new' ? 'reviewed' : selectedRequest.status,
    })
    setResponseText('')
    toast.success('Odpověď odeslána klientovi')
  }

  // Handle add internal note
  const handleAddInternalNote = () => {
    if (!selectedRequest || !internalNote.trim()) return

    const existingNotes = selectedRequest.internal_notes || ''
    const newNotes = existingNotes
      ? `${existingNotes}\n\n[${new Date().toLocaleString('cs-CZ')}] ${internalNote}`
      : `[${new Date().toLocaleString('cs-CZ')}] ${internalNote}`

    updateClientRequest(selectedRequest.id, { internal_notes: newNotes })
    setSelectedRequest({ ...selectedRequest, internal_notes: newNotes })
    setInternalNote('')
    toast.success('Interní poznámka přidána')
  }

  // Handle assign
  const handleAssign = () => {
    if (!selectedRequest || !assignTo) return

    const user = accountants.find(a => a.id === assignTo)
    updateClientRequest(selectedRequest.id, {
      assigned_to: assignTo,
      assigned_to_name: user?.name,
      status: 'reviewed',
    })
    setSelectedRequest({
      ...selectedRequest,
      assigned_to: assignTo,
      assigned_to_name: user?.name,
      status: 'reviewed',
    })
    setShowAssignDialog(false)
    setAssignTo('')
    toast.success(`Požadavek přiřazen: ${user?.name}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Požadavky klientů</h1>
          <p className="text-muted-foreground">
            Správa a zpracování požadavků od klientů
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
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
              <div className="p-2 bg-yellow-100 rounded-lg">
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
              <div className="p-2 bg-red-100 rounded-lg">
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
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Vyřešeno</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
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
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Všechny</SelectItem>
                      <SelectItem value="new">Nové</SelectItem>
                      <SelectItem value="reviewed">Posouzeno</SelectItem>
                      <SelectItem value="in_progress">Řeší se</SelectItem>
                      <SelectItem value="completed">Vyřešeno</SelectItem>
                      <SelectItem value="rejected">Zamítnuto</SelectItem>
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
                      <SelectItem value="normal">Normální</SelectItem>
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
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Žádné požadavky nenalezeny
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map(request => {
                    const CategoryIcon = getCategoryIcon(request.category)
                    return (
                      <TableRow
                        key={request.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => setSelectedRequest(request)}
                      >
                        <TableCell>
                          <Badge className={getPriorityColor(request.priority)}>
                            {getRequestPriorityLabel(request.priority)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{request.client_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="line-clamp-1">{request.title}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CategoryIcon className="h-4 w-4 text-gray-500" />
                            <span>{getRequestCategoryLabel(request.category)}</span>
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
                            {getRequestStatusLabel(request.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {new Date(request.created_at).toLocaleDateString('cs-CZ')}
                        </TableCell>
                        <TableCell>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="my" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Moje přiřazené požadavky</CardTitle>
              <CardDescription>
                Požadavky, které jsou přiřazeny vám k vyřešení
              </CardDescription>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Priorita</TableHead>
                  <TableHead>Klient</TableHead>
                  <TableHead>Požadavek</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Termín</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nemáte žádné přiřazené požadavky
                    </TableCell>
                  </TableRow>
                ) : (
                  myRequests.map(request => (
                    <TableRow
                      key={request.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedRequest(request)}
                    >
                      <TableCell>
                        <Badge className={getPriorityColor(request.priority)}>
                          {getRequestPriorityLabel(request.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{request.client_name}</TableCell>
                      <TableCell>{request.title}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(request.status)}>
                          {getRequestStatusLabel(request.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {request.requested_by_date ? (
                          <span className="text-sm">
                            {new Date(request.requested_by_date).toLocaleDateString('cs-CZ')}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="unassigned" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Nepřiřazené požadavky
              </CardTitle>
              <CardDescription>
                Nové požadavky, které zatím nikdo nepřevzal
              </CardDescription>
            </CardHeader>
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
                {unassignedRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Všechny požadavky jsou přiřazeny
                    </TableCell>
                  </TableRow>
                ) : (
                  unassignedRequests.map(request => {
                    const CategoryIcon = getCategoryIcon(request.category)
                    return (
                      <TableRow key={request.id}>
                        <TableCell>
                          <Badge className={getPriorityColor(request.priority)}>
                            {getRequestPriorityLabel(request.priority)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{request.client_name}</TableCell>
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
                            <CategoryIcon className="h-4 w-4 text-gray-500" />
                            <span>{getRequestCategoryLabel(request.category)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-500">
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
                            Přiřadit
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Request Detail Dialog */}
      <Dialog open={!!selectedRequest && !showAssignDialog} onOpenChange={() => setSelectedRequest(null)}>
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
                        {selectedRequest.client_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(selectedRequest.created_at).toLocaleDateString('cs-CZ')}
                      </span>
                    </DialogDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getPriorityColor(selectedRequest.priority)}>
                      {getRequestPriorityLabel(selectedRequest.priority)}
                    </Badge>
                    <Badge className={getStatusColor(selectedRequest.status)}>
                      {getRequestStatusLabel(selectedRequest.status)}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Description */}
                <div>
                  <h4 className="font-semibold mb-2">Popis požadavku</h4>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="whitespace-pre-wrap">{selectedRequest.description}</p>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAssignDialog(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    {selectedRequest.assigned_to ? 'Přeřadit' : 'Přiřadit'}
                  </Button>
                </div>

                <Separator />

                {/* Response to client */}
                <div>
                  <h4 className="font-semibold mb-2">Odpověď klientovi</h4>
                  {selectedRequest.response_to_client && (
                    <div className="p-4 bg-blue-50 rounded-lg mb-3">
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
                    <Button onClick={handleSendResponse} disabled={!responseText.trim()}>
                      <Send className="h-4 w-4 mr-1" />
                      Odeslat
                    </Button>
                  </div>
                </div>

                {/* Internal notes */}
                <div>
                  <h4 className="font-semibold mb-2">Interní poznámky</h4>
                  {selectedRequest.internal_notes && (
                    <div className="p-4 bg-yellow-50 rounded-lg mb-3 border border-yellow-200">
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
                    <Button variant="outline" onClick={handleAddInternalNote} disabled={!internalNote.trim()}>
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
                      onValueChange={(value) => handleStatusChange(selectedRequest.id, value as ClientRequestStatus)}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Nový</SelectItem>
                        <SelectItem value="reviewed">Posouzeno</SelectItem>
                        <SelectItem value="in_progress">Řeší se</SelectItem>
                        <SelectItem value="completed">Vyřešeno</SelectItem>
                        <SelectItem value="rejected">Zamítnuto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleStatusChange(selectedRequest.id, 'rejected')}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Zamítnout
                    </Button>
                    <Button
                      onClick={() => handleStatusChange(selectedRequest.id, 'completed')}
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

      {/* Assign Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Přiřadit požadavek</DialogTitle>
            <DialogDescription>
              Vyberte účetní/ho, kterému chcete požadavek přiřadit.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={assignTo} onValueChange={setAssignTo}>
              <SelectTrigger>
                <SelectValue placeholder="Vyberte osobu..." />
              </SelectTrigger>
              <SelectContent>
                {accountants.map(acc => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name} ({acc.role === 'assistant' ? 'Asistent' : 'Účetní'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Zrušit
            </Button>
            <Button onClick={handleAssign} disabled={!assignTo}>
              Přiřadit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
