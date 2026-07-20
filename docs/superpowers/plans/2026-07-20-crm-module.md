# CRM Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full CRM pre-sales pipeline (Leads → Prospects → Deals → Customer) in `apps/tenant-web`, backed by the already-shipped `api/src/v1/feat/crm/*` backend, per the approved design at `docs/superpowers/specs/2026-07-20-crm-module-design.md`.

**Architecture:** One new `packages/api-client/src/crm.ts` module (typed functions over the existing `tenantFetch`), six new tenant-web feature areas (`leads`, `prospects`, `deals`, `crm-dashboard`, `crm-settings`, plus a shared `components/crm/ActivityTimeline`), wired into the existing router (`App.tsx`) and sidebar (`Layout.tsx`).

**Tech Stack:** React 18 + TypeScript + Vite, TanStack Query v5, react-router-dom v6, Tailwind, `recharts` (already a dependency — no new packages needed), native HTML5 drag-and-drop for the Kanban board (no DnD library, per design decision).

## Global Constraints

- **No test framework exists in this repo** (no vitest/jest — confirmed via `apps/tenant-web/package.json`). The verification step for every task is `tsc --noEmit` (fast, per-task) and a full `pnpm run build:tenant` (tsc -b && vite build) at milestone tasks — this is the project's actual "test suite." Do not introduce a test framework as part of this plan.
- **Every backend response is resource-keyed, never generic `{data}`/`{docs}`** — confirmed by reading `api/src/v1/feat/crm/**` controller source directly (see design spec §2 for the full verified table). All `crm.ts` functions must go through the existing `one()`/`many()` normalization helpers in `tenant.ts` (exported in Task 1). This is the same root-cause fix already applied to the finance module earlier — do not repeat the mistake of assuming a generic envelope.
- **Reuse existing UI primitives only**: `Button`, `Input`, `Select`, `Card`, `Modal`, `Badge`, `Pagination` from `apps/tenant-web/src/components/ui/*`. Do not create new base components.
- **Match HTTP methods exactly** as verified in the design spec — e.g. lead update is `PATCH`, deal update is `PATCH`, deal stage change is `POST /crm/deals/:id/stage` (not `PATCH`).
- **CRM nav/feature gating**: `const subscription = useAuthStore(s => s.subscription); const hasCrm = !subscription || ['standard', 'premium'].includes(subscription.plan);` — identical pattern already used in `ReportsPage.tsx` and `InvoiceListPage.tsx`. There is no `crm` boolean on `GET /subscription`, so this plan-based heuristic plus graceful handling of any live 403 is the correct approach (confirmed in design spec §2).
- **Currency default**: `NGN` (tenant CRM `baseCurrency` default). `exchangeRateToBase` is required on a deal only when its currency differs from `baseCurrency` — never omit this check.
- **Contact fields are nested** under `contact: {...}` for leads (verified against `LeadValidationSchema`/`contactValidationSchema` in `api/src/validation/crm-validator.ts` and `api/src/validation/validator.ts`) — required subfields: `type` (`individual`|`company`), `firstName`, `lastName`, `email`, `phoneNumber`, `currency`; `companyName` required only when `type === 'company'` (must be sent as `''` otherwise); `website` required only when `type === 'company'` (optional/`''` otherwise).

---

### Task 1: Export response-normalization helpers from `tenant.ts`

**Files:**
- Modify: `packages/api-client/src/tenant.ts:102,104,112`

**Interfaces:**
- Produces: `export type RawResponse`, `export function one<T>(key: string)`, `export function many<T>(key: string, limit: number)`, `export const qs`

- [ ] **Step 1: Add `export` to the three existing declarations**

In `packages/api-client/src/tenant.ts`, change:

```ts
type RawResponse = Record<string, unknown>;
```
to:
```ts
export type RawResponse = Record<string, unknown>;
```

Change:
```ts
function one<T>(key: string) {
```
to:
```ts
export function one<T>(key: string) {
```

Change:
```ts
function many<T>(key: string, limit: number) {
```
to:
```ts
export function many<T>(key: string, limit: number) {
```

Change (a few lines below the `ListParams` interface, around line 148):
```ts
const qs = (p: Record<string, unknown>) => new URLSearchParams(
```
to:
```ts
export const qs = (p: Record<string, unknown>) => new URLSearchParams(
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/Dominion/Sites/padding/products/officing/app && pnpm --filter @officing/api-client exec tsc --noEmit`
Expected: no errors (adding `export` never breaks existing call sites in the same file).

- [ ] **Step 3: Commit**

```bash
cd /Users/Dominion/Sites/padding/products/officing/app
git add packages/api-client/src/tenant.ts
git commit -m "api-client: export response-normalization helpers for reuse by crm.ts"
```

---

### Task 2: Add CRM types to `types.ts`

**Files:**
- Modify: `packages/api-client/src/types.ts` (append new section at end of file)

**Interfaces:**
- Produces: `Contact`, `UserRef`, `LeadSource`, `LeadStatus`, `LeadQualification`, `Lead`, `LeadDuplicateWarning`, `DealStatus`, `DealValue`, `DealStageHistoryEntry`, `DealAttachment`, `Deal`, `DealBoardGroup`, `ActivityType`, `ActivityRelatedKind`, `Activity`, `PipelineStage`, `RevenueTarget`, `CrmSettings`, `KpiSummary`, `KpiFunnel`, `KpiPipeline`, `KpiLeaderboardEntry`, `KpiLeaderboard`

- [ ] **Step 1: Append the CRM type block**

Add to the end of `packages/api-client/src/types.ts`:

```ts
// ─── CRM – Shared ────────────────────────────────────────────────────────────

export interface Contact {
  companyName?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  website?: string;
  currency: string;
  type: 'individual' | 'company';
}

export interface UserRef {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

// ─── CRM – Leads ─────────────────────────────────────────────────────────────

export type LeadSource = 'website' | 'referral' | 'cold_call' | 'social' | 'event' | 'import' | 'other';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'disqualified';

export interface LeadQualification {
  score?: number;
  notes?: string;
  qualifiedAt?: string;
}

export interface LeadAddress {
  contactName?: string;
  phoneNumber?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface Lead {
  _id: string;
  contact: Contact;
  address?: LeadAddress;
  source: LeadSource;
  status: LeadStatus;
  disqualifiedReason?: string;
  droppedReason?: string;
  qualification?: LeadQualification;
  nextFollowUpAt?: string;
  expectedInterest?: string;
  assignedTo?: string | UserRef;
  tags: string[];
  convertedCustomerId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface LeadDuplicateWarning {
  field: 'email' | 'phone';
  value: string;
  existingLeadId: string;
}

// ─── CRM – Deals ─────────────────────────────────────────────────────────────

export type DealStatus = 'open' | 'won' | 'lost';

export interface DealValue {
  amount: number;
  currency: string;
  exchangeRateToBase?: number;
}

export interface DealStageHistoryEntry {
  stage: string;
  enteredAt: string;
  changedBy: string;
}

export interface DealAttachment {
  url: string;
  publicId?: string;
  filename?: string;
}

export interface Deal {
  _id: string;
  title: string;
  leadId?: string | Lead;
  customerId?: string | Customer;
  value: DealValue;
  stage: string;
  probability: number;
  expectedCloseDate?: string;
  status: DealStatus;
  lostReason?: string;
  wonAt?: string;
  lostAt?: string;
  stageHistory: DealStageHistoryEntry[];
  assignedTo: string | UserRef;
  productsOfInterest?: string;
  notes?: string;
  attachments: DealAttachment[];
  lastActivityAt?: string;
  createdAt: string;
  updatedAt?: string;
  /** Only present in the POST /crm/deals/:id/win response. */
  prefill?: Record<string, unknown>;
  estimate?: { _id: string } | null;
  invoice?: { _id: string } | null;
}

export interface DealBoardGroup {
  stage: string;
  label: string;
  deals: Deal[];
  totalValue: number;
  count: number;
}

// ─── CRM – Activities ────────────────────────────────────────────────────────

export type ActivityType = 'note' | 'call' | 'email' | 'meeting' | 'task' | 'status_change';
export type ActivityRelatedKind = 'lead' | 'deal' | 'customer';

export interface Activity {
  _id: string;
  type: ActivityType;
  relatedTo: { kind: ActivityRelatedKind; id: string };
  body: string;
  dueAt?: string;
  completedAt?: string;
  assignedTo?: string | UserRef;
  metadata?: Record<string, unknown>;
  createdBy?: string | UserRef;
  createdAt: string;
}

// ─── CRM – Settings ──────────────────────────────────────────────────────────

export interface PipelineStage {
  key: string;
  label: string;
  order: number;
  defaultProbability: number;
  color?: string;
  isTerminal?: boolean;
}

export interface RevenueTarget {
  amount: number;
  currency: string;
  period: 'monthly' | 'quarterly';
}

export interface CrmSettings {
  pipelineStages: PipelineStage[];
  dealRottenAfterDays: number;
  baseCurrency: string;
  revenueTarget?: RevenueTarget | null;
  captureApiKey?: string;
}

// ─── CRM – KPIs ──────────────────────────────────────────────────────────────

export interface KpiSummary {
  period: { from: string; to: string };
  baseCurrency: string;
  leadsCreated: number;
  leadsBySource: { _id: string; count: number }[];
  leadToProspectRate: number;
  prospectToDealRate: number;
  winRate: number;
  revenueWon: number;
  lostValue: number;
  pipelineValue: number;
  weightedPipeline: number;
  averageDealSize: number;
  openDealsCount: number;
  rottingDealsCount: number;
  followUpsDueCount: number;
  overdueTasksCount: number;
  revenueTarget: RevenueTarget | null;
  comparison: {
    previousRevenueWon: number;
    revenueChange: number;
    revenueChangePercent: number | null;
  } | null;
}

export interface KpiFunnel {
  stages: { key: string; label: string; count: number }[];
}

export interface KpiPipeline {
  byStage: { _id: string; count: number; totalValue: number; weightedValue: number }[];
  topLossReasons: { _id: string; count: number }[];
}

export interface KpiLeaderboardEntry {
  userId: string;
  name: string;
  email?: string;
  dealsWon: number;
  revenue: number;
  leadsHandled: number;
}

export interface KpiLeaderboard {
  entries: KpiLeaderboardEntry[];
  baseCurrency: string;
}
```

Note: `Deal.customerId?: string | Customer` references the existing `Customer` interface already defined earlier in this same file — no import needed.

- [ ] **Step 2: Typecheck**

Run: `cd /Users/Dominion/Sites/padding/products/officing/app && pnpm --filter @officing/api-client exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/api-client/src/types.ts
git commit -m "api-client: add CRM types (Lead, Deal, Activity, CrmSettings, KPI shapes)"
```

---

### Task 3: Create `crm.ts` API client module

**Files:**
- Create: `packages/api-client/src/crm.ts`
- Modify: `packages/api-client/src/index.ts`

