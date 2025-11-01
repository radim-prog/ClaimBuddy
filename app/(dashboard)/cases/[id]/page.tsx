'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/providers/auth-provider';
import { Case, CaseTimeline } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { LoadingPage } from '@/components/ui/spinner';
import { CaseTimeline as TimelineComponent } from '@/components/cases/case-timeline';
import { CaseMessages } from '@/components/cases/case-messages';
import { CaseDocuments } from '@/components/cases/case-documents';
import { CaseAIAssistant } from '@/components/cases/case-ai-assistant';
import { ArrowLeft, Calendar, DollarSign, Building2, FileText } from 'lucide-react';
import { CASE_STATUS_LABELS, INSURANCE_TYPE_LABELS } from '@/lib/constants';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  pending_client: 'bg-orange-100 text-orange-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function CaseDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [timeline, setTimeline] = useState<CaseTimeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetchCaseData();
  }, [user, params.id, refreshKey]);

  const fetchCaseData = async () => {
    try {
      setLoading(true);

      // Fetch case
      const caseRef = doc(db, 'cases', params.id);
      const caseSnap = await getDoc(caseRef);

      if (!caseSnap.exists()) {
        router.push('/dashboard/cases');
        return;
      }

      const caseDataRaw = caseSnap.data();

      // Check if user owns this case
      if (caseDataRaw.userId !== user?.uid) {
        router.push('/dashboard/cases');
        return;
      }

      const caseItem: Case = {
        id: caseSnap.id,
        ...caseDataRaw,
        createdAt: caseDataRaw.createdAt?.toDate() || new Date(),
        updatedAt: caseDataRaw.updatedAt?.toDate() || new Date(),
        closedAt: caseDataRaw.closedAt?.toDate(),
      } as Case;

      setCaseData(caseItem);

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
    } catch (error) {
      console.error('Error fetching case:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (loading) {
    return <LoadingPage />;
  }

  if (!caseData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.push('/dashboard/cases')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Zpět na seznam
      </Button>

      {/* Header */}
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
      </div>

      {/* Grid Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Case Info Card */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Informace o případu
            </h2>
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
            </div>
          </Card>

          {/* Timeline */}
          <Card className="p-6">
            <TimelineComponent timeline={timeline} />
          </Card>

          {/* Messages */}
          <Card className="p-6">
            <CaseMessages caseId={params.id} />
          </Card>
        </div>

        {/* Right Column - Documents & AI */}
        <div className="space-y-6">
          {/* Documents */}
          <Card className="p-6">
            <CaseDocuments
              caseId={params.id}
              documents={caseData.documents || []}
              onDocumentAdded={handleRefresh}
            />
          </Card>

          {/* AI Assistant */}
          <CaseAIAssistant caseId={params.id} />
        </div>
      </div>
    </div>
  );
}
