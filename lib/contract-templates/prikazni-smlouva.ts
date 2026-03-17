/**
 * Příkazní smlouva — generator for insurance case representation contract.
 * 12 articles covering mandate, scope, fees, obligations, termination, GDPR, etc.
 */

export interface ContractData {
  // Client (principal)
  firma_nazev: string
  firma_ico: string
  firma_adresa: string
  firma_jednatel: string
  podepisujici_jmeno: string
  podepisujici_email: string

  // Agent (mandatary / accountant firm)
  ucetni_firma: string
  ucetni_jmeno: string
  ucetni_email: string

  // Insurance case
  pu_cislo: string
  pojistovna_nazev: string
  pu_popis: string
  pu_datum: string

  // Fees
  success_fee_procent: string
  fixni_odmena: string

  // Dates
  datum_dnes: string
}

export function generatePrikazniSmlouva(d: ContractData): string {
  return `PŘÍKAZNÍ SMLOUVA
o zastupování při likvidaci pojistné události

uzavřená dle § 2430 a násl. zákona č. 89/2012 Sb., občanský zákoník


ČLÁNEK I. — SMLUVNÍ STRANY

1. Příkazce (klient):
   ${d.firma_nazev}
   IČO: ${d.firma_ico}
   Sídlo: ${d.firma_adresa}
   Zastoupen: ${d.firma_jednatel || d.podepisujici_jmeno}
   E-mail: ${d.podepisujici_email}

2. Příkazník (zástupce):
   ${d.ucetni_firma}
   Zastoupen: ${d.ucetni_jmeno}
   E-mail: ${d.ucetni_email}


ČLÁNEK II. — PŘEDMĚT SMLOUVY

Příkazce touto smlouvou zmocňuje příkazníka k zastupování při řešení pojistné události:
   Číslo případu: ${d.pu_cislo}
   Pojišťovna: ${d.pojistovna_nazev}
   Popis události: ${d.pu_popis}
   Datum vzniku: ${d.pu_datum}


ČLÁNEK III. — ROZSAH ZMOCNĚNÍ

Příkazník je oprávněn zejména:
a) komunikovat s pojišťovnou jménem příkazce,
b) podávat hlášení a doplňovat dokumentaci k pojistné události,
c) zajistit znalecké posudky a odborná vyjádření,
d) jednat o výši pojistného plnění,
e) podávat námitky a odvolání proti rozhodnutím pojišťovny,
f) přebírat korespondenci od pojišťovny týkající se dané pojistné události.


ČLÁNEK IV. — ODMĚNA

1. Za služby dle této smlouvy náleží příkazníkovi:
   a) Fixní odměna: ${d.fixni_odmena} Kč (vč. DPH), splatná při podpisu smlouvy.
   ${d.success_fee_procent ? `b) Success fee: ${d.success_fee_procent} % z vyplaceného pojistného plnění nad rámec částky,
      kterou pojišťovna nabídla před zahájením zastupování.` : 'b) Success fee: neaplikuje se.'}

2. V případě neúspěchu (zamítnutí nároku) se success fee neúčtuje.


ČLÁNEK V. — POVINNOSTI PŘÍKAZCE

Příkazce se zavazuje:
a) poskytnout příkazníkovi veškeré dostupné podklady a informace,
b) udělit plnou moc dle článku VI.,
c) neprodleně informovat příkazníka o jakékoli komunikaci s pojišťovnou,
d) uhradit sjednanou odměnu ve stanovených termínech.


ČLÁNEK VI. — PLNÁ MOC

Současně s touto smlouvou uděluje příkazce příkazníkovi plnou moc k zastupování
v rozsahu dle článku III. Plná moc tvoří nedílnou přílohu této smlouvy.


ČLÁNEK VII. — POVINNOSTI PŘÍKAZNÍKA

Příkazník se zavazuje:
a) jednat s odbornou péčí a v nejlepším zájmu příkazce,
b) průběžně informovat příkazce o stavu řízení,
c) bez zbytečného odkladu předávat příkazci veškeré získané dokumenty,
d) zachovávat mlčenlivost o všech skutečnostech, o nichž se dozví v souvislosti
   s plněním této smlouvy.


ČLÁNEK VIII. — DOBA TRVÁNÍ

1. Tato smlouva se uzavírá na dobu určitou, a to do pravomocného ukončení
   pojistné události nebo do výplaty pojistného plnění.
2. Smlouva může být ukončena i dohodou smluvních stran nebo výpovědí dle článku IX.


ČLÁNEK IX. — UKONČENÍ SMLOUVY

1. Příkazce může smlouvu kdykoli vypovědět bez udání důvodu.
   V takovém případě náleží příkazníkovi fixní odměna a poměrná část success fee
   za dosud vyjednaná plnění.
2. Příkazník může smlouvu vypovědět s 30denní výpovědní lhůtou.
3. Výpověď musí být učiněna písemně (e-mailem s potvrzením doručení).


ČLÁNEK X. — OCHRANA OSOBNÍCH ÚDAJŮ

1. Příkazník zpracovává osobní údaje příkazce pouze za účelem plnění
   této smlouvy, v souladu s nařízením (EU) 2016/679 (GDPR).
2. Osobní údaje budou uchovány po dobu trvání smlouvy a dále po dobu
   nezbytnou pro plnění právních povinností (max. 10 let).
3. Příkazce má právo na přístup, opravu a výmaz svých osobních údajů.


ČLÁNEK XI. — ROZHODNÉ PRÁVO A ŘEŠENÍ SPORŮ

1. Tato smlouva se řídí právním řádem České republiky.
2. Případné spory budou řešeny přednostně smírnou cestou.
3. Není-li smír možný, je k rozhodnutí příslušný obecný soud.


ČLÁNEK XII. — ZÁVĚREČNÁ USTANOVENÍ

1. Tato smlouva je vyhotovena ve dvou stejnopisech, po jednom pro každou
   smluvní stranu.
2. Smlouva nabývá účinnosti dnem podpisu oběma smluvními stranami.
3. Nedílnou přílohou smlouvy je plná moc.


V ______________________ dne ${d.datum_dnes}



_________________________          _________________________
${d.podepisujici_jmeno}             ${d.ucetni_jmeno}
Příkazce                            Příkazník`
}
