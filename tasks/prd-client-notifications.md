# PRD: Klientský notifikační systém

## Introduction

Systém notifikací pro klienty účetní kanceláře. Klienti uvidí při přihlášení popup modal s nevyřízenými upozorněními (deadline podkladů, neuhrazené faktury, nedodané doklady), které musí odkliknout. Po odkliknutí zůstane malý banner dokud podmínku nesplní. Účetní může notifikace automaticky generovat systémem i vytvářet ručně. Celé nastavení je konfigurovatelné per klient v profilu u účetní.

## Existing Infrastructure

- **DB:** `companies.notification_preferences` JSONB (`email`, `sms`, `push`) already exists
- **Dashboard deadline:** Hardcoded as 15th in `dashboard/page.tsx` line ~85 - needs to become configurable
- **Email UI:** `urgency-email-modal.tsx` exists but API endpoint is TODO
- **Client layout:** `app/client/` pages exist with their own layout
- **Auth:** Custom HMAC-SHA256, middleware sets `x-user-id` header
- **Supabase project:** `ybcubkuskirbspyoxpak`

## Goals

- Klienti vidí popup modal s nesplněnými požadavky při každém přihlášení
- Po odkliknutí modalu zůstane kompaktní banner dokud podmínku nesplní
- Účetní může zapínat/vypínat notifikace per klient a per typ
- Systém automaticky generuje notifikace (deadline podkladů, dluh)
- Účetní může vytvořit vlastní ruční notifikaci pro konkrétního klienta
- Konfigurovatelný globální deadline den (místo hardcoded 15.)
- Email API připraveno (route + šablona), napojení na provider později
- SMS/WhatsApp schema připraveno v DB

## User Stories

### US-001: DB tabulka client_notifications
**Description:** As a developer, I need a database table to store notifications for clients.

**Acceptance Criteria:**
- [ ] Create table `client_notifications` with columns: `id` (uuid PK), `company_id` (FK → companies), `type` (enum: 'deadline_reminder', 'unpaid_invoice', 'missing_documents', 'custom'), `title` (text), `message` (text), `severity` (enum: 'info', 'warning', 'urgent'), `status` (enum: 'active', 'dismissed', 'resolved'), `dismissed_at` (timestamptz null), `resolved_at` (timestamptz null), `auto_generated` (boolean default false), `created_by` (uuid null - accountant who created it), `metadata` (jsonb - for invoice_id, period, amount etc.), `created_at`, `updated_at`
- [ ] Add index on `company_id` + `status` for fast queries
- [ ] Add `deadline_day` column (int, default 15) to a new `app_settings` table (key-value: `setting_key` text PK, `setting_value` jsonb, `updated_at`, `updated_by`)
- [ ] Seed `app_settings` with `deadline_day = 15`
- [ ] Typecheck passes

### US-002: Notification API routes
**Description:** As a developer, I need API endpoints to CRUD notifications.

**Acceptance Criteria:**
- [ ] `GET /api/client/notifications` - returns active notifications for authenticated client (by company_id from auth)
- [ ] `POST /api/client/notifications/[id]/dismiss` - marks notification as dismissed (sets dismissed_at)
- [ ] `GET /api/accountant/companies/[companyId]/notifications` - returns all notifications for a company (for accountant view)
- [ ] `POST /api/accountant/companies/[companyId]/notifications` - create new notification (manual by accountant)
- [ ] `DELETE /api/accountant/companies/[companyId]/notifications/[id]` - delete notification
- [ ] `PATCH /api/accountant/companies/[companyId]/notifications/[id]` - update notification (resolve, edit)
- [ ] All routes check auth via `x-user-id` header
- [ ] Typecheck passes

### US-003: App settings API (deadline day)
**Description:** As an accountant, I want to configure the global deadline day.

**Acceptance Criteria:**
- [ ] `GET /api/accountant/settings` - returns all app settings including `deadline_day`
- [ ] `PATCH /api/accountant/settings` - update settings (only admin role)
- [ ] Dashboard page reads deadline_day from API instead of hardcoded 15
- [ ] Settings page at `/accountant/settings` shows deadline day input (1-28)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-004: Per-client notification settings in accountant UI
**Description:** As an accountant, I want to configure which notification types are enabled per client.

**Acceptance Criteria:**
- [ ] In client detail page (`/accountant/clients/[companyId]`), add "Notifikace" section
- [ ] Toggle switches for each notification type: deadline_reminder, unpaid_invoice, missing_documents
- [ ] Toggle for each channel: in-app popup, email (prepared but not connected)
- [ ] Settings saved to `companies.notification_preferences` JSONB (extend existing schema)
- [ ] Default: all enabled for clients with `monthly_reporting = true`
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-005: Accountant notification management panel
**Description:** As an accountant, I want to see and manage all notifications for a client.

**Acceptance Criteria:**
- [ ] In client detail page, "Notifikace" section shows list of active/dismissed/resolved notifications
- [ ] Each notification shows: type badge, title, message, severity, status, created date
- [ ] "Nová notifikace" button opens form: type select, title, message, severity select
- [ ] "Vyřešit" button marks notification as resolved
- [ ] "Smazat" button deletes notification (with confirm)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-006: Client popup modal on login
**Description:** As a client, I want to see a popup with active notifications when I log in so I know what's needed.

