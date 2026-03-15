import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const FAQ_ITEMS = [
  {
    q: 'Je Účetní OS zdarma?',
    a: 'Ano, základní tarif je zdarma a bez časového omezení. Navíc nabízíme 30denní trial plného tarifu bez nutnosti platební karty.',
  },
  {
    q: 'Jak funguje AI vytěžování dokladů?',
    a: 'Nahrajete fotografii nebo PDF dokladu. Naše AI automaticky rozpozná dodavatele, IČO, částku, DPH sazbu a datum. Výsledky zkontrolujete jedním kliknutím a odešlete účetnímu.',
  },
  {
    q: 'Mohu systém používat i bez účetního?',
    a: 'Klientský portál je navržen pro spolupráci s účetním. Pokud jste účetní, využijte portál pro účetní a pozvěte své klienty.',
  },
  {
    q: 'Jsou moje data v bezpečí?',
    a: 'Absolutně. Data jsou šifrována při přenosu i v klidu. Používáme Supabase s row-level security, každý vidí pouze svá data. Servery běží v EU.',
  },
  {
    q: 'Jak přejdu z jiného systému?',
    a: 'Nabízíme vstupní dotazník pro nové klienty a manuální import dat. Pro větší kanceláře zajistíme individuální migraci.',
  },
  {
    q: 'Kolik klientů mohu spravovat?',
    a: 'V základním tarifu pro účetní až 10 firem. Tarif Profi podporuje 100 firem a Business je zcela neomezený.',
  },
  {
    q: 'Podporujete DPH a daňová přiznání?',
    a: 'Ano. Portál pro účetní obsahuje DPH matici, kontrolní hlášení, přehledy pro daňové přiznání a automatické hlídání termínů.',
  },
  {
    q: 'Mohu systém napojit na jiné služby?',
    a: 'Tarif Business nabízí API přístup a integraci s Raynet CRM. Google Drive integrace je dostupná od tarifu Profi.',
  },
]

export function FAQ() {
  return (
    <section id="faq" className="py-20 sm:py-28">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-foreground">
            Časté dotazy
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Máte otázku? Zde najdete odpovědi na nejčastější dotazy.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-base font-medium">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
