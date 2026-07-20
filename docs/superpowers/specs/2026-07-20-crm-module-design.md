# CRM Module — Frontend Design

**Date:** 2026-07-20
**Scope:** `app/apps/tenant-web` + `app/packages/api-client`
**Backend:** already fully implemented at `api/src/v1/feat/crm/*` (verified directly against controller/service/validator source — see "Verified backend contract" below). No backend changes in this project.

---

## 1. Summary

Add the full CRM pre-sales pipeline to the tenant-web app: Leads → Prospects → Deals → (won) Customer, with an activity timeline and a KPI dashboard, per `FRONTEND_PROMPT.md`, `CRM_FEATURE_SPEC.md`, and `API_DOCUMENTATION.md §22`. This is currently 0% built on the frontend (confirmed: no `features/crm-*`, no `packages/api-client/src/crm.ts`, no CRM nav entry).

Full scope in one pass: Leads, Prospects, Deals (table + Kanban + win/lose), Activities, KPI Dashboard, CRM Settings.

---

## 2. Verified backend contract

Read directly from `api/src/v1/feat/crm/**` and `api/src/validation/crm-validator.ts` (not just the docs — the finance module work earlier this session found the docs and backend can diverge on response envelopes, so every shape below was confirmed against controller code).

**Universal pattern:** every endpoint nests its resource under a resource-named key, never generic `data`/`docs` — same pattern as the finance module fix.

| Endpoint | Method | Response envelope | Notes |
|---|---|---|---|
| `/crm/leads` | GET | `{success, message, leads, totalDocs, totalPages, page, hasPrevPage, hasNextPage, prevPage, nextPage}` | filters: `status,source,assignedTo,q,from,to,unassigned` |
| `/crm/leads` | POST | `{success, lead, duplicates}` | `duplicates: {field,value,existingLeadId}[]` |
| `/crm/leads/:id` | GET | `{success, lead}` | |
| `/crm/leads/:id` | PATCH | `{success, message, lead}` | |
| `/crm/leads/:id` | DELETE | `{success, message}` | soft delete, no `lead` key |
| `/crm/leads/:id/qualify` | POST | `{success, message, lead}` | body `{score?, notes?}` |
| `/crm/leads/:id/disqualify` | POST | `{success, message, lead}` | body `{reason}` required |
| `/crm/leads/:id/drop` | POST | `{success, message, lead}` | body `{reason}` required; 400 if lead isn't `qualified` |
| `/crm/leads/:id/convert` | POST | `{success, message, lead, customer}` | |
| `/crm/leads/import` | POST | `{success, message, imported, duplicates}` | multipart `file` field |
| `/crm/leads/capture` | POST | `{success, lead}` | public, **not built** — locked decision, no hosted form |
| `/crm/deals` | GET | list: `{success, message, deals, totalDocs, ...}` · board (`?view=board`): `{success, board: DealBoardGroup[]}` | `DealBoardGroup = {stage, label, deals, totalValue, count}` |
| `/crm/deals` | POST | `{success, deal}` | requires `leadId` XOR/OR `customerId` (Joi `.or(...)`, at least one) |
| `/crm/deals/:id` | GET | `{success, deal}` | |
| `/crm/deals/:id` | PATCH | `{success, message, deal}` | 400 if deal isn't `open` |
| `/crm/deals/:id` | DELETE | `{success, message}` | |
| `/crm/deals/:id/stage` | POST | `{success, message, deal}` | body `{stage}`; moving to `won` internally calls `winDeal`; moving to `lost` is rejected — must use `/lose` |
| `/crm/deals/:id/win` | POST | `{success, message, deal}` | body `{createEstimate?, createInvoice?}`; **the created `estimate`/`invoice`/`prefill` are attached directly onto the returned `deal` object**, not as siblings |
| `/crm/deals/:id/lose` | POST | `{success, message, deal}` | body `{reason}` required |
| `/crm/activities` | GET | `{success, activities, totalDocs, ...}` | required query `kind` (`lead\|deal\|customer`) + `id` |
| `/crm/activities` | POST | `{success, activity}` | |
| `/crm/activities/:id` | PATCH | `{success, activity}` | complete a task via `{completedAt}` |
| `/crm/kpi/summary` | GET | `{success, summary}` | query `from,to,compare` (from/to **required**) |
| `/crm/kpi/funnel` | GET | `{success, funnel}` | |
| `/crm/kpi/pipeline` | GET | `{success, pipeline}` | no date filter (all-open snapshot) |
| `/crm/kpi/leaderboard` | GET | `{success, leaderboard}` | **403 for users without `fullAccess`** |
| `/crm/settings` | GET | `{success, settings}` | |
| `/crm/settings` | PUT | `{success, settings}` | **`fullAccess` only** |

**Deal value/currency rule** (`normalizeDealValue` in `deal-service.ts`): if `value.currency === baseCurrency`, `exchangeRateToBase` defaults to `1`. If different, `exchangeRateToBase` is **required** (backend throws 400 otherwise). `baseCurrency` comes from `GET /crm/settings` (tenant default `NGN`).

**Deal creation rule:** exactly one of `leadId`/`customerId` context is expected (Joi `.or("leadId","customerId")` — at least one, both allowed).

**RBAC transparency:** the backend already filters list/detail results to "own or assigned" records for users without `fullAccess` (`buildCrmOwnerScope`) — no client-side filtering needed. The one place this surfaces in the UI is the leaderboard, which 403s outright for non-`fullAccess` users.

