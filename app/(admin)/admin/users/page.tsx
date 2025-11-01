'use client';

import { useState, useEffect, useMemo } from 'react';
import { User } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingPage } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar } from '@/components/ui/avatar';
import { EditUserModal } from '@/components/admin/edit-user-modal';
import { CreateUserModal } from '@/components/admin/create-user-modal';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/use-toast';
import {
  Search,
  Users as UsersIcon,
  UserPlus,
  Edit,
  CheckCircle,
  XCircle,
  Download,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { USER_ROLES, UserRole } from '@/lib/constants';

type UserWithStats = User & {
  status?: string;
  casesCount?: number;
};

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const [editingUser, setEditingUser] = useState<UserWithStats | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const token = await currentUser?.getIdToken();
      if (!token) {
        throw new Error('Unauthorized');
      }

      const response = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se načíst uživatele',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((u) => (u.status || 'active') === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name?.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [users, searchQuery, roleFilter, statusFilter]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(filteredUsers.map((u) => u.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleBulkDeactivate = async () => {
    if (selectedUsers.size === 0) return;

    if (
      !confirm(
        `Opravdu chcete deaktivovat ${selectedUsers.size} uživatelů?`
      )
    ) {
      return;
    }

    try {
      const token = await currentUser?.getIdToken();
      if (!token) throw new Error('Unauthorized');

      let successCount = 0;
      let errorCount = 0;

      for (const userId of selectedUsers) {
        try {
          const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch {
          errorCount++;
        }
      }

      toast({
        title: 'Hotovo',
        description: `Deaktivováno: ${successCount}, Chyby: ${errorCount}`,
      });

      setSelectedUsers(new Set());
      await fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Chyba',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleBulkRoleChange = async (newRole: UserRole) => {
    if (selectedUsers.size === 0) return;

    if (
      !confirm(
        `Opravdu chcete změnit roli ${selectedUsers.size} uživatelům na "${newRole}"?`
      )
    ) {
      return;
    }

    try {
      const token = await currentUser?.getIdToken();
      if (!token) throw new Error('Unauthorized');

      let successCount = 0;
      let errorCount = 0;

      for (const userId of selectedUsers) {
        try {
          const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ role: newRole }),
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch {
          errorCount++;
        }
      }

      toast({
        title: 'Hotovo',
        description: `Upraveno: ${successCount}, Chyby: ${errorCount}`,
      });

      setSelectedUsers(new Set());
      await fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Chyba',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleExportCSV = () => {
    const csvData = filteredUsers.map((u) => ({
      Jméno: u.name || '',
      Email: u.email,
      Role: u.role,
      Telefon: u.phone || '',
      Stav: u.status || 'active',
      Případy: u.casesCount || 0,
      Registrace: format(new Date(u.createdAt), 'dd.MM.yyyy', { locale: cs }),
    }));

    const headers = Object.keys(csvData[0] || {});
    const csv = [
      headers.join(','),
      ...csvData.map((row) =>
        headers.map((header) => `"${row[header as keyof typeof row]}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return 'default';
      case USER_ROLES.AGENT:
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return 'Admin';
      case USER_ROLES.AGENT:
        return 'Agent';
      case USER_ROLES.CLIENT:
        return 'Klient';
      default:
        return role;
    }
  };

  if (loading) {
    return <LoadingPage />;
  }

  const allSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((u) => selectedUsers.has(u.id));
  const someSelected =
    selectedUsers.size > 0 &&
    filteredUsers.some((u) => selectedUsers.has(u.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Správa uživatelů</h1>
          <p className="mt-1 text-sm text-gray-500">
            Přehled všech uživatelů v systému ({users.length})
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Přidat agenta
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Hledat podle jména nebo emailu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Role Filter */}
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger>
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filtrovat podle role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všechny role</SelectItem>
              <SelectItem value={USER_ROLES.CLIENT}>Klient</SelectItem>
              <SelectItem value={USER_ROLES.AGENT}>Agent</SelectItem>
              <SelectItem value={USER_ROLES.ADMIN}>Admin</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filtrovat podle stavu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všechny stavy</SelectItem>
              <SelectItem value="active">Aktivní</SelectItem>
              <SelectItem value="inactive">Neaktivní</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedUsers.size > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Vybráno: {selectedUsers.size} uživatelů
            </span>
            <div className="flex gap-2">
              <Select onValueChange={handleBulkRoleChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Změnit roli..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={USER_ROLES.CLIENT}>
                    Změnit na Klient
                  </SelectItem>
                  <SelectItem value={USER_ROLES.AGENT}>
                    Změnit na Agent
                  </SelectItem>
                  <SelectItem value={USER_ROLES.ADMIN}>
                    Změnit na Admin
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDeactivate}
              >
                Deaktivovat vybrané
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Table */}
      {filteredUsers.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="Žádní uživatelé"
          description={
            searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
              ? 'Žádní uživatelé neodpovídají zadaným filtrům'
              : 'V systému zatím nejsou žádní registrovaní uživatelé'
          }
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Vybrat vše"
                    />
                  </TableHead>
                  <TableHead>Uživatel</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Registrace</TableHead>
                  <TableHead>Případy</TableHead>
                  <TableHead>Stav</TableHead>
                  <TableHead className="text-right">Akce</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const isSelected = selectedUsers.has(user.id);
                  const userStatus = user.status || 'active';

                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            handleSelectUser(user.id, checked as boolean)
                          }
                          aria-label={`Vybrat ${user.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={user.photoURL}
                            alt={user.name}
                            fallback={
                              user.name
                                ?.split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase() || user.email[0].toUpperCase()
                            }
                          />
                          <span className="font-medium">
                            {user.name || 'Bez jména'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {user.phone || '-'}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {format(new Date(user.createdAt), 'dd.MM.yyyy', {
                          locale: cs,
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.casesCount || 0}</Badge>
                      </TableCell>
                      <TableCell>
                        {userStatus === 'active' ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Aktivní</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-red-600">
                            <XCircle className="h-4 w-4" />
                            <span className="text-sm">Neaktivní</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Stats */}
      {filteredUsers.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Zobrazeno {filteredUsers.length} z {users.length} uživatelů
          </span>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exportovat tabulku
          </Button>
        </div>
      )}

      {/* Modals */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          open={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={() => {
            setEditingUser(null);
            fetchUsers();
          }}
        />
      )}

      <CreateUserModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => {
          setShowCreateModal(false);
          fetchUsers();
        }}
      />
    </div>
  );
}
