import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useAdminStore } from './store/auth';
import { AdminLoginPage } from './features/auth/AdminLoginPage';
import { OverviewPage } from './features/overview/OverviewPage';
import { TenantListPage } from './features/tenants/TenantListPage';
import { TenantDetailPage } from './features/tenants/TenantDetailPage';
import { TenantCreatePage } from './features/tenants/TenantCreatePage';
import { AuditLogsPage } from './features/audit-logs/AuditLogsPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAdminStore(s => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const isAuthenticated = useAdminStore(s => s.isAuthenticated);

  return (
    <Routes>
      <Route path="/admin/login" element={isAuthenticated ? <Navigate to="/admin/overview" /> : <AdminLoginPage />} />

      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<Navigate to="/admin/overview" />} />
        <Route path="/admin/overview" element={<OverviewPage />} />
        <Route path="/admin/tenants" element={<TenantListPage />} />
        <Route path="/admin/tenants/new" element={<TenantCreatePage />} />
        <Route path="/admin/tenants/:slug" element={<TenantDetailPage />} />
        <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/admin/overview" />} />
    </Routes>
  );
}
