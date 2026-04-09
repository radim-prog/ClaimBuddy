# ClaimBuddy Rollout Plan

Status: active
Created: 2026-04-09
Owner: Codex
Execution branch: `claimbuddy-split`
Execution commit: `4643bbf3d6e6f3886cebbf2c4ce8dbe8ddeeb742`
Execution worktree: `/root/Projects/ClaimBuddy`

## Objective

Dotáhnout ClaimBuddy z hotového splitu do reálně nasazeného produktu pro:

- klienty pojistných událostí
- zpracovatele pojistných událostí

tak, aby účetní aplikace zůstala beze změny a rollback byl jednoduchý.

## Current State

Hotové:

- standalone claims codebase existuje v samostatném worktree a větvi
- claims-only runtime, routing a branding jsou hotové
- vlastní claims DB bootstrap a sync skripty existují
- deploy a smoke skripty existují
- klientský invite flow a client access přes `client_users` jsou ověřené lokálně
- branch `claimbuddy-split` je pushnutá na GitHub

Nehotové mimo kód:

- serverový checkout
- produkční nebo staging claims backend
- produkční env
- staging deploy
- UAT sign-off
- produkční cutover

## Hard Gate

Bez přístupu na cílový server nelze plán dokončit. Do té doby lze připravovat jen:

- rollout dokumentaci
- preflight checklist
- env šablony
- deploy skripty
- testovací postupy

## Execution Order

### Phase 1: Server Inventory

Status: pending external access

Checklist:

- potvrdit cílový server, uživatele a checkout path
- potvrdit cílovou doménu
- potvrdit, zda poběží self-hosted Supabase stack nebo jiný Supabase-compatible backend
- potvrdit, odkud se budou brát produkční env proměnné

Definition of done:

- známe server path, service names, doménu a umístění env souborů

### Phase 2: Claims Backend Provisioning

Status: pending external access

Checklist:

- vytvořit vlastní claims backend
- aplikovat `supabase/claimbuddy.bootstrap.sql`
- založit storage bucket(y) pro claims soubory
- připravit service role, anon key a public URL

Definition of done:

- ClaimBuddy má vlastní funkční auth, REST a storage backend

### Phase 3: Staging Deploy

Status: pending external access

Checklist:

- vytvořit serverový checkout z `origin/claimbuddy-split`
- připravit env soubor
- spustit `scripts/claimbuddy-preflight.sh`
- pustit DB dry-run sync
- pustit DB sync
- sestavit app
- zvednout systemd service nebo ekvivalent

Definition of done:

- staging URL vrací `200` pro `/claims`, `/auth/login`, `/api/health`

### Phase 4: Staging UAT

Status: pending external access

Checklist:

- staff login
- klientská pozvánka
- klientská registrace přes token
- klientský seznam případů
- detail případu
- timeline
- zprávy
- úkoly
- soubory upload/delete

Definition of done:

- claims tým potvrdí, že reálné pracovní flow je použitelné bez účetní app

### Phase 5: Production Cutover

Status: pending staging sign-off

Checklist:

- nasadit stejný build nebo stejný commit na produkční claims host
- spustit preflight
- spustit smoke test
- přepnout reverse proxy nebo DNS
- potvrdit health a základní login flow

Definition of done:

- klienti a zpracovatelé používají ClaimBuddy na samostatné claims doméně

### Phase 6: Post-Cutover Stabilization

Status: pending production launch

Checklist:

- sledovat `api/health`
- sledovat login chyby
- sledovat upload souborů
- sledovat pozvánky a registrace
- potvrdit, že účetní app běží beze změny

Definition of done:

- 24h bez kritické claims regresní chyby

## First Runnable Step

První reálně vykonatelný krok po získání serverového přístupu:

```bash
git clone --branch claimbuddy-split https://github.com/radim-prog/UcetniWebApp.git ClaimBuddy
cd ClaimBuddy
cp scripts/claimbuddy-deploy.env.example /path/to/claimbuddy.env
bash scripts/claimbuddy-preflight.sh /path/to/claimbuddy.env
```

## Rollback Rule

V každé fázi musí rollback znamenat pouze:

- zastavit ClaimBuddy deploy
- vrátit reverse proxy nebo DNS
- nechat účetní aplikaci běžet beze změny

Nikdy neprovádět rollback přepisem nebo resetem účetní aplikace.

## Notes

- Tento rollout plán navazuje na `plans/2026-04-09-claimbuddy-split-plan.md`.
- Pokud vznikne novější rollout plán, tento soubor označit jako superseded.
