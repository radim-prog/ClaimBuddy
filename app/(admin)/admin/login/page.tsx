'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const response = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || 'Přihlášení selhalo.');
      setLoading(false);
      return;
    }

    const next =
      typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('next') || '/admin/cases' : '/admin/cases';
    router.push(next);
    router.refresh();
  }

  return (
    <main className="container max-w-md py-20">
      <h1 className="text-3xl font-bold">Admin přihlášení</h1>
      <p className="mt-3 text-gray-600">Zadej admin heslo pro vstup do interní správy případů.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-xl border bg-white p-6">
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin heslo"
          className="w-full rounded border p-3"
        />
        <button disabled={loading} className="w-full rounded bg-blue-600 px-5 py-3 font-medium text-white disabled:opacity-60">
          {loading ? 'Přihlašuji...' : 'Přihlásit'}
        </button>
      </form>

      {error ? <p className="mt-4 text-red-600">{error}</p> : null}
    </main>
  );
}
