'use client';

import { useState } from 'react';

export default function NewCasePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ caseNumber?: string; url?: string; error?: string }>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setResult({});

    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      fullName: String(formData.get('fullName') || ''),
      email: String(formData.get('email') || ''),
      phone: String(formData.get('phone') || ''),
      insuranceType: String(formData.get('insuranceType') || ''),
      insuranceCompany: String(formData.get('insuranceCompany') || ''),
      incidentDate: String(formData.get('incidentDate') || ''),
      incidentLocation: String(formData.get('incidentLocation') || ''),
      incidentDescription: String(formData.get('incidentDescription') || ''),
      claimAmount: Number(formData.get('claimAmount') || 0),
    };

    const response = await fetch('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setResult({ error: data.error || 'Nepodařilo se uložit případ.' });
      setLoading(false);
      return;
    }

    setResult({ caseNumber: data.caseNumber, url: data.notionUrl });
    form.reset();
    setLoading(false);
  }

  return (
    <main className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold">Nahlásit pojistnou událost</h1>
      <p className="mt-3 text-gray-600">Tato verze ukládá případ přímo do Notion databáze týmu Pojistná Pomoc.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-xl border bg-white p-6">
        <input required name="fullName" placeholder="Jméno a příjmení" className="w-full rounded border p-3" />
        <input required type="email" name="email" placeholder="E-mail" className="w-full rounded border p-3" />
        <input name="phone" placeholder="Telefon" className="w-full rounded border p-3" />
        <input required name="insuranceType" placeholder="Typ pojištění (např. majetek)" className="w-full rounded border p-3" />
        <input required name="insuranceCompany" placeholder="Pojišťovna" className="w-full rounded border p-3" />
        <input required type="date" name="incidentDate" className="w-full rounded border p-3" />
        <input required name="incidentLocation" placeholder="Místo události" className="w-full rounded border p-3" />
        <textarea required name="incidentDescription" placeholder="Popis události" className="h-32 w-full rounded border p-3" />
        <input type="number" name="claimAmount" placeholder="Předpokládaná škoda v Kč" className="w-full rounded border p-3" />

        <button disabled={loading} className="rounded bg-blue-600 px-5 py-3 font-medium text-white disabled:opacity-60">
          {loading ? 'Odesílám...' : 'Odeslat případ'}
        </button>
      </form>

      {result.error ? <p className="mt-4 text-red-600">{result.error}</p> : null}
      {result.caseNumber ? (
        <div className="mt-4 rounded border border-green-200 bg-green-50 p-4 text-green-800">
          <p>Případ vytvořen: <strong>{result.caseNumber}</strong></p>
          {result.url ? <a className="underline" target="_blank" rel="noreferrer" href={result.url}>Otevřít v Notion</a> : null}
        </div>
      ) : null}
    </main>
  );
}
