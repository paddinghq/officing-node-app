import type {
  SignInResponse, User, Subscription, Customer, Merchant,
  Invoice, Bill, Estimate, Expense, ExpenseCategory, Asset,
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

// ─── Response-envelope normalization ─────────────────────────────────────────
// The backend never uses a generic `{data}` / `{docs}` envelope — every
// controller nests the resource under its own resource-named key (e.g.
// `{success, invoice}`, `{success, invoices, totalDocs, ...}`). These helpers
// translate that into the shape the UI components expect.

export type RawResponse = Record<string, unknown>;

export function one<T>(key: string) {
  return (res: RawResponse): { success: boolean; message?: string; data: T } => ({
    success: (res.success as boolean) ?? true,
    message: res.message as string | undefined,
    data: res[key] as T,
  });
}

export function many<T>(key: string, limit: number) {
  return (res: RawResponse): PaginatedResponse<T> => ({
    success: (res.success as boolean) ?? true,
    message: res.message as string | undefined,
    docs: (res[key] as T[]) ?? [],
    totalDocs: (res.totalDocs as number) ?? 0,
    page: (res.page as number) ?? 1,
    limit,
    hasNextPage: !!res.hasNextPage,
    hasPrevPage: !!res.hasPrevPage,
  });
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
export const getCompany = () =>
  tenantFetch<RawResponse>('/company').then(one<Record<string, unknown>>('company'));
export const updateCompany = (body: FormData) => tenantFetch<ApiResponse>('/company', { method: 'PATCH', body });
export const getSubscription = () => tenantFetch<{ success: boolean; subscription: Subscription }>('/subscription');

export interface ListParams { page?: number; limit?: number; from?: string; to?: string; status?: string; [key: string]: unknown; }

export const qs = (p: Record<string, unknown>) => new URLSearchParams(
  Object.fromEntries(Object.entries(p).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]))
).toString();

// Assets (invoice/bill/estimate line item catalog)
export const listAssets = (p: { page?: number; limit?: number } = {}) =>
  tenantFetch<RawResponse>(`/finance/assets?${qs(p)}`).then(many<Asset>('assets', p.limit ?? 20));
export const getAsset = (id: string) =>
  tenantFetch<RawResponse>(`/finance/assets/${id}`).then(one<Asset>('asset'));
export const createAsset = (body: Record<string, unknown>) =>
  tenantFetch<RawResponse>('/finance/assets', { method: 'POST', body: JSON.stringify(body) }).then(one<Asset>('asset'));

// Invoices
export const listInvoices = (p: ListParams = {}) =>
  tenantFetch<RawResponse>(`/finance/invoices?${qs(p)}`).then(res => ({
    ...many<Invoice>('invoices', (p.limit as number) ?? 20)(res),
    summary: {
      dueThisMonth: (res.dueThisMonth as number) ?? 0,
      outstanding: (res.outstanding as number) ?? 0,
      overdue: (res.overdue as number) ?? 0,
      averageDaysToPay: (res.averageDaysToPay as number) ?? 0,
    },
  }));
export const exportInvoicesCSV = (p: ListParams = {}) => tenantFetch<Blob>(`/finance/invoices?${qs({ ...p, format: 'csv' })}`, {}, true);
export const getInvoice = (id: string) =>
  tenantFetch<RawResponse>(`/finance/invoices/${id}`).then(one<Invoice>('invoice'));
export const createInvoice = (body: FormData | Record<string, unknown>) =>
  (body instanceof FormData
    ? tenantFetch<RawResponse>('/finance/invoices', { method: 'POST', body })
    : tenantFetch<RawResponse>('/finance/invoices', { method: 'POST', body: JSON.stringify(body) })
  ).then(one<Invoice>('invoice'));
export const updateInvoice = (id: string, body: Record<string, unknown>) =>
  tenantFetch<RawResponse>(`/finance/invoices/${id}`, { method: 'PUT', body: JSON.stringify(body) }).then(one<Invoice>('invoice'));
