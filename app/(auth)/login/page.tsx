import Link from 'next/link';

export default function LoginPage() {
  return (
    <main className="container py-16">
      <h1 className="text-3xl font-bold">Přihlášení je dočasně vypnuté</h1>
      <p className="mt-4 text-gray-600">Běžíme v Notion režimu pro první testy. Nový případ vytvoříš přímo formulářem.</p>
      <Link className="mt-6 inline-block text-blue-600 underline" href="/cases/new">Přejít na formulář případu</Link>
    </main>
  );
}
