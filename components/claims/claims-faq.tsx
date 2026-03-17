'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const FAQ_ITEMS = [
  {
    q: 'Kolik to stojí?',
    a: 'Základní nahlášení a self-service je zdarma. AI zpracování stojí 199 Kč, konzultaci s poradcem pořídíte za jednorázových 1 499 Kč. U plného zastoupení platíte navíc success fee z vyplaceného pojistného plnění — neuspějeme-li, success fee neplatíte.',
  },
  {
    q: 'Co je AI zpracování?',
    a: 'Za 199 Kč umělá inteligence analyzuje vaše fotky a dokumenty, posoudí oprávněnost nároku a sestaví kompletní hlášenku pojistné události. Vše je hotovo do 15 minut.',
  },
  {
    q: 'Jaký je rozdíl mezi konzultací a zastoupením?',
    a: 'U konzultace (1 499 Kč) vám poradíme, zkontrolujeme podklady a doporučíme postup — ale s pojišťovnou komunikujete sami. U plného zastoupení (1 499 Kč + 10 % success fee) komunikujeme s pojišťovnou za vás na základě plné moci, včetně odvolání při zamítnutí.',
  },
  {
    q: 'Jak dlouho to trvá?',
    a: 'AI zpracování je hotové do 15 minut. Konzultaci obvykle vyřídíme do 2 pracovních dnů. U plného zastoupení většinu případů vyřídíme do 14 dnů. Složitější případy s odvoláním mohou trvat déle, ale o všem vás budeme průběžně informovat.',
  },
  {
    q: 'Jaké pojistné události řešíte?',
    a: 'Řešíme všechny typy — autopojištění, majetek, odpovědnost, úrazy, cestovní pojištění i průmyslové škody.',
  },
  {
    q: 'Musím někam chodit?',
    a: 'Ne, vše vyřídíme online. Formulář vyplníte za 5 minut, zbytek je na nás.',
  },
  {
    q: 'Co když pojišťovna zamítne?',
    a: 'U plného zastoupení připravíme odvolání a budeme bojovat za vaše práva — máme zkušenosti i s komplikovanými případy. U konzultace vám poradíme, jak odvolání sepsat a podat sami.',
  },
  {
    q: 'Můžete pojišťovnu žalovat?',
    a: 'Soudní zastoupení je speciální služba mimo standardní tarify. Pokud by to bylo potřeba, doporučíme vám spolupracujícího právníka specializovaného na pojistné spory.',
  },
  {
    q: 'Co je success fee?',
    a: 'Success fee je 10 % z celkového pojistného plnění, které vám pojišťovna vyplatí. Platíte jej pouze u plného zastoupení a pouze tehdy, když pojišťovna plnění skutečně vyplatí. Pokud pojišťovna nic nevyplatí, success fee neplatíte.',
  },
  {
    q: 'Jsou mé údaje v bezpečí?',
    a: 'Ano, vaše data zpracováváme v souladu s GDPR. Jsou uložena šifrovaně na serverech v EU.',
  },
]

export function ClaimsFAQ() {
  return (
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
  )
}
