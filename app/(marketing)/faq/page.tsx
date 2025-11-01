import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function FAQPage() {
  const faqs = [
    {
      category: 'O ClaimBuddy',
      questions: [
        {
          q: 'Co přesně je ClaimBuddy?',
          a: 'ClaimBuddy je asistenční služba, která vyřídí vaši pojistnou událost od A do Z. Přebíráme veškerou komunikaci s pojišťovnou, shromažďujeme dokumenty, vyplňujeme formuláře a vyjednáváme co nejvyšší možné plnění. Průměrně našim klientům vyjednáváme o 23% více než pojišťovny původně nabízejí.',
        },
        {
          q: 'Proč bych měl použít ClaimBuddy místo vyřízení sám?',
          a: 'Tři hlavní důvody: 1) Čas - průměrné vyřízení zabere 15-20 hodin vašeho času, my to vyřídíme za vás. 2) Peníze - průměrně získáte o 23% více. 3) Stres - pojistné události jsou stresující, nemusíte se starat o nic.',
        },
        {
          q: 'Nejsou ClaimBuddy pojišťovací zprostředkovatelé?',
          a: 'Ne. Neprodáváme pojistky, nebereme provize od pojišťoven a nejsme vázáni na žádnou konkrétní pojišťovnu. Jsme na VAŠÍ straně, ne na straně pojišťovny. Poskytujeme asistenční a poradenskou službu.',
        },
        {
          q: 'S jakými pojišťovnami pracujete?',
          a: 'Se všemi česky licencovanými pojišťovnami: ČPP, Allianz, Kooperativa, Generali, ČSOB, Uniqa, Direct, mPojištění a všechny ostatní. Pracujeme s pojišťovnou, u které máte pojistku.',
        },
      ],
    },
    {
      category: 'Ceny a platby',
      questions: [
        {
          q: 'Kolik to stojí?',
          a: 'Máme dva modely: Fixní cena (490-1990 Kč) nebo Success fee (15-20% z vyjednaného navýšení). Fixní cena je vhodná pro standardní případy do 50,000 Kč. Success fee pro větší škody, kde platíte jen když vyjednáme více.',
        },
        {
          q: 'Jsou to opravdu fixní ceny? Žádné skryté poplatky?',
          a: 'Ano, 100% transparentní. Cena zahrnuje veškerou komunikaci s pojišťovnou, přípravu dokumentů, vyjednávání, přístup do aplikace a podporu. Co NENÍ zahrnuto: znalecké posudky třetích stran (pokud jsou potřeba, informujeme předem), advokátní služby u soudních sporů.',
        },
        {
          q: 'Kdy zaplatím?',
          a: 'Fixní model: 50% při přijetí případu, 50% po schválení pojistky. Success fee: 0 Kč předem (nebo 490 Kč u Premium), zbytek až po výplatě pojistky od pojišťovny. Pokud pojišťovna neschválí navýšení, vrátíme aktivační poplatek.',
        },
        {
          q: 'Co když jsem nespokojený?',
          a: 'Money-back garance: pokud nejste spokojeni s naším přístupem (nikoliv s výsledkem pojišťovny), vrátíme vám peníze do 30 dní. Pokud jsme ještě nezačali pracovat, vrátíme 100%. Pokud už pracujeme na případu, vrátíme 50%.',
        },
      ],
    },
    {
      category: 'Proces a průběh',
      questions: [
        {
          q: 'Jak dlouho trvá vyřízení?',
          a: 'Průměrně 14 pracovních dní. Typické trvání: Basic (21 dní), Premium (14 dní), Pro (7 dní). Nejrychlejší případ: 3 dny. Nejdelší: 45 dní (velmi složitý s odvoláním).',
        },
        {
          q: 'Co všechno potřebujete ode mě?',
          a: 'Minimum: popis události, datum, číslo pojistné smlouvy, kontaktní údaje. Ideálně také: fotky škody, policejní protokol, lékařské zprávy (u úrazů), faktury o opravě. Ale nebojte se - nemusíte mít všechno hned, pomůžeme vám to dohledat.',
        },
        {
          q: 'Musím dělat něco já nebo to vyřídíte opravdu vše?',
          a: 'Vyřídíme 95% sami. Co děláme za vás: komunikaci s pojišťovnou, vyplnění formulářů, shromáždění dokumentů, vyjednávání. Co potřebujeme od vás (max 30 minut celkem): podpis plné moci (online), občas zaslat fotku/dokument, potvrdit finální podmínky.',
        },
        {
          q: 'Jak budu informován o průběhu?',
          a: 'Máte přehled o všem: 1) Aplikace ClaimBuddy - real-time status, 2) SMS notifikace při změnách (Premium+), 3) Email updates týdenně, 4) Telefonní kontakt kdykoliv.',
        },
        {
          q: 'Co když pojišťovna odmítne nebo nabídne méně?',
          a: 'Tři scénáře: 1) Vyjednáme navýšení → platíte dle modelu. 2) Pojišťovna potvrdí původní nabídku → pokud je to férová částka, naše služba ZDARMA. 3) Pojišťovna sníží/odmítne → ZDARMA + pomůžeme s odvoláním.',
        },
      ],
    },
    {
      category: 'Bezpečnost a soukromí',
      questions: [
        {
          q: 'Jsou moje data v bezpečí?',
          a: 'Ano. Používáme 256-bit SSL šifrování, data na Google Cloud (EU servery), ISO 27001 certifikaci (v procesu), dvoufaktorovou autentizaci. GDPR compliant - vaše data používáme POUZE pro vyřízení případu, nikdy je neprodáváme.',
        },
        {
          q: 'Kdo má přístup k mým datům?',
          a: 'Pouze: váš case manager, supervizor (quality check), IT admin (anonymizovaný přístup). Všichni podepsali NDA, prošli školením a mají přístup pouze k případům, které vyřizují. Každý přístup je logován.',
        },
        {
          q: 'Co děláte s mými osobními údaji?',
          a: 'Sbíráme: jméno, kontakt, číslo pojistky, dokumenty. Používáme POUZE pro vyřízení případu. Sdílíme POUZE s pojišťovnou. Neděláme: neprodáváme data, neposíláme marketing třetích stran. Kdykoliv můžete požádat o výpis nebo smazání.',
        },
      ],
    },
    {
      category: 'Specifické situace',
      questions: [
        {
          q: 'Funguje to i pro firemní pojistky?',
          a: 'Ano. Co nabízíme navíc: faktura na IČO, možnost firemních balíčků (více případů = sleva), prioritní vyřízení, dedikovaný account manager od 10+ případů ročně. Ceny stejné jako pro fyzické osoby.',
        },
        {
          q: 'Vyřizujete i starší případy (před 6+ měsíci)?',
          a: 'Ano, pokud: případ není uzavřený, neuplynula promlčecí lhůta (obvykle 2-3 roky), ještě je možné něco vyjednat. U velmi starých případů (1+ rok) je těžší něco měnit, ale pokusíme se.',
        },
        {
          q: 'Co když už jsem začal vyřizovat sám a teď chci pomoc?',
          a: 'Žádný problém, můžeme převzít kdykoliv. Potřebujeme: dosavadní komunikaci, dokumenty co jste poslali, přehled co se stalo. Převezmeme, kde jste skončili, nemusíte začínat znovu.',
        },
        {
          q: 'Děláte i odvolání, když pojišťovna odmítne?',
          a: 'Ano. Pro balíček: zahrnuto v ceně. Premium: +500 Kč. Basic: +990 Kč. Jak probíhá: připravíme odvolání s právním zdůvodněním, odešleme vedení pojišťovny/ombudsmanovi, vyjednáváme znovu. Success rate: 64% případů je při odvolání schváleno.',
        },
      ],
    },
  ];

  return (
    <div className="container py-24">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Máte otázky? Máme odpovědi.
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Připravili jsme odpovědi na nejčastější otázky o ClaimBuddy, pojistných událostech a našich službách.
          </p>
        </div>

        {/* Search placeholder */}
        <div className="mt-12">
          <input
            type="text"
            placeholder="Hledat v často kladených otázkách..."
            className="w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>

        {/* Categories */}
        <div className="mt-16 space-y-12">
          {faqs.map((category) => (
            <div key={category.category}>
              <h2 className="mb-6 text-2xl font-bold">{category.category}</h2>

              <div className="space-y-4">
                {category.questions.map((faq, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <CardTitle className="text-lg">{faq.q}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">{faq.a}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-24 rounded-xl bg-blue-50 p-12 text-center">
          <h2 className="text-2xl font-bold">Nenašli jste odpověď na svou otázku?</h2>
          <p className="mt-4 text-gray-600">Napište nám nebo zavolejte. Odpovíme do 24 hodin.</p>
          <div className="mt-8 flex justify-center gap-4">
            <button className="rounded-lg bg-primary px-8 py-3 font-semibold text-white hover:bg-primary/90">
              Poslat dotaz
            </button>
            <button className="rounded-lg border border-gray-300 bg-white px-8 py-3 font-semibold hover:bg-gray-50">
              Zavolat nám
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
