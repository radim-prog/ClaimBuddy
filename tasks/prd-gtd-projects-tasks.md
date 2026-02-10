# PRD: GTD Projekty a Ukoly - Interaktivni System

## Introduction

Kompletni system pro spravu ukolu a projektu podle GTD (Getting Things Done) metodologie s interaktivnim diagramem propadavani, R-Tasks scoring systemem, location-based tasks a projektovym managementem. System nahrazuje stavajici jednoduchou tabulku ukolu interaktivnim, gamifikovanym prostredim kde uzivatele (ucetni) mohou rychle tridit, hodnotit a organizovat svou praci.

**Problem:** Ucetni firma zpracovava stovky ukolu mesicne pro 120 klientu. Aktualne je sprava ukolu pres jednoduchou tabulku bez prioritizace, bez kontextu mista a bez vizualni hierarchie. Ukoly se hromadi, dulezite veci se ztraci v mase trivialnich.

**Reseni:** Interaktivni GTD diagram kde ukol "propada" rozhodovacim stromem, na konci je ohodnocen R-Tasks scoringem a zarazen do spravne kategorie. Projekty rozkladaji velke ukoly na zvladnutelne faze.

## Goals

- Implementovat kompletni GTD workflow: Inbox → Clarify → Organize → Review → Engage
- Interaktivni "propadavaci" diagram vizualne inspirovany GTD knizkou (klikaci, animovany)
- R-Tasks scoring pres wizard (otazky → score → priorita)
- Location-based tasks: 2-minutove ukoly vazane na mista
- Projekty s fazemi a dilcimi ukoly (nove Supabase tabulky)
- Gamifikace: vizualni satisfakce pri dokonceni, progress bary, streaky

## User Stories

### US-001: GTD Inbox - Rychly vstup ukolu
**Description:** Jako ucetni chci rychle zapsat ukol/myslenku do inboxu, abych ji nezapomnel a mohl se k ni vratit.

**Acceptance Criteria:**
- [ ] Floating "+" button na kazde strance (bottom-right)
- [ ] Kliknuti otevre minimalni formular: jen Title + volitelny Description
- [ ] Keyboard shortcut `Ctrl+N` pro novy ukol
- [ ] Ukol se ulozi do Supabase se statusem 'pending' (inbox)
- [ ] Po ulozeni se zobrazi toast "Ukol pridan do Inboxu"
- [ ] Inbox badge v sidebaru ukazuje pocet neprozkoumanych ukolu
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-002: GTD Clarify - Interaktivni propadavaci diagram
**Description:** Jako ucetni chci vizualne tridit ukoly z inboxu pres interaktivni GTD diagram, abych kazdy ukol zaradil na spravne misto.

**Acceptance Criteria:**
- [ ] Stranka /accountant/tasks/clarify s vizualnim GTD diagramem
- [ ] Diagram zobrazuje aktualni ukol navrchu s animaci "propadavani"
- [ ] Krok 1: "Je to actionable?" → Ano/Ne
  - Ne → "Reference" (ulozit jako poznamku) nebo "Someday/Maybe" nebo "Smazat"
- [ ] Krok 2: "Zabere to mene nez 2 minuty?" → Ano/Ne
  - Ano → "Udelej to HNED" (timer 2 min se spusti, ukol se oznaci jako quick_action)
  - Ne → pokracuj dal
- [ ] Krok 3: "Je to projekt (vice kroku)?" → Ano/Ne
  - Ano → presmeruj na vytvoreni projektu (US-007)
  - Ne → pokracuj
- [ ] Krok 4: "Muzes to delegovat?" → Ano (vyber komu) / Ne (je to na tobe)
- [ ] Krok 5: "Kdy to ma byt hotove?" → Vyber deadline
- [ ] Krok 6: R-Tasks Scoring Wizard (US-003)
- [ ] Kazdy krok ma animaci prechodu (slide down / fade)
- [ ] Progress bar ukazuje kolik ukolu z inboxu zbyla
- [ ] Po zpracovani vsech ukolu: celebracni animace
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-003: R-Tasks Scoring Wizard
**Description:** Jako ucetni chci rychle ohodnotit ukol pomoci interaktivniho wizardu s otazkami, abych ziskal automatickou prioritu.

**Acceptance Criteria:**
- [ ] Wizard se zobrazi jako posledni krok GTD Clarify (US-002) nebo pri rucnim hodnoceni
- [ ] Otazka 1 - Money: "Kolik to vydelat/usetri?"
  - 0: "Nic / pod 5 000 Kc"
  - 1: "5 000 - 15 000 Kc"
  - 2: "15 000 - 50 000 Kc"
  - 3: "Nad 50 000 Kc"
- [ ] Otazka 2 - Fire: "Jak je to nalehave?"
  - 0: "Klidne, cas je dost"
  - 1: "Normalni, bez stresu"
  - 2: "Horici, brzy deadline"
  - 3: "Kriticke! Dnes/zitra!"
- [ ] Otazka 3 - Time: "Jak dlouho to zabere?"
  - 0: "Den a vice"
  - 1: "2-4 hodiny"
  - 2: "Pod 1 hodinu"
  - 3: "Pod 30 minut"
