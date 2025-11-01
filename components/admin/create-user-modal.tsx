'use client';

import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { UserRole, USER_ROLES } from '@/lib/constants';
import { Mail, Phone, User as UserIcon, Shield } from 'lucide-react';

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateUserModal({ open, onClose, onCreated }: CreateUserModalProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: USER_ROLES.AGENT as UserRole,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'Jméno musí mít alespoň 2 znaky';
    }

    if (!formData.email) {
      newErrors.email = 'Email je povinný';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Neplatný email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const token = await currentUser?.getIdToken();
      if (!token) {
        throw new Error('Unauthorized');
      }

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      toast({
        title: 'Úspěch',
        description: 'Uživatel byl vytvořen. Na email bude zaslána pozvánka.',
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: USER_ROLES.AGENT,
      });
      setErrors({});

      onCreated();
      onClose();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Chyba',
        description: error.message || 'Nepodařilo se vytvořit uživatele',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Přidat agenta / administrátora</DialogTitle>
          <DialogDescription>
            Vytvořte nového uživatele s přístupem k administraci. Na email bude zaslána
            pozvánka s přihlašovacími údaji.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              Jméno a příjmení
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Jan Novák"
              disabled={loading}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="jan.novak@claimbuddy.cz"
              disabled={loading}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Telefon (volitelné)
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+420 123 456 789"
              disabled={loading}
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Role
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleChange('role', value)}
              disabled={loading}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Vyberte roli" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={USER_ROLES.AGENT}>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Agent</span>
                    <span className="text-xs text-gray-500">
                      Může spravovat přiřazené případy
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value={USER_ROLES.ADMIN}>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Administrátor</span>
                    <span className="text-xs text-gray-500">
                      Plný přístup ke všemu
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Info box */}
          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
            <p className="font-medium">Poznámka:</p>
            <ul className="mt-1 list-inside list-disc space-y-1 text-xs">
              <li>Uživatel obdrží email s přihlašovacími údaji</li>
              <li>Při prvním přihlášení bude vyzván ke změně hesla</li>
              <li>Účet bude aktivní ihned po vytvoření</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
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
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? 'Vytvářím...' : 'Vytvořit uživatele'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
