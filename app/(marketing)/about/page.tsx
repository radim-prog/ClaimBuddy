import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AboutPage() {
  return (
    <div className="container py-24">
      {/* Hero */}
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Jsme na vaší straně. Ne na straně pojišťovny.
        </h1>
        <p className="mt-6 text-lg text-gray-600">
          Pojistná Pomoc vznikl z osobní zkušenosti. Když jsem musel vyřídit pojistnou událost, bylo to jako navigovat bludiště
          plné papírů, odmítnutí a nízkých nabídek. Pomyslel jsem si: Musí to jít líp. A tak jsme to vytvořili.
        </p>
      </div>

      {/* Founding Story */}
      <div className="mt-16">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Proč Pojistná Pomoc vznikl</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-gray max-w-none">
              <p>
                V roce 2022 jsem měl autonehodu. Nebyla moje chyba, měl jsem plně hrazené pojištění, všechno mělo být v pořádku.
              </p>

              <p className="mt-4 font-semibold">Realita byla jiná:</p>
              <ul className="mt-4 space-y-2">
                <li>Pojišťovna nabídla 14,000 Kč za škody, které stály 28,000 Kč opravit</li>
                <li>Chtěli po mě stohy papírů, které jsem nevěděl, kde sehnat</li>
                <li>Call centrum mě přepojovalo mezi odděleními, nikdo neměl čas</li>
                <li>Email odpovědi přicházely po týdnech</li>
                <li>Když jsem se snažil vyjednávat, narazil jsem na &quot;to je naše standardní nabídka&quot;</li>
              </ul>

              <p className="mt-6 font-semibold text-primary">
                Nakonec jsem to vzdal a přijal těch 14,000 Kč.
              </p>

              <p className="mt-4">
                Přišel jsem o 14,000 Kč, které mi patřily. Ne proto, že bych neměl právo, ale proto, že jsem nevěděl,
                jak bojovat proti systému.
              </p>

              <p className="mt-6 font-semibold">Tehdy mi došlo:</p>
              <p>
                Pojišťovny mají celé týmy lidí, jejichž práce je dát vám co nejméně. Proč by lidi neměli mít tým,
                který bojuje za ně?
              </p>

              <p className="mt-4">A tak vznikl Pojistná Pomoc.</p>

              <p className="mt-6 text-sm italic">– Patrik, zakladatel Pojistná Pomoc</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Our Values */}
      <div className="mt-24">
        <h2 className="text-center text-3xl font-bold">Naše hodnoty</h2>

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Transparentnost</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Žádné skryté poplatky, žádné drobné písmo. Cena, kterou vidíte, je cena, kterou zaplatíte.
                Vždy víte, na čem jsme, co děláme a proč.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Efektivita</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Váš čas je důležitý. Průměrně vyřídíme případ za 14 dní. Nepotřebujete chodit na schůzky,
                vyplňovat formuláře ani volat. Prostě to necháte na nás.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fair pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Vyděláme jen když vyděláte vy. U success fee modelu dostáváme zaplaceno až když vám vyjednáme víc.
                Pokud nevyjednáme navýšení, naše služba je zdarma.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Educace</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Chceme, abyste rozuměli. Vysvětlujeme všechno srozumitelně, bez pojišťovacího žargonu.
                Náš blog a FAQ jsou plné tipů, jak fungují pojistky a na co máte nárok.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Empatie</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Víme, že je to stresující. Pojistné události jsou často spojené s těžkými situacemi - nehodou,
                ztrátou, poškozením majetku. Bereme to vážně a jednáme s respektem.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Výsledky</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Statistiky mluví samy za sebe: průměrně o 23% vyšší plnění, 500+ spokojených klientů,
                4.9/5 hodnocení. Děláme, co funguje.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-24 rounded-xl bg-blue-50 p-12">
        <h2 className="text-center text-3xl font-bold">Co jsme už dokázali</h2>

        <div className="mt-12 grid gap-8 text-center md:grid-cols-4">
          <div>
            <div className="text-5xl font-bold text-primary">500+</div>
            <div className="mt-2 text-sm text-gray-600">vyřízených případů</div>
          </div>
          <div>
            <div className="text-5xl font-bold text-primary">23%</div>
            <div className="mt-2 text-sm text-gray-600">průměrné navýšení</div>
          </div>
          <div>
            <div className="text-5xl font-bold text-primary">3.2M Kč</div>
            <div className="mt-2 text-sm text-gray-600">celkem vyjednáno</div>
          </div>
          <div>
            <div className="text-5xl font-bold text-primary">4.8/5</div>
            <div className="mt-2 text-sm text-gray-600">spokojenost klientů</div>
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="font-semibold">Od založení v roce 2023:</h3>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>📈 Růst: +250% případů rok od roku</li>
              <li>⏱️ Průměrná doba vyřízení: 14 dní (původně 28)</li>
              <li>💰 Největší vyjednané navýšení: 187,000 Kč</li>
              <li>🏆 Success rate: 87% případů dosáhlo navýšení</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">S jakými pojišťovnami pracujeme:</h3>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>✓ Česká pojišťovna</li>
              <li>✓ Allianz</li>
              <li>✓ Kooperativa</li>
              <li>✓ Generali</li>
              <li>✓ ČSOB Pojišťovna</li>
              <li>✓ A všechny ostatní</li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-24 text-center">
        <h2 className="text-3xl font-bold">Připraveni začít?</h2>
        <p className="mt-4 text-gray-600">
          Máte pojistnou událost, kterou potřebujete vyřídit? Nebo chcete jen konzultaci?
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <button className="rounded-lg bg-primary px-8 py-3 font-semibold text-white hover:bg-primary/90">
            Odeslat případ
          </button>
          <button className="rounded-lg border border-gray-300 px-8 py-3 font-semibold hover:bg-gray-50">
            Domluvit konzultaci
          </button>
        </div>
      </div>
    </div>
  );
}
