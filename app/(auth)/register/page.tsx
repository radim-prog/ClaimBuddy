import Link from 'next/link';

export default function RegisterPage() {
  return (
    <main className="container py-16">
      <h1 className="text-3xl font-bold">Registrace je dočasně vypnutá</h1>
      <p className="mt-4 text-gray-600">V prvním půlroce používáme jednoduchý Notion provoz bez účtů.</p>
      <Link className="mt-6 inline-block text-blue-600 underline" href="/cases/new">Vytvořit nový případ</Link>
    </main>
  );
}
