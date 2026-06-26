import type {
  SignInResponse, User, Subscription, Customer, Merchant,
  Invoice, Bill, Estimate, Expense, ExpenseCategory,
  DashboardData, AgingReport, ProfitLossReport,
  ExpensesByCategoryReport, Notification, Role,
  PaginatedResponse, ApiResponse,
} from './types';

// env is injected at build time by Vite
declare const __VITE_API_BASE_URL__: string | undefined;
declare const __VITE_DEFAULT_TENANT_SLUG__: string | undefined;

function getEnv(key: string, fallback: string): string {
  if (typeof import.meta !== 'undefined') {
    const env = (import.meta as { env?: Record<string, string> }).env;
    if (env && env[key]) return env[key];
  }
  return fallback;
}

const API = () => getEnv('VITE_API_BASE_URL', 'https://api-staging-officing.paddi.ng/api/v1');
const DEFAULT_SLUG = () => getEnv('VITE_DEFAULT_TENANT_SLUG', 'officing');

let _at: string | null = null;
let _rt: string | null = null;
let _slug: string | null = null;

export function setTenantAuth(at: string, rt: string, slug?: string) {
  _at = at; _rt = rt;
  if (slug) _slug = slug;
  localStorage.setItem('accessToken', at);
  localStorage.setItem('refreshToken', rt);
  if (slug) localStorage.setItem('tenantSlug', slug);
}

export function clearTenantAuth() {
  _at = null; _rt = null;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export function loadTenantAuth() {
  _at = localStorage.getItem('accessToken');
  _rt = localStorage.getItem('refreshToken');
  _slug = localStorage.getItem('tenantSlug');
}

async function refreshAccessToken(): Promise<boolean> {
  const rt = _rt ?? localStorage.getItem('refreshToken');
  const at = _at ?? localStorage.getItem('accessToken');
  if (!rt || !at) return false;
  try {
    const res = await fetch(`${API()}/auth/refresh`, {
      method: 'GET', headers: { rt, at }, credentials: 'include',
    });
    if (!res.ok) return false;
    const newAt = res.headers.get('at');
    if (newAt) { _at = newAt; localStorage.setItem('accessToken', newAt); }
    return true;
  } catch { return false; }
}

export async function tenantFetch<T = unknown>(
  path: string, options: RequestInit = {}, isBlob = false,
): Promise<T> {
  const token = _at ?? localStorage.getItem('accessToken');
  const slug = _slug ?? localStorage.getItem('tenantSlug') ?? DEFAULT_SLUG();
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('at', token);
  headers.set('x-tenant-slug', slug);

  let res = await fetch(`${API()}${path}`, { ...options, headers, credentials: 'include' });

  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newToken = _at ?? localStorage.getItem('accessToken');
      if (newToken) headers.set('at', newToken);
      res = await fetch(`${API()}${path}`, { ...options, headers, credentials: 'include' });
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText })) as { message?: string };
    const error = Object.assign(new Error(err.message ?? 'Request failed'), { status: res.status });
    throw error;
  }

  if (isBlob) return res.blob() as unknown as T;
  return res.json() as Promise<T>;
}

// Auth
export const signIn = (email: string, password: string, rememberMe = false) =>
  tenantFetch<SignInResponse>('/auth/signin', { method: 'POST', body: JSON.stringify({ email, password, rememberMe }) });

export const forgotPassword = (email: string) =>
  tenantFetch<ApiResponse>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });

export const resetPassword = (token: string, tokenId: string, password: string) =>
  tenantFetch<ApiResponse>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, tokenId, password }) });

export const verifyEmail = (id: string, token: string, uuid: string) =>
  tenantFetch<ApiResponse>(`/auth/verify-email?id=${id}&token=${token}&uuid=${uuid}`);

export const signOut = () => { clearTenantAuth(); };