**Interfaces:**
- Consumes: `tenantFetch`, `one`, `many`, `qs`, `RawResponse` (Task 1); `Lead`, `LeadDuplicateWarning`, `Deal`, `DealBoardGroup`, `Activity`, `CrmSettings`, `KpiSummary`, `KpiFunnel`, `KpiPipeline`, `KpiLeaderboard`, `PaginatedResponse`, `ApiResponse` (Task 2)
- Produces (exact names/signatures every later task must use verbatim):
  - `listLeads(p?: LeadListParams): Promise<PaginatedResponse<Lead>>`
  - `getLead(id: string): Promise<{success: boolean; message?: string; data: Lead}>`
  - `createLead(body: Record<string, unknown>): Promise<{success: boolean; data: Lead; duplicates: LeadDuplicateWarning[]}>`
  - `updateLead(id: string, body: Record<string, unknown>): Promise<{success: boolean; message?: string; data: Lead}>`
  - `deleteLead(id: string): Promise<ApiResponse>`
  - `qualifyLead(id: string, body?: {score?: number; notes?: string}): Promise<{success: boolean; message?: string; data: Lead}>`
  - `disqualifyLead(id: string, reason: string): Promise<{success: boolean; message?: string; data: Lead}>`
  - `dropLead(id: string, reason: string): Promise<{success: boolean; message?: string; data: Lead}>`
  - `convertLead(id: string): Promise<{success: boolean; lead: Lead; customer: Record<string, unknown>}>`
  - `importLeads(file: File): Promise<{success: boolean; imported: number; duplicates: LeadDuplicateWarning[]}>`
  - `listDeals(p?: DealListParams): Promise<PaginatedResponse<Deal>>`
  - `getDealsBoard(): Promise<{success: boolean; board: DealBoardGroup[]}>`
  - `getDeal(id: string): Promise<{success: boolean; message?: string; data: Deal}>`
  - `createDeal(body: Record<string, unknown>): Promise<{success: boolean; message?: string; data: Deal}>`
  - `updateDeal(id: string, body: Record<string, unknown>): Promise<{success: boolean; message?: string; data: Deal}>`
  - `deleteDeal(id: string): Promise<ApiResponse>`
  - `changeDealStage(id: string, stage: string): Promise<{success: boolean; message?: string; data: Deal}>`
  - `winDeal(id: string, body?: {createEstimate?: boolean; createInvoice?: boolean}): Promise<{success: boolean; message?: string; data: Deal}>`
  - `loseDeal(id: string, reason: string): Promise<{success: boolean; message?: string; data: Deal}>`
  - `listActivities(kind: string, id: string, p?: {page?: number; limit?: number}): Promise<PaginatedResponse<Activity>>`
  - `createActivity(body: Record<string, unknown>): Promise<{success: boolean; message?: string; data: Activity}>`
  - `updateActivity(id: string, body: Record<string, unknown>): Promise<{success: boolean; message?: string; data: Activity}>`
  - `getKpiSummary(from: string, to: string, compare?: boolean): Promise<{success: boolean; message?: string; data: KpiSummary}>`
  - `getKpiFunnel(from: string, to: string): Promise<{success: boolean; message?: string; data: KpiFunnel}>`
  - `getKpiPipeline(): Promise<{success: boolean; message?: string; data: KpiPipeline}>`
  - `getKpiLeaderboard(from: string, to: string): Promise<{success: boolean; message?: string; data: KpiLeaderboard}>`
  - `getCrmSettings(): Promise<{success: boolean; message?: string; data: CrmSettings}>`
  - `updateCrmSettings(body: Record<string, unknown>): Promise<{success: boolean; message?: string; data: CrmSettings}>`

- [ ] **Step 1: Write `packages/api-client/src/crm.ts`**

```ts
import type {
  Lead, LeadDuplicateWarning, Deal, DealBoardGroup, Activity,
  CrmSettings, KpiSummary, KpiFunnel, KpiPipeline, KpiLeaderboard,
  PaginatedResponse, ApiResponse,
} from './types';
import { tenantFetch, one, many, qs, type RawResponse } from './tenant';

// ─── Leads ────────────────────────────────────────────────────────────────

export interface LeadListParams {
  page?: number;
  limit?: number;
  status?: string;
  source?: string;
  assignedTo?: string;
  q?: string;
  from?: string;
  to?: string;
  unassigned?: boolean;
  [key: string]: unknown;
}

export const listLeads = (p: LeadListParams = {}) =>
  tenantFetch<RawResponse>(`/crm/leads?${qs(p)}`).then(many<Lead>('leads', p.limit ?? 20));

export const getLead = (id: string) =>
  tenantFetch<RawResponse>(`/crm/leads/${id}`).then(one<Lead>('lead'));

export const createLead = (body: Record<string, unknown>) =>
  tenantFetch<RawResponse>('/crm/leads', { method: 'POST', body: JSON.stringify(body) })
    .then(res => ({
      success: (res.success as boolean) ?? true,
      data: res.lead as Lead,
      duplicates: (res.duplicates as LeadDuplicateWarning[]) ?? [],
    }));

export const updateLead = (id: string, body: Record<string, unknown>) =>
  tenantFetch<RawResponse>(`/crm/leads/${id}`, { method: 'PATCH', body: JSON.stringify(body) }).then(one<Lead>('lead'));

export const deleteLead = (id: string) => tenantFetch<ApiResponse>(`/crm/leads/${id}`, { method: 'DELETE' });

export const qualifyLead = (id: string, body: { score?: number; notes?: string } = {}) =>
  tenantFetch<RawResponse>(`/crm/leads/${id}/qualify`, { method: 'POST', body: JSON.stringify(body) }).then(one<Lead>('lead'));

export const disqualifyLead = (id: string, reason: string) =>
  tenantFetch<RawResponse>(`/crm/leads/${id}/disqualify`, { method: 'POST', body: JSON.stringify({ reason }) }).then(one<Lead>('lead'));

export const dropLead = (id: string, reason: string) =>
  tenantFetch<RawResponse>(`/crm/leads/${id}/drop`, { method: 'POST', body: JSON.stringify({ reason }) }).then(one<Lead>('lead'));

export const convertLead = (id: string) =>
  tenantFetch<RawResponse>(`/crm/leads/${id}/convert`, { method: 'POST' })
    .then(res => ({
      success: (res.success as boolean) ?? true,
      lead: res.lead as Lead,
      customer: res.customer as Record<string, unknown>,
    }));

export const importLeads = (file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return tenantFetch<RawResponse>('/crm/leads/import', { method: 'POST', body: fd })
    .then(res => ({
      success: (res.success as boolean) ?? true,
      imported: (res.imported as number) ?? 0,
      duplicates: (res.duplicates as LeadDuplicateWarning[]) ?? [],
    }));
};

// ─── Deals ────────────────────────────────────────────────────────────────

export interface DealListParams {
  page?: number;
  limit?: number;
  status?: string;
  stage?: string;
  assignedTo?: string;
  q?: string;
  minValue?: number;
  maxValue?: number;
  closeFrom?: string;
  closeTo?: string;
  [key: string]: unknown;
}

export const listDeals = (p: DealListParams = {}) =>
  tenantFetch<RawResponse>(`/crm/deals?${qs(p)}`).then(many<Deal>('deals', p.limit ?? 20));

export const getDealsBoard = () =>
  tenantFetch<RawResponse>('/crm/deals?view=board').then(res => ({
    success: (res.success as boolean) ?? true,
    board: (res.board as DealBoardGroup[]) ?? [],
  }));

export const getDeal = (id: string) =>
  tenantFetch<RawResponse>(`/crm/deals/${id}`).then(one<Deal>('deal'));

export const createDeal = (body: Record<string, unknown>) =>
  tenantFetch<RawResponse>('/crm/deals', { method: 'POST', body: JSON.stringify(body) }).then(one<Deal>('deal'));

export const updateDeal = (id: string, body: Record<string, unknown>) =>
  tenantFetch<RawResponse>(`/crm/deals/${id}`, { method: 'PATCH', body: JSON.stringify(body) }).then(one<Deal>('deal'));

export const deleteDeal = (id: string) => tenantFetch<ApiResponse>(`/crm/deals/${id}`, { method: 'DELETE' });

export const changeDealStage = (id: string, stage: string) =>
  tenantFetch<RawResponse>(`/crm/deals/${id}/stage`, { method: 'POST', body: JSON.stringify({ stage }) }).then(one<Deal>('deal'));

export const winDeal = (id: string, body: { createEstimate?: boolean; createInvoice?: boolean } = {}) =>
  tenantFetch<RawResponse>(`/crm/deals/${id}/win`, { method: 'POST', body: JSON.stringify(body) }).then(one<Deal>('deal'));

export const loseDeal = (id: string, reason: string) =>
  tenantFetch<RawResponse>(`/crm/deals/${id}/lose`, { method: 'POST', body: JSON.stringify({ reason }) }).then(one<Deal>('deal'));

// ─── Activities ───────────────────────────────────────────────────────────

export const listActivities = (kind: string, id: string, p: { page?: number; limit?: number } = {}) =>
  tenantFetch<RawResponse>(`/crm/activities?${qs({ kind, id, ...p })}`).then(many<Activity>('activities', p.limit ?? 50));

export const createActivity = (body: Record<string, unknown>) =>
  tenantFetch<RawResponse>('/crm/activities', { method: 'POST', body: JSON.stringify(body) }).then(one<Activity>('activity'));

export const updateActivity = (id: string, body: Record<string, unknown>) =>
  tenantFetch<RawResponse>(`/crm/activities/${id}`, { method: 'PATCH', body: JSON.stringify(body) }).then(one<Activity>('activity'));

// ─── KPIs ─────────────────────────────────────────────────────────────────

export const getKpiSummary = (from: string, to: string, compare = false) =>
  tenantFetch<RawResponse>(`/crm/kpi/summary?${qs({ from, to, compare })}`).then(one<KpiSummary>('summary'));

export const getKpiFunnel = (from: string, to: string) =>
  tenantFetch<RawResponse>(`/crm/kpi/funnel?${qs({ from, to })}`).then(one<KpiFunnel>('funnel'));

export const getKpiPipeline = () =>
  tenantFetch<RawResponse>('/crm/kpi/pipeline').then(one<KpiPipeline>('pipeline'));

export const getKpiLeaderboard = (from: string, to: string) =>
  tenantFetch<RawResponse>(`/crm/kpi/leaderboard?${qs({ from, to })}`).then(one<KpiLeaderboard>('leaderboard'));

// ─── Settings ─────────────────────────────────────────────────────────────

export const getCrmSettings = () =>
  tenantFetch<RawResponse>('/crm/settings').then(one<CrmSettings>('settings'));

export const updateCrmSettings = (body: Record<string, unknown>) =>
  tenantFetch<RawResponse>('/crm/settings', { method: 'PUT', body: JSON.stringify(body) }).then(one<CrmSettings>('settings'));
```

- [ ] **Step 2: Export it from `packages/api-client/src/index.ts`**