export const deleteInvoice = (id: string) => tenantFetch<ApiResponse>(`/finance/invoices/${id}`, { method: 'DELETE' });
export const recordInvoicePayment = (id: string, data: FormData | Record<string, unknown>) =>
  data instanceof FormData
    ? tenantFetch<ApiResponse>(`/finance/invoices/${id}/payment`, { method: 'POST', body: data })
    : tenantFetch<ApiResponse>(`/finance/invoices/${id}/payment`, { method: 'POST', body: JSON.stringify(data) });
export const sendInvoice = (id: string, message?: string) =>
  tenantFetch<ApiResponse>(`/finance/invoices/${id}/send`, { method: 'POST', body: JSON.stringify({ message }) });
export const downloadInvoicePDF = (id: string) => tenantFetch<Blob>(`/finance/invoices/${id}/pdf`, {}, true);
export const markInvoiceSent = (id: string) => tenantFetch<ApiResponse>(`/finance/invoices/${id}/mark-as-sent`, { method: 'PATCH' });
export const duplicateInvoice = (id: string) =>
  tenantFetch<RawResponse>(`/finance/invoices/duplicate/${id}`, { method: 'POST' }).then(one<Invoice>('invoice'));

// Bills
export const listBills = (p: ListParams = {}) =>
  tenantFetch<RawResponse>(`/finance/bills?${qs(p)}`).then(many<Bill>('bills', (p.limit as number) ?? 20));
export const exportBillsCSV = (p: ListParams = {}) => tenantFetch<Blob>(`/finance/bills?${qs({ ...p, format: 'csv' })}`, {}, true);
export const getBill = (id: string) =>
  tenantFetch<RawResponse>(`/finance/bills/${id}`).then(one<Bill>('bill'));
export const createBill = (body: Record<string, unknown>) =>
  tenantFetch<RawResponse>('/finance/bills', { method: 'POST', body: JSON.stringify(body) }).then(one<Bill>('bill'));
export const updateBill = (id: string, body: Record<string, unknown>) =>
  tenantFetch<RawResponse>(`/finance/bills/${id}`, { method: 'PUT', body: JSON.stringify(body) }).then(one<Bill>('bill'));
export const deleteBill = (id: string) => tenantFetch<ApiResponse>(`/finance/bills/${id}`, { method: 'DELETE' });
export const recordBillPayment = (id: string, data: Record<string, unknown>) => tenantFetch<ApiResponse>(`/finance/bills/${id}/payment`, { method: 'POST', body: JSON.stringify(data) });
export const sendBill = (id: string, message?: string) => tenantFetch<ApiResponse>(`/finance/bills/${id}/send`, { method: 'POST', body: JSON.stringify({ message }) });
export const downloadBillPDF = (id: string) => tenantFetch<Blob>(`/finance/bills/${id}/pdf`, {}, true);

// Estimates
export const listEstimates = (p: ListParams = {}) =>
  tenantFetch<RawResponse>(`/finance/estimates?${qs(p)}`).then(many<Estimate>('estimates', (p.limit as number) ?? 20));
export const getEstimate = (id: string) =>
  tenantFetch<RawResponse>(`/finance/estimates/${id}`).then(one<Estimate>('estimate'));
export const createEstimate = (body: Record<string, unknown>) =>
  tenantFetch<RawResponse>('/finance/estimates', { method: 'POST', body: JSON.stringify(body) }).then(one<Estimate>('estimate'));
export const updateEstimate = (id: string, body: Record<string, unknown>) =>
  // NOTE: the real route is PATCH, not PUT — PUT is not mounted on /finance/estimates/:id
  tenantFetch<RawResponse>(`/finance/estimates/${id}`, { method: 'PATCH', body: JSON.stringify(body) }).then(one<Estimate>('estimate'));
