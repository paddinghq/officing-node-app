// ─── Common ─────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message?: string;
  tenants: T[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: Role;
  permissions?: Permission[];
  isEmailVerified?: boolean;
  tenantSlug?: string;
}

export interface SignInResponse {
  success: boolean;
  message: string;
  accessToken: string;
  refreshToken: string;
  user: User;
}

// ─── Subscription ────────────────────────────────────────────────────────────

export type Plan = 'free' | 'basic' | 'standard' | 'premium';
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

export interface Subscription {
  plan: Plan;
  isActive: boolean;
  subExpDate: string | null;
  billingCycle: BillingCycle;
  accessActive: boolean;
}

// ─── RBAC ────────────────────────────────────────────────────────────────────

export interface Permission {
  module: string;
  submodule: string;
  level: 'view' | 'create' | 'edit' | 'delete' | 'fullAccess';
}

export interface Role {
  _id: string;
  name: string;
  permissions: Permission[];
}

// ─── Finance – Customers ─────────────────────────────────────────────────────

export interface Customer {
  _id: string;
  companyName?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  currency?: string;
  type?: 'company' | 'individual';
  contact?: { email?: string };
  createdAt: string;
}

// ─── Finance – Merchants ─────────────────────────────────────────────────────

export interface Merchant {
  _id: string;
  companyName?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  createdAt: string;
}

// ─── Finance – Line Items ────────────────────────────────────────────────────

export interface LineItem {
  name: string;
  quantity: number;
  rate: number;
  amount?: number;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
export type BillStatus = 'draft' | 'sent' | 'paid' | 'partial' | 'overdue';
export type EstimateStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired';

// ─── Finance – Invoices ──────────────────────────────────────────────────────

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  customer: Customer | string;
  status: InvoiceStatus;
  dueDate: string;
  issueDate?: string;
  inventory: { items: LineItem[]; inventoryImage?: string };
  total: number;
  amountPaid: number;
  amountDue: number;
  currency?: string;
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceListSummary {
  dueThisMonth: number;
  outstanding: number;
  overdue: number;
  averageDaysToPay: number;
}

export interface Payment {
  _id?: string;
  amount: number;
  paymentDate: string;
  paymentMode: string;
  paymentReceiptImage?: string;
}

// ─── Finance – Bills ─────────────────────────────────────────────────────────

export interface Bill {
  _id: string;
  billNumber: string;
  merchant: Merchant | string;
  status: BillStatus;
  dueDate: string;
  inventory: { items: LineItem[] };
  total: number;
  amountPaid: number;
  amountDue: number;
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

// ─── Finance – Estimates ─────────────────────────────────────────────────────

export interface Estimate {
  _id: string;
  estimateNumber: string;
  customer: Customer | string;
  status: EstimateStatus;
  expiryDate?: string;
  inventory: { items: LineItem[] };
  total: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Finance – Expenses ──────────────────────────────────────────────────────

export interface ExpenseCategory {
  _id: string;
  name: string;
}

export interface Expense {
  _id: string;
  amount: number;
  category: ExpenseCategory | string;
  expenseDate: string;
  description?: string;
  createdAt: string;
}

// ─── Finance – Dashboard ─────────────────────────────────────────────────────

export interface DashboardData {
  totalInflow?: number;
  totalOutflow?: number;
  profit?: number;
  overdueInvoices?: number;
  overdueAmount?: number;
  chartData?: Array<{ month: string; inflow: number; outflow: number; profit: number }>;
  [key: string]: unknown;
}

// ─── Finance – Reports ───────────────────────────────────────────────────────

export interface AgingBucket {
  label: string;
  count: number;
  total: number;
}

export interface AgingReport {
  totalOutstanding: number;
  buckets: AgingBucket[];
}

export interface ProfitLossReport {
  months?: Array<{ month: string; revenue: number; expenses: number; profit: number }>;
  totalRevenue?: number;
  totalExpenses?: number;
  netProfit?: number;
  [key: string]: unknown;
}

export interface ExpensesByCategoryReport {
  categories?: Array<{ name: string; total: number }>;
  [key: string]: unknown;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export interface Notification {
  _id: string;
  message: string;
  isRead: boolean;
  type?: string;
  createdAt: string;
}

// ─── Platform Admin – Tenants ────────────────────────────────────────────────

export type TenantStatus = 'active' | 'suspended' | 'inactive';

export interface Tenant {
  _id: string;
  slug: string;
  name: string;
  status: TenantStatus;
  plan: Plan;
  isActive: boolean;
  subExpDate?: string | null;
  billingCycle?: BillingCycle;
  logoUrl?: string;
  primaryColor?: string;
  frontendBaseURL?: string;
  supportEmail?: string;
  createdAt: string;
}

export interface TenantOverview {
  totalTenants: number;
  active: number;
  suspended: number;
  provisioning: number;
  deactivated: number;
  byPlan: Record<Plan, number>;
}

// ─── Platform Admin – Audit Logs ─────────────────────────────────────────────

export interface AuditLog {
  _id: string;
  action: string;
  performedBy?: string;
  tenantSlug?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

// ─── Platform Admin – Admin User ─────────────────────────────────────────────

export interface AdminUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'superadmin' | 'support';
}