Current file content is:
```ts
export * from './types';
export * from './tenant';
export * from './admin';
```

Change to:
```ts
export * from './types';
export * from './tenant';
export * from './admin';
export * from './crm';
```

- [ ] **Step 3: Typecheck**

Run: `cd /Users/Dominion/Sites/padding/products/officing/app && pnpm --filter @officing/api-client exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/api-client/src/crm.ts packages/api-client/src/index.ts
git commit -m "api-client: add crm.ts with typed functions for all CRM endpoints"
```

---

### Task 4: Shared `ReasonModal` component

**Files:**
- Create: `apps/tenant-web/src/components/crm/ReasonModal.tsx`

**Interfaces:**
- Consumes: `Modal`, `Button` from `apps/tenant-web/src/components/ui/*`
- Produces: `ReasonModal` component — `{open, title, actionLabel, onClose, onSubmit(reason: string), loading}`. Used by Task 8 (disqualify/drop) and Task 13 (lose deal).

- [ ] **Step 1: Write `apps/tenant-web/src/components/crm/ReasonModal.tsx`**

```tsx
import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface Props {
  open: boolean;
  title: string;
  actionLabel: string;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  loading?: boolean;
}

export function ReasonModal({ open, title, actionLabel, onClose, onSubmit, loading }: Props) {
  const [reason, setReason] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return;
    onSubmit(reason.trim());
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Reason *</label>
          <textarea
            required
            rows={3}
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="danger" type="submit" loading={loading}>{actionLabel}</Button>
        </div>
      </form>
    </Modal>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/Dominion/Sites/padding/products/officing/app && pnpm --filter tenant-web exec tsc --noEmit`
Expected: no errors related to this file (unrelated pre-existing errors, if any, are out of scope).

- [ ] **Step 3: Commit**

```bash
git add apps/tenant-web/src/components/crm/ReasonModal.tsx
git commit -m "tenant-web: add shared ReasonModal for disqualify/drop/lose flows"
```

---

### Task 5: Shared `ActivityTimeline` component

**Files:**
- Create: `apps/tenant-web/src/components/crm/ActivityTimeline.tsx`

**Interfaces:**
- Consumes: `listActivities`, `createActivity`, `updateActivity` (Task 3); `Activity`, `ActivityRelatedKind`, `ActivityType` (Task 2); `Card`, `Button`, `Select` (existing UI)
- Produces: `<ActivityTimeline kind={ActivityRelatedKind} id={string} />` — used by Task 8 (`LeadDetailPage`) and Task 14 (`DealDetailPage`)

- [ ] **Step 1: Write `apps/tenant-web/src/components/crm/ActivityTimeline.tsx`**

```tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listActivities, createActivity, updateActivity } from '@officing/api-client';
import type { ActivityRelatedKind, ActivityType } from '@officing/api-client';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';

interface Props {
  kind: ActivityRelatedKind;
  id: string;
}

const TYPE_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: 'note', label: 'Note' },
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'task', label: 'Task' },
];

const TYPE_ICON: Record<ActivityType, string> = {
  note: '📝', call: '📞', email: '✉️', meeting: '📅', task: '✅', status_change: '🔄',
};

export function ActivityTimeline({ kind, id }: Props) {
  const qc = useQueryClient();
  const [type, setType] = useState<ActivityType>('note');
  const [body, setBody] = useState('');
  const [dueAt, setDueAt] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['crm-activities', kind, id],
    queryFn: () => listActivities(kind, id, { limit: 50 }),
  });

  const addMutation = useMutation({
    mutationFn: () => createActivity({
      type,
      relatedTo: { kind, id },
      body,
      ...(type === 'task' && dueAt ? { dueAt: new Date(dueAt).toISOString() } : {}),
    }),
    onSuccess: () => {
      toast.success('Activity added');
      setBody(''); setDueAt('');
      qc.invalidateQueries({ queryKey: ['crm-activities', kind, id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const completeMutation = useMutation({
    mutationFn: (activityId: string) => updateActivity(activityId, { completedAt: new Date().toISOString() }),
    onSuccess: () => {
      toast.success('Task completed');
      qc.invalidateQueries({ queryKey: ['crm-activities', kind, id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    addMutation.mutate();
  }

  return (
    <Card title="Activity">
      <form onSubmit={handleSubmit} className="space-y-3 mb-5">
        <div className="grid grid-cols-3 gap-2">
          <Select
            options={TYPE_OPTIONS}
            value={type}
            onChange={e => setType(e.target.value as ActivityType)}
          />
          {type === 'task' && (
            <input
              type="date"
              value={dueAt}
              onChange={e => setDueAt(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          )}
        </div>
        <textarea
          required
          rows={2}
          placeholder="Add a note, call log, or task…"
          value={body}
          onChange={e => setBody(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent"
        />
        <Button type="submit" size="sm" loading={addMutation.isPending}>Add</Button>
      </form>

      {isLoading && <p className="text-sm text-gray-400">Loading activity…</p>}
      {!isLoading && !data?.docs?.length && <p className="text-sm text-gray-400">No activity yet.</p>}
      <div className="space-y-3">
        {data?.docs?.map(a => (
          <div key={a._id} className="flex items-start gap-3 border-b border-gray-100 pb-3 last:border-0">
            <span className="text-lg shrink-0">{TYPE_ICON[a.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800">{a.body}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(a.createdAt).toLocaleString()}
                {a.dueAt && ` · Due ${new Date(a.dueAt).toLocaleDateString()}`}
                {a.completedAt && ' · Completed'}
              </p>
            </div>
            {a.type === 'task' && !a.completedAt && (
              <Button
                variant="ghost"
                size="sm"
                loading={completeMutation.isPending}
                onClick={() => completeMutation.mutate(a._id)}
              >
                Complete
              </Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/Dominion/Sites/padding/products/officing/app && pnpm --filter tenant-web exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/tenant-web/src/components/crm/ActivityTimeline.tsx
git commit -m "tenant-web: add shared ActivityTimeline component"
```

---

### Task 6: `LeadListPage`

**Files:**
- Create: `apps/tenant-web/src/features/leads/LeadListPage.tsx`

**Interfaces:**
- Consumes: `listLeads`, `deleteLead` (Task 3); `Lead`, `LeadStatus` (Task 2); `Button`, `Badge`, `Pagination` (existing UI)
- Produces: `LeadListPage` component, routed at `/leads` in Task 17

- [ ] **Step 1: Write `apps/tenant-web/src/features/leads/LeadListPage.tsx`**

```tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listLeads, deleteLead } from '@officing/api-client';
import type { LeadStatus } from '@officing/api-client';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';

type Color = 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'purple';
const statusColor: Record<LeadStatus, Color> = {
  new: 'blue', contacted: 'yellow', qualified: 'green', disqualified: 'red',
};

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'disqualified', label: 'Disqualified' },
];

export function LeadListPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['crm-leads', page, status, q],
    queryFn: () => listLeads({ page, limit: 20, status: status || undefined, q: q || undefined }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteLead,
    onSuccess: () => { toast.success('Lead deleted'); qc.invalidateQueries({ queryKey: ['crm-leads'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Leads</h2>
        <Link to="/leads/new"><Button size="sm">+ New Lead</Button></Link>
      </div>

      <div className="flex gap-3 items-end">
        <div className="w-48">
          <Select options={STATUS_OPTIONS} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} />
        </div>
        <div className="w-64">
          <Input placeholder="Search leads…" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['Name', 'Company', 'Status', 'Source', 'Assigned To', 'Actions'].map(h => (
              <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>}
            {!isLoading && !data?.docs?.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No leads yet.</td></tr>}
            {data?.docs?.map(lead => (
              <tr key={lead._id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">
                  <Link to={`/leads/${lead._id}`} className="hover:underline">
                    {lead.contact.firstName} {lead.contact.lastName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{lead.contact.companyName || '—'}</td>
                <td className="px-4 py-3"><Badge color={statusColor[lead.status]}>{lead.status}</Badge></td>
                <td className="px-4 py-3 text-gray-600">{lead.source}</td>
                <td className="px-4 py-3 text-gray-600">
                  {typeof lead.assignedTo === 'object' && lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link to={`/leads/${lead._id}/edit`}><Button variant="ghost" size="sm">Edit</Button></Link>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => { if (confirm('Delete this lead?')) deleteMut.mutate(lead._id); }}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && (
          <div className="px-4 pb-4">
            <Pagination
              page={page}
              hasNextPage={data.hasNextPage}
              hasPrevPage={data.hasPrevPage}
              totalDocs={data.totalDocs}
              limit={20}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/Dominion/Sites/padding/products/officing/app && pnpm --filter tenant-web exec tsc --noEmit`
