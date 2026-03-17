/**
 * Plná moc — Power of Attorney generator for insurance case representation.
 */

export interface PowerOfAttorneyData {
  // Principal (client)
  firma_nazev: string
  firma_ico: string
  firma_adresa: string
  firma_jednatel: string
  podepisujici_jmeno: string

  // Agent (mandatary)
  ucetni_firma: string
  ucetni_jmeno: string

  // Insurance case
  pu_cislo: string
  pojistovna_nazev: string
  pu_popis: string

  // Dates
  datum_dnes: string
}

export function generatePlnaMoc(d: PowerOfAttorneyData): string {
  return `PLNÁ MOC

Já, níže podepsaný/á

${d.podepisujici_jmeno}
jednající za: ${d.firma_nazev}
IČO: ${d.firma_ico}
se sídlem: ${d.firma_adresa}

(dále jen „zmocnitel")


tímto uděluji plnou moc

${d.ucetni_jmeno}
jednající za: ${d.ucetni_firma}

(dále jen „zmocněnec")


k zastupování zmocnitele ve věci pojistné události:

   Číslo případu: ${d.pu_cislo}
   Pojišťovna: ${d.pojistovna_nazev}
   Popis: ${d.pu_popis}


ROZSAH ZMOCNĚNÍ

Zmocněnec je oprávněn zejména:

1. Komunikovat s pojišťovnou ${d.pojistovna_nazev} ve věci výše uvedené
   pojistné události, a to včetně písemné i elektronické komunikace.

2. Podávat a doplňovat veškeré dokumenty a podklady potřebné pro řešení
   pojistné události.

3. Nahlížet do spisu pojistné události a pořizovat z něj kopie.

4. Přebírat veškerou korespondenci a rozhodnutí pojišťovny týkající se
   dané pojistné události.

5. Jednat o výši pojistného plnění a uzavírat dohody o narovnání.

6. Podávat námitky, stížnosti a odvolání proti rozhodnutím pojišťovny.

7. Zajistit zpracování znaleckých posudků a odborných vyjádření.

8. Činit veškeré další právní a faktické úkony nezbytné pro úspěšné
   vyřízení pojistné události.


DOBA PLATNOSTI

Tato plná moc se uděluje na dobu neurčitou, nejdéle však do pravomocného
ukončení pojistné události a vyplacení pojistného plnění.

Zmocnitel může tuto plnou moc kdykoli odvolat písemným oznámením doručeným
zmocněnci.


PROHLÁŠENÍ

Zmocnitel prohlašuje, že tuto plnou moc uděluje svobodně a vážně, a že si
je vědom jejího obsahu a právních důsledků.


V ______________________ dne ${d.datum_dnes}



_________________________
${d.podepisujici_jmeno}
za ${d.firma_nazev}
Zmocnitel`
}
