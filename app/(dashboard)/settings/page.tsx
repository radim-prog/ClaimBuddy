'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { User, Bell, Shield, Trash2 } from 'lucide-react';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser as deleteAuthUser,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

interface UserSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
}

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  // Profile
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Notifications
  const [settings, setSettings] = useState<UserSettings>({
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
  });
  const [savingNotifications, setSavingNotifications] = useState(false);

  // Security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Delete account
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        setName(userData.name || '');
        setPhone(userData.phone || '');
        setAddress(userData.address || '');
      }

      // Fetch settings
      const settingsRef = doc(db, 'userSettings', user.uid);
      const settingsSnap = await getDoc(settingsRef);

      if (settingsSnap.exists()) {
        setSettings(settingsSnap.data() as UserSettings);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    if (!name.trim()) {
      toast({
        title: 'Chyba validace',
        description: 'Jméno je povinné',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSavingProfile(true);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name,
        phone,
        address,
        updatedAt: new Date(),
      });

      toast({
        title: 'Profil uložen',
        description: 'Vaše změny byly úspěšně uloženy',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se uložit změny. Zkuste to prosím znovu.',
        variant: 'destructive',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!user) return;

    try {
      setSavingNotifications(true);

      const settingsRef = doc(db, 'userSettings', user.uid);
      await updateDoc(settingsRef, {
        ...settings,
        updatedAt: new Date(),
      });

      toast({
        title: 'Nastavení uloženo',
        description: 'Vaše notifikační preference byly uloženy',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error saving notifications:', error);
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se uložit nastavení. Zkuste to prosím znovu.',
        variant: 'destructive',
      });
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user || !auth.currentUser) return;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: 'Chyba validace',
        description: 'Vyplňte prosím všechna pole',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Chyba validace',
        description: 'Nové heslo musí mít alespoň 8 znaků',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Chyba validace',
        description: 'Nová hesla se neshodují',
        variant: 'destructive',
      });
      return;
    }

    try {
      setChangingPassword(true);

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Change password
      await updatePassword(auth.currentUser, newPassword);

      toast({
        title: 'Heslo změněno',
        description: 'Vaše heslo bylo úspěšně změněno',
        variant: 'success',
      });

      // Clear fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);

      let message = 'Nepodařilo se změnit heslo. Zkuste to prosím znovu.';
      if (error.code === 'auth/wrong-password') {
        message = 'Současné heslo je nesprávné';
      }

      toast({
        title: 'Chyba',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !auth.currentUser) return;

    if (!deletePassword) {
      toast({
        title: 'Chyba validace',
        description: 'Zadejte prosím své heslo pro potvrzení',
        variant: 'destructive',
      });
      return;
    }

    try {
      setDeleting(true);

      // Re-authenticate
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        deletePassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Delete user data from Firestore
      const userRef = doc(db, 'users', user.uid);
      await deleteDoc(userRef);

      // Delete auth account
      await deleteAuthUser(auth.currentUser);

      toast({
        title: 'Účet smazán',
        description: 'Váš účet byl trvale smazán',
        variant: 'success',
      });

      // Sign out will happen automatically
    } catch (error: any) {
      console.error('Error deleting account:', error);

      let message = 'Nepodařilo se smazat účet. Zkuste to prosím znovu.';
      if (error.code === 'auth/wrong-password') {
        message = 'Heslo je nesprávné';
      }

      toast({
        title: 'Chyba',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Nastavení</h1>
        <p className="mt-1 text-sm text-gray-500">
          Spravujte svůj profil a předvolby
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifikace
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" />
            Zabezpečení
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Osobní informace
                </h2>
                <p className="text-sm text-gray-500">
                  Aktualizujte své osobní údaje
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Jméno a příjmení <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jan Novák"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">
                    Email nelze změnit
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+420 123 456 789"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresa</Label>
                  <Textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ulice 123, 110 00 Praha 1"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={savingProfile}>
                  {savingProfile ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Ukládání...
                    </>
                  ) : (
                    'Uložit změny'
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Notifikační předvolby
                </h2>
                <p className="text-sm text-gray-500">
                  Vyberte jak chcete dostávat notifikace
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">
                      Emailové notifikace
                    </Label>
                    <p className="text-sm text-gray-500">
                      Dostávejte aktualizace na email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, emailNotifications: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sms-notifications">SMS notifikace</Label>
                    <p className="text-sm text-gray-500">
                      Dostávejte důležité zprávy přes SMS
                    </p>
                  </div>
                  <Switch
                    id="sms-notifications"
                    checked={settings.smsNotifications}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, smsNotifications: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="marketing-emails">Marketingové emaily</Label>
                    <p className="text-sm text-gray-500">
                      Dostávejte tipy a nabídky
                    </p>
                  </div>
                  <Switch
                    id="marketing-emails"
                    checked={settings.marketingEmails}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, marketingEmails: checked })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveNotifications}
                  disabled={savingNotifications}
                >
                  {savingNotifications ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Ukládání...
                    </>
                  ) : (
                    'Uložit nastavení'
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="space-y-6">
            {/* Change Password */}
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Změna hesla
                  </h2>
                  <p className="text-sm text-gray-500">
                    Aktualizujte své heslo
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Současné heslo</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nové heslo</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      Heslo musí mít alespoň 8 znaků
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">
                      Potvrzení nového hesla
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleChangePassword}
                    disabled={changingPassword}
                  >
                    {changingPassword ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Měním heslo...
                      </>
                    ) : (
                      'Změnit heslo'
                    )}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Delete Account */}
            <Card className="border-red-200 p-6">
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-red-600">
                    Smazat účet
                  </h2>
                  <p className="text-sm text-gray-500">
                    Trvale smazat váš účet a všechna data. Tato akce je nevratná.
                  </p>
                </div>

                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Smazat účet
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Smazat účet</DialogTitle>
            <DialogDescription>
              Opravdu chcete trvale smazat svůj účet? Tato akce je nevratná a
              všechna vaše data budou ztracena.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="delete-password">
              Zadejte své heslo pro potvrzení
            </Label>
            <Input
              id="delete-password"
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Vaše heslo"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeletePassword('');
              }}
              disabled={deleting}
            >
              Zrušit
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Mazání...
                </>
              ) : (
                'Smazat účet'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