Expected: no errors (note: this file references `/leads/new`, `/leads/:id`, `/leads/:id/edit` routes that don't exist until Task 17 — that's fine, `<Link>` doesn't require the route to exist at compile time).

- [ ] **Step 3: Commit**

```bash
git add apps/tenant-web/src/features/leads/LeadListPage.tsx
git commit -m "tenant-web: add LeadListPage"
```

---

### Task 7: `LeadFormPage`

**Files:**
- Create: `apps/tenant-web/src/features/leads/LeadFormPage.tsx`

**Interfaces:**
- Consumes: `createLead`, `updateLead`, `getLead`, `listUsers` (Task 3 + existing `tenant.ts`); `Lead` (Task 2)
- Produces: `LeadFormPage` component, routed at `/leads/new` and `/leads/:id/edit` in Task 17

- [ ] **Step 1: Write `apps/tenant-web/src/features/leads/LeadFormPage.tsx`**

```tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createLead, updateLead, getLead, listUsers } from '@officing/api-client';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';

const SOURCE_OPTIONS = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'social', label: 'Social' },
  { value: 'event', label: 'Event' },
  { value: 'other', label: 'Other' },
];

export function LeadFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    type: 'individual' as 'individual' | 'company',
    firstName: '', lastName: '', email: '', phoneNumber: '',
    companyName: '', website: '', currency: 'NGN',
    source: 'website', assignedTo: '', tags: '', nextFollowUpAt: '', expectedInterest: '',
  });

  const { data: lead } = useQuery({ queryKey: ['crm-lead', id], queryFn: () => getLead(id!), enabled: isEdit });
  const { data: users } = useQuery({ queryKey: ['users-select'], queryFn: listUsers });

  useEffect(() => {
    if (lead?.data) {
      const d = lead.data;
      setForm({
        type: d.contact.type,
        firstName: d.contact.firstName,
        lastName: d.contact.lastName,
        email: d.contact.email,
        phoneNumber: d.contact.phoneNumber,
        companyName: d.contact.companyName ?? '',
        website: d.contact.website ?? '',
        currency: d.contact.currency ?? 'NGN',
        source: d.source,
        assignedTo: typeof d.assignedTo === 'object' && d.assignedTo ? d.assignedTo._id : (d.assignedTo ?? ''),
        tags: d.tags.join(', '),
        nextFollowUpAt: d.nextFollowUpAt?.slice(0, 10) ?? '',
        expectedInterest: d.expectedInterest ?? '',
      });
    }
  }, [lead]);

  const mutation = useMutation({
    mutationFn: () => {
      const body = {
        contact: {
          type: form.type,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phoneNumber: form.phoneNumber,
          companyName: form.type === 'company' ? form.companyName : '',
          website: form.type === 'company' ? form.website : (form.website || ''),
          currency: form.currency,
        },
        source: form.source,
        assignedTo: form.assignedTo || undefined,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        nextFollowUpAt: form.nextFollowUpAt ? new Date(form.nextFollowUpAt).toISOString() : undefined,
        expectedInterest: form.expectedInterest || undefined,
      };
      return isEdit ? updateLead(id!, body) : createLead(body);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Lead updated' : 'Lead created');
      qc.invalidateQueries({ queryKey: ['crm-leads'] });
      navigate('/leads');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const userOptions = [
    { value: '', label: '— Unassigned —' },
    ...(users?.data ?? []).map(u => ({ value: u._id, label: `${u.firstName} ${u.lastName}` })),
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <h2 className="text-xl font-semibold">{isEdit ? 'Edit Lead' : 'New Lead'}</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="Contact">
          <div className="space-y-4">
            <Select
              label="Type"
              options={[{ value: 'individual', label: 'Individual' }, { value: 'company', label: 'Company' }]}
              value={form.type}
              onChange={set('type')}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input label="First Name *" required value={form.firstName} onChange={set('firstName')} />
              <Input label="Last Name *" required value={form.lastName} onChange={set('lastName')} />
            </div>
            <Input label="Email *" type="email" required value={form.email} onChange={set('email')} />
            <Input label="Phone *" required value={form.phoneNumber} onChange={set('phoneNumber')} />
            {form.type === 'company' && (
              <>
                <Input label="Company Name *" required value={form.companyName} onChange={set('companyName')} />
                <Input label="Website *" required value={form.website} onChange={set('website')} />
              </>
            )}
            <Input label="Currency" value={form.currency} onChange={set('currency')} />
          </div>
        </Card>

        <Card title="Lead Details">
          <div className="space-y-4">
            <Select label="Source" options={SOURCE_OPTIONS} value={form.source} onChange={set('source')} />
            <Select label="Assigned To" options={userOptions} value={form.assignedTo} onChange={set('assignedTo')} />
            <Input label="Tags (comma-separated)" value={form.tags} onChange={set('tags')} placeholder="saas, q3" />
            <Input label="Next Follow-up" type="date" value={form.nextFollowUpAt} onChange={set('nextFollowUpAt')} />
            <Input label="Expected Interest" value={form.expectedInterest} onChange={set('expectedInterest')} placeholder="Annual ERP license" />
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={mutation.isPending}>{isEdit ? 'Update Lead' : 'Create Lead'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/leads')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/Dominion/Sites/padding/products/officing/app && pnpm --filter tenant-web exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/tenant-web/src/features/leads/LeadFormPage.tsx
git commit -m "tenant-web: add LeadFormPage (create/edit)"
```

---

### Task 8: `LeadDetailPage`

**Files:**
- Create: `apps/tenant-web/src/features/leads/LeadDetailPage.tsx`

**Interfaces:**
- Consumes: `getLead`, `qualifyLead`, `disqualifyLead`, `dropLead`, `convertLead`, `deleteLead` (Task 3); `ReasonModal` (Task 4); `ActivityTimeline` (Task 5)
- Produces: `LeadDetailPage` component, routed at both `/leads/:id` and `/prospects/:id` in Task 17

- [ ] **Step 1: Write `apps/tenant-web/src/features/leads/LeadDetailPage.tsx`**

```tsx
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getLead, qualifyLead, disqualifyLead, dropLead, convertLead, deleteLead } from '@officing/api-client';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { ReasonModal } from '../../components/crm/ReasonModal';
import { ActivityTimeline } from '../../components/crm/ActivityTimeline';

export function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [qualifyOpen, setQualifyOpen] = useState(false);
  const [disqualifyOpen, setDisqualifyOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [score, setScore] = useState('');
  const [notes, setNotes] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['crm-lead', id], queryFn: () => getLead(id!), enabled: !!id });
  const lead = data?.data;

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['crm-lead', id] });
    qc.invalidateQueries({ queryKey: ['crm-leads'] });
  }

  const qualifyMut = useMutation({
    mutationFn: () => qualifyLead(id!, { score: score ? Number(score) : undefined, notes: notes || undefined }),
    onSuccess: () => { toast.success('Lead qualified'); setQualifyOpen(false); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const disqualifyMut = useMutation({
    mutationFn: (reason: string) => disqualifyLead(id!, reason),
    onSuccess: () => { toast.success('Lead disqualified'); setDisqualifyOpen(false); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const dropMut = useMutation({
    mutationFn: (reason: string) => dropLead(id!, reason),
    onSuccess: () => { toast.success('Prospect dropped'); setDropOpen(false); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const convertMut = useMutation({
    mutationFn: () => convertLead(id!),
    onSuccess: () => { toast.success('Converted to customer'); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteLead(id!),
    onSuccess: () => { toast.success('Lead deleted'); navigate('/leads'); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="p-8 text-gray-400">Loading…</div>;
  if (!lead) return <div className="p-8 text-red-600">Lead not found.</div>;

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate(-1)} className="text-sm text-gray-400 hover:text-gray-600 mb-1">← Back</button>
          <h2 className="text-xl font-semibold">{lead.contact.firstName} {lead.contact.lastName}</h2>
        </div>
        <div className="flex gap-2">
          <Link to={`/leads/${id}/edit`}><Button variant="secondary" size="sm">Edit</Button></Link>
          <Button variant="danger" size="sm" onClick={() => { if (confirm('Delete this lead?')) deleteMut.mutate(); }}>Delete</Button>
        </div>
      </div>

      <Card title="Details">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-gray-500">Status</p><Badge color={lead.status === 'qualified' ? 'green' : lead.status === 'disqualified' ? 'red' : 'blue'}>{lead.status}</Badge></div>
          <div><p className="text-gray-500">Source</p><p>{lead.source}</p></div>
          <div><p className="text-gray-500">Email</p><p>{lead.contact.email}</p></div>
          <div><p className="text-gray-500">Phone</p><p>{lead.contact.phoneNumber}</p></div>
          {lead.contact.companyName && <div><p className="text-gray-500">Company</p><p>{lead.contact.companyName}</p></div>}
          <div><p className="text-gray-500">Assigned To</p><p>{typeof lead.assignedTo === 'object' && lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : '—'}</p></div>
          {lead.nextFollowUpAt && <div><p className="text-gray-500">Next Follow-up</p><p>{new Date(lead.nextFollowUpAt).toLocaleDateString()}</p></div>}
          {lead.expectedInterest && <div><p className="text-gray-500">Expected Interest</p><p>{lead.expectedInterest}</p></div>}
          {lead.tags.length > 0 && <div className="col-span-2"><p className="text-gray-500">Tags</p><p>{lead.tags.join(', ')}</p></div>}
          {lead.disqualifiedReason && <div className="col-span-2"><p className="text-gray-500">Disqualified Reason</p><p>{lead.disqualifiedReason}</p></div>}
          {lead.droppedReason && <div className="col-span-2"><p className="text-gray-500">Dropped Reason</p><p>{lead.droppedReason}</p></div>}
          {lead.qualification && <div className="col-span-2"><p className="text-gray-500">Qualification Notes</p><p>{lead.qualification.notes || '—'} {lead.qualification.score != null && `(score: ${lead.qualification.score})`}</p></div>}
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        {(lead.status === 'new' || lead.status === 'contacted') && (
          <>
            <Button size="sm" onClick={() => setQualifyOpen(true)}>Qualify</Button>
            <Button size="sm" variant="danger" onClick={() => setDisqualifyOpen(true)}>Disqualify</Button>
          </>
        )}
        {lead.status === 'qualified' && !lead.convertedCustomerId && (
          <>
            <Link to={`/deals/new?leadId=${id}`}><Button size="sm">Create Deal</Button></Link>
            <Button size="sm" variant="secondary" loading={convertMut.isPending} onClick={() => convertMut.mutate()}>Convert to Customer</Button>
            <Button size="sm" variant="danger" onClick={() => setDropOpen(true)}>Drop</Button>
          </>
        )}
        {lead.convertedCustomerId && <Badge color="green">Converted to customer</Badge>}
      </div>

      <ActivityTimeline kind="lead" id={id!} />

      <Modal open={qualifyOpen} onClose={() => setQualifyOpen(false)} title="Qualify Lead">
        <form onSubmit={e => { e.preventDefault(); qualifyMut.mutate(); }} className="space-y-4">
          <Input label="Score (0-100, optional)" type="number" min="0" max="100" value={score} onChange={e => setScore(e.target.value)} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Notes (optional)</label>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" type="button" onClick={() => setQualifyOpen(false)}>Cancel</Button>
            <Button type="submit" loading={qualifyMut.isPending}>Qualify</Button>
          </div>
        </form>
      </Modal>

      <ReasonModal
        open={disqualifyOpen}
        title="Disqualify Lead"
        actionLabel="Disqualify"
        onClose={() => setDisqualifyOpen(false)}
        onSubmit={reason => disqualifyMut.mutate(reason)}
        loading={disqualifyMut.isPending}
      />

      <ReasonModal
        open={dropOpen}
        title="Drop Prospect"
        actionLabel="Drop"
        onClose={() => setDropOpen(false)}
        onSubmit={reason => dropMut.mutate(reason)}
        loading={dropMut.isPending}
      />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/Dominion/Sites/padding/products/officing/app && pnpm --filter tenant-web exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/tenant-web/src/features/leads/LeadDetailPage.tsx
git commit -m "tenant-web: add LeadDetailPage with qualify/disqualify/drop/convert actions"
```

---

### Task 9: `ProspectListPage`

**Files:**
- Create: `apps/tenant-web/src/features/prospects/ProspectListPage.tsx`

**Interfaces:**
- Consumes: `listLeads`, `convertLead` (Task 3); `ReasonModal` (Task 4)
- Produces: `ProspectListPage` component, routed at `/prospects` in Task 17. Detail view reuses `LeadDetailPage` (Task 8) at `/prospects/:id`.

- [ ] **Step 1: Write `apps/tenant-web/src/features/prospects/ProspectListPage.tsx`**

```tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listLeads, convertLead, dropLead } from '@officing/api-client';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Pagination';
import { Input } from '../../components/ui/Input';
import { ReasonModal } from '../../components/crm/ReasonModal';

export function ProspectListPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['crm-prospects', page, q],
    queryFn: () => listLeads({ page, limit: 20, status: 'qualified', q: q || undefined }),
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['crm-prospects'] });
  }

  const convertMut = useMutation({
    mutationFn: convertLead,
    onSuccess: () => { toast.success('Converted to customer'); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const dropMut = useMutation({
    mutationFn: (reason: string) => dropLead(dropTarget!, reason),
    onSuccess: () => { toast.success('Prospect dropped'); setDropTarget(null); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Prospects</h2>
        <div className="w-64">
          <Input placeholder="Search prospects…" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['Name', 'Company', 'Next Follow-up', 'Score', 'Assigned To', 'Actions'].map(h => (
              <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>}
            {!isLoading && !data?.docs?.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No prospects yet.</td></tr>}
            {data?.docs?.map(lead => (
              <tr key={lead._id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">
                  <Link to={`/prospects/${lead._id}`} className="hover:underline">{lead.contact.firstName} {lead.contact.lastName}</Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{lead.contact.companyName || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3 text-gray-600">{lead.qualification?.score ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">
                  {typeof lead.assignedTo === 'object' && lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link to={`/deals/new?leadId=${lead._id}`}><Button variant="ghost" size="sm">Create Deal</Button></Link>
                    <Button variant="secondary" size="sm" loading={convertMut.isPending} onClick={() => convertMut.mutate(lead._id)}>Convert</Button>
                    <Button variant="danger" size="sm" onClick={() => setDropTarget(lead._id)}>Drop</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && (
          <div className="px-4 pb-4">
            <Pagination page={page} hasNextPage={data.hasNextPage} hasPrevPage={data.hasPrevPage} totalDocs={data.totalDocs} limit={20} onPageChange={setPage} />
          </div>
        )}
      </div>

      <ReasonModal
        open={!!dropTarget}
        title="Drop Prospect"
        actionLabel="Drop"
        onClose={() => setDropTarget(null)}
        onSubmit={reason => dropMut.mutate(reason)}
        loading={dropMut.isPending}
      />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/Dominion/Sites/padding/products/officing/app && pnpm --filter tenant-web exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/tenant-web/src/features/prospects/ProspectListPage.tsx
git commit -m "tenant-web: add ProspectListPage"
```

---

### Task 10: `DealFormPage`

**Files:**
- Create: `apps/tenant-web/src/features/deals/DealFormPage.tsx`

**Interfaces:**
- Consumes: `createDeal`, `updateDeal`, `getDeal`, `getCrmSettings`, `listLeads`, `listCustomers`, `listUsers` (Task 3 + existing `tenant.ts`)
- Produces: `DealFormPage` component, routed at `/deals/new` and `/deals/:id/edit` in Task 17

- [ ] **Step 1: Write `apps/tenant-web/src/features/deals/DealFormPage.tsx`**

```tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createDeal, updateDeal, getDeal, getCrmSettings, listLeads, listCustomers, listUsers } from '@officing/api-client';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';

export function DealFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const presetLeadId = searchParams.get('leadId') ?? '';
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [sourceType, setSourceType] = useState<'lead' | 'customer'>(presetLeadId ? 'lead' : 'lead');
  const [form, setForm] = useState({
    title: '', leadId: presetLeadId, customerId: '',
    amount: '', currency: 'NGN', exchangeRateToBase: '',
    expectedCloseDate: '', assignedTo: '', productsOfInterest: '', notes: '',
  });

  const { data: deal } = useQuery({ queryKey: ['crm-deal', id], queryFn: () => getDeal(id!), enabled: isEdit });
  const { data: settings } = useQuery({ queryKey: ['crm-settings'], queryFn: getCrmSettings });
  const { data: leads } = useQuery({ queryKey: ['leads-select'], queryFn: () => listLeads({ status: 'qualified', limit: 200 }) });
  const { data: customers } = useQuery({ queryKey: ['customers-select'], queryFn: () => listCustomers({ limit: 200 }) });
  const { data: users } = useQuery({ queryKey: ['users-select'], queryFn: listUsers });

  const baseCurrency = settings?.data?.baseCurrency ?? 'NGN';
  const needsExchangeRate = form.currency.toUpperCase() !== baseCurrency.toUpperCase();

  useEffect(() => {
    if (deal?.data) {
      const d = deal.data;
      setSourceType(d.leadId ? 'lead' : 'customer');
      setForm({
        title: d.title,
        leadId: typeof d.leadId === 'object' && d.leadId ? d.leadId._id : (d.leadId ?? ''),
        customerId: typeof d.customerId === 'object' && d.customerId ? d.customerId._id : (d.customerId ?? ''),
        amount: String(d.value.amount),
        currency: d.value.currency,
        exchangeRateToBase: d.value.exchangeRateToBase != null ? String(d.value.exchangeRateToBase) : '',
        expectedCloseDate: d.expectedCloseDate?.slice(0, 10) ?? '',
        assignedTo: typeof d.assignedTo === 'object' && d.assignedTo ? d.assignedTo._id : (d.assignedTo ?? ''),
        productsOfInterest: d.productsOfInterest ?? '',
        notes: d.notes ?? '',
      });
    }
  }, [deal]);

  const mutation = useMutation({
    mutationFn: () => {
      const value: Record<string, unknown> = { amount: Number(form.amount), currency: form.currency.toUpperCase() };
      if (needsExchangeRate) value.exchangeRateToBase = Number(form.exchangeRateToBase);

      const body: Record<string, unknown> = {
        title: form.title,
        value,
        expectedCloseDate: form.expectedCloseDate ? new Date(form.expectedCloseDate).toISOString() : undefined,
        assignedTo: form.assignedTo || undefined,
        productsOfInterest: form.productsOfInterest || undefined,
        notes: form.notes || undefined,
      };

      if (!isEdit) {
        if (sourceType === 'lead') body.leadId = form.leadId;
        else body.customerId = form.customerId;
      }

      return isEdit ? updateDeal(id!, body) : createDeal(body);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Deal updated' : 'Deal created');
      qc.invalidateQueries({ queryKey: ['crm-deals'] });
      navigate('/deals');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const leadOptions = [
    { value: '', label: '— Select prospect —' },
    ...(leads?.docs ?? []).map(l => ({ value: l._id, label: `${l.contact.firstName} ${l.contact.lastName}${l.contact.companyName ? ` (${l.contact.companyName})` : ''}` })),
  ];
  const customerOptions = [
    { value: '', label: '— Select customer —' },
    ...(customers?.docs ?? []).map(c => ({ value: c._id, label: `${c.firstName} ${c.lastName}` })),
  ];
  const userOptions = [
    { value: '', label: '— Unassigned —' },
    ...(users?.data ?? []).map(u => ({ value: u._id, label: `${u.firstName} ${u.lastName}` })),
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isEdit && sourceType === 'lead' && !form.leadId) { toast.error('Please select a prospect'); return; }
    if (!isEdit && sourceType === 'customer' && !form.customerId) { toast.error('Please select a customer'); return; }
    if (needsExchangeRate && !form.exchangeRateToBase) { toast.error('Exchange rate to base currency is required'); return; }
    mutation.mutate();
  }

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <h2 className="text-xl font-semibold">{isEdit ? 'Edit Deal' : 'New Deal'}</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <div className="space-y-4">
            <Input label="Title *" required value={form.title} onChange={set('title')} />

            {!isEdit && (
              <>
                <Select
                  label="Link to"
                  options={[{ value: 'lead', label: 'Prospect' }, { value: 'customer', label: 'Existing Customer' }]}
                  value={sourceType}
                  onChange={e => setSourceType(e.target.value as 'lead' | 'customer')}
                />
                {sourceType === 'lead'
                  ? <Select label="Prospect *" options={leadOptions} value={form.leadId} onChange={set('leadId')} />
                  : <Select label="Customer *" options={customerOptions} value={form.customerId} onChange={set('customerId')} />}
              </>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input label="Amount *" type="number" step="0.01" min="0" required value={form.amount} onChange={set('amount')} />
              <Input label="Currency *" required value={form.currency} onChange={set('currency')} />
            </div>
            {needsExchangeRate && (
              <Input
                label={`Exchange Rate to ${baseCurrency} *`}
                type="number"
                step="0.0001"
                min="0"
                required
                helpText={`Units of ${baseCurrency} per 1 unit of ${form.currency.toUpperCase()}`}
                value={form.exchangeRateToBase}
                onChange={set('exchangeRateToBase')}
              />
            )}

            <Input label="Expected Close Date" type="date" value={form.expectedCloseDate} onChange={set('expectedCloseDate')} />
            <Select label="Assigned To" options={userOptions} value={form.assignedTo} onChange={set('assignedTo')} />
            <Input label="Products/Services of Interest" value={form.productsOfInterest} onChange={set('productsOfInterest')} />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Notes</label>
              <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={mutation.isPending}>{isEdit ? 'Update Deal' : 'Create Deal'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/deals')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/Dominion/Sites/padding/products/officing/app && pnpm --filter tenant-web exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/tenant-web/src/features/deals/DealFormPage.tsx
git commit -m "tenant-web: add DealFormPage with currency/exchange-rate handling"
```

---

### Task 11: `DealListPage`

**Files:**
- Create: `apps/tenant-web/src/features/deals/DealListPage.tsx`

**Interfaces:**
- Consumes: `listDeals`, `deleteDeal` (Task 3)
- Produces: `DealListPage` component, routed at `/deals` in Task 17

- [ ] **Step 1: Write `apps/tenant-web/src/features/deals/DealListPage.tsx`**

```tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listDeals, deleteDeal } from '@officing/api-client';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Select } from '../../components/ui/Select';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

function fmt(n: number) {
  return new Intl.NumberFormat('en', { minimumFractionDigits: 2 }).format(n);
}

export function DealListPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['crm-deals', page, status],
    queryFn: () => listDeals({ page, limit: 20, status: status || undefined }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteDeal,
    onSuccess: () => { toast.success('Deal deleted'); qc.invalidateQueries({ queryKey: ['crm-deals'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Deals</h2>
        <div className="flex gap-2">
          <Link to="/deals/board"><Button variant="secondary" size="sm">Board View</Button></Link>
          <Link to="/deals/new"><Button size="sm">+ New Deal</Button></Link>
        </div>
      </div>

      <div className="w-48">
        <Select options={STATUS_OPTIONS} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['Title', 'Stage', 'Value', 'Assigned To', 'Expected Close', 'Actions'].map(h => (
              <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>}
            {!isLoading && !data?.docs?.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No deals yet.</td></tr>}
            {data?.docs?.map(deal => (
              <tr key={deal._id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium"><Link to={`/deals/${deal._id}`} className="hover:underline">{deal.title}</Link></td>
                <td className="px-4 py-3"><Badge color={deal.status === 'won' ? 'green' : deal.status === 'lost' ? 'red' : 'blue'}>{deal.stage}</Badge></td>
                <td className="px-4 py-3 text-gray-600">{fmt(deal.value.amount)} {deal.value.currency}</td>
                <td className="px-4 py-3 text-gray-600">{typeof deal.assignedTo === 'object' ? `${deal.assignedTo.firstName} ${deal.assignedTo.lastName}` : '—'}</td>
                <td className="px-4 py-3 text-gray-600">{deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {deal.status === 'open' && <Link to={`/deals/${deal._id}/edit`}><Button variant="ghost" size="sm">Edit</Button></Link>}
                    <Button variant="danger" size="sm" onClick={() => { if (confirm('Delete this deal?')) deleteMut.mutate(deal._id); }}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && (
          <div className="px-4 pb-4">
            <Pagination page={page} hasNextPage={data.hasNextPage} hasPrevPage={data.hasPrevPage} totalDocs={data.totalDocs} limit={20} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/Dominion/Sites/padding/products/officing/app && pnpm --filter tenant-web exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/tenant-web/src/features/deals/DealListPage.tsx
git commit -m "tenant-web: add DealListPage (table view)"
```

---

### Task 12: `DealBoardPage` (Kanban)

**Files:**
- Create: `apps/tenant-web/src/features/deals/DealBoardPage.tsx`

**Interfaces:**
- Consumes: `getDealsBoard`, `changeDealStage` (Task 3); `DealBoardGroup` (Task 2)
- Produces: `DealBoardPage` component, routed at `/deals/board` in Task 17

- [ ] **Step 1: Write `apps/tenant-web/src/features/deals/DealBoardPage.tsx`**

```tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getDealsBoard, changeDealStage } from '@officing/api-client';
import { Button } from '../../components/ui/Button';

function fmt(n: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

export function DealBoardPage() {
  const qc = useQueryClient();
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['crm-deals-board'], queryFn: getDealsBoard });

  const stageMutation = useMutation({
    mutationFn: ({ dealId, stage }: { dealId: string; stage: string }) => changeDealStage(dealId, stage),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-deals-board'] }),
    onError: (e: Error) => toast.error(e.message),
  });

  function handleDrop(e: React.DragEvent, stage: string) {
    e.preventDefault();
    setDragOverStage(null);
    const dealId = e.dataTransfer.getData('text/plain');
    if (dealId) stageMutation.mutate({ dealId, stage });
  }

  if (isLoading) return <div className="p-8 text-gray-400">Loading board…</div>;

  return (
    <div className="p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Deals — Board</h2>
        <Link to="/deals"><Button variant="secondary" size="sm">Table View</Button></Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {data?.board.map(group => (
          <div
            key={group.stage}
            onDragOver={e => { e.preventDefault(); setDragOverStage(group.stage); }}
            onDragLeave={() => setDragOverStage(null)}
            onDrop={e => handleDrop(e, group.stage)}
            className={`flex-shrink-0 w-72 bg-gray-50 rounded-xl border ${dragOverStage === group.stage ? 'border-[var(--brand-primary)]' : 'border-gray-200'} p-3`}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="font-semibold text-sm text-gray-700">{group.label}</h3>
              <span className="text-xs text-gray-400">{group.count} · {fmt(group.totalValue)}</span>
            </div>
            <div className="space-y-2">
              {group.deals.map(deal => (
                <div
                  key={deal._id}
                  draggable
                  onDragStart={e => e.dataTransfer.setData('text/plain', deal._id)}
                  className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm cursor-grab active:cursor-grabbing"
                >
                  <Link to={`/deals/${deal._id}`} className="text-sm font-medium text-gray-900 hover:underline block truncate">
                    {deal.title}
                  </Link>
                  <p className="text-xs text-gray-500 mt-1">{deal.value.amount.toLocaleString()} {deal.value.currency}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {typeof deal.assignedTo === 'object' ? `${deal.assignedTo.firstName} ${deal.assignedTo.lastName}` : ''}
                  </p>
                </div>
              ))}
              {group.deals.length === 0 && <p className="text-xs text-gray-300 text-center py-4">No deals</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/Dominion/Sites/padding/products/officing/app && pnpm --filter tenant-web exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/tenant-web/src/features/deals/DealBoardPage.tsx
git commit -m "tenant-web: add DealBoardPage with native HTML5 drag-and-drop"
```

---

### Task 13: `WinDealModal` and `LoseDealModal`

**Files:**
- Create: `apps/tenant-web/src/features/deals/WinDealModal.tsx`
- Create: `apps/tenant-web/src/features/deals/LoseDealModal.tsx`

**Interfaces:**
- Consumes: `winDeal`, `loseDeal` (Task 3); `Modal`, `Button` (existing UI); `ReasonModal` (Task 4, wrapped by `LoseDealModal`)
- Produces: `WinDealModal` — `{open, dealId, onClose, onSuccess}`; `LoseDealModal` — `{open, dealId, onClose, onSuccess}`. Used by Task 14 (`DealDetailPage`).

- [ ] **Step 1: Write `apps/tenant-web/src/features/deals/WinDealModal.tsx`**

```tsx
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { winDeal } from '@officing/api-client';
import type { Deal } from '@officing/api-client';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

interface Props {
  open: boolean;
  dealId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function WinDealModal({ open, dealId, onClose, onSuccess }: Props) {
  const [createEstimate, setCreateEstimate] = useState(false);
  const [createInvoice, setCreateInvoice] = useState(false);
  const [wonDeal, setWonDeal] = useState<Deal | null>(null);

  const mutation = useMutation({
    mutationFn: () => winDeal(dealId, { createEstimate, createInvoice }),
    onSuccess: (res) => {
      toast.success('Deal won');
      setWonDeal(res.data);
      onSuccess();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleClose() {
    setWonDeal(null);
    setCreateEstimate(false);
    setCreateInvoice(false);
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Win Deal">
      {!wonDeal ? (
        <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <p className="text-sm text-gray-600">Mark this deal as won. This creates (or reuses) a customer record.</p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={createEstimate} onChange={e => setCreateEstimate(e.target.checked)} />
            Create a draft estimate for the deal value
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={createInvoice} onChange={e => setCreateInvoice(e.target.checked)} />
            Create a draft invoice for the deal value
          </label>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" type="button" onClick={handleClose}>Cancel</Button>
            <Button type="submit" loading={mutation.isPending}>Mark Won</Button>
          </div>
        </form>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-green-700 font-medium">Deal marked as won.</p>
          {wonDeal.estimate && (
            <Link to={`/estimates/${wonDeal.estimate._id}/edit`} className="block text-sm text-[var(--brand-primary)] underline">
              View draft estimate →
            </Link>
          )}
          {wonDeal.invoice && (
            <Link to={`/invoices/${wonDeal.invoice._id}/edit`} className="block text-sm text-[var(--brand-primary)] underline">
              View draft invoice →
            </Link>
          )}
          <div className="flex justify-end">
            <Button variant="secondary" onClick={handleClose}>Close</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
```

- [ ] **Step 2: Write `apps/tenant-web/src/features/deals/LoseDealModal.tsx`**

```tsx
import React from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { loseDeal } from '@officing/api-client';
import { ReasonModal } from '../../components/crm/ReasonModal';

interface Props {
  open: boolean;
  dealId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function LoseDealModal({ open, dealId, onClose, onSuccess }: Props) {
  const mutation = useMutation({
    mutationFn: (reason: string) => loseDeal(dealId, reason),
    onSuccess: () => { toast.success('Deal marked as lost'); onSuccess(); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <ReasonModal
      open={open}
      title="Lose Deal"
      actionLabel="Mark Lost"
      onClose={onClose}
      onSubmit={reason => mutation.mutate(reason)}
      loading={mutation.isPending}
    />
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `cd /Users/Dominion/Sites/padding/products/officing/app && pnpm --filter tenant-web exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/tenant-web/src/features/deals/WinDealModal.tsx apps/tenant-web/src/features/deals/LoseDealModal.tsx
git commit -m "tenant-web: add WinDealModal and LoseDealModal"
```

---

### Task 14: `DealDetailPage`

**Files:**
- Create: `apps/tenant-web/src/features/deals/DealDetailPage.tsx`

**Interfaces:**
- Consumes: `getDeal`, `deleteDeal` (Task 3); `ActivityTimeline` (Task 5); `WinDealModal`, `LoseDealModal` (Task 13)
- Produces: `DealDetailPage` component, routed at `/deals/:id` in Task 17

- [ ] **Step 1: Write `apps/tenant-web/src/features/deals/DealDetailPage.tsx`**

```tsx
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getDeal, deleteDeal } from '@officing/api-client';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ActivityTimeline } from '../../components/crm/ActivityTimeline';
import { WinDealModal } from './WinDealModal';
import { LoseDealModal } from './LoseDealModal';

