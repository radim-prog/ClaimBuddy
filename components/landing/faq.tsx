'use client'

import { useState } from 'react'
import {
  ScanLine, Gift, Building2, MessageCircle, FileOutput,
  Car, ShieldCheck, ArrowRightLeft, ChevronDown, HelpCircle,
} from 'lucide-react'

const FAQ_ITEMS = [
  {
    icon: ScanLine,
    accent: 'text-blue-400',
    accentBg: 'bg-blue-500/10',
    q: 'Jak funguje AI vytěžování dokladů?',
    a: 'Nahrajete foto nebo PDF dokladu. OCR engine přečte text, AI model extrahuje klíčové údaje (dodavatel, IČO, částka, DPH sazba, datum splatnosti) a navrhne předkontaci podle českých účetních standardů. Výsledek zkontrolujete ve split-screen verifikaci — dokument vlevo, formulář vpravo. Celý proces trvá pár sekund.',
  },
  {
    icon: Gift,
    accent: 'text-emerald-400',
    accentBg: 'bg-emerald-500/10',
    q: 'Můžu to vyzkoušet zdarma?',
    a: 'Ano. Základní tarif je zdarma navždy — fakturace, nahrávání dokladů, komunikace s účetní. Navíc každý nový uživatel dostane 30 dní tarifu Professional zdarma, bez nutnosti zadávat platební kartu. Po uplynutí se automaticky přepnete na Free.',
  },
  {
    icon: Building2,
    accent: 'text-violet-400',
    accentBg: 'bg-violet-500/10',
    q: 'Kolik firem můžu spravovat?',
    a: 'Záleží na tarifu. Free: 5 firem a 1 uživatel. Starter (490 Kč/měs): 20 firem a 3 uživatelé. Profi (1 290 Kč/měs): 100 firem a 10 uživatelů. Business (2 990 Kč/měs): bez limitu. Firmy můžete organizovat do skupin a spravovat hromadně.',
  },
  {
    icon: MessageCircle,
    accent: 'text-pink-400',
    accentBg: 'bg-pink-500/10',
    q: 'Jak funguje komunikace s klienty?',
    a: 'Každá konverzace má vlastní téma a stav (otevřená/vyřešená). Klient vidí jen svou firmu, účetní má přehled přes všechny klienty na jednom místě. Přílohy se automaticky párují s doklady. Žádný chaos v emailu — vše je v kontextu konkrétní firmy.',
  },
  {
    icon: FileOutput,
    accent: 'text-amber-400',
    accentBg: 'bg-amber-500/10',
    q: 'Exportujete do Pohody?',
    a: 'Ano. Generujeme XML exporty kompatibilní s Pohodou — faktury vydané, přijaté doklady a pokladní doklady. Export stáhnete a nahrajete do Pohody ručně. Přímé napojení přes API Pohoda zatím nepodporuje, proto používáme XML cestu.',
  },
  {
    icon: Car,
    accent: 'text-cyan-400',
    accentBg: 'bg-cyan-500/10',
    q: 'Jak funguje cestovní deník?',
    a: 'Klient zadává vozidla, řidiče a oblíbené trasy. AI randomizér umí automaticky sestavit knihu jízd z evidovaných tankování — generuje realistické trasy s výpočtem PHM podle skutečné spotřeby. Výsledek exportujete jako PDF nebo CSV pro účetní.',
  },
  {
    icon: ShieldCheck,
    accent: 'text-green-400',
    accentBg: 'bg-green-500/10',
    q: 'Je to bezpečné? Jak řešíte GDPR?',
    a: 'Data jsou šifrována při přenosu (TLS) i v klidu. Databáze běží na Supabase s row-level security — každý uživatel vidí pouze svá data. Servery jsou v EU (Frankfurt). Hesla hashujeme PBKDF2. Přístup k API je chráněný HMAC-SHA256 JWT tokeny. Plně v souladu s GDPR.',
  },
  {
    icon: ArrowRightLeft,
    accent: 'text-orange-400',
    accentBg: 'bg-orange-500/10',
    q: 'Můžu přejít z jiného systému?',
    a: 'Ano. Nové klienty provedeme vstupním dotazníkem, kde vyplní potřebné údaje. Data z předchozího systému můžete importovat přes CSV. Pro větší účetní kanceláře nabízíme asistovanou migraci — pomůžeme s přenosem klientské databáze a dokumentů.',
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="relative py-20 sm:py-28 bg-gray-950 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent" />

      <div className="container relative mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
            <HelpCircle className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-300">FAQ</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-white">
            Časté dotazy
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            Odpovědi na to, co vás zajímá nejvíc.
          </p>
        </div>

        {/* FAQ Cards */}
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => {
            const Icon = item.icon
            const isOpen = openIndex === i

            return (
              <div
                key={i}
                className={`rounded-xl border transition-all duration-300 ${
                  isOpen
                    ? 'border-white/[0.12] bg-white/[0.05]'
                    : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04]'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center gap-4 p-5 text-left"
                >
                  <div className={`flex-shrink-0 p-2.5 rounded-lg ${item.accentBg}`}>
                    <Icon className={`h-4 w-4 ${item.accent}`} />
                  </div>
                  <span className="flex-1 text-[15px] font-medium text-white/90">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-500 flex-shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 pl-[4.25rem]">
                      <p className="text-sm text-gray-400 leading-relaxed">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