- [ ] Otazka 4 - Distance: "Kde to udelat?"
  - 0: "Musim nekam jet"
  - 1: "Lokalne v kancelari/blizko"
  - 2: "U pocitace, bez cestovani"
- [ ] Otazka 5 - Personal: "Jak se u toho citim?"
  - 0: "Nechce se mi, otravne"
  - 1: "OK, normalni prace"
- [ ] Kazda otazka = jeden klik na kartu (ne dropdown)
- [ ] Total Score = suma vsech (max 12)
- [ ] Priority se automaticky urci: >= 9 High, >= 6 Medium, < 6 Low
- [ ] Vizualni zobrazeni vysledku: barvena karta s prioritou
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-004: Location-based Tasks
**Description:** Jako ucetni chci prirazovat ukolum mista a pri prijezdu na misto videt seznam krátkych ukolu k vyrizeni.

**Acceptance Criteria:**
- [ ] Supabase tabulka 'locations': id, name, icon, user_id, is_default, created_at
- [ ] Preddefinovane lokace: Kancelar, Doma, Posta, Banka, Urad, Klient (s ikonami)
- [ ] Uzivatel muze pridat vlastni lokace v Nastaveni
- [ ] Pri vytvareni/editaci ukolu: volitelne pole "Misto" (select z lokaci)
- [ ] Stranka /accountant/tasks?location=kancelar filtruje ukoly pro dane misto
- [ ] Quick-view panel: "Ukoly pro [Misto]" - zobrazuje jen 2-min ukoly pro dane misto
- [ ] Badge na lokaci ukazuje pocet cekajicich 2-min ukolu
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-005: Supabase tabulky - projects a project_phases
**Description:** Jako developer potrebuji Supabase tabulky pro projekty a faze.

**Acceptance Criteria:**
- [ ] Tabulka `projects`:
  - id (UUID PK), title, description, outcome (cil projektu)
  - status (planning/active/on_hold/review/completed/cancelled)
  - company_id (FK → companies), owner_id (FK → users)
  - due_date, estimated_hours, actual_hours
  - progress_percentage, tags (JSONB)
  - created_at, updated_at, completed_at
- [ ] Tabulka `project_phases`:
  - id (UUID PK), project_id (FK → projects)
  - title, description, position (INT)
  - status (pending/active/completed)
  - due_date, created_at
- [ ] Tabulka `locations`:
  - id (UUID PK), name, icon, user_id (FK → users)
  - is_default (BOOL), created_at
- [ ] ALTER TABLE tasks ADD COLUMN project_id UUID REFERENCES projects(id)
- [ ] ALTER TABLE tasks ADD COLUMN phase_id UUID REFERENCES project_phases(id)
- [ ] ALTER TABLE tasks ADD COLUMN location_id UUID REFERENCES locations(id)
- [ ] ALTER TABLE tasks ADD COLUMN position_in_phase INT
- [ ] ALTER TABLE tasks ADD COLUMN is_next_action BOOL DEFAULT false
- [ ] RLS disabled (service_role)
- [ ] Seed default locations
- [ ] Typecheck passes

### US-006: API Routes pro projekty
**Description:** Jako developer potrebuji CRUD API pro projekty, faze a location-based operace.

**Acceptance Criteria:**
- [ ] `app/api/projects/route.ts` - GET (list), POST (create)
- [ ] `app/api/projects/[id]/route.ts` - GET, PUT, DELETE
- [ ] `app/api/projects/[id]/phases/route.ts` - GET, POST
- [ ] `app/api/projects/[id]/tasks/route.ts` - GET (tasks in project)
- [ ] `app/api/locations/route.ts` - GET, POST
- [ ] `app/api/tasks/route.ts` - UPDATE: pridat location_id, project_id, phase_id
- [ ] Vsechny routes: `export const dynamic = 'force-dynamic'`
- [ ] Vsechny routes pouzivaji `supabaseAdmin` z `lib/supabase-admin.ts`
- [ ] Typecheck passes

### US-007: UI - Vytvoreni projektu
**Description:** Jako ucetni chci vytvorit projekt s cilem, fazemi a dilcimi ukoly.

**Acceptance Criteria:**
- [ ] Stranka /accountant/projects/new s multi-step formularem
- [ ] Krok 1: Nazev projektu, Popis, Cil (outcome), Firma (select)
- [ ] Krok 2: Faze projektu (drag & drop razeni, pridavani/mazani)
- [ ] Krok 3: Deadline, Odhadovany cas
- [ ] Krok 4: Rekapitulace a vytvoreni
- [ ] Po vytvoreni presmerovat na detail projektu
- [ ] Detail projektu: kanban board s fazemi jako sloupci, ukoly jako karticky
- [ ] "Next Action" oznaceni: jeden ukol v projektu je vzdy "dalsi krok"
- [ ] Progress bar: vizualni postup projektu (% dokonceni)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-008: UI - GTD Dashboard redesign
**Description:** Jako ucetni chci na dashboardu videt prehled podle GTD: co delat ted, co ceka, co je v inboxu.

