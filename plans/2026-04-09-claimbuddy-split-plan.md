# ClaimBuddy Split Plan

Status: active
Created: 2026-04-09
Owner: Codex
Execution branch: `claimbuddy-split`
Execution worktree: `/root/Projects/ClaimBuddy`
Source repo kept stable: `/root/Projects/UcetniWebApp`

## Goal

Oddělit claims doménu do samostatné aplikace bez rozbití fungující účetní aplikace.

## Guardrails

- Žádné runtime zásahy do živé účetní aplikace během extrakce.
- Všechny claims-only změny se dělají ve worktree `ClaimBuddy`.
- Účetní aplikace zůstává source of truth pro účetní firmy a klienty, dokud nebude hotový bridge.
- Claims a accounting se nesmí dál spojovat přes nové přímé joiny nebo sdílené UI přepínače.
- Každá fáze musí mít rollback.

## Backups

- Git tag: `claimbuddy-pre-split-2026-04-09`
- Git bundle: `/root/Projects/_archive/UcetniWebApp-pre-claimbuddy-split-2026-04-09.bundle`
- Source commit: `e0f30abca52cb1aee8d0e0bfdbca31aa8b09caae`

## Phase 0: Freeze And Prepare

- Keep `UcetniWebApp` on stable path and branch.
- Work only in `/root/Projects/ClaimBuddy`.
- Do not remove claims code from accounting app in this phase.

## Phase 1: Claims-Only Bootstrap

- Make ClaimBuddy default to claims landing and claims branding.
- Disable cross-product switchers in ClaimBuddy.
- Default login to claims UX even on staging domains.
- Keep existing claims staff routes working, even if they still live under `/accountant/claims`.

Definition of done:

- `/` opens claims flow, not accounting landing.
- Login opens claims UX by default.
- No visible switch between accounting and claims.

Rollback:

- Drop the worktree or reset branch to the backup commit.

## Phase 2: Data Boundary

- Inventory every claims dependency on accounting tables, auth, and shared company records.
- Add explicit external identifiers for synced companies and clients.
- Replace direct assumptions with bridge-based reads or import tables.

Definition of done:

- Claims can read required company/client context without direct coupling to accounting UI modules.

Rollback:

- Keep old claims joins in place behind feature flag until bridge is verified.

## Phase 3: Bridge

- Expose only the minimum accounting data needed by claims.
- Sync companies and selected client contacts from accounting into ClaimBuddy.
- Keep link table or external ID mapping between accounting company and claims company.

Definition of done:

- A client/accounting company can be linked across systems without shared navigation state.

Rollback:

- Disable sync jobs and fall back to manual linking.

## Phase 4: Cutover

- Deploy ClaimBuddy on its own domain and environment.
- Move claims traffic to ClaimBuddy.
- Leave old claims entries in accounting app as redirects or read-only links during transition.

Definition of done:

- Claims operations run in ClaimBuddy only.
- Accounting app remains stable and no longer owns claims runtime.

Rollback:

- Re-point DNS and traffic to the previous claims host/runtime.

## Current Execution Log

- 2026-04-09: created local backup tag and bundle.
- 2026-04-09: created isolated worktree `/root/Projects/ClaimBuddy` on branch `claimbuddy-split`.
- 2026-04-09: started Phase 1 claims-only bootstrap in ClaimBuddy.
- 2026-04-09: added dedicated claims DB config, bootstrap SQL, local Supabase stack, and DB sync script.
- 2026-04-09: migrated current claims dataset into isolated local ClaimBuddy DB.
- 2026-04-09: added storage sync script and confirmed current missing claims files belong to test fixture data, not production data.
- 2026-04-09: added claims-only middleware guards so ClaimBuddy no longer routes users into accounting frontend flows.
- 2026-04-09: prepared standalone server deploy checklist in `docs/claimbuddy-server-deploy.md`.
- 2026-04-09: completed standalone claims split, committed it as `4643bbf3d6e6f3886cebbf2c4ce8dbe8ddeeb742`, and pushed branch `claimbuddy-split` to GitHub.
- 2026-04-09: created rollout execution plan in `plans/2026-04-09-claimbuddy-rollout-plan.md`.

## Next Step

Next execution phase is server rollout, not more split work.

- waiting for target server access
- waiting for claims backend provisioning
- use `plans/2026-04-09-claimbuddy-rollout-plan.md` as the active operational checklist
