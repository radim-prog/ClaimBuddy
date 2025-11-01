'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
import { Search, FileQuestion, Download } from 'lucide-react';
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

export default function AdminCasesPage() {
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchCases();
  }, []);

  useEffect(() => {
    filterCases();
  }, [cases, searchQuery, statusFilter]);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const casesRef = collection(db, 'cases');
      const q = query(casesRef, orderBy('createdAt', 'desc'));

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

    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.incidentDescription.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    setFilteredCases(filtered);
  };

  const handleRowClick = (caseId: string) => {
    router.push(`/admin/cases/${caseId}`);
  };

  const handleExportCSV = () => {
    const csvData = filteredCases.map((c) => ({
      'Číslo případu': c.caseNumber,
      Status: CASE_STATUS_LABELS[c.status],
      'Typ pojištění': INSURANCE_TYPE_LABELS[c.insuranceType],
      Pojišťovna: c.insuranceCompany,
      'Částka (Kč)': c.claimAmount,
      Vytvořeno: format(new Date(c.createdAt), 'dd.MM.yyyy'),
    }));

    const headers = Object.keys(csvData[0]);
    const csv = [
      headers.join(','),
      ...csvData.map((row) =>
        headers.map((h) => `"${row[h as keyof typeof row]}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cases-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Správa případů</h1>
          <p className="mt-1 text-sm text-gray-500">
            Přehled všech případů v systému
          </p>
        </div>
        <Button onClick={handleExportCSV} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Hledat podle čísla, popisu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

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
        </div>
      </Card>

      {filteredCases.length === 0 ? (
        <EmptyState
          icon={FileQuestion}
          title="Žádné případy"
          description="V systému zatím nejsou žádné případy"
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Číslo případu</TableHead>
                  <TableHead>Klient</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Pojišťovna</TableHead>
                  <TableHead>Částka</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Datum</TableHead>
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
                    <TableCell>{caseItem.userId.substring(0, 8)}...</TableCell>
                    <TableCell>
                      {INSURANCE_TYPE_LABELS[caseItem.insuranceType]}
                    </TableCell>
                    <TableCell>{caseItem.insuranceCompany}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('cs-CZ', {
                        style: 'currency',
                        currency: 'CZK',
                        maximumFractionDigits: 0,
                      }).format(caseItem.claimAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          STATUS_COLORS[caseItem.status] || 'bg-gray-100'
                        }
                      >
                        {CASE_STATUS_LABELS[caseItem.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(caseItem.createdAt), 'dd.MM.yyyy', {
                        locale: cs,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {filteredCases.length > 0 && (
        <div className="text-sm text-gray-500">
          Zobrazeno {filteredCases.length} z {cases.length} případů
        </div>
      )}
    </div>
  );
}
