/**
 * Dohoda o Poskytování Služeb — generator for accounting services contract.
 * Based on Zajíček Consulting s.r.o. template (smlouva-ucetnictvi-vzor.pdf).
 * 6 articles + price list appendix (7 subject types + additional fees).
 */

export interface UcetniSmlouvaData {
  // Client
  firma_nazev: string
  firma_ico: string
  firma_dic: string | null
  firma_adresa: string
  firma_korespondencni_adresa: string | null
  firma_ds: string | null
  firma_email: string
  firma_telefon: string | null
  firma_jednatel: string

  // Dates
  datum_dnes: string
  misto: string
}

export function generateUcetniSmlouva(d: UcetniSmlouvaData): string {
  return `DOHODA O POSKYTOVÁNÍ SLUŽEB


Poskytovatel je společnost Zajíček Consulting s.r.o. se sídlem Nové Sady 988/2, 602 00 Brno,
IČ: 07343957, DIČ: CZ07343957, zastoupena jednatelem Radimem Zajíčkem.
Kontaktní údaje: datová schránka gardk4g, email radim.zajicek@icloud.com, telefon +420 725 329 902


Klient:
   Jméno/Název firmy: ${d.firma_nazev}
   IČ: ${d.firma_ico}
   Sídlo/Adresa: ${d.firma_adresa}${d.firma_dic ? `
   DIČ: ${d.firma_dic}` : ''}${d.firma_korespondencni_adresa ? `
   Korespondenční adresa: ${d.firma_korespondencni_adresa}` : ''}${d.firma_ds ? `
   DS: ${d.firma_ds}` : ''}
   Email: ${d.firma_email}${d.firma_telefon ? `
   Telefon: ${d.firma_telefon}` : ''}


ČLÁNEK 1: PŘEDMĚT SMLOUVY

Poskytovatel se zavazuje poskytovat Klientovi služby (dále jen „Služby") v rozsahu
a za podmínek stanovených touto smlouvou. Služby mohou zahrnovat, mimo jiné, účetní,
poradenské, realitní a další činnosti, které budou specifikovány na základě aktuálních
potřeb Klienta a možností Poskytovatele.


ČLÁNEK 2: CENA A PLATEBNÍ PODMÍNKY

1. Cena za poskytované Služby bude určena dle aktuálního ceníku, který je přílohou
   této dohody.
2. Faktury budou splatné do 7 dnů od data vystavení.
3. V případě prodlení s platbou je Klient povinen uhradit smluvní pokutu ve výši
   3% z dlužné částky za každý započatý týden prodlení.
4. V případě změny ceníku bude Klient informován elektronickou nebo fyzickou
   písemnou formou.


ČLÁNEK 3: POVINNOSTI POSKYTOVATELE

1. Poskytovatel bude poskytovat Služby v souladu se svými možnostmi a aktuální
   dostupností.
2. Informování Klienta o všech skutečnostech bude probíhat na základě specifických
   požadavků Klienta.
3. Poskytovatel může, na základě svých možností a dostupných kapacit, rozhodnout
   o přijetí nebo odmítnutí požadavků Klienta.


ČLÁNEK 4: POVINNOSTI KLIENTA

1. Klient se zavazuje poskytovat Poskytovateli veškeré potřebné dokumenty a informace
   včas a ve správné formě, aby mohl Poskytovatel řádně vykonávat své služby.
2. Klient se zavazuje platit za všechny požadavky, které předloží Poskytovateli.
3. Klient dále souhlasí s tím, že jakékoliv požadavky nad rámec základního
   poskytovaného paušálu budou účtovány podle aktuálního ceníku Poskytovatele.


ČLÁNEK 5: TRVÁNÍ A UKONČENÍ SMLOUVY

1. Tato dohoda se uzavírá na dobu neurčitou s možností výpovědi ze strany obou
   smluvních stran.
2. Výpovědní lhůta činí 2 měsíce a počíná běžet prvním dnem následujícího měsíce
   po doručení výpovědi druhé smluvní straně.


ČLÁNEK 6: ZÁVĚREČNÁ USTANOVENÍ

1. Tato dohoda nabývá platnosti a účinnosti dnem podpisu oběma smluvními stranami.
2. Smluvní strany prohlašují, že si dohodu přečetly, rozumějí jejímu obsahu
   a souhlasí s ní.
3. Tato dohoda je vyhotovena ve dvou stejnopisech, z nichž každá smluvní strana
   obdrží jeden.


V ${d.misto} dne ${d.datum_dnes}


Za Poskytovatele:                         Za Klienta:

_________________________                 _________________________
Radim Zajíček, jednatel                   ${d.firma_jednatel}


===========================================================================================

PŘÍLOHA: CENÍK SPOLEČNOSTI ZAJÍČEK CONSULTING S.R.O.
Platný od 3.6.2024 (Pokud není uvedeno jinak, ceny jsou uvedeny bez DPH)


PORADENSKÉ SLUŽBY

   Hodinová taxa:      2 500 CZK + DPH / hodina
   Cestovní náklady:      25 CZK + DPH / km
   Promeškaný čas:       500 CZK + DPH / hodina


ÚČETNÍ SLUŽBY

Typy subjektů a jejich základní ceník:

   1. S.R.O. plátce DPH                           4 500 CZK + DPH / měsíc
   2. S.R.O. neplátce DPH                          3 500 CZK + DPH / měsíc
   3. Fyzická osoba podnikající (FOP) plátce DPH   4 000 CZK + DPH / měsíc
   4. FOP neplátce DPH                              3 000 CZK + DPH / měsíc
   5. FOP přiznání k dani z příjmu                  2 500 CZK + DPH / rok
   6. Zaměstnanec přiznání k dani z příjmu          2 000 CZK + DPH / rok
   7. Evidence zaměstnance                            500 CZK + DPH / měsíc


Standardní služby v rámci paušálu:
   - Základní vedení účetnictví
   - Měsíční/čtvrtletní DPH přiznání (pro plátce DPH)
   - Měsíční závěrka
   - Zpracování mezd (dle paušálu za zaměstnance), Podávání přehledů
   - Základní komunikace s úřady


DODATEČNÉ POPLATKY

Dodatečné doklady:
   - Do 100 dokladů/měsíc: v ceně paušálu
   - Nad 100 dokladů/měsíc: 500 CZK + DPH za každých dalších 50 dokladů

Výpisy z účtu s velkým množstvím položek:
   - Do 50 položek/měsíc: v ceně paušálu
   - Nad 50 položek/měsíc: 500 CZK + DPH za každých dalších 25 položek

Evidence Exekuce:
   - Do 5 položek/měsíc: 100 CZK + DPH / exekuce
   - 6 a více položek/měsíc: 50 CZK + DPH / každá další exekuce

Nadstandardní komunikace s úřady / Exekutory / Bankami / atd.:
   - Komunikace: 500 CZK + DPH / hod
   - Příprava podkladů: 1 000 CZK + DPH / hod


VÝKONNOSTNÍ ODMĚNA

   20% z dosažené úspory nebo vytvořené příležitosti pro zisk`
}