export const deleteEstimate = (id: string) => tenantFetch<ApiResponse>(`/finance/estimates/${id}`, { method: 'DELETE' });
export const downloadEstimatePDF = (id: string) => tenantFetch<Blob>(`/finance/estimates/${id}/pdf`, {}, true);
export const markEstimateSent = (id: string) => tenantFetch<ApiResponse>(`/finance/estimates/${id}/mark-as-sent`, { method: 'PATCH' });

// Expenses
export const listExpenses = (p: ListParams = {}) =>
  tenantFetch<RawResponse>(`/finance/expenses?${qs(p)}`).then(many<Expense>('expenses', (p.limit as number) ?? 20));
export const exportExpensesCSV = (p: ListParams = {}) => tenantFetch<Blob>(`/finance/expenses?${qs({ ...p, format: 'csv' })}`, {}, true);
export const getExpense = (id: string) =>
  tenantFetch<RawResponse>(`/finance/expenses/${id}`).then(one<Expense>('expense'));
export const createExpense = (body: Record<string, unknown>) =>
  tenantFetch<RawResponse>('/finance/expenses', { method: 'POST', body: JSON.stringify(body) }).then(one<Expense>('expense'));
export const updateExpense = (id: string, body: Record<string, unknown>) =>
  tenantFetch<RawResponse>(`/finance/expenses/${id}`, { method: 'PUT', body: JSON.stringify(body) }).then(one<Expense>('expense'));
export const deleteExpense = (id: string) => tenantFetch<ApiResponse>(`/finance/expenses/${id}`, { method: 'DELETE' });
export const listExpenseCategories = () =>
  tenantFetch<RawResponse>('/finance/expenses/categories').then(one<ExpenseCategory[]>('categories'));
export const createExpenseCategory = (name: string) =>
  tenantFetch<RawResponse>('/finance/expenses/categories', { method: 'POST', body: JSON.stringify({ name }) }).then(one<ExpenseCategory>('category'));

// Customers
export const listCustomers = (p: { page?: number; limit?: number } = {}) =>
  tenantFetch<RawResponse>(`/finance/customers?${qs(p)}`).then(many<Customer>('customers', p.limit ?? 20));
export const getCustomer = (id: string) =>
  tenantFetch<RawResponse>(`/finance/customers/${id}`).then(one<Customer>('customer'));
export const createCustomer = (body: Record<string, unknown>) =>
  tenantFetch<RawResponse>('/finance/customers', { method: 'POST', body: JSON.stringify(body) }).then(one<Customer>('customer'));
export const updateCustomer = (id: string, body: Record<string, unknown>) =>
  // NOTE: the real edit route is PATCH — PUT on /:id instead toggles active/deactivated status
  tenantFetch<RawResponse>(`/finance/customers/${id}`, { method: 'PATCH', body: JSON.stringify(body) }).then(one<Customer>('customer'));
// There is no hard-delete endpoint for customers on the backend; PUT /:id toggles active/deactivated status.
export const deactivateCustomer = (id: string) =>
  tenantFetch<RawResponse>(`/finance/customers/${id}`, { method: 'PUT' }).then(one<Customer>('customer'));

// Merchants
export const listMerchants = (p: { page?: number; limit?: number } = {}) =>
  tenantFetch<RawResponse>(`/finance/merchants?${qs(p)}`).then(many<Merchant>('merchants', p.limit ?? 20));
export const getMerchant = (id: string) =>
  tenantFetch<RawResponse>(`/finance/merchants/${id}`).then(one<Merchant>('merchant'));
export const createMerchant = (body: Record<string, unknown>) =>
  tenantFetch<RawResponse>('/finance/merchants', { method: 'POST', body: JSON.stringify(body) }).then(one<Merchant>('merchant'));
export const updateMerchant = (id: string, body: Record<string, unknown>) =>
  // NOTE: the real edit route is PATCH — PUT on /:id instead toggles active status
  tenantFetch<RawResponse>(`/finance/merchants/${id}`, { method: 'PATCH', body: JSON.stringify(body) }).then(one<Merchant>('merchant'));
export const deleteMerchant = (id: string) => tenantFetch<ApiResponse>(`/finance/merchants/${id}`, { method: 'DELETE' });

