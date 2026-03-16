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
    a: 'Platíte pouze success fee z vymoženého plnění. Pokud neuspějeme, neplatíte nic. Žádné vstupní poplatky, žádné měsíční paušály.',
  },
  {
    q: 'Jak dlouho to trvá?',
    a: 'Většinu případů vyřídíme do 14 dnů. Složitější případy s odvoláním mohou trvat déle, ale o všem vás budeme průběžně informovat.',
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
    q: 'Co když pojišťovna odmítne?',
    a: 'Připravíme odvolání a budeme bojovat za vaše práva. Máme zkušenosti i s komplikovanými případy.',
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
