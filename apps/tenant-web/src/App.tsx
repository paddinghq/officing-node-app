import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { useAuthStore } from './store/auth';
import { getSubscription } from '@officing/api-client';

// Auth
import { LoginPage } from './features/auth/LoginPage';
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './features/auth/ResetPasswordPage';
import { VerifyEmailPage } from './features/auth/VerifyEmailPage';

// Finance
import { DashboardPage } from './features/dashboard/DashboardPage';
import { InvoiceListPage } from './features/invoices/InvoiceListPage';
import { InvoiceDetailPage } from './features/invoices/InvoiceDetailPage';
import { InvoiceFormPage } from './features/invoices/InvoiceFormPage';
import { BillListPage } from './features/bills/BillListPage';
import { BillDetailPage } from './features/bills/BillDetailPage';
import { BillFormPage } from './features/bills/BillFormPage';
import { EstimateListPage } from './features/estimates/EstimateListPage';
import { EstimateDetailPage } from './features/estimates/EstimateDetailPage';
import { EstimateFormPage } from './features/estimates/EstimateFormPage';
import { ExpenseListPage } from './features/expenses/ExpenseListPage';
import { ExpenseFormPage } from './features/expenses/ExpenseFormPage';
import { CustomerListPage } from './features/customers/CustomerListPage';
import { CustomerFormPage } from './features/customers/CustomerFormPage';
import { MerchantListPage } from './features/merchants/MerchantListPage';
import { MerchantFormPage } from './features/merchants/MerchantFormPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { UsersPage } from './features/uac/UsersPage';
import { RolesPage } from './features/uac/RolesPage';
import { SecurityPage } from './features/security/SecurityPage';
import { NotificationsPage } from './features/notifications/NotificationsPage';
import { SubscriptionPage } from './features/subscription/SubscriptionPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function SubscriptionLoader({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, setSubscription } = useAuthStore();

  useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const r = await getSubscription();
      setSubscription(r.subscription);
      return r.subscription;
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  return <>{children}</>;
}

export default function App() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  return (
    <SubscriptionLoader>
      <Routes>
        {/* Public */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* Protected */}
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/invoices" element={<InvoiceListPage />} />
          <Route path="/invoices/new" element={<InvoiceFormPage />} />
          <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
          <Route path="/invoices/:id/edit" element={<InvoiceFormPage />} />
          <Route path="/bills" element={<BillListPage />} />
          <Route path="/bills/new" element={<BillFormPage />} />
          <Route path="/bills/:id" element={<BillDetailPage />} />
          <Route path="/bills/:id/edit" element={<BillFormPage />} />
          <Route path="/estimates" element={<EstimateListPage />} />
          <Route path="/estimates/new" element={<EstimateFormPage />} />
          <Route path="/estimates/:id" element={<EstimateDetailPage />} />
          <Route path="/estimates/:id/edit" element={<EstimateFormPage />} />
          <Route path="/expenses" element={<ExpenseListPage />} />
          <Route path="/expenses/new" element={<ExpenseFormPage />} />
          <Route path="/expenses/:id/edit" element={<ExpenseFormPage />} />
          <Route path="/customers" element={<CustomerListPage />} />
          <Route path="/customers/new" element={<CustomerFormPage />} />
          <Route path="/customers/:id/edit" element={<CustomerFormPage />} />
          <Route path="/merchants" element={<MerchantListPage />} />
          <Route path="/merchants/new" element={<MerchantFormPage />} />
          <Route path="/merchants/:id/edit" element={<MerchantFormPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/people" element={<UsersPage />} />
          <Route path="/people/roles" element={<RolesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </SubscriptionLoader>
  );
}
