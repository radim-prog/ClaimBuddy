import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PricingPage() {
  return (
    <div className="container py-24">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Transparentní ceny. Bez překvapení.
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Vyberte si, jak chcete platit. Fixní cena nebo procento z výsledku. Vždy víte, co dostanete a co za to dáte.
        </p>
      </div>

      {/* Fixní cena */}
      <div className="mt-16">
        <h2 className="text-center text-2xl font-bold">Fixní cena</h2>
        <p className="mt-2 text-center text-gray-600">Vhodné pro standardní případy a škody do 50,000 Kč</p>

        <div className="mt-8 grid gap-8 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Basic</CardTitle>
              <div className="mt-4 text-4xl font-bold">490 Kč</div>
              <CardDescription className="mt-2">Ideální pro drobné škody do 20,000 Kč</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li>✓ Konzultace případu</li>
                <li>✓ Příprava podkladů</li>
                <li>✓ Komunikace s pojišťovnou</li>
                <li>✓ Sledování stavu</li>
                <li>✓ Email podpora (48h)</li>
              </ul>
              <div className="mt-6">
                <p className="text-xs text-gray-500">Běžná priorita vyřízení: ~21 dní</p>
              </div>
              <Button className="mt-6 w-full" variant="outline">Začít s Basic</Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary">
            <CardHeader>
              <div className="mb-2 inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                Nejčastější volba
              </div>
              <CardTitle>Premium</CardTitle>
              <div className="mt-4 text-4xl font-bold">990 Kč</div>
              <CardDescription className="mt-2">Střední škody 20,000 - 100,000 Kč</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li>✓ Vše z Basic +</li>
                <li>✓ Prioritní vyřízení (o 30% rychleji)</li>
                <li>✓ Osobní case manager</li>
                <li>✓ Telefonická podpora</li>
                <li>✓ Vyjednávání navýšení</li>
                <li>✓ SMS notifikace</li>
              </ul>
              <div className="mt-6">
                <p className="text-xs text-gray-500">Prioritní vyřízení: ~14 dní</p>
                <p className="mt-1 text-xs font-semibold text-primary">
                  Průměrně o 28% více než Basic
                </p>
              </div>
              <Button className="mt-6 w-full">Začít s Premium</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 inline-block rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold">
                Maximální péče
              </div>
              <CardTitle>Pro</CardTitle>
              <div className="mt-4 text-4xl font-bold">1,990 Kč</div>
              <CardDescription className="mt-2">Velké škody 100,000 Kč+ a složité případy</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li>✓ Vše z Premium +</li>
                <li>✓ Expresní vyřízení</li>
                <li>✓ Dedikovaný tým specialistů</li>
                <li>✓ 24/7 dostupnost</li>
                <li>✓ Právní konzultace</li>
                <li>✓ Odvolací řízení zahrnuto</li>
                <li>✓ Osobní schůzka</li>
              </ul>
              <div className="mt-6">
                <p className="text-xs text-gray-500">Expresní vyřízení: ~7 dní</p>
                <p className="mt-1 text-xs font-semibold text-primary">
                  Průměrně o 35% více + garance výsledku
                </p>
              </div>
              <Button className="mt-6 w-full" variant="outline">Začít s Pro</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Success Fee */}
      <div className="mt-24">
        <h2 className="text-center text-2xl font-bold">Success Fee (úspěchová odměna)</h2>
        <p className="mt-2 text-center text-gray-600">
          Platíte pouze z toho, co vyjednáme navíc. Vhodné pro velké škody 50,000 Kč+
        </p>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Standardní Success Fee</CardTitle>
              <div className="mt-4 text-4xl font-bold">20%</div>
              <CardDescription className="mt-2">z vyjednaného navýšení</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li>✓ Žádný poplatek předem</li>
                <li>✓ Pokud nevyjednáme navýšení = 0 Kč</li>
                <li>✓ Email podpora</li>
                <li>✓ Standardní vyřízení (21 dní)</li>
              </ul>
              <div className="mt-6 rounded-lg bg-blue-50 p-4">
                <p className="text-xs font-semibold">Příklad:</p>
                <p className="mt-2 text-sm">
                  Původní nabídka: 25,000 Kč<br/>
                  Po Pojistná Pomoc: 38,000 Kč<br/>
                  Rozdíl: 13,000 Kč<br/>
                  <span className="font-semibold">Náš poplatek (20%): 2,600 Kč</span><br/>
                  <span className="font-semibold text-primary">Váš čistý zisk: +10,400 Kč</span>
                </p>
              </div>
              <Button className="mt-6 w-full" variant="outline">Vybrat tento model</Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle>Premium Success Fee</CardTitle>
              <div className="mt-4 text-4xl font-bold">15%</div>
              <CardDescription className="mt-2">z vyjednaného navýšení</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li>✓ Vše ze Standardní +</li>
                <li>✓ Osobní case manager</li>
                <li>✓ Prioritní vyřízení (14 dní)</li>
                <li>✓ Telefonická podpora</li>
                <li>✓ SMS notifikace</li>
              </ul>
              <div className="mt-6 rounded-lg bg-blue-50 p-4">
                <p className="text-xs font-semibold">Příklad:</p>
                <p className="mt-2 text-sm">
                  Původní nabídka: 120,000 Kč<br/>
                  Po Pojistná Pomoc: 165,000 Kč<br/>
                  Rozdíl: 45,000 Kč<br/>
                  <span className="font-semibold">Náš poplatek (15%): 6,750 Kč</span><br/>
                  <span className="font-semibold text-primary">Váš čistý zisk: +38,250 Kč</span>
                </p>
              </div>
              <p className="mt-4 text-xs text-gray-600">Poplatek za aktivaci: 490 Kč (započítá se do finální odměny)</p>
              <Button className="mt-6 w-full">Vybrat tento model</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-24">
        <h2 className="text-center text-2xl font-bold">Často kladené otázky</h2>

        <div className="mx-auto mt-8 max-w-3xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Je to opravdu fixní cena? Žádné skryté poplatky?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Ano, 100% transparentní. Cena, kterou vidíte, je cena, kterou zaplatíte. Zahrnuje veškerou komunikaci,
                přípravu dokumentů, vyjednávání a podporu. Bez DPH navíc, bez skrytých poplatků.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Kdy zaplatím?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                <strong>Fixní model:</strong> 50% při potvrzení případu, 50% po schválení pojistky.<br/>
                <strong>Success fee:</strong> 0 Kč předem (nebo 490 Kč u Premium), zbytek až po výplatě od pojišťovny.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Co když pojišťovna odmítne?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Pokud pojišťovna neschválí navýšení oproti původní nabídce, naše služba je ZDARMA u success fee modelu.
                U fixního modelu vrátíme aktivační poplatek, pokud jsme nebyli schopni dosáhnout žádného navýšení.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-24 text-center">
        <h2 className="text-3xl font-bold">Ještě si nejste jistí?</h2>
        <p className="mt-4 text-gray-600">
          Vyplňte krátký formulář a my vám do 24 hodin řekneme, kolik můžete získat a který balíček je pro vás nejvhodnější.
        </p>
        <Button size="lg" className="mt-8">Získat nezávaznou konzultaci</Button>
      </div>
    </div>
  );
}
