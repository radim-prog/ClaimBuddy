'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const STATUS_OPTIONS = ['new', 'in_progress', 'waiting_client', 'resolved', 'rejected'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'];

type CaseDetail = {
  id: string;
  caseNumber: string;
  fullName: string;
  email: string;
  phone: string;
  insuranceType: string;
  insuranceCompany: string;
  incidentDate: string;
  incidentLocation: string;
  incidentDescription: string;
  claimAmount: number;
  status: string;
  priority: string;
  assignee: string;
  createdTime: string;
  url: string;
  notes: Array<{ at: string; actor: string; message: string }>;
  documents: Array<{ at: string; uploadedBy: string; size: number; name: string; url: string }>;
  activity: Array<{ at: string; type: string; actor: string; message: string }>;
};

export default function AdminCaseDetailPage() {
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<CaseDetail | null>(null);
  const [status, setStatus] = useState('new');
  const [priority, setPriority] = useState('medium');
  const [assignee, setAssignee] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    if (!params.id) return;

    setLoading(true);
    const response = await fetch(`/api/admin/cases/${params.id}`, { cache: 'no-store' });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || 'Nepodařilo se načíst detail případu.');
      setLoading(false);
      return;
    }

    const data = await response.json();
    setItem(data.case);
    setStatus(data.case?.status || 'new');
    setPriority(data.case?.priority || 'medium');
    setAssignee(data.case?.assignee || '');
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [params.id]);

  async function saveStatus(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;

    setSaving(true);
    setMessage('');
    setError('');

    const response = await fetch(`/api/admin/cases/${item.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || 'Uložení statusu selhalo.');
      setSaving(false);
      return;
    }

    setMessage('Status uložen.');
    await load();
    setSaving(false);
  }

  async function saveAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;

    setSaving(true);
    setMessage('');
    setError('');

    const response = await fetch(`/api/admin/cases/${item.id}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignee, priority }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || 'Uložení přiřazení selhalo.');
      setSaving(false);
      return;
    }

    setMessage('Přiřazení a priorita uloženy.');
    await load();
    setSaving(false);
  }

  async function saveNote(e: React.FormEvent) {
    e.preventDefault();
    if (!item || !note.trim()) return;

    setSaving(true);
    setMessage('');
    setError('');

    const response = await fetch(`/api/admin/cases/${item.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || 'Uložení poznámky selhalo.');
      setSaving(false);
      return;
    }

    setNote('');
    setMessage('Poznámka uložena.');
    await load();
    setSaving(false);
  }

  async function uploadDocument(e: React.ChangeEvent<HTMLInputElement>) {
    if (!item) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage('');
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`/api/admin/cases/${item.id}/documents`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || 'Upload selhal.');
      setUploading(false);
      return;
    }

    setMessage('Dokument nahrán.');
    await load();
    setUploading(false);
    e.currentTarget.value = '';
  }

  if (loading) {
    return <main className="container py-12">Načítám detail...</main>;
  }

  if (error && !item) {
    return (
      <main className="container py-12">
        <p className="text-red-600">{error}</p>
        <Link href="/admin/cases" className="mt-4 inline-block text-blue-600 underline">
          Zpět na případy
        </Link>
      </main>
    );
  }

  if (!item) {
    return <main className="container py-12">Případ nenalezen.</main>;
  }

  return (
    <main className="container max-w-6xl py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">{item.caseNumber || 'Detail případu'}</h1>
        <div className="flex gap-3">
          <Link href="/admin/cases" className="text-blue-600 underline">Zpět na seznam</Link>
          <a href={item.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">Notion karta</a>
        </div>
      </div>

      <p className="mt-2 text-gray-600">Vytvořeno: {new Date(item.createdTime).toLocaleString('cs-CZ')}</p>
      {message ? <p className="mt-3 text-green-700">{message}</p> : null}
      {error ? <p className="mt-3 text-red-600">{error}</p> : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-xl font-semibold">Detail klienta</h2>
          <div className="mt-4 grid gap-2 text-sm">
            <div><strong>Klient:</strong> {item.fullName || '-'}</div>
            <div><strong>E-mail:</strong> {item.email || '-'}</div>
            <div><strong>Telefon:</strong> {item.phone || '-'}</div>
            <div><strong>Typ pojištění:</strong> {item.insuranceType || '-'}</div>
            <div><strong>Pojišťovna:</strong> {item.insuranceCompany || '-'}</div>
            <div><strong>Datum události:</strong> {item.incidentDate || '-'}</div>
            <div><strong>Místo:</strong> {item.incidentLocation || '-'}</div>
            <div><strong>Odhad škody:</strong> {(item.claimAmount || 0).toLocaleString('cs-CZ')} Kč</div>
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm text-gray-700">{item.incidentDescription || '-'}</p>
        </div>

        <div className="space-y-6">
          <form onSubmit={saveStatus} className="rounded-xl border bg-white p-6">
            <h2 className="text-xl font-semibold">Status</h2>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded border p-2">
                {STATUS_OPTIONS.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
              <button disabled={saving} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60">
                {saving ? 'Ukládám...' : 'Uložit status'}
              </button>
            </div>
          </form>

          <form onSubmit={saveAssign} className="rounded-xl border bg-white p-6">
            <h2 className="text-xl font-semibold">Přiřazení a priorita</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="Řešitel (jméno)"
                className="rounded border p-2"
              />
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="rounded border p-2">
                {PRIORITY_OPTIONS.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>
            <button disabled={saving} className="mt-3 rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60">
              Uložit přiřazení
            </button>
          </form>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-white p-6">
          <h2 className="text-xl font-semibold">Interní poznámky</h2>
          <form onSubmit={saveNote} className="mt-3 space-y-3">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-24 w-full rounded border p-2"
              placeholder="Zapiš interní poznámku..."
            />
            <button disabled={saving || !note.trim()} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60">
              Přidat poznámku
            </button>
          </form>

          <div className="mt-4 space-y-3">
            {(item.notes || []).map((n, i) => (
              <div key={`${n.at}-${i}`} className="rounded border bg-gray-50 p-3 text-sm">
                <div className="text-xs text-gray-500">{new Date(n.at).toLocaleString('cs-CZ')} | {n.actor}</div>
                <div className="mt-1 whitespace-pre-wrap">{n.message}</div>
              </div>
            ))}
            {(!item.notes || item.notes.length === 0) ? <p className="text-sm text-gray-500">Zatím bez poznámek.</p> : null}
          </div>
        </section>

        <section className="rounded-xl border bg-white p-6">
          <h2 className="text-xl font-semibold">Dokumenty</h2>
          <div className="mt-3">
            <input type="file" onChange={uploadDocument} disabled={uploading} />
            {uploading ? <p className="mt-2 text-sm text-gray-600">Nahrávám...</p> : null}
          </div>

          <div className="mt-4 space-y-3">
            {(item.documents || []).map((doc, i) => (
              <div key={`${doc.url}-${i}`} className="rounded border bg-gray-50 p-3 text-sm">
                <a href={doc.url} target="_blank" rel="noreferrer" className="font-medium text-blue-600 underline">
                  {doc.name}
                </a>
                <div className="mt-1 text-xs text-gray-500">
                  {new Date(doc.at).toLocaleString('cs-CZ')} | {doc.uploadedBy} | {(doc.size || 0).toLocaleString('cs-CZ')} B
                </div>
              </div>
            ))}
            {(!item.documents || item.documents.length === 0) ? <p className="text-sm text-gray-500">Zatím bez dokumentů.</p> : null}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-xl border bg-white p-6">
        <h2 className="text-xl font-semibold">Aktivita</h2>
        <div className="mt-4 space-y-2 text-sm">
          {(item.activity || []).map((a, i) => (
            <div key={`${a.at}-${i}`} className="rounded border bg-gray-50 p-2">
              <span className="text-xs text-gray-500">{new Date(a.at).toLocaleString('cs-CZ')} | {a.actor} | {a.type}</span>
              <p>{a.message}</p>
            </div>
          ))}
          {(!item.activity || item.activity.length === 0) ? <p className="text-sm text-gray-500">Zatím bez aktivity.</p> : null}
        </div>
      </section>
    </main>
  );
}