export function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [winOpen, setWinOpen] = useState(false);
  const [loseOpen, setLoseOpen] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ['crm-deal', id], queryFn: () => getDeal(id!), enabled: !!id });
  const deal = data?.data;

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['crm-deal', id] });
    qc.invalidateQueries({ queryKey: ['crm-deals'] });
    qc.invalidateQueries({ queryKey: ['crm-deals-board'] });
  }

  const deleteMut = useMutation({
    mutationFn: () => deleteDeal(id!),
    onSuccess: () => { toast.success('Deal deleted'); navigate('/deals'); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="p-8 text-gray-400">Loading…</div>;
  if (!deal) return <div className="p-8 text-red-600">Deal not found.</div>;

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate(-1)} className="text-sm text-gray-400 hover:text-gray-600 mb-1">← Back</button>
          <h2 className="text-xl font-semibold">{deal.title}</h2>
        </div>
        <div className="flex gap-2">
          {deal.status === 'open' && <Link to={`/deals/${id}/edit`}><Button variant="secondary" size="sm">Edit</Button></Link>}
          <Button variant="danger" size="sm" onClick={() => { if (confirm('Delete this deal?')) deleteMut.mutate(); }}>Delete</Button>
        </div>
      </div>

      <Card title="Details">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-gray-500">Status</p><Badge color={deal.status === 'won' ? 'green' : deal.status === 'lost' ? 'red' : 'blue'}>{deal.status}</Badge></div>
          <div><p className="text-gray-500">Stage</p><p>{deal.stage}</p></div>
          <div><p className="text-gray-500">Value</p><p>{deal.value.amount.toLocaleString()} {deal.value.currency}</p></div>
          <div><p className="text-gray-500">Probability</p><p>{deal.probability}%</p></div>
          <div><p className="text-gray-500">Assigned To</p><p>{typeof deal.assignedTo === 'object' ? `${deal.assignedTo.firstName} ${deal.assignedTo.lastName}` : '—'}</p></div>
          {deal.expectedCloseDate && <div><p className="text-gray-500">Expected Close</p><p>{new Date(deal.expectedCloseDate).toLocaleDateString()}</p></div>}
          {deal.productsOfInterest && <div className="col-span-2"><p className="text-gray-500">Products/Services</p><p>{deal.productsOfInterest}</p></div>}
          {deal.notes && <div className="col-span-2"><p className="text-gray-500">Notes</p><p>{deal.notes}</p></div>}
          {deal.lostReason && <div className="col-span-2"><p className="text-gray-500">Lost Reason</p><p>{deal.lostReason}</p></div>}
        </div>
      </Card>

      <Card title="Stage History">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-500"><th className="pb-2">Stage</th><th className="pb-2">Entered</th></tr></thead>
          <tbody>
            {deal.stageHistory.map((h, i) => (
              <tr key={i} className="border-t"><td className="py-2">{h.stage}</td><td className="py-2 text-gray-500">{new Date(h.enteredAt).toLocaleString()}</td></tr>
            ))}
          </tbody>
        </table>
      </Card>

      {deal.status === 'open' && (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setWinOpen(true)}>Win Deal</Button>
          <Button size="sm" variant="danger" onClick={() => setLoseOpen(true)}>Lose Deal</Button>
        </div>
      )}

      <ActivityTimeline kind="deal" id={id!} />

      <WinDealModal open={winOpen} dealId={id!} onClose={() => setWinOpen(false)} onSuccess={invalidate} />
      <LoseDealModal open={loseOpen} dealId={id!} onClose={() => setLoseOpen(false)} onSuccess={invalidate} />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/Dominion/Sites/padding/products/officing/app && pnpm --filter tenant-web exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/tenant-web/src/features/deals/DealDetailPage.tsx
git commit -m "tenant-web: add DealDetailPage with stage history, win/lose, activity timeline"
```

---

### Task 15: `CrmDashboardPage`

**Files:**
- Create: `apps/tenant-web/src/features/crm-dashboard/CrmDashboardPage.tsx`

**Interfaces:**
- Consumes: `getKpiSummary`, `getKpiFunnel`, `getKpiPipeline`, `getKpiLeaderboard` (Task 3); `recharts` (`BarChart`, `Bar`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `ResponsiveContainer` — already used in `ReportsPage.tsx`)
- Produces: `CrmDashboardPage` component, routed at `/crm` in Task 17

- [ ] **Step 1: Write `apps/tenant-web/src/features/crm-dashboard/CrmDashboardPage.tsx`**

```tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getKpiSummary, getKpiFunnel, getKpiPipeline, getKpiLeaderboard } from '@officing/api-client';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