**Acceptance Criteria:**
- [ ] On client pages (`/client/*`), check for active undismissed notifications on mount
- [ ] If any exist, show fullscreen modal overlay (cannot close by clicking outside)
- [ ] Modal shows list of notifications grouped by severity (urgent first)
- [ ] Each notification: icon by type, title, message, severity color
- [ ] "Beru na vědomí" button dismisses ALL shown notifications and closes modal
- [ ] After dismissal, notifications don't show as popup again (dismissed_at set)
- [ ] Modal uses existing Dialog component from shadcn
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-007: Client persistent banner
**Description:** As a client, I want to see a persistent banner for unresolved notifications after dismissing the popup.

**Acceptance Criteria:**
- [ ] After popup is dismissed, show compact sticky banner at top of client layout
- [ ] Banner shows count of unresolved notifications: "Máte 3 nevyřízené požadavky"
- [ ] Click on banner expands to show notification list
- [ ] Banner disappears only when all notifications are resolved (status = 'resolved')
- [ ] Banner color: red for urgent, orange for warning, blue for info
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-008: Auto-generate deadline notifications
**Description:** As a system, I want to automatically create notifications when document deadline approaches.

**Acceptance Criteria:**
- [ ] API route `POST /api/cron/generate-notifications` that can be called by n8n/cron
- [ ] For each company with `monthly_reporting = true` and notification type enabled:
  - If current day >= (deadline_day - 7) and documents are 'missing' for current period → create 'deadline_reminder' notification (if not already exists for this period)
- [ ] Don't create duplicate notifications (check metadata.period)
- [ ] Route protected by a secret API key (env var `CRON_SECRET`)
- [ ] Typecheck passes

### US-009: Email notification API (prepared, not connected)
**Description:** As a developer, I need an email sending API route ready for future provider integration.

**Acceptance Criteria:**
- [ ] `POST /api/notifications/send-email` route that accepts: `to`, `subject`, `body`, `template` (enum: 'deadline_reminder', 'unpaid_invoice', 'missing_documents')
- [ ] Route validates input, logs the email to a `notification_log` table (company_id, channel, template, status, created_at)
- [ ] Currently returns `{ success: true, provider: 'none', message: 'Email queued (provider not configured)' }`
- [ ] Comment block with integration points for Resend/SendGrid/Mailgun
- [ ] Typecheck passes

### US-010: SMS/WhatsApp schema preparation
**Description:** As a developer, I need DB schema ready for future SMS/WhatsApp integration.

**Acceptance Criteria:**
- [ ] `notification_log` table includes `channel` enum: 'email', 'sms', 'whatsapp', 'in_app'
- [ ] `companies.notification_preferences` JSONB extended with: `channels: { in_app: true, email: true, sms: false, whatsapp: false }` and `types: { deadline_reminder: true, unpaid_invoice: true, missing_documents: true }`
- [ ] Migration backfills existing companies with default preferences
- [ ] Typecheck passes

## Functional Requirements

- FR-1: Create `client_notifications` table with type, severity, status, metadata
- FR-2: Create `app_settings` table with `deadline_day` (default 15)
- FR-3: Create `notification_log` table for tracking sent notifications across channels
- FR-4: CRUD API for notifications (client read/dismiss, accountant full CRUD)
- FR-5: App settings API (GET/PATCH) for deadline day configuration
- FR-6: Cron-compatible API for auto-generating deadline notifications
- FR-7: Client popup modal - fullscreen, must dismiss, grouped by severity
- FR-8: Client persistent banner - sticky, shows count, expandable, severity-colored
- FR-9: Accountant notification panel in client detail - list, create, resolve, delete
- FR-10: Accountant per-client notification settings - type toggles, channel toggles
- FR-11: Dashboard reads deadline_day from app_settings instead of hardcoded 15
- FR-12: Email API route prepared with logging but no provider connected
- FR-13: Notification preferences JSONB structure supports channels + types granularity

## Non-Goals

- Actual email sending (no Resend/SendGrid integration yet)
- Actual SMS sending (no Twilio integration yet)
- Actual WhatsApp sending (no WhatsApp Business API yet)
- Push notifications (PWA/mobile)
- Notification scheduling/queue system (n8n will handle scheduling)
- Notification templates editor UI
- Client self-service notification preferences
- Real-time WebSocket notifications

## Design Considerations

- Popup modal: Use existing `Dialog` component from shadcn, set `onInteractOutside` to prevent closing
- Banner: Add to `app/client/layout.tsx` as conditional sticky element
- Severity colors: urgent=red, warning=orange, info=blue (consistent with existing app patterns)
- Notification type icons: reuse lucide icons (Clock for deadline, Banknote for invoice, FileText for documents, Bell for custom)
- Accountant panel: Add as collapsible section in client detail page (same pattern as employees/insurance sections)

## Technical Considerations

- **Supabase project:** `ybcubkuskirbspyoxpak`
- **Auth:** Middleware sets `x-user-id`, client pages have company_id in user context
- **Existing patterns:** Use `supabaseAdmin` from `lib/supabase-admin.ts` for all DB operations
- **API pattern:** Follow existing route.ts pattern with `export const dynamic = 'force-dynamic'`
- **Cron route:** Use `CRON_SECRET` env var for authentication (simple header check)
- **notification_preferences migration:** Must preserve existing `email/sms/push` booleans and extend structure

## Success Metrics

- Clients see popup on login within 200ms of page load
- Accountant can create and send notification to client in under 30 seconds
- Auto-generated notifications appear 7 days before deadline
- Dashboard stats reflect configurable deadline day, not hardcoded 15
- Zero duplicate notifications for same company + period + type

## Open Questions

- Should resolved notifications be auto-deleted after X days or kept as history?
- Should there be a "snooze" option on client popup (remind me tomorrow)?
- What's the max number of active notifications per client before UX degrades?