**Acceptance Criteria:**
- [ ] Sekce "Udelej ted" (quick actions < 2 min, high priority)
- [ ] Sekce "Pristi akce" (next actions z projektu + standalone ukoly)
- [ ] Sekce "Ceka na" (waiting_for + waiting_client)
- [ ] Sekce "Inbox" s poctem neprozkoumanych a tlacitkem "Zpracovat" → clarify
- [ ] Sekce "Projekty" s progress bary aktivnich projektu
- [ ] Sekce "Lokace" s kartami mist a poctem 2-min ukolu
- [ ] Kazda sekce je collapsible
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-009: Gamifikace - Vizualni feedback
**Description:** Jako ucetni chci vizualni satisfakci pri dokonceni ukolu a zpracovani inboxu.

**Acceptance Criteria:**
- [ ] Konfeti animace pri dokonceni ukolu (canvas confetti library)
- [ ] "Streak" pocitadlo: kolik dni v rade zpracoval inbox
- [ ] Progress ring na dashboardu: "Dnes hotovo X z Y"
- [ ] Level system: pocet dokoncenich ukolu → level badge
- [ ] Sound effect pri dokonceni (volitelne, vypnutelne v nastaveni)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: System musi podporovat kompletni GTD workflow: Capture → Clarify → Organize → Reflect → Engage
- FR-2: Kazdy ukol musi projit GTD Clarify diagramem pred zarazenim (nebo byt manualne zarazen)
- FR-3: R-Tasks scoring wizard musi byt interaktivni (klikaci karty, ne formular)
- FR-4: Total Score = score_money + score_fire + score_time + score_distance + score_personal (max 12)
- FR-5: Priority se automaticky pocita: score >= 9 = High, >= 6 = Medium, < 6 = Low
- FR-6: Ukoly s estimated_minutes <= 2 jsou automaticky quick_action
- FR-7: Quick actions nevyzaduji R-Tasks scoring (preskoci se)
- FR-8: Projekty musi mit alespon jeden "Next Action" ukol oznaceny
- FR-9: Location-based view zobrazuje jen 2-min ukoly pro dane misto
- FR-10: Inbox badge v sidebaru se aktualizuje v realnem case
- FR-11: Vsechna data persistuji v Supabase PostgreSQL
- FR-12: Existujici data v tabulce 'tasks' zustanou kompatibilni (migrace, ne nahrada)
- FR-13: Interaktivni diagram pouziva CSS animace (transition, transform), ne canvas
- FR-14: Mobilni responzivita: diagram a wizard musi fungovat na mobilu (375px)

## Non-Goals (Out of Scope)

- GPS-based notifikace pri prijezdu na misto (jen manualni filtr)
- AI-driven automaticke prirazovani priorit
- Integrace s externimi task management systemy (Asana, Jira, Todoist)
- Email notifikace o ukolech (uz existuje v jine casti app)
- Multi-user real-time collaboration na projektu
- Gantt chart pro projekty (mozna v budoucnosti)
- Drag & drop presouvani mezi GTD kategoriemi (v1: jen pres wizard)

## Design Considerations

- **GTD Diagram**: Vertikalni flow chart s kartickami, animovany prechod shora dolu
- **Barvy**: Pouzit existujici purple-600 theme, cervena pro urgent, zelena pro done
- **Komponenty**: Reuse shadcn/ui (Card, Button, Badge, Dialog, Progress)
- **Animace**: Framer Motion nebo CSS transitions (preferovat CSS pro performance)
- **Scoring karty**: Velke klikaci karty (ne male radio buttons), kazda s ikonou a popisem
- **Mobilni**: Bottom sheet pro wizard na mobilu misto modal

## Technical Considerations

- **Supabase**: Nove tabulky projects, project_phases, locations + ALTER tasks
- **Existujici typy**: lib/types/tasks.ts uz ma R-Tasks scoring typy, GTDContext, GTDWizardData
- **API Routes**: Nove routes pro projects, locations; update existujicich tasks routes
- **State management**: React hooks + fetch, zadny external state manager
- **Konfeti**: Pouzit `canvas-confetti` npm package (3kB gzipped)
- **Animace**: CSS @keyframes pro propadavani, transition pro hover efekty
- **Performance**: Lazy loading pro diagram komponentu, virtualizace pro velke seznamy
- **Stack**: Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase

## Success Metrics

- Ucetni zpracuje inbox (10 ukolu) pod 5 minut
- R-Tasks scoring: 5 kliknuti na ukol (jedno per otazka)
- 90% ukolu ma prirazenou prioritu (vs. aktualne 0%)
- Projekty s fazemi pouziva alespon 3 ucetni
- Quick actions (2-min) maji 80%+ completion rate
- Prumerna doba v GTD Clarify diagramu: pod 30 sekund na ukol

## Open Questions

- Ma se streak pocitat per-user nebo per-team?
- Maji se archivovane projekty zobrazovat v seznamu (s filtrem)?
- Jak resit konflikty kdyz vice ucetnich edituje stejny projekt?
- Ma wizard ukazovat i "preskocit scoring" tlacitko pro zkusene uzivatele?
