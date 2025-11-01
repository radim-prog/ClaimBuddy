'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { LoadingPage } from '@/components/ui/spinner';
import {
  FileText,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  CheckCircle,
} from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DashboardStats } from '@/types';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // In production, this would be a single API call
      // For now, we'll calculate from Firestore
      const casesRef = collection(db, 'cases');
      const casesSnap = await getDocs(casesRef);

      const cases = casesSnap.docs.map((doc: any) => doc.data());

      const totalCases = cases.length;
      const activeCases = cases.filter((c) =>
        ['new', 'in_progress', 'pending_client'].includes(c.status)
      ).length;
      const resolvedCases = cases.filter((c) => c.status === 'resolved').length;

      // Mock revenue calculation (15% of resolved cases)
      const totalRevenue = cases
        .filter((c) => c.status === 'resolved')
        .reduce((sum, c) => sum + c.claimAmount * 0.15, 0);

      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const casesThisMonth = cases.filter((c) => {
        const created = c.createdAt?.toDate?.() || new Date(c.createdAt);
        return created >= thisMonth;
      }).length;

      const revenueThisMonth = cases
        .filter((c) => {
          const created = c.createdAt?.toDate?.() || new Date(c.createdAt);
          return created >= thisMonth && c.status === 'resolved';
        })
        .reduce((sum, c) => sum + c.claimAmount * 0.15, 0);

      setStats({
        totalCases,
        activeCases,
        resolvedCases,
        pendingPayments: 0,
        totalRevenue,
        avgResolutionTime: 14,
        casesThisMonth,
        revenueThisMonth,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingPage />;
  }

  const statCards = [
    {
      name: 'Celkem případů',
      value: stats?.totalCases || 0,
      icon: FileText,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      name: 'Aktivní případy',
      value: stats?.activeCases || 0,
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      name: 'Vyřešené případy',
      value: stats?.resolvedCases || 0,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600',
    },
    {
      name: 'Příjem tento měsíc',
      value: new Intl.NumberFormat('cs-CZ', {
        style: 'currency',
        currency: 'CZK',
        maximumFractionDigits: 0,
      }).format(stats?.revenueThisMonth || 0),
      icon: DollarSign,
      color: 'bg-purple-100 text-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Přehled</h1>
        <p className="mt-1 text-sm text-gray-500">
          Statistiky a přehledy celého systému
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.name}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className={`rounded-lg p-3 ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Rychlé statistiky
          </h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Celkový příjem</dt>
              <dd className="text-sm font-medium text-gray-900">
                {new Intl.NumberFormat('cs-CZ', {
                  style: 'currency',
                  currency: 'CZK',
                  maximumFractionDigits: 0,
                }).format(stats?.totalRevenue || 0)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">
                Průměrná doba vyřízení
              </dt>
              <dd className="text-sm font-medium text-gray-900">
                {stats?.avgResolutionTime || 0} dní
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Případy tento měsíc</dt>
              <dd className="text-sm font-medium text-gray-900">
                {stats?.casesThisMonth || 0}
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Rychlé akce
          </h3>
          <div className="space-y-2">
            <a
              href="/admin/cases"
              className="block rounded-lg border p-3 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">
                  Spravovat případy
                </span>
              </div>
            </a>
            <a
              href="/admin/users"
              className="block rounded-lg border p-3 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">
                  Spravovat uživatele
                </span>
              </div>
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
