// Tax questionnaire definition — questions, sections, conditional logic

export type QuestionType = 'yesno' | 'text' | 'select' | 'children'

export interface Question {
  id: string
  label: string
  type: QuestionType
  required?: boolean
  conditionalOn?: string // show only when this question id = 'yes'
  placeholder?: string
  options?: { value: string; label: string }[] // for select type
  hint?: string // optional tooltip / explanatory note
  forEntity?: 'FO' | 'PO' // show only for this entity type (undefined = both)
}

export interface Section {
  id: string
  title: string
  icon: string
  questions: Question[]
  allowDocUpload?: boolean
  uploadHint?: string
  relevantForMinimal?: boolean // show even in flat-tax minimal mode
}

export type QuestionnaireResponses = Record<string, string | boolean | ChildEntry[] | null>

export interface ChildEntry {
  name: string
  birth_number: string
}

export const HEALTH_INSURANCE_OPTIONS = [
  { value: 'vzp', label: '111 — VZP' },
  { value: 'vozp', label: '201 — VoZP' },
  { value: 'cpzp', label: '205 — ČPZP' },
  { value: 'ozp', label: '207 — OZP' },
  { value: 'zpmv', label: '211 — ZP MV' },
  { value: 'rbp', label: '213 — RBP' },
  { value: 'zpma', label: '217 — ZP M-A' },
]

