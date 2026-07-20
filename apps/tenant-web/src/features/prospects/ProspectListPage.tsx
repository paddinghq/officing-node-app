import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listLeads, convertLead, dropLead } from '@officing/api-client';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Pagination';
import { Input } from '../../components/ui/Input';
import { ReasonModal } from '../../components/crm/ReasonModal';

export function ProspectListPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['crm-prospects', page, q],
    queryFn: () => listLeads({ page, limit: 20, status: 'qualified', q: q || undefined }),
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['crm-prospects'] });
  }

  const convertMut = useMutation({
    mutationFn: convertLead,
    onSuccess: () => { toast.success('Converted to customer'); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const dropMut = useMutation({
    mutationFn: (reason: string) => dropLead(dropTarget!, reason),
    onSuccess: () => { toast.success('Prospect dropped'); setDropTarget(null); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Prospects</h2>
        <div className="w-64">
          <Input placeholder="Search prospects…" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['Name', 'Company', 'Next Follow-up', 'Score', 'Assigned To', 'Actions'].map(h => (
              <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>}
            {!isLoading && !data?.docs?.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No prospects yet.</td></tr>}
            {data?.docs?.map(lead => (
              <tr key={lead._id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">
                  <Link to={`/prospects/${lead._id}`} className="hover:underline">{lead.contact.firstName} {lead.contact.lastName}</Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{lead.contact.companyName || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3 text-gray-600">{lead.qualification?.score ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">
                  {typeof lead.assignedTo === 'object' && lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link to={`/deals/new?leadId=${lead._id}`}><Button variant="ghost" size="sm">Create Deal</Button></Link>
                    <Button variant="secondary" size="sm" loading={convertMut.isPending} onClick={() => convertMut.mutate(lead._id)}>Convert</Button>
                    <Button variant="danger" size="sm" onClick={() => setDropTarget(lead._id)}>Drop</Button>
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

      <ReasonModal
        open={!!dropTarget}
        title="Drop Prospect"
        actionLabel="Drop"
        onClose={() => setDropTarget(null)}
        onSubmit={reason => dropMut.mutate(reason)}
        loading={dropMut.isPending}
      />
    </div>
  );
}
