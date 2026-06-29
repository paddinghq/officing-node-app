import type {
  Tenant, TenantOverview, AuditLog, AdminUser,
  Plan, BillingCycle, PaginatedResponse, ApiResponse,
} from './types';

function getEnv(key: string, fallback: string): string {
  if (typeof import.meta !== 'undefined') {
    const env = (import.meta as { env?: Record<string, string> }).env;
    if (env && env[key]) return env[key];
  }
  return fallback;
}

const API = () => getEnv('VITE_API_BASE_URL', 'https://api-staging-officing.paddi.ng/api/v1');

let _pat: string | null = null;

export function setAdminToken(pat: string) {
  _pat = pat;
  localStorage.setItem('platformToken', pat);
}

export function clearAdminToken() {
  _pat = null;
  localStorage.removeItem('platformToken');
}

export function loadAdminToken() {
  _pat = localStorage.getItem('platformToken');
}

export async function adminFetch<T = unknown>(
  path: string, options: RequestInit = {}, isBlob = false,
): Promise<T> {
  const token = _pat ?? localStorage.getItem('platformToken');
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('pat', token);

  const res = await fetch(`${API()}/platform/admin${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText })) as { message?: string };
    const error = Object.assign(new Error(err.message ?? 'Request failed'), { status: res.status });
    throw error;
  }

  if (isBlob) return res.blob() as unknown as T;
  return res.json() as Promise<T>;
}

// Auth
export const adminLogin = (email: string, password: string) =>
  fetch(`${API()}/platform/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then(r => r.json()) as Promise<{ success: boolean; accessToken: string; admin: AdminUser }>;

// Overview
export const getOverview = () => adminFetch<{ success: boolean; overview: TenantOverview }>('/overview');

// Tenants
const qs = (p: Record<string, unknown>) => new URLSearchParams(
  Object.fromEntries(Object.entries(p).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]))
).toString();

export const listTenants = (p: { page?: number; limit?: number; status?: string } = {}) =>
  adminFetch<PaginatedResponse<Tenant>>(`/tenants?${qs(p)}`);

export const getTenant = (slug: string) =>
  adminFetch<{ success: boolean; data: Tenant }>(`/tenants/${slug}`);

export const createTenant = (body: Record<string, unknown>) =>
  adminFetch<{ success: boolean; data: Tenant }>('/tenants', { method: 'POST', body: JSON.stringify(body) });

export const updateTenant = (slug: string, body: Record<string, unknown>) =>
  adminFetch<ApiResponse>(`/tenants/${slug}`, { method: 'PATCH', body: JSON.stringify(body) });

export const suspendTenant = (slug: string) =>
  adminFetch<ApiResponse>(`/tenants/${slug}/suspend`, { method: 'POST' });

export const activateTenant = (slug: string) =>
  adminFetch<ApiResponse>(`/tenants/${slug}/activate`, { method: 'POST' });

export const updateBranding = (slug: string, body: {
  logoUrl?: string; primaryColor?: string; frontendBaseURL?: string; supportEmail?: string;
}) => adminFetch<ApiResponse>(`/tenants/${slug}/branding`, { method: 'PATCH', body: JSON.stringify(body) });

export const updateSubscription = (slug: string, body: {
  plan: Plan; isActive: boolean; subExpDate?: string; billingCycle?: BillingCycle; supportNotes?: string;
}) => adminFetch<ApiResponse>(`/tenants/${slug}/subscription`, { method: 'PATCH', body: JSON.stringify(body) });

export const renewSubscription = (slug: string, body: { subExpDate: string; plan?: Plan }) =>
  adminFetch<ApiResponse>(`/tenants/${slug}/subscription/renew`, { method: 'POST', body: JSON.stringify(body) });

export const provisionMasterAdmin = (slug: string, body: {
  email: string; firstName: string; lastName: string; password?: string; companyName?: string;
}) => adminFetch<ApiResponse & { temporaryPassword?: string }>(`/tenants/${slug}/master-admin`, { method: 'POST', body: JSON.stringify(body) });

// Per-tenant read
export const getTenantStats = (slug: string) => adminFetch<{ success: boolean; data: Record<string, unknown> }>(`/tenants/${slug}/stats`);
export const getTenantUsers = (slug: string, p: { page?: number; limit?: number } = {}) =>
  adminFetch<PaginatedResponse<Record<string, unknown>>>(`/tenants/${slug}/users?${qs(p)}`);
export const getTenantAuditLogs = (slug: string, p: { page?: number; limit?: number } = {}) =>
  adminFetch<PaginatedResponse<AuditLog>>(`/tenants/${slug}/audit-logs?${qs(p)}`);
export const getTenantHealth = (slug: string) => adminFetch<{ success: boolean; data: Record<string, unknown> }>(`/tenants/${slug}/health`);

// Platform audit logs
export const listAuditLogs = (p: { page?: number; limit?: number; tenantSlug?: string } = {}) =>
  adminFetch<PaginatedResponse<AuditLog>>(`/audit-logs?${qs(p)}`);