export const TAX_QUESTIONNAIRE_SECTIONS: Section[] = [
  // ─── Krok 0: Rychlý přehled (pre-check) ────────────────────────────────────
  {
    id: 'precheck',
    title: 'Rychlý přehled',
    icon: 'zap',
    relevantForMinimal: true,
    questions: [
      {
        id: 'precheck_flat_tax',
        label: 'Platíte paušální daň?',
        type: 'yesno',
        forEntity: 'FO',
        hint: 'Paušální daň zahrnuje daň z příjmu, sociální a zdravotní pojištění v jedné platbě. Pokud jste se k paušálnímu režimu přihlásili u finančního úřadu a FÚ vám účast potvrdil, odpovězte Ano.',
      },
      {
        id: 'precheck_revenue_limit',
        label: 'Vaše roční příjmy z podnikání jsou do 2 000 000 Kč?',
        type: 'yesno',
        conditionalOn: 'precheck_flat_tax',
        forEntity: 'FO',
        hint: 'Paušální daň 1. pásma: limit 1 000 000 Kč, 2. pásmo: 1 500 000 Kč, 3. pásmo: 2 000 000 Kč. Pokud jste v libovolném pásmu a nepřesahujete 2M, odpovězte Ano.',
      },
      {
        id: 'precheck_legal_form',
        label: 'Forma podnikání',
        type: 'select',
        options: [
          { value: 'FO', label: 'Fyzická osoba / OSVČ' },
          { value: 'PO', label: 'Právnická osoba (s.r.o., a.s., …)' },
        ],
        hint: 'Fyzická osoba = OSVČ, živnostník, freelancer. Právnická osoba = společnost s ručením omezeným, akciová společnost apod.',
      },
    ],
  },
  // ─── Sekce 1: Příjmy ────────────────────────────────────────────────────────
  {
    id: 'income',
    title: 'Příjmy',
    icon: 'banknote',
    relevantForMinimal: true,
    allowDocUpload: true,
    uploadHint: 'Potvrzení o příjmech, výpisy z investičních platforem',
    questions: [
      {
        id: 'income_employment',
        label: 'Příjmy ze závislé činnosti (pracovní poměr/brigády)?',
        type: 'yesno',
        hint: 'Příjmy z HPP, DPP nebo DPČ. Účetní potřebuje Potvrzení o zdanitelných příjmech od každého zaměstnavatele.',
      },
      {
        id: 'income_business',
        label: 'Příjmy z podnikání?',
        type: 'yesno',
        forEntity: 'FO',
        hint: 'Příjmy jako OSVČ — z živnosti, svobodného povolání nebo jiné samostatné výdělečné činnosti (§ 7 ZDP).',
      },
      {
        id: 'income_capital',
        label: 'Příjmy z kapitálového majetku (úroky, dividendy, participace)?',
        type: 'yesno',
        hint: 'Dividendy, úroky z dluhopisů, participační listy, podíly na zisku ze zahraničí. Nezahrnuje úroky z bankovního účtu (ty jsou daněny srážkovou daní přímo bankou).',
      },
      {
        id: 'income_rent',
        label: 'Příjmy z nájmu?',
        type: 'yesno',
        hint: 'Příjmy z pronájmu nemovitostí nebo movitých věcí (§ 9 ZDP). Lze uplatnit výdaje paušálem 30 % nebo skutečné výdaje.',
      },
      {
        id: 'income_property_sale',
        label: 'Příjmy z prodeje majetku (nemovitost, vozidlo)?',
        type: 'yesno',
        hint: 'Prodej nemovitosti nebo vozidla. Může být osvobozeno od daně při splnění podmínek (např. bydliště 2 roky, nebo vlastnictví 10 let).',
      },
      {
        id: 'income_securities',
        label: 'Příjmy z prodeje cenných papírů?',
        type: 'yesno',
        hint: 'Prodej akcií, ETF, dluhopisů. Od roku 2025: osvobozeno do 100 000 Kč zisku/rok nebo při držení 3+ roky (akcie do 250 000 Kč/rok).',
      },
      {
        id: 'income_trading',
        label: 'Příjmy z tradingu (forex, deriváty, krypto)?',
        type: 'yesno',
        hint: 'Forex, CFD, kryptoměny, deriváty. Zisky z kryptoměn se zdaňují jako ostatní příjmy (§ 10 ZDP). Osvobození od daně je podmíněno — konzultujte s účetní.',
      },
      {
        id: 'income_pension_cancel',
        label: 'Příjmy z zrušení penzijního/životního pojištění?',
        type: 'yesno',
        hint: 'Předčasné zrušení produktu, u kterého jste uplatňovali odpočet, se zpětně zdaňuje. Pojišťovna by vám měla vystavit potvrzení.',
      },
    ],
  },
  // ─── Sekce 2: Slevy na dani ─────────────────────────────────────────────────
  {
    id: 'deductions',
    title: 'Slevy na dani',
    icon: 'percent',
    allowDocUpload: true,
    uploadHint: 'Potvrzení o studiu dětí, čestné prohlášení manžela/manželky',
    questions: [
      {
        id: 'deduction_children',
        label: 'Sleva na děti?',
        type: 'yesno',
        forEntity: 'FO',
        hint: 'Daňové zvýhodnění: 1. dítě 15 204 Kč/rok, 2. dítě 22 320 Kč/rok, 3. a každé další 27 840 Kč/rok. Uplatnit lze i jako daňový bonus (vrácení přeplatku).',
      },
      {
        id: 'deduction_children_list',
        label: 'Jména a rodná čísla dětí',
        type: 'children',
        conditionalOn: 'deduction_children',
        forEntity: 'FO',
      },
      {
        id: 'deduction_spouse',
        label: 'Sleva na manžela/manželku?',
        type: 'yesno',
        forEntity: 'FO',
        hint: 'Sleva 24 840 Kč: manžel/ka žije ve společné domácnosti a jeho/její vlastní příjmy nepřesáhly 68 000 Kč za rok. Do vlastních příjmů se nepočítají rodičovský příspěvek, přídavky na děti apod.',
      },
      {
        id: 'deduction_spouse_name',
        label: 'Jméno manžela/manželky',
        type: 'text',
        conditionalOn: 'deduction_spouse',
        placeholder: 'Celé jméno',
        forEntity: 'FO',
      },
      {
        id: 'deduction_spouse_bn',
        label: 'Rodné číslo manžela/manželky',
        type: 'text',
        conditionalOn: 'deduction_spouse',
        placeholder: '000000/0000',
        forEntity: 'FO',
      },
      {
        id: 'deduction_disability',
        label: 'Sleva na invaliditu?',
        type: 'yesno',
        forEntity: 'FO',
        hint: '1. nebo 2. stupeň invalidity: sleva 2 520 Kč/rok. 3. stupeň invalidity: sleva 5 040 Kč/rok. Nutné rozhodnutí o přiznání invalidního důchodu.',
      },
      {
        id: 'deduction_ztp',
        label: 'Sleva na držitele průkazu ZTP?',
        type: 'yesno',
        forEntity: 'FO',
        hint: 'Průkaz ZTP nebo ZTP/P — sleva 16 140 Kč/rok. Platí pro samotného poplatníka nebo dítě v péči.',
      },
    ],
  },
  // ─── Sekce 3: Odčitatelné položky ──────────────────────────────────────────
  {
    id: 'deductible',
    title: 'Odčitatelné položky',
    icon: 'receipt',
    allowDocUpload: true,
    uploadHint: 'Potvrzení o darech, úrocích, pojištění, DIP',
    questions: [
      {
        id: 'ded_donation',
        label: 'Poskytnutý dar?',
        type: 'yesno',
        hint: 'Dar musí být min. 2 % základu daně nebo alespoň 1 000 Kč. Lze odečíst max. 15 % základu daně. Nutné potvrzení od obdarované organizace.',
      },
      {
        id: 'ded_mortgage',
        label: 'Hypotéční úroky?',
        type: 'yesno',
        hint: 'Úroky z hypotéky nebo úvěru ze stavebního spoření na vlastní bydlení. Max. 150 000 Kč/rok (pro smlouvy uzavřené do 31. 12. 2020) nebo 300 000 Kč (smlouvy od 1. 1. 2021). Nutné potvrzení banky.',
      },
      {
        id: 'ded_pension',
        label: 'Penzijní připojištění / doplňkové penzijní spoření?',
        type: 'yesno',
        forEntity: 'FO',
        hint: 'Příspěvky nad 12 000 Kč/rok lze odečíst (max. 24 000 Kč odpočtu). Platí pro starý produkt penzijního připojištění i nové doplňkové penzijní spoření.',
      },
      {
        id: 'ded_dip',
        label: 'Dlouhodobý investiční produkt (DIP)?',
        type: 'yesno',
        forEntity: 'FO',
        hint: 'DIP je spoření na důchod přes investiční účet (akcie, ETF, fondy). Příspěvky nad 12 000 Kč/rok lze odečíst, max. 48 000 Kč/rok. Nový produkt platný od 1. 1. 2024 — potvrzení vydává finanční instituce.',
      },
      {
        id: 'ded_life_insurance',
        label: 'Životní pojištění?',
        type: 'yesno',
        forEntity: 'FO',
        hint: 'Životní pojištění s rezervotvornou složkou (kapitálové nebo investiční). Max. odpočet 24 000 Kč/rok. Smlouvy uzavřené po 1. 1. 2024 již nárok na odpočet nenabízejí.',
      },
      {
        id: 'ded_union',
        label: 'Odborové příspěvky?',
        type: 'yesno',
        forEntity: 'FO',
        hint: 'Příspěvky odborové organizaci — max. 3 000 Kč/rok nebo 1,5 % zdanitelných příjmů ze závislé činnosti.',
      },
      {
        id: 'ded_exam',
        label: 'Úhrady zkoušky ověřující výsledky vzdělávání?',
        type: 'yesno',
        forEntity: 'FO',
        hint: 'Úhrada za zkoušku, která ověřuje výsledky dalšího vzdělávání (profesní zkoušky, certifikace). Max. 10 000 Kč/rok, ZTP/P 13 000 Kč.',
      },
      {
        id: 'ded_research',
        label: 'Výdaje na výzkum a vývoj?',
        type: 'yesno',
        hint: 'Odpočet výdajů na výzkum a vývoj (§ 34b ZDP). Platí zejména pro firmy s vlastním VaV projektem.',
      },
      {
        id: 'ded_education',
        label: 'Odpočet na podporu odborného vzdělávání?',
        type: 'yesno',
        hint: 'Firmy a OSVČ, které přijímají žáky nebo studenty na praxi. Odpočet dle skutečně vynaložených nákladů na vzdělávání.',
      },
    ],
  },
  // ─── Sekce 4: Zálohy ────────────────────────────────────────────────────────
  {
    id: 'advances',
    title: 'Zálohy',
    icon: 'clock',
    questions: [
      {
        id: 'advance_income_tax',
        label: 'Zálohy na daň z příjmu?',
        type: 'yesno',
        hint: 'Zálohy na DPFO nebo DPPO placené v průběhu roku finančnímu úřadu. Zálohy se odečítají od výsledné daňové povinnosti.',
      },
      {
        id: 'advance_flat_tax',
        label: 'Paušální daň (zálohy)?',
        type: 'yesno',
        forEntity: 'FO',
        hint: 'Pokud platíte paušální daň, zaplatili jste v roce jednu zálohu zahrnující daň, SP i ZP. Potvrďte, aby účetní věděla, že přehledy SP/ZP nevyplňujete.',
      },
    ],
  },
  // ─── Sekce 5: Sociální pojištění ────────────────────────────────────────────
  {
    id: 'social_insurance',
    title: 'Přehledy — Sociální pojištění',
    icon: 'shield',
    allowDocUpload: true,
    uploadHint: 'Potvrzení o zaplacených zálohách z ePortálu ČSSZ',
    questions: [
      {
        id: 'si_variable_symbol',
        label: '8místný variabilní symbol OSSZ',
        type: 'text',
        placeholder: '12345678',
        forEntity: 'FO',
        hint: 'Variabilní symbol pro platbu sociálního pojištění (přiděluje OSSZ). Najdete ho na rozhodnutí o výši záloh nebo v ePortálu ČSSZ.',
      },
      {
        id: 'si_pension_advances',
        label: 'Zálohy na důchodové pojištění?',
        type: 'yesno',
        forEntity: 'FO',
        hint: 'Minimální záloha OSVČ v hlavní činnosti pro rok 2025 je 3 646 Kč/měs. Účetní potřebuje potvrzení o zaplacených zálohách za celý rok.',
      },
      {
        id: 'si_secondary_activity',
        label: 'Činnost vedlejší (zaměstnání, důchod, rodičovská, mateřská, péče, student)?',
        type: 'yesno',
        forEntity: 'FO',
        hint: 'Při vedlejší činnosti je limit pro povinné SP vyšší a zálohy jsou nižší. Vedlejší činnost = jste zároveň zaměstnanec, důchodce, student, rodič na mateřské apod.',
      },
      {
        id: 'si_sickness_insurance',
        label: 'Nemocenské pojištění?',
        type: 'yesno',
        forEntity: 'FO',
        hint: 'Nemocenské pojištění je pro OSVČ DOBROVOLNÉ. Nezaměňujte se zdravotním pojištěním, které je POVINNÉ. Platíte nemocenské jen pokud jste se k němu přihlásili.',
      },
    ],
  },
  // ─── Sekce 6: Zdravotní pojištění ──────────────────────────────────────────
  {
    id: 'health_insurance',
    title: 'Přehledy — Zdravotní pojištění',
    icon: 'heart-pulse',
    allowDocUpload: true,
    uploadHint: 'Přehled záloh z portálu zdravotní pojišťovny',
    questions: [
      {
        id: 'hi_company',
        label: 'Zdravotní pojišťovna',
        type: 'select',
        options: HEALTH_INSURANCE_OPTIONS,
        forEntity: 'FO',
        hint: 'Uveďte pojišťovnu, u které jste byli pojištěni v průběhu roku. Pokud jste pojišťovnu měnili, uveďte tu, u které jste byli na konci roku.',
      },
      {
        id: 'hi_advances',
        label: 'Zálohy na zdravotní pojištění?',
        type: 'yesno',
        forEntity: 'FO',
        hint: 'Minimální záloha ZP pro OSVČ v hlavní činnosti: 2 968 Kč/měs (2025). Potvrzení o zaplacených zálohách získáte z portálu své zdravotní pojišťovny.',
      },
      {
        id: 'hi_secondary_activity',
        label: 'Činnost vedlejší (státní pojištěnec, zaměstnání s min. ZP, nemocenská, ZTP, důchod, celodenní péče)?',
        type: 'yesno',
        forEntity: 'FO',
        hint: 'Pokud splňujete podmínky vedlejší činnosti u ZP, nemusíte platit zálohy během roku a odvod se vyrovná v přehledu.',
      },
    ],
  },
  // ─── Sekce 7: Doplňující informace ─────────────────────────────────────────
  {
    id: 'additional',
    title: 'Doplňující informace',
    icon: 'info',
    questions: [
      {
        id: 'add_business_change',
        label: 'Podnikání zahájeno/přerušeno/ukončeno?',
        type: 'yesno',
        forEntity: 'FO',
        hint: 'Změna v průběhu roku ovlivňuje výpočet záloh SP/ZP a období, za které podáváte přehledy.',
      },
      {
        id: 'add_flat_mode',
        label: 'Paušální výdaje (% z příjmů)?',
        type: 'yesno',
        forEntity: 'FO',
        hint: 'Paušální výdaje = % z příjmů (40–80 % podle druhu činnosti). Alternativa ke skutečným výdajům — jednodušší, ale nelze kombinovat s některými slevami.',
      },
      {
        id: 'add_activity_change',
        label: 'Změna hlavní/vedlejší činnost?',
        type: 'yesno',
        forEntity: 'FO',
        hint: 'Přechod z hlavní na vedlejší činnost (nebo naopak) ovlivňuje výpočet SP a ZP za celý rok.',
      },
    ],
  },
]

export function countAnswered(
  responses: QuestionnaireResponses,
  entityType?: 'FO' | 'PO',
): { answered: number; total: number } {
  let answered = 0
  let total = 0
  for (const section of TAX_QUESTIONNAIRE_SECTIONS) {
    for (const q of section.questions) {
      if (entityType && q.forEntity && q.forEntity !== entityType) continue
      if (q.conditionalOn) {
        if (responses[q.conditionalOn] !== true && responses[q.conditionalOn] !== 'yes') continue
      }
      total++
      const val = responses[q.id]
      if (val !== undefined && val !== null && val !== '') answered++
    }
  }
  return { answered, total }
}
