import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listLeads, deleteLead } from '@officing/api-client';
import type { LeadStatus } from '@officing/api-client';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';

type Color = 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'purple';
const statusColor: Record<LeadStatus, Color> = {
  new: 'blue', contacted: 'yellow', qualified: 'green', disqualified: 'red',
};

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'disqualified', label: 'Disqualified' },
];

export function LeadListPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['crm-leads', page, status, q],
    queryFn: () => listLeads({ page, limit: 20, status: status || undefined, q: q || undefined }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteLead,
    onSuccess: () => { toast.success('Lead deleted'); qc.invalidateQueries({ queryKey: ['crm-leads'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Leads</h2>
        <Link to="/leads/new"><Button size="sm">+ New Lead</Button></Link>
      </div>

      <div className="flex gap-3 items-end">
        <div className="w-48">
          <Select options={STATUS_OPTIONS} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} />
        </div>
        <div className="w-64">
          <Input placeholder="Search leads…" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['Name', 'Company', 'Status', 'Source', 'Assigned To', 'Actions'].map(h => (
              <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>}
            {!isLoading && !data?.docs?.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No leads yet.</td></tr>}
            {data?.docs?.map(lead => (
              <tr key={lead._id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">
                  <Link to={`/leads/${lead._id}`} className="hover:underline">
                    {lead.contact.firstName} {lead.contact.lastName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{lead.contact.companyName || '—'}</td>
                <td className="px-4 py-3"><Badge color={statusColor[lead.status]}>{lead.status}</Badge></td>
                <td className="px-4 py-3 text-gray-600">{lead.source}</td>
                <td className="px-4 py-3 text-gray-600">
                  {typeof lead.assignedTo === 'object' && lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link to={`/leads/${lead._id}/edit`}><Button variant="ghost" size="sm">Edit</Button></Link>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => { if (confirm('Delete this lead?')) deleteMut.mutate(lead._id); }}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && (
          <div className="px-4 pb-4">
            <Pagination
              page={page}
              hasNextPage={data.hasNextPage}
              hasPrevPage={data.hasPrevPage}
              totalDocs={data.totalDocs}
              limit={20}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
