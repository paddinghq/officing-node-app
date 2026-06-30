import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listTenants } from '@officing/api-client';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { useAdminStore } from '../../store/auth';

type Color = 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'purple';
const statusColor: Record<string, Color> = { active: 'green', suspended: 'red', inactive: 'gray' };
const planColor: Record<string, Color> = { free: 'gray', basic: 'blue', standard: 'purple', premium: 'green' };

export function TenantListPage() {
  const admin = useAdminStore(s => s.admin);
  const isSuperAdmin = admin?.role == 'superadmin';
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['admin-tenants', page, statusFilter],
    queryFn: () => listTenants({ page, limit: 20, status: statusFilter || undefined }),
  });

  return (
    <div className="p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Tenants</h2>
        <div className="flex gap-2 items-center">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
          {isSuperAdmin && <Link to="/admin/tenants/new"><Button size="sm" style={{ backgroundColor: '#4f46e5' }}>+ New Tenant</Button></Link>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['Slug', 'Name', 'Plan', 'Status', 'Created', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>)}</tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>}
            {!isLoading && !data?.tenants?.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No tenants found.</td></tr>}
            {data?.tenants?.map(t => (
              <tr key={t._id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{t.slug}</td>
                <td className="px-4 py-3 font-medium">{t.name}</td>
                <td className="px-4 py-3"><Badge color={planColor[t.subscription.plan] ?? 'gray'}>{t.subscription.plan}</Badge></td>
                <td className="px-4 py-3"><Badge color={statusColor[t.status] ?? 'gray'}>{t.status}</Badge></td>
                <td className="px-4 py-3 text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <Link to={`/admin/tenants/${t.slug}`}><Button variant="ghost" size="sm">View</Button></Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && <div className="px-4 pb-4"><Pagination page={page} hasNextPage={page * 20 < data.total} hasPrevPage={page > 1} totalDocs={data.total} limit={20} onPageChange={setPage} /></div>}
      </div>
    </div>
  );
}
