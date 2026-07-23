import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { listTenants } from '@officing/api-client';
import type { Tenant } from '@officing/api-client';
import { Button, Spinner } from '@heroui/react';
import { Plus } from '@gravity-ui/icons';
import { useAdminStore } from '../../store/auth';
import { PaginatedTable } from '../../components/ui/PaginatedTable';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active:    { bg: 'rgba(22,163,74,0.12)',  text: '#16a34a' },
  suspended: { bg: 'rgba(220,38,38,0.12)',  text: '#dc2626' },
  inactive:  { bg: 'var(--surface-secondary)', text: 'var(--muted)' },
};

const PLAN_COLORS: Record<string, { bg: string; text: string }> = {
  free:     { bg: 'var(--surface-secondary)', text: 'var(--muted)' },
  basic:    { bg: 'rgba(99,102,241,0.12)',  text: '#6366f1' },
  standard: { bg: 'rgba(245,158,11,0.12)',  text: '#d97706' },
  premium:  { bg: 'rgba(22,163,74,0.12)',   text: '#16a34a' },
};

const STATUS_OPTIONS = [
  { value: '',          label: 'All statuses' },
  { value: 'active',    label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'inactive',  label: 'Inactive' },
];

const COLUMNS = [
  { id: 'slug',      name: 'Slug' },
  { id: 'name',      name: 'Name' },
  { id: 'plan',      name: 'Plan' },
  { id: 'status',    name: 'Status' },
  { id: 'createdAt', name: 'Created' },
  { id: 'actions',   name: '' },
];

const ROWS_PER_PAGE = 20;

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.inactive;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
      style={{ background: c.bg, color: c.text }}
    >
      {status}
    </span>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const c = PLAN_COLORS[plan] ?? PLAN_COLORS.free;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
      style={{ background: c.bg, color: c.text }}
    >
      {plan}
    </span>
  );
}

export function TenantListPage() {
  const admin = useAdminStore(s => s.admin);
  const isSuperAdmin = admin?.role === 'superadmin';
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-tenants', page, statusFilter],
    queryFn: () => listTenants({ page, limit: ROWS_PER_PAGE, status: statusFilter || undefined }),
  });

  const rows = data?.tenants ?? [];
  const totalItems = data?.total ?? 0;

  const renderCell = useCallback(
    (t: Tenant, columnKey: string) => {
      switch (columnKey) {
        case 'slug':
          return (
            <span
              className="font-mono text-xs"
              style={{ color: 'var(--muted)' }}
            >
              {t.slug}
            </span>
          );
        case 'name':
          return (
            <span className="font-medium" style={{ color: 'var(--foreground)' }}>
              {t.name}
            </span>
          );
        case 'plan':
          return <PlanBadge plan={t.subscription.plan} />;
        case 'status':
          return <StatusBadge status={t.status} />;
        case 'createdAt':
          return (
            <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
              {new Date(t.createdAt).toLocaleDateString()}
            </span>
          );
        case 'actions':
          return (
            <Button
              variant="outline"
              className="text-xs"
              onPress={() => navigate(`/admin/tenants/${t.slug}`)}
            >
              View
            </Button>
          );
        default:
          return null;
      }
    },
    [navigate]
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            className="text-2xl font-semibold tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
          >
            Tenants
          </h2>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Manage every organization on the platform.
          </p>
        </div>

        <div className="flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row sm:items-center">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-xl border px-3 py-2 text-sm w-full sm:w-44"
            style={{
              background: 'var(--field-background)',
              borderColor: 'var(--field-border)',
              color: 'var(--field-foreground)',
            }}
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {isSuperAdmin && (
            <Button
              variant="primary"
              className="w-full sm:w-auto font-medium"
              onPress={() => navigate('/admin/tenants/new')}
            >
              <Plus width={16} height={16} />
              New tenant
            </Button>
          )}
        </div>
      </div>

      {/* Table card */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <PaginatedTable
            ariaLabel="Tenants table"
            columns={COLUMNS}
            items={rows}
            totalItems={totalItems}
            page={page}
            rowsPerPage={ROWS_PER_PAGE}
            onPageChange={setPage}
            renderCell={renderCell}
          />
        )}
      </div>
    </div>
  );
}
