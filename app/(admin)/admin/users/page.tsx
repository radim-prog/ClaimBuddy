'use client';

import { useEffect, useState } from 'react';

export default function AdminUsersPage() {
  const [agents, setAgents] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      const response = await fetch('/api/admin/agents', { cache: 'no-store' });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (!active) return;
        setError(data.error || 'Nepodařilo se načíst řešitele.');
        return;
      }

      const data = await response.json();
      if (!active) return;
      setAgents(data.agents || []);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="container py-12">
      <h1 className="text-3xl font-bold">Řešitelé</h1>
      <p className="mt-2 text-gray-600">Seznam jmen, která jsou aktuálně použita v přiřazených případech.</p>

      {error ? <p className="mt-4 text-red-600">{error}</p> : null}

      <ul className="mt-6 space-y-2">
        {agents.map((agent) => (
          <li key={agent} className="rounded border bg-white p-3">{agent}</li>
        ))}
        {agents.length === 0 ? <li className="text-sm text-gray-500">Zatím bez přiřazených řešitelů.</li> : null}
      </ul>
    </main>
  );
}
