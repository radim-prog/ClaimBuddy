'use client';

import { useState } from 'react';
import { User } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { UserRole, USER_ROLES } from '@/lib/constants';
import { AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

interface EditUserModalProps {
  user: User & { status?: string; casesCount?: number };
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function EditUserModal({ user, open, onClose, onSaved }: EditUserModalProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<UserRole>(user.role);
  const [status, setStatus] = useState<'active' | 'inactive'>(
    (user.status as 'active' | 'inactive') || 'active'
  );

  const isOwnAccount = currentUser?.uid === user.id;

  const handleSave = async () => {
    try {
      setLoading(true);

      const token = await currentUser?.getIdToken();
      if (!token) {
        throw new Error('Unauthorized');
      }

      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user');
      }

      toast({
        title: 'Úspěch',
        description: 'Uživatel byl aktualizován',
      });

      onSaved();
      onClose();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: 'Chyba',
        description: error.message || 'Nepodařilo se aktualizovat uživatele',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('Opravdu chcete deaktivovat tohoto uživatele?')) {
      return;
    }

    try {
      setLoading(true);

      const token = await currentUser?.getIdToken();
      if (!token) {
        throw new Error('Unauthorized');
      }

      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to deactivate user');
      }

      toast({
        title: 'Úspěch',
        description: 'Uživatel byl deaktivován',
      });

      if (data.assignedCasesCount > 0) {
        toast({
          title: 'Upozornění',
          description: `Uživatel měl ${data.assignedCasesCount} přiřazených případů`,
          variant: 'default',
        });
      }

      onSaved();
      onClose();
    } catch (error: any) {
      console.error('Error deactivating user:', error);
      toast({
        title: 'Chyba',
        description: error.message || 'Nepodařilo se deaktivovat uživatele',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = role !== user.role || status !== (user.status || 'active');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upravit uživatele</DialogTitle>
          <DialogDescription>
            Změna role a stavu uživatele {user.name || user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isOwnAccount && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nemůžete upravovat vlastní účet
              </AlertDescription>
            </Alert>
          )}

          {/* User Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Email:</span>
              <span className="text-sm font-medium">{user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Jméno:</span>
              <span className="text-sm font-medium">{user.name || '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Případy:</span>
              <span className="text-sm font-medium">{user.casesCount || 0}</span>
            </div>
          </div>

          {/* Role Select */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as UserRole)}
              disabled={isOwnAccount || loading}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Vyberte roli" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={USER_ROLES.CLIENT}>Klient</SelectItem>
                <SelectItem value={USER_ROLES.AGENT}>Agent</SelectItem>
                <SelectItem value={USER_ROLES.ADMIN}>Administrátor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Select */}
          <div className="space-y-2">
            <Label htmlFor="status">Stav</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as 'active' | 'inactive')}
              disabled={isOwnAccount || loading}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Vyberte stav" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Aktivní
                  </div>
                </SelectItem>
                <SelectItem value="inactive">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    Neaktivní
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Cases Link */}
          {user.casesCount && user.casesCount > 0 && (
            <Link
              href={`/admin/cases?userId=${user.id}`}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="h-4 w-4" />
              Zobrazit případy uživatele ({user.casesCount})
            </Link>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            {!isOwnAccount && status === 'active' && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeactivate}
                disabled={loading}
                size="sm"
              >
                Deaktivovat
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Zrušit
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isOwnAccount || !hasChanges || loading}
            >
              {loading ? 'Ukládám...' : 'Uložit změny'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
