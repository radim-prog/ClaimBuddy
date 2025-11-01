'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { LoadingPage } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle,
  Download,
  Calendar,
  Activity,
  Award,
  AlertCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getAnalyticsData, DATE_RANGES, AnalyticsData } from '@/lib/analytics';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

export default function AdminDashboardPage() {
  const [dateRange, setDateRange] = useState('30d');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await getAnalyticsData(dateRange);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!analyticsData) return;

    // Prepare CSV data
    const csvRows = [
      ['ClaimBuddy Analytics Report'],
      ['Generated:', new Date().toLocaleString('cs-CZ')],
      ['Date Range:', DATE_RANGES.find((r) => r.value === dateRange)?.label],
      [''],
      ['STATISTICS'],
      ['Total Cases', analyticsData.stats.totalCases],
      ['Active Cases', analyticsData.stats.activeCases],
      ['Resolved Cases', analyticsData.stats.resolvedCases],
      [
        'Total Revenue',
        new Intl.NumberFormat('cs-CZ', {
          style: 'currency',
          currency: 'CZK',
        }).format(analyticsData.stats.totalRevenue),
      ],
      ['Avg Resolution Time', `${analyticsData.stats.avgResolutionTime} days`],
      ['Conversion Rate', `${analyticsData.stats.conversionRate}%`],
      [''],
      ['TOP AGENTS'],
      ['Name', 'Resolved Cases', 'Avg Resolution Time', 'Rating'],
      ...analyticsData.topLists.topAgents.map((agent) => [
        agent.name,
        agent.resolvedCases,
        `${agent.avgResolutionTime} days`,
        agent.rating,
      ]),
      [''],
      ['HIGH VALUE CASES'],
      ['Case Number', 'Claim Amount', 'Status', 'Assigned To'],
      ...analyticsData.topLists.highValueCases.map((c) => [
        c.caseNumber,
        new Intl.NumberFormat('cs-CZ', {
          style: 'currency',
          currency: 'CZK',
        }).format(c.claimAmount),
        c.status,
        c.assignedTo || 'Unassigned',
      ]),
    ];

    const csvContent = csvRows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `claimbuddy-analytics-${dateRange}-${format(
      new Date(),
      'yyyy-MM-dd'
    )}.csv`;
    link.click();
  };

  if (loading) {
    return <LoadingPage />;
  }

  if (!analyticsData) {
    return <div>Chyba při načítání dat</div>;
  }

  const { stats, charts, topLists } = analyticsData;

  const statCards = [
    {
      name: 'Celkem případů',
      value: stats.totalCases,
      icon: FileText,
      color: 'bg-blue-100 text-blue-600',
      trend: stats.trends.casesChange,
      subtitle: `${stats.trends.casesChange.isPositive ? '+' : ''}${Math.round(stats.trends.casesChange.value)} vs minulé období`,
    },
    {
      name: 'Aktivní případy',
      value: stats.activeCases,
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-600',
      subtitle: `Průměrná doba: ${stats.avgResolutionTime} dní`,
    },
    {
      name: 'Vyřešené případy',
      value: stats.resolvedCases,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600',
      subtitle: `Success rate: ${stats.conversionRate}%`,
    },
    {
      name: 'Celkový příjem',
      value: new Intl.NumberFormat('cs-CZ', {
        style: 'currency',
        currency: 'CZK',
        maximumFractionDigits: 0,
      }).format(stats.totalRevenue),
      icon: DollarSign,
      color: 'bg-purple-100 text-purple-600',
      trend: stats.trends.revenueChange,
      subtitle: `${stats.trends.revenueChange.isPositive ? '+' : ''}${new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(stats.trends.revenueChange.value)} vs minulé období`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Komplexní přehled výkonnosti a statistik
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const hasTrend = stat.trend !== undefined;
          return (
            <Card key={stat.name} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    {stat.name}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    {hasTrend && (
                      <>
                        {stat.trend.isPositive ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <span
                          className={`text-xs font-medium ${
                            stat.trend.isPositive
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {stat.trend.percentage.toFixed(1)}%
                        </span>
                      </>
                    )}
                  </div>
                  {stat.subtitle && (
                    <p className="mt-1 text-xs text-gray-500">
                      {stat.subtitle}
                    </p>
                  )}
                </div>
                <div className={`rounded-lg p-3 ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cases Over Time - Line Chart */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Vývoj případů v čase
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={charts.casesOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="created"
                stroke="#3B82F6"
                name="Vytvořené"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="resolved"
                stroke="#10B981"
                name="Vyřešené"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="active"
                stroke="#F59E0B"
                name="Aktivní"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Revenue Over Time - Area Chart */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Vývoj příjmů
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={charts.revenueOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value: number) =>
                  new Intl.NumberFormat('cs-CZ', {
                    style: 'currency',
                    currency: 'CZK',
                    maximumFractionDigits: 0,
                  }).format(value)
                }
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#8B5CF6"
                fill="#8B5CF6"
                fillOpacity={0.6}
                name="Příjem (Kč)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Cases by Status - Pie Chart */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Případy podle statusu
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={charts.casesByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {charts.casesByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Cases by Insurance Company - Bar Chart */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Top 10 pojišťoven
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={charts.casesByInsurance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="company" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" name="Počet případů" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Agent Performance - Full Width Bar Chart */}
      {charts.agentPerformance.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Výkonnost agentů
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={charts.agentPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="resolved"
                fill="#10B981"
                name="Vyřešené případy"
              />
              <Bar
                yAxisId="right"
                dataKey="avgTime"
                fill="#F59E0B"
                name="Průměrná doba (dny)"
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Top Lists */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Agents */}
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Top Agenti
            </h3>
          </div>
          <div className="space-y-4">
            {topLists.topAgents.length === 0 ? (
              <p className="text-sm text-gray-500">Zatím žádní agenti</p>
            ) : (
              topLists.topAgents.map((agent, index) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{agent.name}</p>
                      <p className="text-xs text-gray-500">
                        {agent.resolvedCases} případů •{' '}
                        {agent.avgResolutionTime} dní
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-yellow-600">
                      {agent.rating}
                    </span>
                    <Award className="h-4 w-4 text-yellow-500" />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Nedávná aktivita
            </h3>
          </div>
          <div className="space-y-3">
            {topLists.recentActivity.length === 0 ? (
              <p className="text-sm text-gray-500">Zatím žádná aktivita</p>
            ) : (
              topLists.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="border-l-2 border-blue-200 pl-3"
                >
                  <div className="flex items-start gap-2">
                    {activity.type === 'case_created' ? (
                      <FileText className="mt-0.5 h-4 w-4 text-blue-600" />
                    ) : (
                      <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-600">
                        {activity.description}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {format(activity.timestamp, 'PPp', { locale: cs })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* High Value Cases */}
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Vysoké náhrady
            </h3>
          </div>
          <div className="space-y-3">
            {topLists.highValueCases.length === 0 ? (
              <p className="text-sm text-gray-500">Zatím žádné případy</p>
            ) : (
              topLists.highValueCases.map((c) => (
                <a
                  key={c.id}
                  href={`/admin/cases/${c.id}`}
                  className="block rounded-lg border p-3 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        #{c.caseNumber}
                      </p>
                      <p className="text-sm font-semibold text-purple-600">
                        {new Intl.NumberFormat('cs-CZ', {
                          style: 'currency',
                          currency: 'CZK',
                          maximumFractionDigits: 0,
                        }).format(c.claimAmount)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {c.assignedTo || 'Nepřiřazeno'}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        c.status === 'resolved'
                          ? 'bg-green-100 text-green-700'
                          : c.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                </a>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Rychlé akce
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <a
            href="/admin/cases"
            className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-gray-50"
          >
            <FileText className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">
              Spravovat případy
            </span>
          </a>
          <a
            href="/admin/users"
            className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-gray-50"
          >
            <Users className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">
              Spravovat uživatele
            </span>
          </a>
          <a
            href="/admin/cases?status=new"
            className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-gray-50"
          >
            <AlertCircle className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">
              Nové případy
            </span>
          </a>
          <button
            onClick={handleExport}
            className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-gray-50"
          >
            <Download className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">
              Exportovat data
            </span>
          </button>
        </div>
      </Card>
    </div>
  );
}
