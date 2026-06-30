import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listAuditLogs } from '@officing/api-client';
import { Pagination } from '../../components/ui/Pagination';
import { Input } from '../../components/ui/Input';

export function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [tenantSlug, setTenantSlug] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, tenantSlug],
    queryFn: () => listAuditLogs({ page, limit: 30, tenantSlug: tenantSlug || undefined }),
  });

  return (
    <div className="p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Audit Logs</h2>
        <div className="w-56">
          <Input placeholder="Filter by tenant slug…" value={tenantSlug} onChange={e => { setTenantSlug(e.target.value); setPage(1); }} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['Action', 'Tenant', 'Performed By', 'Date'].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>)}</tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>}
            {!isLoading && !data?.tenants?.length && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No audit logs.</td></tr>}
            {data?.tenants?.map(log => (
              <tr key={log._id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{log.action}</td>
                <td className="px-4 py-3 font-mono text-xs">{log.tenantSlug ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{log.performedBy ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && <div className="px-4 pb-4"><Pagination page={page} hasNextPage={page * 30 < data.total} hasPrevPage={page > 1} totalDocs={data.total} limit={30} onPageChange={setPage} /></div>}
      </div>
    </div>
  );
}
