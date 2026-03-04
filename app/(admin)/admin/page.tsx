'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Analytics = {
  totalCases: number;
  totalAmount: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
};

export default function AdminPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      const response = await fetch('/api/admin/analytics', { cache: 'no-store' });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        if (!active) return;
        setError(body.error || 'Nepodařilo se načíst statistiky.');
        return;
      }

      const body = await response.json();
      if (!active) return;
      setData(body);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="container py-12">
      <h1 className="text-3xl font-bold">Admin Pojistná Pomoc</h1>
      <p className="mt-2 text-gray-600">Provozní přehled a rychlý vstup do zpracování případů.</p>

      {error ? <p className="mt-4 text-red-600">{error}</p> : null}

      {data ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-gray-600">Celkem případů</p>
            <p className="mt-2 text-3xl font-semibold">{data.totalCases}</p>
          </div>
          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-gray-600">Součet škod</p>
            <p className="mt-2 text-3xl font-semibold">{(data.totalAmount || 0).toLocaleString('cs-CZ')} Kč</p>
          </div>
          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-gray-600">Nové případy</p>
            <p className="mt-2 text-3xl font-semibold">{data.byStatus?.new || 0}</p>
          </div>
        </div>
      ) : (
        <p className="mt-6">Načítám...</p>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link className="rounded bg-blue-600 px-4 py-2 text-white" href="/admin/cases">
          Otevřít případy
        </Link>
        <a className="rounded border px-4 py-2" href="/api/admin/export">
          Export CSV
        </a>
        <form action="/api/admin/auth/logout" method="post">
          <button className="rounded border px-4 py-2">Odhlásit se</button>
        </form>
      </div>
    </main>
  );
}
