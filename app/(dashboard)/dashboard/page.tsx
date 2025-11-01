'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Clock, CheckCircle, Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getCases } from '@/lib/firebase/firestore';
import { Case } from '@/types';
import { CASE_STATUS_LABELS, CASE_STATUSES } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { WelcomeWizard } from '@/components/welcome-wizard';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

export default function DashboardPage() {
  const { user, userData } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWelcomeWizard, setShowWelcomeWizard] = useState(false);

  useEffect(() => {
    if (user) {
      loadCases();
      checkWelcomeWizard();
    }
  }, [user]);

  const checkWelcomeWizard = async () => {
    if (!user) return;

    try {
      const settingsRef = doc(db, 'userSettings', user.uid);
      const settingsSnap = await getDoc(settingsRef);

      if (!settingsSnap.exists() || !settingsSnap.data()?.hasSeenWelcomeWizard) {
        setShowWelcomeWizard(true);
      }
    } catch (error) {
      console.error('Error checking welcome wizard:', error);
    }
  };

  const handleWelcomeComplete = async () => {
    if (!user) return;

    try {
      const settingsRef = doc(db, 'userSettings', user.uid);
      await setDoc(
        settingsRef,
        {
          userId: user.uid,
          hasSeenWelcomeWizard: true,
          updatedAt: new Date(),
        },
        { merge: true }
      );
      setShowWelcomeWizard(false);
    } catch (error) {
      console.error('Error saving welcome wizard state:', error);
    }
  };

  const loadCases = async () => {
    if (!user) return;
    const { cases: fetchedCases } = await getCases(user.uid, { limitCount: 5 });
    setCases(fetchedCases);
    setLoading(false);
  };

  const activeCases = cases.filter(
    (c) => c.status !== CASE_STATUSES.CLOSED && c.status !== CASE_STATUSES.RESOLVED
  );
  const resolvedCases = cases.filter((c) => c.status === CASE_STATUSES.RESOLVED);

  return (
    <>
      {showWelcomeWizard && (
        <WelcomeWizard
          onComplete={handleWelcomeComplete}
          onSkip={handleWelcomeComplete}
        />
      )}

    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Vítejte zpět, {userData?.name?.split(' ')[0]}!</h1>
        <p className="text-muted-foreground mt-2">Přehled vašich pojistných událostí</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{cases.length}</p>
              <p className="text-sm text-muted-foreground">Celkem případů</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeCases.length}</p>
              <p className="text-sm text-muted-foreground">Aktivní případy</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{resolvedCases.length}</p>
              <p className="text-sm text-muted-foreground">Vyřešené případy</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Action */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">Máte novou pojistnou událost?</h3>
            <p className="text-sm text-muted-foreground">
              Vytvořte nový případ a my vám pomůžeme ho vyřídit
            </p>
          </div>
          <Link href="/dashboard/cases/new">
            <Button size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Nový případ
            </Button>
          </Link>
        </div>
      </Card>

      {/* Recent Cases */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Nedávné případy</h2>
          <Link href="/dashboard/cases">
            <Button variant="ghost">Zobrazit vše</Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p>Načítání případů...</p>
          </div>
        ) : cases.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Zatím nemáte žádné případy</h3>
            <p className="text-muted-foreground mb-6">
              Vytvořte svůj první případ a začněte vyřizovat pojistnou událost
            </p>
            <Link href="/dashboard/cases/new">
              <Button>
                <Plus className="h-5 w-5 mr-2" />
                Vytvořit první případ
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {cases.slice(0, 5).map((caseItem) => (
              <Link key={caseItem.id} href={`/dashboard/cases/${caseItem.id}`}>
                <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{caseItem.caseNumber}</h3>
                        <Badge variant="outline">{caseItem.insuranceCompany}</Badge>
                        <Badge variant={caseItem.status === CASE_STATUSES.RESOLVED ? 'success' : 'warning'}>
                          {CASE_STATUS_LABELS[caseItem.status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {caseItem.incidentDescription}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span>📅 {formatDate(caseItem.incidentDate)}</span>
                        <span>📍 {caseItem.incidentLocation}</span>
                        <span>💰 {caseItem.claimAmount.toLocaleString('cs-CZ')} Kč</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
