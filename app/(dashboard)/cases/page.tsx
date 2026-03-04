import Link from 'next/link';

export default function CasesPage() {
  return (
    <main className="container py-16">
      <h1 className="text-3xl font-bold">Případy</h1>
      <p className="mt-3 text-gray-600">Seznam případů sleduj v Notion databázi projektu ClaimBuddy.</p>
      <Link className="mt-6 inline-block text-blue-600 underline" href="/cases/new">Přidat případ</Link>
    </main>
  );
}
