'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  addDoc,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { Case, CaseTimeline, User, Message } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { LoadingPage } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { CaseTimeline as TimelineComponent } from '@/components/cases/case-timeline';
import { CaseDocuments } from '@/components/cases/case-documents';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Building2,
  FileText,
  User as UserIcon,
  Clock,
  Lock,
  Mail,
  Phone,
  Archive,
  X,
  CheckCircle2,
  MessageSquare,
  FileDown
} from 'lucide-react';
import { CASE_STATUS_LABELS, INSURANCE_TYPE_LABELS, CASE_STATUSES, CaseStatus } from '@/lib/constants';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  waiting_for_client: 'bg-orange-100 text-orange-800',
  waiting_for_insurance: 'bg-purple-100 text-purple-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

interface InternalNote {
  id: string;
  caseId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
}

interface StatusChange {
  id: string;
  caseId: string;
  oldStatus: string;
  newStatus: string;
  reason: string;
  changedBy: string;
  changedByName: string;
  createdAt: Date;
}

export default function AdminCaseDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [caseOwner, setCaseOwner] = useState<User | null>(null);
  const [timeline, setTimeline] = useState<CaseTimeline[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [internalNotes, setInternalNotes] = useState<InternalNote[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusChange[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Admin action states
  const [newInternalNote, setNewInternalNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusChangeReason, setStatusChangeReason] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchCaseData();
    fetchAgents();
  }, [user, params.id, refreshKey]);

  useEffect(() => {
    if (!params.id) return;

    // Real-time internal notes
    const notesRef = collection(db, 'internalNotes');
    const notesQuery = query(
      notesRef,
      where('caseId', '==', params.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeNotes = onSnapshot(notesQuery, (snapshot) => {
      const notesData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as InternalNote;
      });
      setInternalNotes(notesData);
    });

    // Real-time messages
    const messagesRef = collection(db, 'messages');
    const messagesQuery = query(
      messagesRef,
      where('caseId', '==', params.id),
      orderBy('createdAt', 'asc')
    );

    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Message;
      });
      setMessages(messagesData);
    });

    return () => {
      unsubscribeNotes();
      unsubscribeMessages();
    };
  }, [params.id]);

  const fetchCaseData = async () => {
    try {
      setLoading(true);

      // Fetch case
      const caseRef = doc(db, 'cases', params.id);
      const caseSnap = await getDoc(caseRef);

      if (!caseSnap.exists()) {
        toast({
          title: 'Případ nenalezen',
          description: 'Tento případ neexistuje',
          variant: 'destructive',
        });
        router.push('/admin/cases');
        return;
      }

      const caseDataRaw = caseSnap.data();
      const caseItem: Case = {
        id: caseSnap.id,
        ...caseDataRaw,
        createdAt: caseDataRaw.createdAt?.toDate() || new Date(),
        updatedAt: caseDataRaw.updatedAt?.toDate() || new Date(),
        closedAt: caseDataRaw.closedAt?.toDate(),
      } as Case;

      setCaseData(caseItem);
      setNewStatus(caseItem.status);
      setSelectedAgent(caseItem.assignedTo || '');

      // Fetch case owner
      const userRef = doc(db, 'users', caseItem.userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setCaseOwner({
          id: userSnap.id,
          ...userData,
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date(),
        } as User);
      }

      // Fetch timeline
      const timelineRef = collection(db, 'timeline');
      const timelineQuery = query(
        timelineRef,
        where('caseId', '==', params.id),
        orderBy('createdAt', 'desc')
      );

      const timelineSnap = await getDocs(timelineQuery);
      const timelineData = timelineSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as CaseTimeline;
      });

      setTimeline(timelineData);

      // Fetch status history
      const statusHistoryRef = collection(db, 'statusChanges');
      const statusHistoryQuery = query(
        statusHistoryRef,
        where('caseId', '==', params.id),
        orderBy('createdAt', 'desc')
      );

      const statusHistorySnap = await getDocs(statusHistoryQuery);
      const statusHistoryData = statusHistorySnap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as StatusChange;
      });

      setStatusHistory(statusHistoryData);

    } catch (error) {
      console.error('Error fetching case:', error);
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se načíst data případu',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const usersRef = collection(db, 'users');
      const agentsQuery = query(
        usersRef,
        where('role', 'in', ['agent', 'admin'])
      );

      const agentsSnap = await getDocs(agentsQuery);
      const agentsData = agentsSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as User;
      });

      setAgents(agentsData);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const handleAddInternalNote = async () => {
    if (!newInternalNote.trim() || !user || !caseData) return;

    try {
      setSavingNote(true);

      const noteData = {
        caseId: params.id,
        content: newInternalNote,
        authorId: user.uid,
        authorName: user.displayName || user.email || 'Admin',
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'internalNotes'), noteData);

      // Add timeline event
      await addDoc(collection(db, 'timeline'), {
        caseId: params.id,
        type: 'note',
        title: 'Interní poznámka přidána',
        description: `${noteData.authorName} přidal(a) interní poznámku`,
        userId: user.uid,
        userName: noteData.authorName,
        createdAt: Timestamp.now(),
      });

      setNewInternalNote('');
      toast({
        title: 'Poznámka uložena',
        description: 'Interní poznámka byla úspěšně přidána',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error adding internal note:', error);
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se uložit poznámku',
        variant: 'destructive',
      });
    } finally {
      setSavingNote(false);
    }
  };

  const handleChangeStatus = async () => {
    if (!newStatus || !statusChangeReason.trim() || !user || !caseData) return;

    if (newStatus === caseData.status) {
      toast({
        title: 'Žádná změna',
        description: 'Vybraný status je stejný jako aktuální',
        variant: 'destructive',
      });
      return;
    }

    try {
      setChangingStatus(true);

      const caseRef = doc(db, 'cases', params.id);
      await updateDoc(caseRef, {
        status: newStatus,
        updatedAt: Timestamp.now(),
      });

      // Save status change record
      await addDoc(collection(db, 'statusChanges'), {
        caseId: params.id,
        oldStatus: caseData.status,
        newStatus: newStatus,
        reason: statusChangeReason,
        changedBy: user.uid,
        changedByName: user.displayName || user.email || 'Admin',
        createdAt: Timestamp.now(),
      });

      // Add timeline event
      await addDoc(collection(db, 'timeline'), {
        caseId: params.id,
        type: 'status_change',
        title: 'Status změněn',
        description: `${CASE_STATUS_LABELS[caseData.status as CaseStatus]} → ${CASE_STATUS_LABELS[newStatus]}`,
        userId: user.uid,
        userName: user.displayName || user.email || 'Admin',
        createdAt: Timestamp.now(),
        metadata: {
          oldStatus: caseData.status,
          newStatus: newStatus,
          reason: statusChangeReason,
        },
      });

      setStatusChangeReason('');
      setRefreshKey(prev => prev + 1);

      toast({
        title: 'Status změněn',
        description: 'Status případu byl úspěšně aktualizován',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error changing status:', error);
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se změnit status',
        variant: 'destructive',
      });
    } finally {
      setChangingStatus(false);
    }
  };

  const handleAssignAgent = async () => {
    if (!selectedAgent || !user || !caseData) return;

    if (selectedAgent === caseData.assignedTo) {
      toast({
        title: 'Žádná změna',
        description: 'Vybraný agent je již přiřazen',
        variant: 'destructive',
      });
      return;
    }

    try {
      setAssigning(true);

      const agent = agents.find(a => a.id === selectedAgent);
      if (!agent) return;

      const caseRef = doc(db, 'cases', params.id);
      await updateDoc(caseRef, {
        assignedTo: selectedAgent,
        assignedToName: agent.name,
        updatedAt: Timestamp.now(),
      });

      // Add timeline event
      await addDoc(collection(db, 'timeline'), {
        caseId: params.id,
        type: 'assignment',
        title: 'Případ přiřazen',
        description: `Případ byl přiřazen: ${agent.name}`,
        userId: user.uid,
        userName: user.displayName || user.email || 'Admin',
        createdAt: Timestamp.now(),
        metadata: {
          assignedTo: selectedAgent,
          assignedToName: agent.name,
        },
      });

      setRefreshKey(prev => prev + 1);

      toast({
        title: 'Přiřazení dokončeno',
        description: `Případ byl přiřazen agentovi ${agent.name}`,
        variant: 'success',
      });
    } catch (error) {
      console.error('Error assigning agent:', error);
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se přiřadit agenta',
        variant: 'destructive',
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleExportPDF = async () => {
    toast({
      title: 'Připravuje se export',
      description: 'Export do PDF bude brzy k dispozici',
    });
  };

  const handleCloseCase = async () => {
    if (!confirm('Opravdu chcete uzavřít tento případ?')) return;

    try {
      const caseRef = doc(db, 'cases', params.id);
      await updateDoc(caseRef, {
        status: CASE_STATUSES.CLOSED,
        closedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      await addDoc(collection(db, 'timeline'), {
        caseId: params.id,
        type: 'status_change',
        title: 'Případ uzavřen',
        description: 'Případ byl uzavřen administrátorem',
        userId: user?.uid,
        userName: user?.displayName || user?.email || 'Admin',
        createdAt: Timestamp.now(),
      });

      setRefreshKey(prev => prev + 1);

      toast({
        title: 'Případ uzavřen',
        description: 'Případ byl úspěšně uzavřen',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error closing case:', error);
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se uzavřít případ',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <LoadingPage />;
  }

  if (!caseData) {
    return null;
  }

  const metadataStats = {
    messagesCount: messages.length,
    documentsCount: caseData.documents?.length || 0,
    internalNotesCount: internalNotes.length,
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.push('/admin/cases')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Zpět na seznam
      </Button>

      {/* Header with Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">
              Případ #{caseData.caseNumber}
            </h1>
            <Badge className={STATUS_COLORS[caseData.status]}>
              {CASE_STATUS_LABELS[caseData.status]}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Vytvořeno {format(new Date(caseData.createdAt), 'dd. MM. yyyy HH:mm', { locale: cs })}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <FileDown className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          {caseOwner && (
            <a href={`mailto:${caseOwner.email}`}>
              <Button variant="outline" size="sm">
                <Mail className="mr-2 h-4 w-4" />
                Email klientovi
              </Button>
            </a>
          )}
          {caseData.status !== CASE_STATUSES.CLOSED && (
            <Button variant="outline" size="sm" onClick={handleCloseCase}>
              <X className="mr-2 h-4 w-4" />
              Uzavřít případ
            </Button>
          )}
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Sidebar - Admin Metadata */}
        <div className="space-y-6 lg:col-span-3">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Metadata</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-500">Klient</p>
                <div className="flex items-center gap-2 mt-1">
                  <UserIcon className="h-4 w-4 text-gray-400" />
                  <p className="font-medium">{caseOwner?.name || 'Načítání...'}</p>
                </div>
                {caseOwner?.email && (
                  <p className="text-gray-600 text-xs mt-1">{caseOwner.email}</p>
                )}
                {caseOwner?.phone && (
                  <p className="text-gray-600 text-xs">{caseOwner.phone}</p>
                )}
              </div>

              {caseData.assignedToName && (
                <div>
                  <p className="text-gray-500">Přiřazeno</p>
                  <div className="flex items-center gap-2 mt-1">
                    <UserIcon className="h-4 w-4 text-gray-400" />
                    <p className="font-medium">{caseData.assignedToName}</p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-gray-500">Naposledy upraveno</p>
                <p className="font-medium mt-1">
                  {format(new Date(caseData.updatedAt), 'dd. MM. yyyy HH:mm', { locale: cs })}
                </p>
              </div>

              {caseData.closedAt && (
                <div>
                  <p className="text-gray-500">Uzavřeno</p>
                  <p className="font-medium mt-1">
                    {format(new Date(caseData.closedAt), 'dd. MM. yyyy HH:mm', { locale: cs })}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Zprávy</span>
                    <Badge variant="secondary">{metadataStats.messagesCount}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Dokumenty</span>
                    <Badge variant="secondary">{metadataStats.documentsCount}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Interní poznámky</span>
                    <Badge variant="secondary">{metadataStats.internalNotesCount}</Badge>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content - Tabs */}
        <div className="lg:col-span-6">
          <Card className="p-6">
            <Tabs defaultValue="overview">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="overview">Přehled</TabsTrigger>
                <TabsTrigger value="documents">Dokumenty</TabsTrigger>
                <TabsTrigger value="messages">Komunikace</TabsTrigger>
                <TabsTrigger value="timeline">Historie</TabsTrigger>
                <TabsTrigger value="internal">
                  <Lock className="h-3 w-3 mr-1" />
                  Interní
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Informace o případu</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Typ pojištění</p>
                        <p className="font-medium text-gray-900">
                          {INSURANCE_TYPE_LABELS[caseData.insuranceType]}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                        <Building2 className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Pojišťovna</p>
                        <p className="font-medium text-gray-900">
                          {caseData.insuranceCompany}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                        <Calendar className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Datum události</p>
                        <p className="font-medium text-gray-900">
                          {format(new Date(caseData.incidentDate), 'dd. MM. yyyy', { locale: cs })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                        <DollarSign className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Předpokládaná škoda</p>
                        <p className="font-medium text-gray-900">
                          {new Intl.NumberFormat('cs-CZ', {
                            style: 'currency',
                            currency: 'CZK',
                            maximumFractionDigits: 0,
                          }).format(caseData.claimAmount)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Místo události</p>
                      <p className="text-gray-900">{caseData.incidentLocation}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Popis události</p>
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {caseData.incidentDescription}
                      </p>
                    </div>

                    {caseData.policyNumber && (
                      <div>
                        <p className="text-sm text-gray-500">Číslo pojistky</p>
                        <p className="text-gray-900">{caseData.policyNumber}</p>
                      </div>
                    )}

                    {caseData.policeReportNumber && (
                      <div>
                        <p className="text-sm text-gray-500">Číslo policejního protokolu</p>
                        <p className="text-gray-900">{caseData.policeReportNumber}</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents">
                <CaseDocuments
                  caseId={params.id}
                  documents={caseData.documents || []}
                  onDocumentAdded={() => setRefreshKey(prev => prev + 1)}
                />
              </TabsContent>

              {/* Messages Tab */}
              <TabsContent value="messages" className="space-y-4">
                <h3 className="font-semibold text-gray-900">Komunikace s klientem</h3>
                <div className="space-y-4 max-h-[500px] overflow-y-auto rounded-lg border p-4">
                  {messages.length === 0 ? (
                    <p className="text-center text-sm text-gray-500 py-8">
                      Zatím žádné zprávy.
                    </p>
                  ) : (
                    messages.map((message) => (
                      <div key={message.id} className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                            <UserIcon className="h-4 w-4 text-gray-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <p className="text-sm font-medium text-gray-900">
                              {message.userName}
                            </p>
                            <Badge variant={message.userRole === 'client' ? 'secondary' : 'default'}>
                              {message.userRole === 'client' ? 'Klient' : 'Admin'}
                            </Badge>
                            <time className="text-xs text-gray-500">
                              {format(new Date(message.createdAt), 'dd. MM. HH:mm', { locale: cs })}
                            </time>
                          </div>
                          <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2">
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Timeline Tab */}
              <TabsContent value="timeline">
                <TimelineComponent timeline={timeline} />
              </TabsContent>

              {/* Internal Notes Tab */}
              <TabsContent value="internal" className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="h-4 w-4 text-amber-600" />
                  <h3 className="font-semibold text-gray-900">Interní poznámky</h3>
                  <Badge variant="secondary" className="ml-auto">
                    Pouze pro admin/agent
                  </Badge>
                </div>

                {/* Add New Note */}
                <div className="space-y-2">
                  <Textarea
                    placeholder="Napište interní poznámku (viditelná pouze pro admin/agent)..."
                    value={newInternalNote}
                    onChange={(e) => setNewInternalNote(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <Button
                    onClick={handleAddInternalNote}
                    disabled={!newInternalNote.trim() || savingNote}
                    size="sm"
                  >
                    {savingNote ? 'Ukládání...' : 'Přidat poznámku'}
                  </Button>
                </div>

                {/* Notes List */}
                <div className="space-y-3 mt-6">
                  {internalNotes.length === 0 ? (
                    <p className="text-center text-sm text-gray-500 py-8">
                      Zatím žádné interní poznámky.
                    </p>
                  ) : (
                    internalNotes.map((note) => (
                      <div key={note.id} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Lock className="h-3 w-3 text-amber-600" />
                            <p className="text-sm font-medium text-gray-900">{note.authorName}</p>
                          </div>
                          <time className="text-xs text-gray-500">
                            {format(new Date(note.createdAt), 'dd. MM. yyyy HH:mm', { locale: cs })}
                          </time>
                        </div>
                        <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                          {note.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Right Sidebar - Status & Assignment */}
        <div className="space-y-6 lg:col-span-3">
          {/* Status Management */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Správa statusu</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Nový status
                </label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CASE_STATUSES.NEW}>
                      {CASE_STATUS_LABELS[CASE_STATUSES.NEW]}
                    </SelectItem>
                    <SelectItem value={CASE_STATUSES.IN_PROGRESS}>
                      {CASE_STATUS_LABELS[CASE_STATUSES.IN_PROGRESS]}
                    </SelectItem>
                    <SelectItem value={CASE_STATUSES.WAITING_FOR_CLIENT}>
                      {CASE_STATUS_LABELS[CASE_STATUSES.WAITING_FOR_CLIENT]}
                    </SelectItem>
                    <SelectItem value={CASE_STATUSES.WAITING_FOR_INSURANCE}>
                      {CASE_STATUS_LABELS[CASE_STATUSES.WAITING_FOR_INSURANCE]}
                    </SelectItem>
                    <SelectItem value={CASE_STATUSES.RESOLVED}>
                      {CASE_STATUS_LABELS[CASE_STATUSES.RESOLVED]}
                    </SelectItem>
                    <SelectItem value={CASE_STATUSES.CLOSED}>
                      {CASE_STATUS_LABELS[CASE_STATUSES.CLOSED]}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Důvod změny *
                </label>
                <Textarea
                  placeholder="Proč měníte status?"
                  value={statusChangeReason}
                  onChange={(e) => setStatusChangeReason(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <Button
                onClick={handleChangeStatus}
                disabled={!statusChangeReason.trim() || changingStatus || newStatus === caseData.status}
                className="w-full"
              >
                {changingStatus ? 'Měním...' : 'Změnit status'}
              </Button>

              {/* Status History */}
              {statusHistory.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Historie změn</h4>
                  <div className="space-y-3 max-h-[200px] overflow-y-auto">
                    {statusHistory.map((change) => (
                      <div key={change.id} className="text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {CASE_STATUS_LABELS[change.oldStatus as CaseStatus]} → {CASE_STATUS_LABELS[change.newStatus as CaseStatus]}
                          </span>
                          <time className="text-gray-500">
                            {format(new Date(change.createdAt), 'dd. MM.', { locale: cs })}
                          </time>
                        </div>
                        <p className="text-gray-600 mt-1">{change.reason}</p>
                        <p className="text-gray-500 mt-0.5">— {change.changedByName}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Agent Assignment */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Přiřazení</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Přiřadit agentovi
                </label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte agenta..." />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name} ({agent.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleAssignAgent}
                disabled={!selectedAgent || assigning || selectedAgent === caseData.assignedTo}
                className="w-full"
              >
                {assigning ? 'Přiřazuji...' : 'Přiřadit'}
              </Button>

              {caseData.assignedToName && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-500">Aktuálně přiřazeno</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {caseData.assignedToName}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
