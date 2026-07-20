import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listDeals, deleteDeal } from '@officing/api-client';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Select } from '../../components/ui/Select';
import { useAuthStore } from '../../store/auth';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

function fmt(n: number) {
  return new Intl.NumberFormat('en', { minimumFractionDigits: 2 }).format(n);
}

export function DealListPage() {
  const subscription = useAuthStore(s => s.subscription);
  const hasCrm = !subscription || ['standard', 'premium'].includes(subscription.plan);
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['crm-deals', page, status],
    queryFn: () => listDeals({ page, limit: 20, status: status || undefined }),
    enabled: hasCrm,
  });

  const deleteMut = useMutation({
    mutationFn: deleteDeal,
    onSuccess: () => { toast.success('Deal deleted'); qc.invalidateQueries({ queryKey: ['crm-deals'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!hasCrm) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold mb-4">Deals</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-yellow-800 font-medium">CRM is available on Standard plan and above.</p>
          <a href="mailto:support@officing.app" className="text-[var(--brand-primary)] underline text-sm mt-2 inline-block">Contact support to upgrade</a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Deals</h2>
        <div className="flex gap-2">
          <Link to="/deals/board"><Button variant="secondary" size="sm">Board View</Button></Link>
          <Link to="/deals/new"><Button size="sm">+ New Deal</Button></Link>
        </div>
      </div>

      <div className="w-48">
        <Select options={STATUS_OPTIONS} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['Title', 'Stage', 'Value', 'Assigned To', 'Expected Close', 'Actions'].map(h => (
              <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>}
            {!isLoading && !data?.docs?.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No deals yet.</td></tr>}
            {data?.docs?.map(deal => (
              <tr key={deal._id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium"><Link to={`/deals/${deal._id}`} className="hover:underline">{deal.title}</Link></td>
                <td className="px-4 py-3"><Badge color={deal.status === 'won' ? 'green' : deal.status === 'lost' ? 'red' : 'blue'}>{deal.stage}</Badge></td>
                <td className="px-4 py-3 text-gray-600">{fmt(deal.value.amount)} {deal.value.currency}</td>
                <td className="px-4 py-3 text-gray-600">{typeof deal.assignedTo === 'object' ? `${deal.assignedTo.firstName} ${deal.assignedTo.lastName}` : '—'}</td>
                <td className="px-4 py-3 text-gray-600">{deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {deal.status === 'open' && <Link to={`/deals/${deal._id}/edit`}><Button variant="ghost" size="sm">Edit</Button></Link>}
                    <Button variant="danger" size="sm" onClick={() => { if (confirm('Delete this deal?')) deleteMut.mutate(deal._id); }}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && (
          <div className="px-4 pb-4">
            <Pagination page={page} hasNextPage={data.hasNextPage} hasPrevPage={data.hasPrevPage} totalDocs={data.totalDocs} limit={20} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
