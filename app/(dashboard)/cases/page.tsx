'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/providers/auth-provider';
import { Case } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingPage } from '@/components/ui/spinner';
import { Plus, Search, FileQuestion, Calendar, Filter } from 'lucide-react';
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

export default function CasesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    if (!user) return;
    fetchCases();
  }, [user]);

  useEffect(() => {
    filterCases();
  }, [cases, searchQuery, statusFilter, typeFilter]);

  const fetchCases = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const casesRef = collection(db, 'cases');
      const q = query(
        casesRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const casesData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          closedAt: data.closedAt?.toDate(),
        } as Case;
      });

      setCases(casesData);
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCases = () => {
    let filtered = [...cases];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.incidentDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.insuranceCompany.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((c) => c.insuranceType === typeFilter);
    }

    setFilteredCases(filtered);
  };

  const handleRowClick = (caseId: string) => {
    router.push(`/dashboard/cases/${caseId}`);
  };

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Moje případy</h1>
          <p className="mt-1 text-sm text-gray-500">
            Přehled všech vašich pojistných událostí
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/cases/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Nový případ
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Hledat podle čísla, popisu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Všechny statusy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všechny statusy</SelectItem>
              {Object.entries(CASE_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Type filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Všechny typy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všechny typy</SelectItem>
              {Object.entries(INSURANCE_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Cases Table / Empty State */}
      {filteredCases.length === 0 ? (
        <EmptyState
          icon={FileQuestion}
          title={cases.length === 0 ? 'Zatím nemáte žádné případy' : 'Žádné výsledky'}
          description={
            cases.length === 0
              ? 'Vytvořte svůj první případ pomocí tlačítka "Nový případ"'
              : 'Zkuste změnit filtry nebo vyhledávací dotaz'
          }
          action={
            cases.length === 0
              ? {
                  label: 'Vytvořit případ',
                  onClick: () => router.push('/dashboard/cases/new'),
                }
              : undefined
          }
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Číslo případu</TableHead>
                  <TableHead>Typ pojištění</TableHead>
                  <TableHead>Pojišťovna</TableHead>
                  <TableHead>Datum události</TableHead>
                  <TableHead>Částka</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((caseItem) => (
                  <TableRow
                    key={caseItem.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleRowClick(caseItem.id)}
                  >
                    <TableCell className="font-medium">
                      {caseItem.caseNumber}
                    </TableCell>
                    <TableCell>
                      {INSURANCE_TYPE_LABELS[caseItem.insuranceType]}
                    </TableCell>
                    <TableCell>{caseItem.insuranceCompany}</TableCell>
                    <TableCell>
                      {format(new Date(caseItem.incidentDate), 'dd. MM. yyyy', {
                        locale: cs,
                      })}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('cs-CZ', {
                        style: 'currency',
                        currency: 'CZK',
                        maximumFractionDigits: 0,
                      }).format(caseItem.claimAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={STATUS_COLORS[caseItem.status] || 'bg-gray-100'}
                      >
                        {CASE_STATUS_LABELS[caseItem.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Summary */}
      {filteredCases.length > 0 && (
        <div className="text-sm text-gray-500">
          Zobrazeno {filteredCases.length} z {cases.length} případů
        </div>
      )}
    </div>
  );
}