// Dashboard & Reports
export const getDashboard = (duration = 6) =>
  tenantFetch<RawResponse>(`/finance/dashboard?duration=${duration}`).then(one<DashboardData>('dashboardData'));
export const getProfitLoss = (from: string, to: string) => tenantFetch<{ success: boolean; report: ProfitLossReport }>(`/finance/reports/profit-loss?from=${from}&to=${to}`);
export const getARaging = () => tenantFetch<{ success: boolean; report: AgingReport }>('/finance/reports/ar-aging');
export const getAPaging = () => tenantFetch<{ success: boolean; report: AgingReport }>('/finance/reports/ap-aging');
export const getExpensesByCategory = (from: string, to: string) => tenantFetch<{ success: boolean; report: ExpensesByCategoryReport }>(`/finance/reports/expenses-by-category?from=${from}&to=${to}`);

// Finance Settings (general group only — the backend splits settings across
// many sub-resources at /finance/settings/{general,bills,estimates,...})
export const getFinanceSettings = () =>
  tenantFetch<RawResponse>('/finance/settings/general').then(one<Record<string, unknown>>('general'));
export const updateFinanceSettings = (group: string, body: Record<string, unknown>) =>
  tenantFetch<ApiResponse>(`/finance/settings/${group}`, { method: 'PATCH', body: JSON.stringify(body) });

// UAC
export const listUsers = () =>
  tenantFetch<RawResponse>('/account/user-access/users').then(one<User[]>('users'));
export const inviteUser = (body: { email: string; firstName: string; lastName: string; roleId: string }) =>
  tenantFetch<ApiResponse>('/account/user-access/users', { method: 'POST', body: JSON.stringify(body) });
export const resendInvite = (userId: string) =>
  tenantFetch<ApiResponse>('/account/user-access/users/invite', { method: 'POST', body: JSON.stringify({ userId }) });
export const updateUser = (id: string, body: Record<string, unknown>) =>
  tenantFetch<ApiResponse>(`/account/user-access/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
export const removeUser = (id: string) => tenantFetch<ApiResponse>(`/account/user-access/users/${id}`, { method: 'DELETE' });
export const listRoles = () =>
  tenantFetch<RawResponse>('/account/user-access/roles').then(one<Role[]>('roles'));
export const createRole = (body: { name: string; permissions: unknown[] }) =>
  tenantFetch<ApiResponse>('/account/user-access/roles', { method: 'POST', body: JSON.stringify(body) });
export const updateRole = (id: string, body: Record<string, unknown>) =>
  tenantFetch<ApiResponse>(`/account/user-access/roles/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
export const deleteRole = (id: string) => tenantFetch<ApiResponse>(`/account/user-access/roles/${id}`, { method: 'DELETE' });

// Security
export const getSecuritySettings = () =>
  tenantFetch<RawResponse>('/account/security').then(one<Record<string, unknown>>('security'));
export const changePassword = (currentPassword: string, newPassword: string) =>
  tenantFetch<ApiResponse>('/account/security/change-password', { method: 'PATCH', body: JSON.stringify({ currentPassword, newPassword }) });
export const updateRecoveryEmail = (email: string) =>
  tenantFetch<ApiResponse>('/account/security/recovery-email', { method: 'PATCH', body: JSON.stringify({ email }) });
export const toggleMFA = (enabled: boolean) =>
  tenantFetch<ApiResponse>('/account/security/mfa', { method: 'PATCH', body: JSON.stringify({ enabled }) });

// Notifications
export const listNotifications = () =>
  tenantFetch<RawResponse>('/notification').then(one<Notification[]>('notifications'));
export const markNotificationRead = (id: string) =>
  // There is no dedicated "mark read" route — PATCH /:id is the general update endpoint.
  tenantFetch<RawResponse>(`/notification/${id}`, { method: 'PATCH', body: JSON.stringify({ isRead: true }) }).then(one<Notification>('updatedNotification'));

// Download helper
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}
