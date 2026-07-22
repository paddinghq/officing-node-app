// ─── Common ─────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message?: string;
  docs: T[];
  totalDocs: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage?: boolean;
}

export interface AdminListResponse<T> {
  success: boolean;
  tenants: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: Role;
  companyRole?: { _id: string; name: string };
  permissions?: Permission[];
  isEmailVerified?: boolean;
  tenantSlug?: string;
  lastLoginDate?: string | null;
}

/** Shape returned by GET /account/user-access/users */
export interface UserEntry {
  user: User;
  status: 'active' | 'inactive' | string;
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

export interface CustomerContact {
  companyName?: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  website?: string;
  currency?: string;
  type?: 'company' | 'individual';
}

export interface Customer {
  _id: string;
  id?: string;
  contact: CustomerContact;
  // Convenience accessors (may be present on older records or form-mapped objects)
  companyName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  isDeactivated?: boolean;
  createdAt: string;
}

/** Returns the display name for a customer regardless of data shape */
export function customerDisplayName(c: Customer): string {
  const firstName = c.contact?.firstName ?? c.firstName ?? '';
  const lastName  = c.contact?.lastName  ?? c.lastName  ?? '';
  return `${firstName} ${lastName}`.trim() || '—';
}

// ─── Finance – Merchants ─────────────────────────────────────────────────────

export interface MerchantContact {
  companyName?: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  website?: string;
  currency?: string;
  type?: 'company' | 'individual';
}

export interface Merchant {
  _id: string;
  id?: string;
  contact: MerchantContact;
  // Convenience accessors
  companyName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  isDeactivated?: boolean;
  createdAt: string;
}

/** Returns the display name for a merchant regardless of data shape */
export function merchantDisplayName(m: Merchant): string {
  const firstName = m.contact?.firstName ?? m.firstName ?? '';
  const lastName  = m.contact?.lastName  ?? m.lastName  ?? '';
  return `${firstName} ${lastName}`.trim() || '—';
}

// ─── Finance – Assets (used as invoice/bill/estimate line item catalog) ──────

export type AssetType = 'product' | 'service';

export interface Asset {
  _id: string;
  name: string;
  price: number;
  taxRate: number;
  description?: string;
  assetType: AssetType;
  sku?: string;
  measuringUnit?: string;
  isDeactivated?: boolean;
  assetId?: string;
}

// ─── Finance – Line Items ────────────────────────────────────────────────────

export interface LineItem {
  asset: string | Asset;
  quantity: number;
  amount: number;
}

export interface Inventory {
  items: LineItem[];
  taxRate: number;
  shipping: number;
  discount?: number;
  subtotal: number;
  total: number;
  inventoryImage?: string;
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
  inventory: Inventory;
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
  inventory: Inventory;
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
  inventory: Inventory;
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

export interface TenantBranding {
  logoUrl?: string;
  primaryColor?: string;
  supportEmail?: string;
  frontendBaseURL?: string;
}

export interface TenantSubscription {
  plan: Plan;
  isActive: boolean;
  subExpDate: string | null;
  billingCycle: BillingCycle | null;
  supportNotes?: string;
}

export interface Tenant {
  _id: string;
  slug: string;
  name: string;
  status: TenantStatus;
  subscription: TenantSubscription;
  branding: TenantBranding;
  createdAt: string;
  updatedAt?: string;
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
