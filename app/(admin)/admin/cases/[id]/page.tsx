'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Case } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingPage } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Save } from 'lucide-react';
import { CASE_STATUS_LABELS } from '@/lib/constants';

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  pending_client: 'bg-orange-100 text-orange-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function AdminCaseDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  useEffect(() => {
    fetchCase();
  }, [params.id]);

  const fetchCase = async () => {
    try {
      setLoading(true);
      const caseRef = doc(db, 'cases', params.id);
      const caseSnap = await getDoc(caseRef);

      if (!caseSnap.exists()) {
        router.push('/admin/cases');
        return;
      }

      const data = caseSnap.data();
      const caseItem: Case = {
        id: caseSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Case;

      setCaseData(caseItem);
      setNewStatus(caseItem.status);
      setInternalNotes(caseItem.internalNotes || '');
    } catch (error) {
      console.error('Error fetching case:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!caseData) return;

    try {
      setSaving(true);
      const caseRef = doc(db, 'cases', params.id);

      await updateDoc(caseRef, {
        status: newStatus,
        internalNotes,
        updatedAt: new Date(),
      });

      toast({
        title: 'Změny uloženy',
        description: 'Případ byl úspěšně aktualizován',
        variant: 'success',
      });

      fetchCase();
    } catch (error) {
      console.error('Error saving case:', error);
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se uložit změny',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingPage />;
  }

  if (!caseData) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.push('/admin/cases')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Zpět na seznam
      </Button>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">
            Případ #{caseData.caseNumber}
          </h1>
          <Badge className={STATUS_COLORS[caseData.status]}>
            {CASE_STATUS_LABELS[caseData.status]}
          </Badge>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Ukládání...' : 'Uložit změny'}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Informace o případu
          </h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-500">Klient ID</dt>
              <dd className="text-sm font-medium text-gray-900">
                {caseData.userId}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Popis</dt>
              <dd className="text-sm text-gray-900">
                {caseData.incidentDescription}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Částka</dt>
              <dd className="text-sm font-medium text-gray-900">
                {new Intl.NumberFormat('cs-CZ', {
                  style: 'currency',
                  currency: 'CZK',
                }).format(caseData.claimAmount)}
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Admin akce
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Změnit status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CASE_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Interní poznámky (jen pro admin)</Label>
              <Textarea
                id="notes"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={6}
                placeholder="Poznámky viditelné pouze pro admin..."
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
