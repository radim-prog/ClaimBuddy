import type { Metadata } from 'next'
import { ClaimsNavbar } from '@/components/claims/claims-navbar'
import { ClaimsFooter } from '@/components/claims/claims-footer'

export const metadata: Metadata = {
  title: 'Ochrana osobních údajů — Pojistná Pomoc',
  description: 'Informace o zpracování osobních údajů při vyřizování pojistných událostí.',
}

export default function ClaimsPrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <ClaimsNavbar />

      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-8">
          Ochrana osobních údajů
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mt-8 mb-3">1. Správce osobních údajů</h2>
            <p>
              Správcem osobních údajů je společnost <strong>Zajcon s.r.o.</strong>, se sídlem v České republice,
              IČO: 21890137 (dále jen &bdquo;Správce&ldquo;).
            </p>
            <p>
              Kontakt: <a href="mailto:podpora@zajcon.cz" className="text-blue-600 dark:text-blue-400 hover:underline">podpora@zajcon.cz</a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mt-8 mb-3">2. Účel zpracování</h2>
            <p>Vaše osobní údaje zpracováváme za účelem:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Vyřízení Vaší pojistné události a komunikace s pojišťovnou</li>
              <li>Kontaktování Vás ohledně průběhu případu</li>
              <li>Plnění právních povinností Správce</li>
              <li>Ochrany oprávněných zájmů Správce (evidence, archivace)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mt-8 mb-3">3. Rozsah zpracovávaných údajů</h2>
            <p>Zpracováváme následující kategorie osobních údajů:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Identifikační údaje:</strong> jméno a příjmení</li>
              <li><strong>Kontaktní údaje:</strong> e-mailová adresa, telefonní číslo</li>
              <li><strong>Údaje o pojistné události:</strong> typ pojištění, pojišťovna, datum a místo události, popis škody, odhadovaná výše škody</li>
              <li><strong>Dokumenty:</strong> fotodokumentace, protokoly a další přílohy nahrané k případu</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mt-8 mb-3">4. Právní základ zpracování</h2>
            <p>
              Zpracování probíhá na základě Vašeho souhlasu (čl. 6 odst. 1 písm. a) GDPR) uděleného při odeslání
              formuláře a dále za účelem plnění smlouvy (čl. 6 odst. 1 písm. b) GDPR).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mt-8 mb-3">5. Doba uchování</h2>
            <p>
              Osobní údaje uchováváme po dobu nezbytnou pro vyřízení pojistné události a následně po dobu
              stanovenou právními předpisy (zpravidla 10 let pro účetní a daňové účely).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mt-8 mb-3">6. Práva subjektu údajů</h2>
            <p>V souvislosti se zpracováním osobních údajů máte právo na:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Přístup</strong> ke svým osobním údajům</li>
              <li><strong>Opravu</strong> nepřesných nebo neúplných údajů</li>
              <li><strong>Výmaz</strong> osobních údajů (&bdquo;právo být zapomenut&ldquo;)</li>
              <li><strong>Omezení zpracování</strong></li>
              <li><strong>Přenositelnost údajů</strong></li>
              <li><strong>Odvolání souhlasu</strong> se zpracováním, a to kdykoliv bez udání důvodu</li>
              <li><strong>Podání stížnosti</strong> u Úřadu pro ochranu osobních údajů (www.uoou.cz)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mt-8 mb-3">7. Příjemci údajů</h2>
            <p>
              Vaše údaje mohou být předány příslušné pojišťovně za účelem vyřízení pojistné události.
              Údaje nejsou předávány do třetích zemí mimo EU/EHP.
            </p>
          </section>

          <p className="text-xs text-gray-400 dark:text-gray-500 mt-12 pt-6 border-t border-gray-200 dark:border-gray-800">
            Poslední aktualizace: březen 2026
          </p>
        </div>
      </main>

      <ClaimsFooter />
    </div>
  )
}
