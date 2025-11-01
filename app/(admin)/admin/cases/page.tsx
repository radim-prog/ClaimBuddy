'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Case, User } from '@/types';
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, FileQuestion, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { CASE_STATUS_LABELS, CASE_STATUSES } from '@/lib/constants';
import { formatDate, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  in_progress: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  waiting_for_client: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
  waiting_for_insurance: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
  resolved: 'bg-green-100 text-green-800 hover:bg-green-200',
  closed: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
};

type SortField = 'createdAt' | 'claimAmount' | 'status';
type SortDirection = 'asc' | 'desc';

interface CaseWithUser extends Case {
  userName?: string;
  userEmail?: string;
}

export default function AdminCasesPage() {
  const router = useRouter();
  const [cases, setCases] = useState<CaseWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);

  const ITEMS_PER_PAGE = 25;

  useEffect(() => {
    fetchAgents();
    setupRealtimeListener();
  }, []);

  const fetchAgents = async () => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const agentsList = snapshot.docs
        .map(doc => {
          const data = doc.data() as User;
          return {
            id: doc.id,
            name: data.name || data.email,
          };
        })
        .filter(user => user.name);

      setAgents(agentsList);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const setupRealtimeListener = () => {
    try {
      setLoading(true);
      const casesRef = collection(db, 'cases');
      const q = query(casesRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const casesData = await Promise.all(
          snapshot.docs.map(async (caseDoc) => {
            const data = caseDoc.data();

            // Fetch user data
            let userName = 'Neznámý uživatel';
            let userEmail = '';

            if (data.userId) {
              try {
                const userDoc = await getDoc(doc(db, 'users', data.userId));
                if (userDoc.exists()) {
                  const userData = userDoc.data() as User;
                  userName = userData.name || userData.email;
                  userEmail = userData.email;
                }
              } catch (error) {
                console.error('Error fetching user:', error);
              }
            }

            return {
              id: caseDoc.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
              closedAt: data.closedAt?.toDate(),
              userName,
              userEmail,
            } as CaseWithUser;
          })
        );

        setCases(casesData);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up realtime listener:', error);
      setLoading(false);
    }
  };

  const filteredAndSortedCases = useMemo(() => {
    let filtered = [...cases];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.caseNumber.toLowerCase().includes(query) ||
          c.userName?.toLowerCase().includes(query) ||
          c.userEmail?.toLowerCase().includes(query) ||
          c.insuranceCompany.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    // Agent filter
    if (agentFilter !== 'all') {
      if (agentFilter === 'unassigned') {
        filtered = filtered.filter((c) => !c.assignedTo);
      } else {
        filtered = filtered.filter((c) => c.assignedTo === agentFilter);
      }
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'createdAt':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        case 'claimAmount':
          aValue = a.claimAmount;
          bValue = b.claimAmount;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [cases, searchQuery, statusFilter, agentFilter, sortField, sortDirection]);

  const paginatedCases = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredAndSortedCases.slice(startIndex, endIndex);
  }, [filteredAndSortedCases, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedCases.length / ITEMS_PER_PAGE);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-4 w-4" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-1 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-1 h-4 w-4" />
    );
  };

  const handleExportCSV = () => {
    const csvData = filteredAndSortedCases.map((c) => ({
      'Číslo případu': c.caseNumber,
      'Klient': c.userName || '',
      'Email': c.userEmail || '',
      'Pojišťovna': c.insuranceCompany,
      'Status': CASE_STATUS_LABELS[c.status],
      'Částka': c.claimAmount,
      'Datum vytvoření': formatDate(c.createdAt),
      'Přiřazeno': c.assignedToName || 'Nepřiřazeno',
    }));

    const headers = Object.keys(csvData[0]);
    const csv = '\uFEFF' + [
      headers.join(','),
      ...csvData.map((row) =>
        headers.map((h) => `"${row[h as keyof typeof row]}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cases-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setAgentFilter('all');
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="h-9 w-64" />
            <Skeleton className="mt-2 h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <Card className="p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        </Card>

        <Card>
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Správa případů</h1>
          <p className="mt-1 text-sm text-gray-500">
            Přehled všech případů v systému ({filteredAndSortedCases.length} z {cases.length})
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleExportCSV}
              variant="outline"
              disabled={filteredAndSortedCases.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Exportovat filtrované případy (číslo, klient, pojišťovna, status, částka, datum)
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Hledat podle čísla, klienta, pojišťovny..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
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

          <Select
            value={agentFilter}
            onValueChange={(value) => {
              setAgentFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Všichni agenti" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všichni agenti</SelectItem>
              <SelectItem value="unassigned">Nepřiřazeno</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(searchQuery || statusFilter !== 'all' || agentFilter !== 'all') && (
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <p className="text-sm text-gray-500">
              Aktivní filtry: {' '}
              {searchQuery && <span className="font-medium">Vyhledávání</span>}
              {searchQuery && (statusFilter !== 'all' || agentFilter !== 'all') && ', '}
              {statusFilter !== 'all' && <span className="font-medium">Status</span>}
              {statusFilter !== 'all' && agentFilter !== 'all' && ', '}
              {agentFilter !== 'all' && <span className="font-medium">Agent</span>}
            </p>
            <Button variant="ghost" size="sm" onClick={handleResetFilters}>
              Zrušit filtry
            </Button>
          </div>
        )}
      </Card>

      {/* Table */}
      {paginatedCases.length === 0 ? (
        <EmptyState
          icon={FileQuestion}
          title={cases.length === 0 ? "Žádné případy" : "Nic nenalezeno"}
          description={
            cases.length === 0
              ? "V systému zatím nejsou žádné případy"
              : "Zkuste upravit filtry nebo vyhledávání"
          }
        />
      ) : (
        <>
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Číslo případu</TableHead>
                    <TableHead>Klient</TableHead>
                    <TableHead>Pojišťovna</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead
                      className="cursor-pointer select-none hover:bg-gray-50"
                      onClick={() => handleSort('claimAmount')}
                      role="button"
                      tabIndex={0}
                      aria-label="Třídit podle částky"
                    >
                      <div className="flex items-center">
                        Částka
                        {getSortIcon('claimAmount')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none hover:bg-gray-50"
                      onClick={() => handleSort('createdAt')}
                      role="button"
                      tabIndex={0}
                      aria-label="Třídit podle data"
                    >
                      <div className="flex items-center">
                        Datum
                        {getSortIcon('createdAt')}
                      </div>
                    </TableHead>
                    <TableHead>Přiřazeno</TableHead>
                    <TableHead className="text-right">Akce</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCases.map((caseItem) => (
                    <TableRow
                      key={caseItem.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push(`/admin/cases/${caseItem.id}`)}
                    >
                      <TableCell className="font-medium">
                        <Link
                          href={`/admin/cases/${caseItem.id}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {caseItem.caseNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{caseItem.userName}</div>
                          <div className="text-sm text-gray-500">{caseItem.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>{caseItem.insuranceCompany}</TableCell>
                      <TableCell>
                        <Badge
                          className={STATUS_COLORS[caseItem.status] || 'bg-gray-100'}
                        >
                          {CASE_STATUS_LABELS[caseItem.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(caseItem.claimAmount)}
                      </TableCell>
                      <TableCell>{formatDate(caseItem.createdAt)}</TableCell>
                      <TableCell>
                        {caseItem.assignedToName ? (
                          <span className="text-sm">{caseItem.assignedToName}</span>
                        ) : (
                          <span className="text-sm text-gray-400">Nepřiřazeno</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/cases/${caseItem.id}`);
                          }}
                        >
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Stránka {currentPage} z {totalPages}
              </p>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>

                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    // Show first, last, current, and adjacent pages
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <PaginationItem key={page}>...</PaginationItem>;
                    }
                    return null;
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
      </div>
    </TooltipProvider>
  );
}
