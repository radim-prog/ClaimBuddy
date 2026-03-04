import Link from 'next/link';

export default function DashboardPage() {
  return (
    <main className="container py-16">
      <h1 className="text-3xl font-bold">ClaimBuddy Dashboard (Notion mode)</h1>
      <p className="mt-3 text-gray-600">Klientské účty jsou dočasně vypnuté. Případy ukládáme přímo do Notion databáze.</p>
      <Link className="mt-6 inline-block text-blue-600 underline" href="/cases/new">Vytvořit nový případ</Link>
    </main>
  );
}
