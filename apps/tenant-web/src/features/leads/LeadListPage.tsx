import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listLeads, deleteLead } from '@officing/api-client';
import type { Lead, LeadStatus } from '@officing/api-client';
import { useAuthStore } from '../../store/auth';
import { Btn, SBadge, DataTable, PageShell, PlanGate } from '../../components/ui/index';
import { Field } from '../../components/ui/Field';
import { Plus, Pencil, TrashBin } from '@gravity-ui/icons';

const STATUS_COLOR: Record<LeadStatus, 'info' | 'warning' | 'success' | 'danger'> = {
  new: 'info', contacted: 'warning', qualified: 'success', disqualified: 'danger',
};
const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' }, { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' }, { value: 'qualified', label: 'Qualified' },
  { value: 'disqualified', label: 'Disqualified' },
];
const COLS = [
  { key: 'name', label: 'Name' }, { key: 'company', label: 'Company' },
  { key: 'status', label: 'Status' }, { key: 'source', label: 'Source' },
  { key: 'assigned', label: 'Assigned to' }, { key: 'actions', label: '' },
];

export function LeadListPage() {
  const subscription = useAuthStore(s => s.subscription);
  const hasCrm = !subscription || ['standard', 'premium'].includes(subscription.plan);
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['crm-leads', page, status, q], queryFn: () => listLeads({ page, limit: 20, status: status || undefined, q: q || undefined }), enabled: hasCrm });
  const deleteMut = useMutation({ mutationFn: deleteLead, onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['crm-leads'] }); }, onError: (e: Error) => toast.error(e.message) });

  function renderCell(lead: Lead, key: string) {
    switch (key) {
      case 'name':     return <Link to={`/leads/${lead._id}`} className="font-semibold hover:underline" style={{ color: 'var(--brand-primary)' }}>{lead.contact.firstName} {lead.contact.lastName}</Link>;
      case 'company':  return <span style={{ color: 'var(--muted)' }}>{lead.contact.companyName || '—'}</span>;
      case 'status':   return <SBadge color={STATUS_COLOR[lead.status]}>{lead.status}</SBadge>;
      case 'source':   return <span className="capitalize" style={{ color: 'var(--muted)' }}>{lead.source.replace(/_/g, ' ')}</span>;
      case 'assigned': return <span style={{ color: 'var(--muted)' }}>{typeof lead.assignedTo === 'object' && lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : '—'}</span>;
      case 'actions':  return (
        <div className="flex items-center justify-end gap-1">
          <Link to={`/leads/${lead._id}/edit`}><Btn variant="ghost" size="sm"><Pencil width={13} height={13} /></Btn></Link>
          <Btn variant="danger-soft" size="sm" onClick={() => { if (confirm('Delete this lead?')) deleteMut.mutate(lead._id); }}><TrashBin width={13} height={13} /></Btn>
        </div>
      );
      default: return null;
    }
  }

  return (
    <PlanGate allowed={hasCrm} feature="CRM — Leads">
      <PageShell title="Leads" subtitle="Track and manage your incoming leads."
        actions={<Link to="/leads/new"><Btn size="sm"><Plus width={14} height={14} /> New lead</Btn></Link>}
      >
        <div className="flex gap-3 flex-wrap">
          <Field.Select options={STATUS_OPTIONS} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="w-44" />
          <Field placeholder="Search leads…" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} className="w-60" />
        </div>
        <DataTable columns={COLS} rows={data?.docs ?? []} renderCell={renderCell} isLoading={isLoading}
          page={page} hasNextPage={data?.hasNextPage} hasPrevPage={data?.hasPrevPage} totalDocs={data?.totalDocs ?? 0} limit={20} onPageChange={setPage}
          emptyMessage="No leads yet. Start by creating your first lead."
        />
      </PageShell>
    </PlanGate>
  );
}
