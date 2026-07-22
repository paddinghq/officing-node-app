import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listLeads, convertLead, dropLead } from '@officing/api-client';
import type { Lead } from '@officing/api-client';
import { useAuthStore } from '../../store/auth';
import { Btn, DataTable, PageShell, PlanGate } from '../../components/ui/index';
import { Field } from '../../components/ui/Field';
import { ReasonModal } from '../../components/crm/ReasonModal';
import { ArrowRightToSquare, FileText } from '@gravity-ui/icons';

const COLS = [
  { key: 'name', label: 'Name' }, { key: 'company', label: 'Company' },
  { key: 'followUp', label: 'Next follow-up' }, { key: 'score', label: 'Score' },
  { key: 'assigned', label: 'Assigned to' }, { key: 'actions', label: '' },
];

export function ProspectListPage() {
  const subscription = useAuthStore(s => s.subscription);
  const hasCrm = !subscription || ['standard', 'premium'].includes(subscription.plan);
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['crm-prospects', page, q], queryFn: () => listLeads({ page, limit: 20, status: 'qualified', q: q || undefined }), enabled: hasCrm });

  const convertMut = useMutation({ mutationFn: convertLead, onSuccess: () => { toast.success('Converted to customer'); qc.invalidateQueries({ queryKey: ['crm-prospects'] }); }, onError: (e: Error) => toast.error(e.message) });
  const dropMut    = useMutation({ mutationFn: (r: string) => dropLead(dropTarget!, r), onSuccess: () => { toast.success('Dropped'); setDropTarget(null); qc.invalidateQueries({ queryKey: ['crm-prospects'] }); }, onError: (e: Error) => toast.error(e.message) });

  function renderCell(lead: Lead, key: string) {
    switch (key) {
      case 'name':     return <Link to={`/prospects/${lead._id}`} className="font-semibold hover:underline" style={{ color: 'var(--brand-primary)' }}>{lead.contact.firstName} {lead.contact.lastName}</Link>;
      case 'company':  return <span style={{ color: 'var(--muted)' }}>{lead.contact.companyName || '—'}</span>;
      case 'followUp': return <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>{lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toLocaleDateString() : '—'}</span>;
      case 'score':    return <span style={{ color: 'var(--muted)' }}>{lead.qualification?.score ?? '—'}</span>;
      case 'assigned': return <span style={{ color: 'var(--muted)' }}>{typeof lead.assignedTo === 'object' && lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : '—'}</span>;
      case 'actions':  return (
        <div className="flex items-center justify-end gap-1 flex-wrap">
          <Link to={`/deals/new?leadId=${lead._id}`}><Btn variant="ghost" size="sm"><FileText width={13} height={13} /> Deal</Btn></Link>
          <Btn variant="secondary" size="sm" loading={convertMut.isPending} onClick={() => convertMut.mutate(lead._id)}>
            <ArrowRightToSquare width={13} height={13} /> Convert
          </Btn>
          <Btn variant="danger-soft" size="sm" onClick={() => setDropTarget(lead._id)}>Drop</Btn>
        </div>
      );
      default: return null;
    }
  }

  return (
    <PlanGate allowed={hasCrm} feature="CRM — Prospects">
      <PageShell title="Prospects" subtitle="Qualified leads ready to be converted or moved to a deal."
        actions={<Field placeholder="Search prospects…" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} className="w-60" />}
      >
        <DataTable columns={COLS} rows={data?.docs ?? []} renderCell={renderCell} isLoading={isLoading}
          page={page} hasNextPage={data?.hasNextPage} hasPrevPage={data?.hasPrevPage} totalDocs={data?.totalDocs ?? 0} limit={20} onPageChange={setPage}
          emptyMessage="No qualified prospects yet."
        />
      </PageShell>

      <ReasonModal open={!!dropTarget} title="Drop prospect" actionLabel="Drop" onClose={() => setDropTarget(null)} onSubmit={r => dropMut.mutate(r)} loading={dropMut.isPending} />
    </PlanGate>
  );
}
