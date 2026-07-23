import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listAuditLogs } from '@officing/api-client';
import { Spinner } from '@heroui/react';
import { ListUl, MagnifierPlus } from '@gravity-ui/icons';

const LIMIT = 30;

export function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [tenantSlug, setTenantSlug] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, tenantSlug],
    queryFn: () => listAuditLogs({ page, limit: LIMIT, tenantSlug: tenantSlug || undefined }),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;
  const start = (page - 1) * LIMIT + 1;
  const end = Math.min(page * LIMIT, data?.total ?? 0);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            className="text-2xl font-semibold tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
          >
            Audit logs
          </h2>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            A full record of actions performed across the platform.
          </p>
        </div>

        {/* Filter */}
        <div className="relative w-full sm:w-56">
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--muted)' }}
          >
            <MagnifierPlus width={15} height={15} />
          </span>
          <input
            type="text"
            placeholder="Filter by tenant slug"
            value={tenantSlug}
            onChange={e => { setTenantSlug(e.target.value); setPage(1); }}
            className="w-full rounded-xl border py-2 pl-9 pr-3 text-sm"
            style={{
              background: 'var(--field-background)',
              borderColor: 'var(--field-border)',
              color: 'var(--field-foreground)',
            }}
          />
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
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse text-sm">
                <thead>
                  <tr style={{ background: 'var(--surface-secondary)', borderBottom: '1px solid var(--separator)' }}>
                    {['Action', 'Tenant', 'Performed by', 'Date'].map(h => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                        style={{ color: 'var(--muted)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!data?.docs?.length && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-12 text-center"
                        style={{ color: 'var(--muted)' }}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <ListUl width={32} height={32} style={{ opacity: 0.4 }} />
                          <p className="text-sm">No audit logs found.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {data?.docs?.map(log => (
                    <tr
                      key={log._id}
                      style={{ borderBottom: '1px solid var(--separator)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-secondary)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
                          {log.tenantSlug ?? '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                          {log.performedBy ?? '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.total > 0 && (
              <div
                className="flex items-center justify-between px-5 py-4 border-t"
                style={{ borderColor: 'var(--separator)' }}
              >
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  Showing {start}–{end} of {data.total} results
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-40"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }}
                  >
                    Previous
                  </button>
                  <span className="text-xs px-2" style={{ color: 'var(--muted)' }}>
                    {page} / {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-40"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