**No `crm` feature flag on `GET /subscription`** — only `plan`/`isActive`/`subExpDate`/`billingCycle`/`accessActive`. CRM nav visibility uses the same plan-heuristic (`standard`/`premium` → show) already used for PDF/Reports gating elsewhere, backstopped by graceful 403 handling on the actual `/crm/*` calls (a tenant can have `crm` overridden independent of plan via platform admin `featuresOverride`).

---

## 3. `packages/api-client` changes

**`types.ts`** — new types: `Contact` (nested contact shape: `firstName,lastName,email,phoneNumber,companyName?,website?,currency,type`), `Lead`, `LeadSource`, `LeadStatus`, `Deal`, `DealValue`, `DealStatus`, `DealStageHistoryEntry`, `DealBoardGroup`, `Activity`, `ActivityType`, `ActivityRelatedKind`, `PipelineStage`, `CrmSettings`, `KpiSummary`, `KpiFunnel`, `KpiPipeline`, `KpiLeaderboard`.

**`tenant.ts`** — export the existing internal `one()`/`many()`/`RawResponse` normalization helpers (currently module-private) so `crm.ts` can reuse them instead of duplicating envelope-unwrapping logic.

**`crm.ts`** (new) — typed functions for every row in the table above, built on the exported `tenantFetch`/`one`/`many` from `tenant.ts` (CRM is tenant-scoped, same `/api/v1/crm/*` prefix, same `at`/`x-tenant-slug` auth — no new HTTP client needed). Two endpoints get bespoke (non-`one`/`many`) mappings because their shape doesn't fit the generic helpers: `createLead`/`importLeads` (multi-key payload: `{lead, duplicates}` / `{imported, duplicates}`) and `convertLead` (`{lead, customer}`) and `listDeals` (must branch on `view=board` returning `{board}` vs the normal paginated shape).

---

## 4. Frontend pages (`apps/tenant-web/src/features`)

| Folder | Files | Notes |
|---|---|---|
| `leads` | `LeadListPage`, `LeadFormPage`, `LeadDetailPage`, `ReasonModal` | `ReasonModal` is a small shared modal (reason textarea) reused for disqualify/drop/lose |
| `prospects` | `ProspectListPage` | Same list UI as leads, hard-filtered `status=qualified`; extra columns (next follow-up, score); row actions: Create Deal, Convert, Drop. Routes to the shared `LeadDetailPage` for detail view |
| `deals` | `DealListPage` (table), `DealBoardPage` (Kanban), `DealFormPage`, `DealDetailPage`, `WinDealModal`, `LoseDealModal` | |
| `crm-dashboard` | `CrmDashboardPage` | KPI stat tiles + funnel + pipeline-by-stage + leaderboard (only if `fullAccess`, detected by catching the 403) + follow-ups-due/overdue-tasks |
| `crm-settings` | `CrmSettingsPage` | Pipeline stage editor, base currency, rotting days, revenue target, capture API key. Hidden from nav/route for non-`fullAccess` users |
| `components/crm` | `ActivityTimeline.tsx` | Shared: fetch + render + inline add-note/add-task form + complete-task button. Used by both `LeadDetailPage` and `DealDetailPage` |

**Nav:** new "CRM" section in `Layout.tsx` sidebar — Dashboard, Leads, Prospects, Deals — shown when plan is Standard/Premium.
**Routes:** added to the existing router (wherever `App.tsx`/router config currently registers `/invoices`, `/bills`, etc.).

---

## 5. Key flows

- **Qualify/Disqualify/Drop:** buttons on `LeadDetailPage` conditioned on `status`. Qualify opens a small inline modal (optional score 0–100 + notes). Disqualify/Drop use `ReasonModal` (reason required, matches Joi).
- **Create Deal from lead/prospect:** navigates to `DealFormPage?leadId=`, prefilling the lead link.
- **Deal currency:** `DealFormPage` fetches `GET /crm/settings` for `baseCurrency`; the `exchangeRateToBase` field only appears (and is required client-side) when the chosen deal currency differs from base — mirroring the backend's own rule instead of guessing.
- **Kanban (`DealBoardPage`):** native HTML5 drag-and-drop (`draggable`, `onDragStart/Over/Drop`) — no new dependency, per decision. Columns from `pipelineStages` excluding terminal stages. Drop fires `POST /crm/deals/:id/stage`; optimistic move + React Query invalidation. Dropping into a "won"/"lost" column is not offered on the board (those are terminal and reached via the Win/Lose modals only, matching the backend rejecting stage-change-to-lost).
- **Win/Lose:** modals on `DealDetailPage` (and a quick-action from the board card). Win modal offers "create draft estimate"/"create draft invoice" checkboxes; on success, since the backend nests `estimate`/`invoice` inside the returned `deal`, the modal surfaces direct links to whichever were created.
- **Activity timeline:** shared component, `kind`/`id` props determine what it fetches/posts.

---

## 6. Out of scope (unchanged from locked backend decisions)

- Hosted/embeddable public lead capture form (API-only capture stays as-is)
- Per-rep/per-team revenue targets (company-wide only)
- Any backend changes — this is frontend-only, backend is already shipped

---

## 7. Testing / verification

- `pnpm run build:tenant` must pass (tsc + vite build), same bar as the finance module fix.
- Manual smoke pass through the CRM_IMPLEMENTATION.md testing checklist (create lead → qualify → create deal → win → verify customer/estimate created) against a running API if available; otherwise rely on type-checking + careful cross-reference against the verified contract in §2.
