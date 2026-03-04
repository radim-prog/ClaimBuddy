import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <main className="container py-16">
      <h1 className="text-3xl font-bold">Obnova hesla není potřeba</h1>
      <p className="mt-4 text-gray-600">Autentizaci teď nepoužíváme. Založ případ přímo přes veřejný formulář.</p>
      <Link className="mt-6 inline-block text-blue-600 underline" href="/cases/new">Přejít na formulář</Link>
    </main>
  );
}