// Company & Subscription
export const getCompany = () => tenantFetch<{ success: boolean; data: Record<string, unknown> }>('/company');
export const updateCompany = (body: FormData) => tenantFetch<ApiResponse>('/company', { method: 'PATCH', body });
export const getSubscription = () => tenantFetch<{ success: boolean; subscription: Subscription }>('/subscription');

// Invoices
export interface ListParams { page?: number; limit?: number; from?: string; to?: string; status?: string; [key: string]: unknown; }

const qs = (p: Record<string, unknown>) => new URLSearchParams(
  Object.fromEntries(Object.entries(p).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]))
).toString();

export const listInvoices = (p: ListParams = {}) => tenantFetch<PaginatedResponse<Invoice> & { summary?: Record<string, number> }>(`/finance/invoices?${qs(p)}`);
export const exportInvoicesCSV = (p: ListParams = {}) => tenantFetch<Blob>(`/finance/invoices?${qs({ ...p, format: 'csv' })}`, {}, true);
export const getInvoice = (id: string) => tenantFetch<{ success: boolean; data: Invoice }>(`/finance/invoices/${id}`);
export const createInvoice = (body: FormData | Record<string, unknown>) =>
  body instanceof FormData
    ? tenantFetch<{ success: boolean; data: Invoice }>('/finance/invoices', { method: 'POST', body })
    : tenantFetch<{ success: boolean; data: Invoice }>('/finance/invoices', { method: 'POST', body: JSON.stringify(body) });