function fmt(n: number) {
  return new Intl.NumberFormat('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function today() { return new Date().toISOString().slice(0, 10); }
function monthStart() { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); }
function quarterStart() { const d = new Date(); const q = Math.floor(d.getMonth() / 3) * 3; d.setMonth(q, 1); return d.toISOString().slice(0, 10); }
function yearStart() { const d = new Date(); d.setMonth(0, 1); return d.toISOString().slice(0, 10); }

type Period = 'month' | 'quarter' | 'year' | 'custom';

export function CrmDashboardPage() {
  const [period, setPeriod] = useState<Period>('month');
  const [customFrom, setCustomFrom] = useState(monthStart());
  const [customTo, setCustomTo] = useState(today());
  const [compare, setCompare] = useState(false);

  const from = period === 'month' ? monthStart() : period === 'quarter' ? quarterStart() : period === 'year' ? yearStart() : customFrom;
  const to = period === 'custom' ? customTo : today();

  const summaryQuery = useQuery({ queryKey: ['crm-kpi-summary', from, to, compare], queryFn: () => getKpiSummary(from, to, compare) });
  const funnelQuery = useQuery({ queryKey: ['crm-kpi-funnel', from, to], queryFn: () => getKpiFunnel(from, to) });
  const pipelineQuery = useQuery({ queryKey: ['crm-kpi-pipeline'], queryFn: getKpiPipeline });
  const leaderboardQuery = useQuery({
    queryKey: ['crm-kpi-leaderboard', from, to],
    queryFn: async () => {
      try {
        return await getKpiLeaderboard(from, to);
      } catch (e) {
        if ((e as { status?: number }).status === 403) return null;
        throw e;
      }
    },
  });

  const summary = summaryQuery.data?.data;
  const funnel = funnelQuery.data?.data;
  const pipeline = pipelineQuery.data?.data;
  const leaderboard = leaderboardQuery.data;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-semibold">CRM Dashboard</h2>
        <div className="flex items-center gap-2">
          {(['month', 'quarter', 'year', 'custom'] as Period[]).map(p => (
            <Button key={p} size="sm" variant={period === p ? 'primary' : 'secondary'} onClick={() => setPeriod(p)}>
              {p === 'month' ? 'This Month' : p === 'quarter' ? 'This Quarter' : p === 'year' ? 'This Year' : 'Custom'}
            </Button>
          ))}
          {period === 'custom' && (
            <>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
            </>
          )}
          <label className="flex items-center gap-1.5 text-sm text-gray-600">
            <input type="checkbox" checked={compare} onChange={e => setCompare(e.target.checked)} /> Compare to previous
          </label>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Leads Created', value: fmt(summary.leadsCreated) },
            { label: 'Lead → Prospect Rate', value: `${summary.leadToProspectRate.toFixed(1)}%` },
            { label: 'Prospect → Deal Rate', value: `${summary.prospectToDealRate.toFixed(1)}%` },
            { label: 'Win Rate', value: `${summary.winRate.toFixed(1)}%` },
            { label: `Revenue Won (${summary.baseCurrency})`, value: fmt(summary.revenueWon) },
            { label: 'Pipeline Value', value: fmt(summary.pipelineValue) },
            { label: 'Weighted Pipeline', value: fmt(summary.weightedPipeline) },
            { label: 'Avg Deal Size', value: fmt(summary.averageDealSize) },
            { label: 'Rotting Deals', value: fmt(summary.rottingDealsCount) },
            { label: 'Follow-ups Due', value: fmt(summary.followUpsDueCount) },
            { label: 'Overdue Tasks', value: fmt(summary.overdueTasksCount) },
          ].map(tile => (
            <div key={tile.label} className="bg-white border rounded-lg p-3 shadow-sm">
              <p className="text-xs text-gray-500">{tile.label}</p>
              <p className="font-bold text-lg">{tile.value}</p>
            </div>
          ))}
          {summary.comparison && (
            <div className="bg-white border rounded-lg p-3 shadow-sm col-span-2">
              <p className="text-xs text-gray-500">Revenue vs Previous Period</p>
              <p className={`font-bold text-lg ${summary.comparison.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.comparison.revenueChange >= 0 ? '+' : ''}{fmt(summary.comparison.revenueChange)}
                {summary.comparison.revenueChangePercent != null && ` (${summary.comparison.revenueChangePercent.toFixed(1)}%)`}
              </p>
            </div>
          )}
          {summary.revenueTarget && (
            <div className="bg-white border rounded-lg p-3 shadow-sm col-span-2">
              <p className="text-xs text-gray-500">Target ({summary.revenueTarget.period})</p>
              <p className="font-bold text-lg">{fmt(summary.revenueWon)} / {fmt(summary.revenueTarget.amount)}</p>
            </div>
          )}
        </div>
      )}

      {funnel && (
        <Card title="Funnel">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={funnel.stages}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {pipeline && (
        <Card title="Pipeline by Stage">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={pipeline.byStage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalValue" fill="#8b5cf6" name="Total Value" />
            </BarChart>
          </ResponsiveContainer>
          {pipeline.topLossReasons.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Top Loss Reasons</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {pipeline.topLossReasons.map(r => <li key={r._id}>{r._id}: {r.count}</li>)}
              </ul>
            </div>
          )}
        </Card>
      )}

      {leaderboard && (
        <Card title="Leaderboard">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500"><th className="pb-2">Rep</th><th className="pb-2">Deals Won</th><th className="pb-2">Revenue</th><th className="pb-2">Leads Handled</th></tr></thead>
            <tbody>
              {leaderboard.entries.map(entry => (
                <tr key={entry.userId} className="border-t">
                  <td className="py-2">{entry.name}</td>
                  <td className="py-2">{entry.dealsWon}</td>
                  <td className="py-2">{fmt(entry.revenue)} {leaderboard.baseCurrency}</td>
                  <td className="py-2">{entry.leadsHandled}</td>
                </tr>
              ))}
              {leaderboard.entries.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-gray-400">No wins in this period yet.</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/Dominion/Sites/padding/products/officing/app && pnpm --filter tenant-web exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/tenant-web/src/features/crm-dashboard/CrmDashboardPage.tsx
git commit -m "tenant-web: add CrmDashboardPage with KPI tiles, funnel, pipeline, leaderboard"
```

---

### Task 16: `CrmSettingsPage`

**Files:**
- Create: `apps/tenant-web/src/features/crm-settings/CrmSettingsPage.tsx`

**Interfaces:**
- Consumes: `getCrmSettings`, `updateCrmSettings` (Task 3); `PipelineStage` (Task 2)
- Produces: `CrmSettingsPage` component, routed at `/crm-settings` in Task 17

- [ ] **Step 1: Write `apps/tenant-web/src/features/crm-settings/CrmSettingsPage.tsx`**

```tsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getCrmSettings, updateCrmSettings } from '@officing/api-client';
import type { PipelineStage } from '@officing/api-client';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';

export function CrmSettingsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['crm-settings'], queryFn: getCrmSettings });

  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [baseCurrency, setBaseCurrency] = useState('NGN');
  const [dealRottenAfterDays, setDealRottenAfterDays] = useState('14');
  const [hasTarget, setHasTarget] = useState(false);
  const [targetAmount, setTargetAmount] = useState('');
  const [targetPeriod, setTargetPeriod] = useState<'monthly' | 'quarterly'>('monthly');
  const [captureApiKey, setCaptureApiKey] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (data?.data && !loaded) {
      const s = data.data;
      setStages(s.pipelineStages);
      setBaseCurrency(s.baseCurrency);
      setDealRottenAfterDays(String(s.dealRottenAfterDays));
      if (s.revenueTarget) {
        setHasTarget(true);
        setTargetAmount(String(s.revenueTarget.amount));
        setTargetPeriod(s.revenueTarget.period);
      }
      setCaptureApiKey(s.captureApiKey ?? '');
      setLoaded(true);
    }
  }, [data, loaded]);

  const mutation = useMutation({
    mutationFn: () => updateCrmSettings({
      pipelineStages: stages,
      baseCurrency: baseCurrency.toUpperCase(),
      dealRottenAfterDays: Number(dealRottenAfterDays),
      revenueTarget: hasTarget ? { amount: Number(targetAmount), currency: baseCurrency.toUpperCase(), period: targetPeriod } : null,
      captureApiKey: captureApiKey || undefined,
    }),
    onSuccess: () => toast.success('CRM settings saved'),
    onError: (e: Error) => toast.error(e.message),
  });

  function updateStage(i: number, patch: Partial<PipelineStage>) {
    setStages(s => s.map((stage, idx) => idx === i ? { ...stage, ...patch } : stage));
  }
  function addStage() {
    setStages(s => [...s, { key: '', label: '', order: s.length, defaultProbability: 0 }]);
  }
  function removeStage(i: number) {
    setStages(s => s.filter((_, idx) => idx !== i));
  }

  if (isLoading) return <div className="p-8 text-gray-400">Loading…</div>;

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <h2 className="text-xl font-semibold">CRM Settings</h2>
      <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-6">
        <Card title="Pipeline Stages">
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
              <span className="col-span-3">Key</span>
              <span className="col-span-3">Label</span>
              <span className="col-span-2">Order</span>
              <span className="col-span-2">Probability</span>
              <span className="col-span-2">Color</span>
            </div>
            {stages.map((stage, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-3"><Input value={stage.key} onChange={e => updateStage(i, { key: e.target.value })} /></div>
                <div className="col-span-3"><Input value={stage.label} onChange={e => updateStage(i, { label: e.target.value })} /></div>
                <div className="col-span-2"><Input type="number" value={stage.order} onChange={e => updateStage(i, { order: Number(e.target.value) })} /></div>
                <div className="col-span-2"><Input type="number" value={stage.defaultProbability} onChange={e => updateStage(i, { defaultProbability: Number(e.target.value) })} /></div>
                <div className="col-span-1"><Input type="color" value={stage.color ?? '#6366f1'} onChange={e => updateStage(i, { color: e.target.value })} /></div>
                <div className="col-span-1"><button type="button" onClick={() => removeStage(i)} className="text-red-400 hover:text-red-600 text-lg">×</button></div>
              </div>
            ))}
            <Button type="button" variant="ghost" size="sm" onClick={addStage}>+ Add Stage</Button>
          </div>
        </Card>

        <Card title="General">
          <div className="space-y-4">
            <Input label="Base Currency" value={baseCurrency} onChange={e => setBaseCurrency(e.target.value)} />
            <Input label="Deal Rotten After (days)" type="number" min="1" value={dealRottenAfterDays} onChange={e => setDealRottenAfterDays(e.target.value)} />
          </div>
        </Card>

        <Card title="Revenue Target">
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={hasTarget} onChange={e => setHasTarget(e.target.checked)} /> Set a company-wide revenue target
            </label>
            {hasTarget && (
              <div className="grid grid-cols-2 gap-3">
                <Input label={`Amount (${baseCurrency})`} type="number" min="0" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} />
                <Select label="Period" options={[{ value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }]} value={targetPeriod} onChange={e => setTargetPeriod(e.target.value as 'monthly' | 'quarterly')} />
              </div>
            )}
          </div>
        </Card>

        <Card title="Public Lead Capture">
          <Input
            label="Capture API Key (optional)"
            value={captureApiKey}
            onChange={e => setCaptureApiKey(e.target.value)}
            helpText="If set, your website must send this as x-crm-capture-key when POSTing to /crm/leads/capture."
          />
        </Card>

        <Button type="submit" loading={mutation.isPending}>Save Settings</Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/Dominion/Sites/padding/products/officing/app && pnpm --filter tenant-web exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/tenant-web/src/features/crm-settings/CrmSettingsPage.tsx
git commit -m "tenant-web: add CrmSettingsPage (pipeline editor, base currency, targets)"
```

---

### Task 17: Wire routes and navigation

**Files:**
- Modify: `apps/tenant-web/src/App.tsx`
- Modify: `apps/tenant-web/src/components/Layout.tsx`

**Interfaces:**
- Consumes: every page component from Tasks 6–16

- [ ] **Step 1: Add CRM imports and routes to `App.tsx`**

In `apps/tenant-web/src/App.tsx`, add these imports after the existing `SubscriptionPage` import:

```tsx
import { SubscriptionPage } from './features/subscription/SubscriptionPage';

// CRM
import { CrmDashboardPage } from './features/crm-dashboard/CrmDashboardPage';
import { LeadListPage } from './features/leads/LeadListPage';
import { LeadFormPage } from './features/leads/LeadFormPage';
import { LeadDetailPage } from './features/leads/LeadDetailPage';
import { ProspectListPage } from './features/prospects/ProspectListPage';
import { DealListPage } from './features/deals/DealListPage';
import { DealBoardPage } from './features/deals/DealBoardPage';
import { DealFormPage } from './features/deals/DealFormPage';
import { DealDetailPage } from './features/deals/DealDetailPage';
import { CrmSettingsPage } from './features/crm-settings/CrmSettingsPage';
```

Then add these routes right after `<Route path="/subscription" element={<SubscriptionPage />} />` (still inside the `<Route element={<RequireAuth><Layout /></RequireAuth>}>` block):

```tsx
          <Route path="/subscription" element={<SubscriptionPage />} />

          {/* CRM */}
          <Route path="/crm" element={<CrmDashboardPage />} />
          <Route path="/leads" element={<LeadListPage />} />
          <Route path="/leads/new" element={<LeadFormPage />} />
          <Route path="/leads/:id" element={<LeadDetailPage />} />
          <Route path="/leads/:id/edit" element={<LeadFormPage />} />
          <Route path="/prospects" element={<ProspectListPage />} />
          <Route path="/prospects/:id" element={<LeadDetailPage />} />
          <Route path="/deals" element={<DealListPage />} />
          <Route path="/deals/board" element={<DealBoardPage />} />
          <Route path="/deals/new" element={<DealFormPage />} />
          <Route path="/deals/:id" element={<DealDetailPage />} />
          <Route path="/deals/:id/edit" element={<DealFormPage />} />
          <Route path="/crm-settings" element={<CrmSettingsPage />} />
```

(Route order matters for react-router only where paths could ambiguously overlap — `/deals/board`, `/deals/new` and `/deals/:id` don't conflict here because react-router v6 matches static segments before dynamic ones regardless of declaration order, but keep `/deals/board` and `/deals/new` listed before `/deals/:id` as shown, for readability.)

- [ ] **Step 2: Add gated CRM nav section to `Layout.tsx`**

In `apps/tenant-web/src/components/Layout.tsx`, add this import:

```tsx
import { useAuthStore } from '../store/auth';
import { SubscriptionBanner } from './SubscriptionBanner';
```
becomes (add nothing new here — `useAuthStore` is already imported; just confirm it's there, no change needed to imports).

Change the `Layout` function body's nav rendering. Current code:

```tsx
export function Layout() {
  const { user, tenantName, logoUrl, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
```

Change to:

```tsx
export function Layout() {
  const { user, tenantName, logoUrl, logout, subscription } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const hasCrm = !subscription || ['standard', 'premium'].includes(subscription.plan);
```

Then find the `<nav>` block:

```tsx
        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-[var(--brand-primary)] text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`
              }
              title={collapsed ? item.label : undefined}
            >
              <span className="text-lg shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
```

Change to:

```tsx
        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-[var(--brand-primary)] text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`
              }
              title={collapsed ? item.label : undefined}
            >
              <span className="text-lg shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}

          {hasCrm && (
            <>
              {!collapsed && <p className="px-4 pt-4 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">CRM</p>}
              {CRM_NAV_ITEMS.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-[var(--brand-primary)] text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <span className="text-lg shrink-0">{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </>
          )}
        </nav>
```

Finally, add a second nav-items array right after the existing `NAV_ITEMS` constant:

```tsx
const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/invoices', label: 'Invoices', icon: '📄' },
  { to: '/estimates', label: 'Estimates', icon: '📋' },
  { to: '/bills', label: 'Bills', icon: '🧾' },
  { to: '/expenses', label: 'Expenses', icon: '💸' },
  { to: '/customers', label: 'Customers', icon: '👤' },
  { to: '/merchants', label: 'Merchants', icon: '🏪' },
  { to: '/reports', label: 'Reports', icon: '📈' },
  { to: '/people', label: 'People', icon: '👥' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
  { to: '/security', label: 'Security', icon: '🔒' },
  { to: '/notifications', label: 'Notifications', icon: '🔔' },
];

const CRM_NAV_ITEMS: NavItem[] = [
  { to: '/crm', label: 'CRM Dashboard', icon: '🧲' },
  { to: '/leads', label: 'Leads', icon: '🧑‍💼' },
  { to: '/prospects', label: 'Prospects', icon: '🎯' },
  { to: '/deals', label: 'Deals', icon: '🤝' },
  { to: '/crm-settings', label: 'CRM Settings', icon: '🛠️' },
];
```

- [ ] **Step 3: Typecheck**

Run: `cd /Users/Dominion/Sites/padding/products/officing/app && pnpm --filter tenant-web exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/tenant-web/src/App.tsx apps/tenant-web/src/components/Layout.tsx
git commit -m "tenant-web: wire CRM routes and gated sidebar nav section"
```

---

### Task 18: Full build verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full tenant-web build**

Run: `cd /Users/Dominion/Sites/padding/products/officing/app && pnpm run build:tenant`
Expected: `tsc -b && vite build` completes with no errors, ending in a line like `✓ built in <N>s`.

- [ ] **Step 2: Run the platform-admin build (unaffected, but confirm nothing broke)**

Run: `cd /Users/Dominion/Sites/padding/products/officing/app && pnpm run build:admin`
Expected: completes with no errors (this plan does not touch `apps/platform-admin`, so this should be identical to before this plan started — a sanity check, not a new requirement).

- [ ] **Step 3: Manual smoke-test checklist (if a running API + seeded tenant is available)**

Cross-reference against `CRM_IMPLEMENTATION.md`'s own testing checklist:
1. Ensure the tenant is on Standard+ plan (or has `crm: true` override) — confirm the CRM nav section appears.
2. `/leads/new` → create a lead → appears in `/leads` list.
3. Open the lead → **Qualify** → status becomes `qualified`, appears in `/prospects`.
4. From `/prospects` → **Create Deal** → fill in value/currency → deal appears in `/deals` and `/deals/board`.
5. Drag the deal card to a different column on `/deals/board` → stage updates.
6. Open the deal → **Win Deal** with "create draft estimate" checked → confirm a link to the new estimate appears.
7. `/crm` dashboard → confirm stat tiles, funnel, and pipeline chart render with non-error data.
8. `/crm-settings` → edit a pipeline stage label → Save → reload → change persisted.

If no running API is available in this environment, skip Step 3 and rely on Steps 1–2 plus the type-level verification already done per task.

- [ ] **Step 4: Final commit (if any cleanup was needed)**

```bash
cd /Users/Dominion/Sites/padding/products/officing/app
git status --short
```
If clean (no changes beyond what's already committed per-task), no further commit is needed — the CRM module is complete.

---

## Self-Review Notes

- **Spec coverage:** every §3/§4/§5 item in the design spec (leads, prospects, deals table+board, activities, KPI dashboard, settings, nav gating) maps to a task above. The one spec detail intentionally *not* built is the hosted public capture form — explicitly out of scope per the locked backend decision log, not a gap.
- **Type consistency:** `getLead`/`getDeal`/etc. all return `.data` (via `one()`); `listLeads`/`listDeals`/`listActivities` all return `.docs`/`.totalDocs`/`.hasNextPage`/`.hasPrevPage` (via `many()`) — checked consistent across every task that consumes them (Tasks 6–16 all reference `.data`/`.docs` correctly, never `.lead`/`.leads` directly).
- **No invented endpoints:** the KPI dashboard only surfaces `followUpsDueCount`/`overdueTasksCount` as numbers (from `/crm/kpi/summary`) rather than inventing a list-of-follow-ups endpoint — no such route exists in the verified backend contract.
