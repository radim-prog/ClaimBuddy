# ClaimBuddy Dependency Inventory

Created: 2026-04-09
Branch: `claimbuddy-split`
Purpose: identify what still binds claims to accounting so the split can continue without breaking either product.

## Primary Runtime Couplings

### Shared company record

- Claims cases still join directly to `companies` through `insurance_cases.company_id`.
- Main store joins are in [insurance-store.ts](/root/Projects/ClaimBuddy/lib/insurance-store.ts#L44).
- Public and staff claims company views still load company context from `/api/claims/company-profile`.

Impact:

- ClaimBuddy still assumes accounting-style company records exist locally.

### Client identity mapping

- Client claims listing resolves the company through `client_users.company_id` in [route.ts](/root/Projects/ClaimBuddy/app/api/client/claims/route.ts#L12).
- Client claims timeline and contracts routes follow the same model.

Impact:

- Client access still depends on the accounting-side client membership model.

### Explicit accounting bridge link

- Claims already has a direct bridge field `insurance_cases.accounting_company_id` managed by [link-company route](/root/Projects/ClaimBuddy/app/api/claims/link-company/route.ts#L8).

Impact:

- This is the correct extraction direction.
- It should become the canonical cross-system link, not an extra field beside hard joins forever.

### Existing bridge API

- Accounting already exposes `/api/bridge/companies` in [route.ts](/root/Projects/ClaimBuddy/app/api/bridge/companies/route.ts#L7).
- Accounting also exposes `/api/bridge/closures` in [route.ts](/root/Projects/ClaimBuddy/app/api/bridge/closures/route.ts#L7).

Impact:

- We do not need shared UI state to connect both systems.
- We can move toward explicit sync/import instead.

## UI Couplings

### Shared module switching

- Staff switcher is in [app-switcher.tsx](/root/Projects/ClaimBuddy/components/app-switcher.tsx#L1).
- Client switcher is in [client-module-switcher.tsx](/root/Projects/ClaimBuddy/components/client/client-module-switcher.tsx#L1).
- Active module state is in [active-module-context.tsx](/root/Projects/ClaimBuddy/lib/contexts/active-module-context.tsx#L1).

Current status:

- Phase 1 disables these switchers in ClaimBuddy so the new app stops pretending to be a combined product.

### Accountant views consuming claims

- Accountant client layouts and dashboards still fetch claims directly, for example:
  [page.tsx](/root/Projects/ClaimBuddy/app/accountant/clients/[companyId]/claims/page.tsx#L92)
  [layout.tsx](/root/Projects/ClaimBuddy/app/accountant/clients/[companyId]/layout.tsx#L216)
  [page.tsx](/root/Projects/ClaimBuddy/app/accountant/claims/dashboard/page.tsx#L56)

Impact:

- These remain valid inside ClaimBuddy for now, but they must eventually be re-framed as claims staff views, not accounting views.

## Safe Next Extraction Steps

1. Create claims-owned company projection tables or synced mirror records keyed by `accounting_company_id`.
2. Move client claims access from raw `client_users.company_id` assumptions to a claims-side membership mapping.
3. Rename or re-route staff claims pages away from `/accountant/claims` after claims auth is stable.
4. Keep accounting app on its existing paths until ClaimBuddy cutover is complete.
