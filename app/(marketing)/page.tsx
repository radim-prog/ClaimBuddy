import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
              Pojišťovna vám nedala, co vám patří?
              <span className="text-primary"> Pomůžeme to změnit.</span>
            </h1>

            <p className="mt-6 text-lg leading-8 text-gray-600">
              ClaimBuddy vyřídí vaši pojistnou událost od A do Z. Bez starostí, bez papírování, bez odmítnutí.
              Získáte až o 23% více, než kdybyste jednali sami.
            </p>

            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/cases/new">
                <Button size="lg" className="px-8 py-6 text-lg">
                  Začít hned zdarma
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg">
                  Jak to funguje
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">500+</div>
                <div className="mt-2 text-sm text-gray-600">spokojených klientů</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">23%</div>
                <div className="mt-2 text-sm text-gray-600">vyšší plnění průměrně</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">14 dní</div>
                <div className="mt-2 text-sm text-gray-600">průměrná doba vyřízení</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">4.9/5</div>
                <div className="mt-2 text-sm text-gray-600">hodnocení klientů</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24">
        <div className="container">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Tři kroky k maximálnímu pojistnému plnění
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Žádné složité formuláře ani nekonečné telefonáty. Prostě to necháte na nás.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
                  1
                </div>
                <CardTitle>Popište, co se stalo</CardTitle>
                <CardDescription>
                  Vyplňte jednoduchý formulář nebo nám zavolejte. Stačí základní informace o pojistné události.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ Registrace zdarma</li>
                  <li>✓ Odpovíme do 24 hodin</li>
                  <li>✓ Nezávazná konzultace</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
                  2
                </div>
                <CardTitle>My se postaráme o zbytek</CardTitle>
                <CardDescription>
                  Převezmeme veškerou komunikaci s pojišťovnou. Seženeme dokumenty, vyjednáme podmínky.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ Pravidelné SMS/email notifikace</li>
                  <li>✓ Přístup do aplikace 24/7</li>
                  <li>✓ Průměrná doba: 14 dní</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
                  3
                </div>
                <CardTitle>Získáte peníze, které vám patří</CardTitle>
                <CardDescription>
                  Jakmile pojišťovna schválí vyšší plnění, peníze přijdou na váš účet. Pak nám zaplatíte odměnu.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ O 23% více průměrně</li>
                  <li>✓ Platba až po úspěchu</li>
                  <li>✓ Transparentní vyúčtování</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="bg-gray-50 py-24">
        <div className="container">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Transparentní ceny. Bez překvapení.
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Vyberte si model, který vám vyhovuje. Fixní cena nebo procento z výsledku.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Basic</CardTitle>
                <div className="mt-4 text-4xl font-bold">490 Kč</div>
                <CardDescription>Pro jednoduché případy</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li>✓ Konzultace případu</li>
                  <li>✓ Příprava podkladů</li>
                  <li>✓ Komunikace s pojišťovnou</li>
                  <li>✓ Email podpora</li>
                </ul>
                <Button className="mt-6 w-full" variant="outline">Začít</Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary">
              <CardHeader>
                <div className="mb-2 inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                  Nejoblíbenější
                </div>
                <CardTitle>Premium</CardTitle>
                <div className="mt-4 text-4xl font-bold">990 Kč</div>
                <CardDescription>Pro složitější případy</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li>✓ Vše z Basic +</li>
                  <li>✓ Prioritní vyřízení</li>
                  <li>✓ Osobní case manager</li>
                  <li>✓ Telefonická podpora</li>
                  <li>✓ SMS notifikace</li>
                </ul>
                <Button className="mt-6 w-full">Začít</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pro</CardTitle>
                <div className="mt-4 text-4xl font-bold">1,990 Kč</div>
                <CardDescription>Maximální péče</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li>✓ Vše z Premium +</li>
                  <li>✓ Expresní vyřízení</li>
                  <li>✓ Dedikovaný tým</li>
                  <li>✓ 24/7 dostupnost</li>
                  <li>✓ Právní konzultace</li>
                </ul>
                <Button className="mt-6 w-full" variant="outline">Začít</Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <Link href="/pricing" className="text-primary hover:underline">
              Zobrazit všechny možnosti včetně Success Fee →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Připraveni získat, co vám patří?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Registrace je zdarma. Platíte až po úspěchu.
            </p>
            <div className="mt-8">
              <Link href="/cases/new">
                <Button size="lg" className="px-12 py-6 text-lg">
                  Začít hned zdarma
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Žádné skryté poplatky • Zrušitelné kdykoliv • 500+ spokojených klientů
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
