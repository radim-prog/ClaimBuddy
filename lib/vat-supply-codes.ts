// DPH kódy plnění (supply codes) dle zákona č. 235/2004 Sb. o DPH
// Používá se v přiznání k DPH pro klasifikaci plnění

export interface VatSupplyCode {
  code: number
  label: string
  description: string
  category: 'domestic' | 'eu' | 'special' | 'reverse_charge'
  // Row number in the VAT return form (přiznání k DPH)
  vatReturnRow?: number
}

export const VAT_SUPPLY_CODES: VatSupplyCode[] = [
  // ============================================
  // TUZEMSKO (§21 — dodání zboží a poskytnutí služeb)
  // ============================================
  {
    code: 1,
    label: 'Dodání zboží',
    description: 'Dodání zboží s místem plnění v tuzemsku (§13)',
    category: 'domestic',
    vatReturnRow: 1,
  },
  {
    code: 2,
    label: 'Poskytnutí služeb',
    description: 'Poskytnutí služeb s místem plnění v tuzemsku (§14)',
    category: 'domestic',
    vatReturnRow: 1,
  },
  {
    code: 3,
    label: 'Převod nemovitosti',
    description: 'Převod nemovité věci (§13 odst. 3)',
    category: 'domestic',
    vatReturnRow: 1,
  },
  {
    code: 4,
    label: 'Zasílání zboží',
    description: 'Zasílání zboží s místem plnění v tuzemsku (§8)',
    category: 'domestic',
    vatReturnRow: 1,
  },
  {
    code: 5,
    label: 'Plnění osvobozená s nárokem na odpočet',
    description: 'Plnění osvobozená od daně s nárokem na odpočet (§63)',
    category: 'domestic',
    vatReturnRow: 26,
  },

  // ============================================
  // EU (intrakomunitární plnění)
  // ============================================
  {
    code: 6,
    label: 'Dodání zboží do JČS',
    description: 'Dodání zboží do jiného členského státu osobě registrované k dani (§64)',
    category: 'eu',
    vatReturnRow: 20,
  },
  {
    code: 7,
    label: 'Pořízení zboží z JČS',
    description: 'Pořízení zboží z jiného členského státu (§16)',
    category: 'eu',
    vatReturnRow: 3,
  },
  {
    code: 8,
    label: 'Přijetí služeb z JČS',
    description: 'Přijetí služeb od osoby registrované v JČS — §24a (místo plnění §9)',
    category: 'eu',
    vatReturnRow: 5,
  },
  {
    code: 9,
    label: 'Poskytnutí služeb do JČS',
    description: 'Poskytnutí služeb s místem plnění v JČS dle §9 odst. 1',
    category: 'eu',
    vatReturnRow: 21,
  },
  {
    code: 10,
    label: 'Třístranný obchod — prostřední osoba',
    description: 'Zjednodušený postup při dodání zboží formou třístranného obchodu — prostřední osoba (§17)',
    category: 'eu',
    vatReturnRow: 30,
  },
  {
    code: 11,
    label: 'Vývoz zboží',
    description: 'Vývoz zboží mimo EU (§66)',
    category: 'eu',
    vatReturnRow: 22,
  },
  {
    code: 12,
    label: 'Dovoz zboží',
    description: 'Dovoz zboží ze třetích zemí (§23)',
    category: 'eu',
    vatReturnRow: 7,
  },

  // ============================================
  // SPECIÁLNÍ REŽIMY
  // ============================================
  {
    code: 13,
    label: 'Režim přenesení daňové povinnosti — dodavatel',
    description: 'Dodání zboží nebo poskytnutí služeb v režimu přenesení — dodavatel vystavuje daňový doklad bez DPH (§92a)',
    category: 'special',
    vatReturnRow: 25,
  },
  {
    code: 14,
    label: 'Režim přenesení daňové povinnosti — odběratel',
    description: 'Pořízení zboží/služeb v tuzemsku v režimu přenesení — odběratel přiznává a zároveň odpočítává DPH (§92a)',
    category: 'special',
    vatReturnRow: 10,
  },
  {
    code: 15,
    label: 'Plnění osvobozená bez nároku na odpočet',
    description: 'Plnění osvobozená od daně bez nároku na odpočet (§51)',
    category: 'special',
    vatReturnRow: 50,
  },
  {
    code: 16,
    label: 'Oprava základu daně',
    description: 'Oprava základu daně a výše daně (§42, §43)',
    category: 'special',
  },
  {
    code: 17,
    label: 'Režim jednoho správního místa (OSS)',
    description: 'Zvláštní režim jednoho správního místa — One Stop Shop (§110a a násl.)',
    category: 'special',
  },
  {
    code: 18,
    label: 'Zvláštní režim — cestovní služby',
    description: 'Zvláštní režim pro cestovní služby (§89)',
    category: 'special',
  },
  {
    code: 19,
    label: 'Zvláštní režim — použité zboží',
    description: 'Zvláštní režim pro obchodníky s použitým zbožím (§90)',
    category: 'special',
  },
  {
    code: 20,
    label: 'Zvláštní režim — investiční zlato',
    description: 'Zvláštní režim pro investiční zlato (§92)',
    category: 'special',
  },
  {
    code: 21,
    label: 'Plnění nepatřící do DPH',
    description: 'Plnění, která nejsou předmětem daně (mimo DPH režim)',
    category: 'special',
  },

  // ============================================
  // REVERSE CHARGE — specifické komodity (§92b–§92g)
  // ============================================
  {
    code: 92,
    label: 'Reverse charge — stavební práce',
    description: 'Poskytnutí stavebních a montážních prací (§92e, CZ-CPA 41-43)',
    category: 'reverse_charge',
    vatReturnRow: 10,
  },
  {
    code: 93,
    label: 'Reverse charge — odpady a šrot',
    description: 'Dodání kovového odpadu a šrotu (§92c)',
    category: 'reverse_charge',
    vatReturnRow: 10,
  },
  {
    code: 94,
    label: 'Reverse charge — elektřina a plyn',
    description: 'Dodání elektřiny a plynu obchodníkovi (§92d)',
    category: 'reverse_charge',
    vatReturnRow: 10,
  },
  {
    code: 95,
    label: 'Reverse charge — obiloviny a technické plodiny',
    description: 'Dodání obilovin a technických plodin (§92f, příloha č. 7)',
    category: 'reverse_charge',
    vatReturnRow: 10,
  },
  {
    code: 96,
    label: 'Reverse charge — kovy',
    description: 'Dodání kovů a polotovarů z kovů (§92f, příloha č. 6)',
    category: 'reverse_charge',
    vatReturnRow: 10,
  },
  {
    code: 97,
    label: 'Reverse charge — mobilní telefony a tablety',
    description: 'Dodání mobilních telefonů, tabletů a herních konzolí nad 100 000 Kč (§92f)',
    category: 'reverse_charge',
    vatReturnRow: 10,
  },
  {
    code: 98,
    label: 'Reverse charge — povolenky na emise',
    description: 'Převod povolenek na emise skleníkových plynů (§92b)',
    category: 'reverse_charge',
    vatReturnRow: 10,
  },
]

// Helpers
export function getSupplyCodeByCode(code: number): VatSupplyCode | undefined {
  return VAT_SUPPLY_CODES.find(c => c.code === code)
}

export function getSupplyCodesByCategory(category: VatSupplyCode['category']): VatSupplyCode[] {
  return VAT_SUPPLY_CODES.filter(c => c.category === category)
}

export const SUPPLY_CODE_CATEGORIES = [
  { key: 'domestic' as const, label: 'Tuzemsko' },
  { key: 'eu' as const, label: 'EU / Zahraničí' },
  { key: 'special' as const, label: 'Speciální režimy' },
  { key: 'reverse_charge' as const, label: 'Přenesení daňové povinnosti' },
]
