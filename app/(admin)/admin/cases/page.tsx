'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type CaseItem = {
  id: string;
  caseNumber: string;
  fullName: string;
  email: string;
  status: string;
  priority: string;
  assignee: string;
  claimAmount: number;
  createdTime: string;
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'Všechny stavy' },
  { value: 'new', label: 'Nové' },
  { value: 'in_progress', label: 'Rozpracované' },
  { value: 'waiting_client', label: 'Čeká na klienta' },
  { value: 'resolved', label: 'Vyřešené' },
  { value: 'rejected', label: 'Zamítnuté' },
];

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'Všechny priority' },
  { value: 'low', label: 'low' },
  { value: 'medium', label: 'medium' },
  { value: 'high', label: 'high' },
  { value: 'urgent', label: 'urgent' },
];

export default function AdminCasesPage() {
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (status !== 'all') params.set('status', status);
      if (priority !== 'all') params.set('priority', priority);
      if (query.trim()) params.set('q', query.trim());

      const url = `/api/admin/cases${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url, { cache: 'no-store' });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (!active) return;
        setError(data.error || 'Nepodařilo se načíst případy.');
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (!active) return;
      setItems(data.cases || []);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [status, priority, query]);

  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + Number(item.claimAmount || 0), 0), [items]);

  return (
    <main className="container py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Případy</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin" className="rounded border px-3 py-2">Přehled</Link>
          <a href="/api/admin/export" className="rounded border px-3 py-2">Export CSV</a>
          <form action="/api/admin/auth/logout" method="post">
            <button className="rounded border px-3 py-2">Odhlásit</button>
          </form>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="rounded border p-2"
          placeholder="Hledat číslo, klienta, e-mail..."
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded border p-2">
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="rounded border p-2">
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="rounded border bg-white p-2 text-sm text-gray-600">
          {items.length} případů | {totalAmount.toLocaleString('cs-CZ')} Kč
        </div>
      </div>

      {loading ? <p className="mt-6">Načítám...</p> : null}
      {error ? <p className="mt-6 text-red-600">{error}</p> : null}

      {!loading && !error ? (
        <div className="mt-6 overflow-x-auto rounded-xl border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="p-3">Číslo</th>
                <th className="p-3">Klient</th>
                <th className="p-3">E-mail</th>
                <th className="p-3">Status</th>
                <th className="p-3">Priorita</th>
                <th className="p-3">Řešitel</th>
                <th className="p-3">Škoda</th>
                <th className="p-3">Vytvořeno</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-3">
                    <Link className="text-blue-600 underline" href={`/admin/cases/${item.id}`}>
                      {item.caseNumber || item.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="p-3">{item.fullName || '-'}</td>
                  <td className="p-3">{item.email || '-'}</td>
                  <td className="p-3">{item.status || '-'}</td>
                  <td className="p-3">{item.priority || '-'}</td>
                  <td className="p-3">{item.assignee || '-'}</td>
                  <td className="p-3">{(item.claimAmount || 0).toLocaleString('cs-CZ')} Kč</td>
                  <td className="p-3">{new Date(item.createdTime).toLocaleString('cs-CZ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </main>
  );
}
