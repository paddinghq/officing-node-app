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
