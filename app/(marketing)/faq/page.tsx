'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion } from '@/components/ui/accordion';
import { Building, DollarSign, FileText, Shield, Scale, HelpCircle, Phone, Mail } from 'lucide-react';

const FAQ_CATEGORIES = [
  {
    id: 'about',
    title: 'O Pojistná Pomoc',
    icon: Building,
    emoji: '🏢',
    questions: [
      {
        question: 'Co přesně je Pojistná Pomoc?',
        answer: `Pojistná Pomoc je asistenční služba, která vyřídí vaši pojistnou událost od A do Z. Přebíráme veškerou komunikaci s pojišťovnou, shromažďujeme dokumenty, vyplňujeme formuláře a vyjednáváme co nejvyšší možné plnění.

Jednoduše řečeno: Děláme vše, co byste museli dělat vy, ale rychleji, efektivněji a s lepšími výsledky. Průměrně našim klientům vyjednáváme o 23% více než pojišťovny původně nabízejí.`,
      },
      {
        question: 'Proč bych měl použít Pojistná Pomoc místo vyřízení sám?',
        answer: `Tři hlavní důvody:

1. Čas: Průměrné vyřízení pojistky zabere 15-20 hodin vašeho času (telefonáty, papírování, čekání). My to vyřídíme za vás.

2. Peníze: Víme, jak vyjednávat s pojišťovnami. Průměrně získáte o 23% více než při jednání sami.

3. Stres: Pojistné události jsou stresující. Nemusíte se starat o nic, prostě to necháte na nás.

Příklad:
• Bez Pojistná Pomoc: 20 hodin vašeho času + pojišťovna nabídne 18,000 Kč
• S Pojistná Pomoc: 0 hodin vašeho času + vyjednáme 25,000 Kč, zaplatíte nám 990 Kč = zisk +6,010 Kč a ušetříte 20 hodin`,
      },
      {
        question: 'Nejsou Pojistná Pomoc pojišťovací zprostředkovatelé?',
        answer: `Ne. Neprodáváme pojistky, nebereme provize od pojišťoven a nejsme vázáni na žádnou konkrétní pojišťovnu.

Jsme na VAŠÍ straně, ne na straně pojišťovny.

Poskytujeme asistenční a poradenskou službu. Pomáháme vám dostat maximum z pojistky, kterou už máte.`,
      },
      {
        question: 'S jakými pojišťovnami pracujete?',
        answer: `Se všemi česky licencovanými pojišťovnami:

• ČPP (Česká pojišťovna)
• Allianz
• Kooperativa
• Generali
• ČSOB Pojišťovna
• Uniqa
• Direct
• mPojištění
• A všechny ostatní

Pracujeme s pojišťovnou, u které máte pojistku. Neměníme vaši pojišťovnu, jen vyřídíme událost efektivněji.`,
      },
      {
        question: 'Potřebuji advokáta nebo stačí Pojistná Pomoc?',
        answer: `Pro 85% případů stačí Pojistná Pomoc.

Advokáta potřebujete pouze pokud:
• Případ jde k soudu (pojišťovna odmítne vyplácet vůbec)
• Jedná se o velmi složitý spor (například odpovědnost více stran)
• Jde o velmi vysoké částky (500,000 Kč+) a pojišťovna odmítá vyjednávat

Pokud advokát bude potřeba, doporučíme vám toho správného a pomůžeme koordinovat.

V 99% případů ale pojišťovny komunikují a my to vyřídíme bez právních sporů.`,
      },
      {
        question: 'Pracují u vás opravdu bývalí pojišťovací agenti?',
        answer: `Ano. Náš tým má celkem 50+ let kombinovaných zkušeností z pojišťoven:

• Zakladatel Patrik pracoval 8 let pro ČPP a Allianz
• Jana byla právní asistentka ve firemním pojišťovacím oddělení
• Několik case managerů jsou bývalí likvidátoři škod (ti, co vyřizují události na straně pojišťovny)

To je naše výhoda: Víme, jak pojišťovny fungují zevnitř, jaké jsou jejich interní procesy a jak se vyjednává.`,
      },
    ],
  },
  {
    id: 'pricing',
    title: 'Ceny a platby',
    icon: DollarSign,
    emoji: '💰',
    questions: [
      {
        question: 'Kolik to stojí?',
        answer: `Máme dva modely:

Fixní cena:
• Basic: 490 Kč (standardní případy)
• Premium: 990 Kč (složitější případy, osobní péče)
• Pro: 1,990 Kč (velmi složité případy, express vyřízení)

Success fee:
• 15-20% z toho, co vyjednáme navíc oproti původní nabídce pojišťovny
• Pokud nevyjednáme navýšení = 0 Kč

Který model zvolit?
• Fixní cena: Pokud chcete jistotu, standardní případy, škody do 50,000 Kč
• Success fee: Pokud je škoda velká (50,000 Kč+), chcete zero-risk

Pomůžeme vám vybrat, co je pro vás výhodnější.`,
      },
      {
        question: 'Jsou to opravdu fixní ceny? Žádné skryté poplatky?',
        answer: `Ano, 100% transparentní.

Cena, kterou vidíte = cena, kterou zaplatíte. Zahrnuje:
• Veškerou komunikaci s pojišťovnou
• Přípravu dokumentů
• Vyjednávání
• Přístup do aplikace
• Podporu po celou dobu

Co NENÍ zahrnuto (a řekneme vám to předem):
• Znalecké posudky třetích stran (pokud jsou potřeba, cca 1,500-3,000 Kč)
• Advokátní služby u soudních sporů (řídí se advokatem)
• Poštovné doporučené zásilky (cca 50-100 Kč)

V 90% případů žádné extra náklady nejsou.`,
      },
      {
        question: 'Kdy zaplatím?',
        answer: `Fixní model:
• 50% při přijetí případu (aktivační poplatek)
• 50% po schválení pojistky pojišťovnou

Success fee model:
• 0 Kč předem (nebo 490 Kč u Premium varianty)
• Zbytek až po výplatě pojistky od pojišťovny

Garance: Pokud pojišťovna neschválí navýšení, vrátíme aktivační poplatek zpět.`,
      },
      {
        question: 'Mohu platit kartou?',
        answer: `Ano, přijímáme:
• 💳 Platební karty (Visa, Mastercard)
• 🏦 Bankovní převod
• 📱 Google Pay / Apple Pay
• 💼 Faktura pro firmy (splatnost 14 dní)

Všechny platby jsou šifrovány 256-bit SSL. Neukládáme čísla karet.`,
      },
      {
        question: 'Co když jsem nespokojený?',
        answer: `Money-back garance:

Pokud nejste spokojeni s naším přístupem (nikoliv s výsledkem pojišťovny, který neovlivňujeme 100%), vrátíme vám peníze do 30 dní.

Podmínky:
• Musíte nás informovat do 30 dní od začátku spolupráce
• Pokud jsme již případ dokončili, vrátíme 50% (protože práce byla vykonána)
• Pokud jsme ještě nezačali pracovat, vrátíme 100%`,
      },
      {
        question: 'Je to daňově uznatelné?',
        answer: `Ano, pro OSVČ a firmy je služba plně daňově uznatelná.

Vystavíme fakturu s DPH, kterou můžete uplatnit jako náklad. Spadá pod kategorie:
• Právní služby
• Poradenství
• Administrativní služby`,
      },
    ],
  },
  {
    id: 'process',
    title: 'Proces a průběh',
    icon: FileText,
    emoji: '📋',
    questions: [
      {
        question: 'Jak dlouho trvá vyřízení?',
        answer: `Průměrně 14 pracovních dní.

Časová osa závisí na:
• Složitosti případu
• Rychlosti odpovědi pojišťovny
• Dostupnosti dokumentů

Typické trvání:
• Basic: 21 dní
• Premium: 14 dní
• Pro: 7 dní (expresní priorita)

Nejrychlejší případ: 3 dny
Nejdelší případ: 45 dní (velmi složitý s odvoláním)`,
      },
      {
        question: 'Co všechno potřebujete ode mě?',
        answer: `Minimum:
• Popis události (co se stalo, kdy)
• Číslo pojistné smlouvy (nebo alespoň název pojišťovny)
• Základní kontaktní údaje

Ideálně také:
• Fotky škody
• Policejní protokol (pokud byl)
• Lékařské zprávy (u zdravotních úrazů)
• Faktury/doklady o opravě

Ale nebojte se: Nemusíte mít všechno hned. Pomůžeme vám to dohledat a sesbírat.`,
      },
      {
        question: 'Musím dělat něco já nebo to vyřídíte opravdu vše?',
        answer: `Vyřídíme 95% sami.

Co děláme za vás:
• Komunikace s pojišťovnou (telefonáty, emaily)
• Vyplnění všech formulářů
• Shromáždění dokumentů
• Vyjednávání podmínek
• Sledování průběhu

Co potřebujeme od vás (max. 30 minut celkem):
• Podpis plné moci (online)
• Občas zaslat fotku/dokument
• Potvrdit finální podmínky před schválením

To je vše. Zbytek je na nás.`,
      },
      {
        question: 'Jak budu informován o průběhu?',
        answer: `Máte přehled o všem:

1. Aplikace Pojistná Pomoc - Real-time status vašeho případu
2. SMS notifikace - Při každé změně stavu (Premium+)
3. Email updates - Týdenní souhrn průběhu
4. Telefonní kontakt - Kdykoliv se můžete ozvat case managerovi

Vidíte:
• V jaké fázi je případ
• Co se právě děje
• Co bude následovat
• Všechnu komunikaci s pojišťovnou`,
      },
      {
        question: 'Co když pojišťovna odmítne nebo nabídne méně?',
        answer: `Tři scénáře:

1. Vyjednáme navýšení
   → Platíte dle zvoleného modelu, dostáváte více než původně

2. Pojišťovna potvrdí původní nabídku (bez navýšení)
   → Pokud je to férová částka a nelze dosáhnout více, naše služba je ZDARMA

3. Pojišťovna sníží nabídku nebo odmítne zcela
   → Naše služba ZDARMA + pomůžeme s odvolacím řízením (zdarma v rámci Pro balíčku, 50% sleva u ostatních)

Bottom line: Nikdy na tom nebudete hůř než bez nás.`,
      },
      {
        question: 'Mohu zrušit spolupráci kdykoliv?',
        answer: `Ano, kdykoli.

Pokud jsme ještě nezačali pracovat:
• Vrátíme 100% aktivačního poplatku

Pokud už pracujeme na případu:
• Vrátíme poměrnou část (podle toho, kolik práce bylo vykonáno)
• Dostanete všechny dokumenty a komunikaci, které jsme připravili

Bez "lock-in", bez fine printu.`,
      },
    ],
  },
  {
    id: 'legal',
    title: 'Právní otázky',
    icon: Scale,
    emoji: '⚖️',
    questions: [
      {
        question: 'Je to legální?',
        answer: `Ano, 100% legální.

Pojistná Pomoc poskytuje asistenční a poradenskou službu, nikoliv zprostředkování pojištění.

Právní rámec:
• Jsme registrovaná s.r.o.
• Plátci DPH
• Poskytujeme právní poradenství (§ 2 zákona o advokacii - může poskytovat i non-advokát)
• Asistenční služby (zcela legální bez speciální licence)

Podobné služby fungují v:
• USA (Lemonade claims assist)
• UK (Claims Management Companies - regulované)
• Německo (Schadenregulierer)`,
      },
      {
        question: 'Neporušujete povinnost mlčenlivosti pojišťoven?',
        answer: `Ne, protože:

1. Jednáme vaším jménem - Podepíšete nám plnou moc, takže jsme oprávněni komunikovat s pojišťovnou za vás

2. Pojišťovny s tím souhlasí - Jakmile předložíme plnou moc, pojišťovna komunikuje s námi jako s vaším zástupcem

3. Vše je transparentní - Vidíte veškerou komunikaci v aplikaci, nic se neděje bez vašeho vědomí

Je to stejné jako když někoho pověříte zastupovat vás u advokáta nebo daňového poradce.`,
      },
      {
        question: 'Co je to plná moc a k čemu ji potřebujete?',
        answer: `Plná moc = právní dokument, který nám dává právo jednat vaším jménem.

Co nám umožňuje:
• Komunikovat s pojišťovnou za vás
• Získávat informace o vašem případu
• Vyplňovat formuláře vaším jménem
• Vyjednávat podmínky

Co nám NEUMOŽŇUJE:
• Přístup k vašemu bankovnímu účtu
• Podepisovat smlouvy bez vašeho souhlasu
• Měnit vaši pojistnou smlouvu
• Cokoliv mimo konkrétní pojistnou událost

Jak probíhá podepisování:
Pošleme vám plnou moc emailem/aplikací → Podepíšete online (elektronický podpis) → Hotovo za 2 minuty.`,
      },
      {
        question: 'Co se stane, pokud půjde případ k soudu?',
        answer: `Pokud případ eskaluje k soudu:

1. Doporučíme advokáta - Máme partnery, kteří se specializují na pojišťovací právo

2. Pomůžeme s koordinací - Předáme všechny dokumenty, komunikaci a důkazy

3. Můžeme pokračovat jako podpora - Koordinace mezi vámi a advokátem

Náklady:
• Advokát se účtuje samostatně (dle advokaního tarifu)
• Naše služby při soudním sporu: 50% sleva z našich poplatků
• Pokud vyhrajete, pojišťovna hradí soudní náklady

Realita: Méně než 2% případů jde k soudu. Většinu vyřídíme mimosoudně.`,
      },
    ],
  },
  {
    id: 'security',
    title: 'Bezpečnost a soukromí',
    icon: Shield,
    emoji: '🔒',
    questions: [
      {
        question: 'Jsou moje data v bezpečí?',
        answer: `Ano. Bereme bezpečnost velmi vážně.

Technická bezpečnost:
• 🔐 256-bit SSL šifrování
• ☁️ Data na Google Cloud (evropské servery)
• 🛡️ ISO 27001 certifikace (v procesu)
• 🔑 Dvoufaktorová autentizace

GDPR compliance:
• Vaše data používáme POUZE pro vyřízení vašeho případu
• Nikdy neprodáváme data třetím stranám
• Můžete kdykoli požádat o výpis nebo smazání dat
• Data jsou automaticky archivována po 7 letech`,
      },
      {
        question: 'Kdo má přístup k mým datům?',
        answer: `Pouze:
1. Váš přidělený case manager
2. Supervizor (pro quality check)
3. IT admin (pro technickou podporu, anonymizovaný přístup)

Všichni zaměstnanci:
• Podepsali NDA (mlčenlivost)
• Prošli bezpečnostním školením
• Mají přístup pouze k případům, které vyřizují

Logování:
Každý přístup k vašim datům je zaznamenán (kdo, kdy, co udělal).`,
      },
      {
        question: 'Co děláte s mými osobními údaji?',
        answer: `Co shromažďujeme:
• Jméno, příjmení, kontakt (pro komunikaci)
• Číslo pojistky (pro vyřízení)
• Dokumenty k případu (fotky, zprávy)
• Komunikace (emaily, poznámky)

Co s tím děláme:
• Používáme POUZE pro vyřízení vašeho případu
• Sdílíme POUZE s pojišťovnou (v rámci vyřízení)
• Ukládáme šifrovaně na bezpečných serverech

Co NEDĚLÁME:
❌ Neprodáváme data nikomu
❌ Neposíláme marketing třetích stran
❌ Nesdílíme s kýmkoliv bez vašeho souhlasu

Vaše práva:
Kdykoliv můžete požádat o:
• Výpis vašich dat
• Opravu nepřesných dat
• Smazání dat (po ukončení případu)`,
      },
    ],
  },
  {
    id: 'communication',
    title: 'Komunikace a podpora',
    icon: Phone,
    emoji: '📞',
    questions: [
      {
        question: 'Jak rychle odpovíte?',
        answer: `Záleží na balíčku:

• Basic: Email odpověď do 48 hodin
• Premium: Email/telefon do 24 hodin
• Pro: Kdykoliv (24/7 dostupnost)

V případě urgentní situace: Vždy odpovíme do 4 hodin, bez ohledu na balíček.`,
      },
      {
        question: 'Mohu vám zavolat, nebo jen písemný kontakt?',
        answer: `Ano, můžete volat:

• Premium a Pro balíčky: Máte přímé telefonní číslo na case managera
• Basic balíček: Primárně email/chat, ale v urgentních situacích můžete zavolat

Pracovní doba:
Po-Pá: 9:00-18:00

Mimo pracovní dobu:
• Email/chat podpora: Odpovíme další pracovní den
• Pro balíček: 24/7 dostupnost přes call centrum`,
      },
      {
        question: 'Mluvíte jen česky nebo i jiné jazyky?',
        answer: `Primárně česky a slovensky.

Na vyžádání máme k dispozici:
• Angličtinu (většina týmu mluví)
• Němčinu (máme 2 case managery)
• Ukrajinštinu (1 case manager)

Pokud potřebujete jinou řeč, dejte vědět a pokusíme se zajistit.`,
      },
      {
        question: 'Komunikujete i s pojišťovnou v mém jméně, nebo jen připravíte podklady?',
        answer: `Komunikujeme plně v vašem jméně.

Co konkrétně děláme:
• Voláme pojišťovně za vás
• Píšeme emaily
• Vyjednáváme podmínky
• Řešíme problémy
• Odpovídáme na jejich dotazy

Vy se o nic nestaráte. Jediné, co občas potřebujeme, je vaše potvrzení nějakého rozhodnutí (např. "Souhlasíte s touto nabídkou?").`,
      },
    ],
  },
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Filter questions based on search
  const filteredCategories = searchQuery
    ? FAQ_CATEGORIES.map((category) => ({
        ...category,
        questions: category.questions.filter(
          (q) =>
            q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.answer.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter((category) => category.questions.length > 0)
    : FAQ_CATEGORIES;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-gray-900">
              Máte otázky? Máme odpovědi.
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Připravili jsme odpovědi na nejčastější otázky o Pojistná Pomoc, pojistných
              událostech a našich službách.
            </p>
          </div>

          {/* Search */}
          <div className="mb-12">
            <div className="relative">
              <HelpCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Hledat v často kladených otázkách..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 py-6 text-lg border-2 border-gray-200 focus:border-primary rounded-xl"
              />
            </div>
          </div>

          {/* Category Pills */}
          {!searchQuery && (
            <div className="flex flex-wrap gap-3 justify-center mb-12">
              {FAQ_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() =>
                    setActiveCategory(activeCategory === category.id ? null : category.id)
                  }
                  className={`px-6 py-3 rounded-full font-medium transition-all ${
                    activeCategory === category.id
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-100 shadow'
                  }`}
                >
                  <span className="mr-2">{category.emoji}</span>
                  {category.title}
                </button>
              ))}
            </div>
          )}

          {/* FAQ Content */}
          <div className="space-y-12">
            {filteredCategories
              .filter((cat) => !activeCategory || cat.id === activeCategory)
              .map((category) => (
                <div key={category.id}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <category.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                      {category.emoji} {category.title}
                    </h2>
                  </div>

                  <Accordion items={category.questions} />
                </div>
              ))}
          </div>

          {/* No results */}
          {searchQuery && filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Žádné výsledky
              </h3>
              <p className="text-gray-600">
                Zkuste jiný vyhledávací dotaz nebo se na nás obraťte přímo.
              </p>
            </div>
          )}

          {/* CTA Section */}
          <Card className="mt-16 bg-gradient-to-r from-primary/10 to-blue-100 border-0">
            <div className="p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Nenašli jste odpověď na svou otázku?
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Napište nám nebo zavolejte. Odpovíme do 24 hodin.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="gap-2">
                  <Mail className="h-5 w-5" />
                  Poslat dotaz
                </Button>
                <Button size="lg" variant="outline" className="gap-2 bg-white">
                  <Phone className="h-5 w-5" />
                  Zavolat nám
                </Button>
              </div>
            </div>
          </Card>

          {/* Trust indicators */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500 mb-4">Důvěřuje nám více než 500 klientů</p>
            <div className="flex justify-center gap-8 text-sm text-gray-400">
              <span>⭐ 4.8/5 na Google</span>
              <span>🏆 100% GDPR compliant</span>
              <span>🔒 Bezpečné šifrování</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