export const updateInvoice = (id: string, body: Record<string, unknown>) =>
  tenantFetch<{ success: boolean; data: Invoice }>(`/finance/invoices/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteInvoice = (id: string) => tenantFetch<ApiResponse>(`/finance/invoices/${id}`, { method: 'DELETE' });
export const recordInvoicePayment = (id: string, data: FormData | Record<string, unknown>) =>
  data instanceof FormData
    ? tenantFetch<ApiResponse>(`/finance/invoices/${id}/payment`, { method: 'POST', body: data })
    : tenantFetch<ApiResponse>(`/finance/invoices/${id}/payment`, { method: 'POST', body: JSON.stringify(data) });
export const sendInvoice = (id: string, message?: string) =>
  tenantFetch<ApiResponse>(`/finance/invoices/${id}/send`, { method: 'POST', body: JSON.stringify({ message }) });
export const downloadInvoicePDF = (id: string) => tenantFetch<Blob>(`/finance/invoices/${id}/pdf`, {}, true);
export const markInvoiceSent = (id: string) => tenantFetch<ApiResponse>(`/finance/invoices/${id}/mark-as-sent`, { method: 'PATCH' });
export const duplicateInvoice = (id: string) => tenantFetch<{ success: boolean; data: Invoice }>(`/finance/invoices/duplicate/${id}`, { method: 'POST' });

// Bills
export const listBills = (p: ListParams = {}) => tenantFetch<PaginatedResponse<Bill>>(`/finance/bills?${qs(p)}`);
export const exportBillsCSV = (p: ListParams = {}) => tenantFetch<Blob>(`/finance/bills?${qs({ ...p, format: 'csv' })}`, {}, true);
export const getBill = (id: string) => tenantFetch<{ success: boolean; data: Bill }>(`/finance/bills/${id}`);
export const createBill = (body: Record<string, unknown>) => tenantFetch<{ success: boolean; data: Bill }>('/finance/bills', { method: 'POST', body: JSON.stringify(body) });
export const updateBill = (id: string, body: Record<string, unknown>) => tenantFetch<{ success: boolean; data: Bill }>(`/finance/bills/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteBill = (id: string) => tenantFetch<ApiResponse>(`/finance/bills/${id}`, { method: 'DELETE' });
export const recordBillPayment = (id: string, data: Record<string, unknown>) => tenantFetch<ApiResponse>(`/finance/bills/${id}/payment`, { method: 'POST', body: JSON.stringify(data) });
export const sendBill = (id: string, message?: string) => tenantFetch<ApiResponse>(`/finance/bills/${id}/send`, { method: 'POST', body: JSON.stringify({ message }) });
export const downloadBillPDF = (id: string) => tenantFetch<Blob>(`/finance/bills/${id}/pdf`, {}, true);

// Estimates
export const listEstimates = (p: ListParams = {}) => tenantFetch<PaginatedResponse<Estimate>>(`/finance/estimates?${qs(p)}`);
export const getEstimate = (id: string) => tenantFetch<{ success: boolean; data: Estimate }>(`/finance/estimates/${id}`);
export const createEstimate = (body: Record<string, unknown>) => tenantFetch<{ success: boolean; data: Estimate }>('/finance/estimates', { method: 'POST', body: JSON.stringify(body) });
export const updateEstimate = (id: string, body: Record<string, unknown>) => tenantFetch<{ success: boolean; data: Estimate }>(`/finance/estimates/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteEstimate = (id: string) => tenantFetch<ApiResponse>(`/finance/estimates/${id}`, { method: 'DELETE' });
export const downloadEstimatePDF = (id: string) => tenantFetch<Blob>(`/finance/estimates/${id}/pdf`, {}, true);
export const markEstimateSent = (id: string) => tenantFetch<ApiResponse>(`/finance/estimates/${id}/mark-as-sent`, { method: 'PATCH' });

// Expenses
export const listExpenses = (p: ListParams = {}) => tenantFetch<PaginatedResponse<Expense>>(`/finance/expenses?${qs(p)}`);
export const exportExpensesCSV = (p: ListParams = {}) => tenantFetch<Blob>(`/finance/expenses?${qs({ ...p, format: 'csv' })}`, {}, true);
export const getExpense = (id: string) => tenantFetch<{ success: boolean; data: Expense }>(`/finance/expenses/${id}`);
export const createExpense = (body: Record<string, unknown>) => tenantFetch<{ success: boolean; data: Expense }>('/finance/expenses', { method: 'POST', body: JSON.stringify(body) });
export const updateExpense = (id: string, body: Record<string, unknown>) => tenantFetch<{ success: boolean; data: Expense }>(`/finance/expenses/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteExpense = (id: string) => tenantFetch<ApiResponse>(`/finance/expenses/${id}`, { method: 'DELETE' });
export const listExpenseCategories = () => tenantFetch<{ success: boolean; data: ExpenseCategory[] }>('/finance/expenses/categories');
export const createExpenseCategory = (name: string) => tenantFetch<{ success: boolean; data: ExpenseCategory }>('/finance/expenses/categories', { method: 'POST', body: JSON.stringify({ name }) });

// Customers
export const listCustomers = (p: { page?: number; limit?: number } = {}) => tenantFetch<PaginatedResponse<Customer>>(`/finance/customers?${qs(p)}`);
export const getCustomer = (id: string) => tenantFetch<{ success: boolean; data: Customer }>(`/finance/customers/${id}`);
export const createCustomer = (body: Record<string, unknown>) => tenantFetch<{ success: boolean; data: Customer }>('/finance/customers', { method: 'POST', body: JSON.stringify(body) });
export const updateCustomer = (id: string, body: Record<string, unknown>) => tenantFetch<{ success: boolean; data: Customer }>(`/finance/customers/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteCustomer = (id: string) => tenantFetch<ApiResponse>(`/finance/customers/${id}`, { method: 'DELETE' });

// Merchants
export const listMerchants = (p: { page?: number; limit?: number } = {}) => tenantFetch<PaginatedResponse<Merchant>>(`/finance/merchants?${qs(p)}`);
export const getMerchant = (id: string) => tenantFetch<{ success: boolean; data: Merchant }>(`/finance/merchants/${id}`);
export const createMerchant = (body: Record<string, unknown>) => tenantFetch<{ success: boolean; data: Merchant }>('/finance/merchants', { method: 'POST', body: JSON.stringify(body) });
export const updateMerchant = (id: string, body: Record<string, unknown>) => tenantFetch<{ success: boolean; data: Merchant }>(`/finance/merchants/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteMerchant = (id: string) => tenantFetch<ApiResponse>(`/finance/merchants/${id}`, { method: 'DELETE' });

// Dashboard & Reports
export const getDashboard = (duration = 6) => tenantFetch<{ success: boolean; data: DashboardData }>(`/finance/dashboard?duration=${duration}`);
export const getProfitLoss = (from: string, to: string) => tenantFetch<{ success: boolean; report: ProfitLossReport }>(`/finance/reports/profit-loss?from=${from}&to=${to}`);
export const getARaging = () => tenantFetch<{ success: boolean; report: AgingReport }>('/finance/reports/ar-aging');
export const getAPaging = () => tenantFetch<{ success: boolean; report: AgingReport }>('/finance/reports/ap-aging');
export const getExpensesByCategory = (from: string, to: string) => tenantFetch<{ success: boolean; report: ExpensesByCategoryReport }>(`/finance/reports/expenses-by-category?from=${from}&to=${to}`);

// Finance Settings
export const getFinanceSettings = () => tenantFetch<{ success: boolean; data: Record<string, unknown> }>('/finance/settings');
export const updateFinanceSettings = (group: string, body: Record<string, unknown>) =>
  tenantFetch<ApiResponse>(`/finance/settings/${group}`, { method: 'PATCH', body: JSON.stringify(body) });

// UAC
export const listUsers = () => tenantFetch<{ success: boolean; data: User[] }>('/account/user-access/users');
export const inviteUser = (body: { email: string; firstName: string; lastName: string; roleId: string }) =>
  tenantFetch<ApiResponse>('/account/user-access/users', { method: 'POST', body: JSON.stringify(body) });
export const resendInvite = (userId: string) =>
  tenantFetch<ApiResponse>('/account/user-access/users/invite', { method: 'POST', body: JSON.stringify({ userId }) });
export const updateUser = (id: string, body: Record<string, unknown>) =>
  tenantFetch<ApiResponse>(`/account/user-access/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
export const removeUser = (id: string) => tenantFetch<ApiResponse>(`/account/user-access/users/${id}`, { method: 'DELETE' });
export const listRoles = () => tenantFetch<{ success: boolean; data: Role[] }>('/account/user-access/roles');
export const createRole = (body: { name: string; permissions: unknown[] }) =>
  tenantFetch<ApiResponse>('/account/user-access/roles', { method: 'POST', body: JSON.stringify(body) });
export const updateRole = (id: string, body: Record<string, unknown>) =>
  tenantFetch<ApiResponse>(`/account/user-access/roles/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
export const deleteRole = (id: string) => tenantFetch<ApiResponse>(`/account/user-access/roles/${id}`, { method: 'DELETE' });

// Security
export const getSecuritySettings = () => tenantFetch<{ success: boolean; data: Record<string, unknown> }>('/account/security');
export const changePassword = (currentPassword: string, newPassword: string) =>
  tenantFetch<ApiResponse>('/account/security/change-password', { method: 'PATCH', body: JSON.stringify({ currentPassword, newPassword }) });
export const updateRecoveryEmail = (email: string) =>
  tenantFetch<ApiResponse>('/account/security/recovery-email', { method: 'PATCH', body: JSON.stringify({ email }) });
export const toggleMFA = (enabled: boolean) =>
  tenantFetch<ApiResponse>('/account/security/mfa', { method: 'PATCH', body: JSON.stringify({ enabled }) });

// Notifications
export const listNotifications = () => tenantFetch<{ success: boolean; data: Notification[] }>('/notification');
export const markNotificationRead = (id: string) =>
  tenantFetch<ApiResponse>(`/notification/${id}`, { method: 'PATCH', body: JSON.stringify({ isRead: true }) });

// Download helper
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}
