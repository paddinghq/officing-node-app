import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listDeals, deleteDeal } from '@officing/api-client';
import type { Deal } from '@officing/api-client';
import { useAuthStore } from '../../store/auth';
import { Btn, SBadge, DataTable, PageShell, PlanGate } from '../../components/ui/index';
import { Field } from '../../components/ui/Field';
import { Plus, Pencil, TrashBin, SquareBars } from '@gravity-ui/icons';

const STATUS_COLOR: Record<string, 'success' | 'danger' | 'info'> = {
  won: 'success', lost: 'danger', open: 'info',
};
const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' }, { value: 'open', label: 'Open' },
  { value: 'won', label: 'Won' }, { value: 'lost', label: 'Lost' },
];
const COLS = [
  { key: 'title', label: 'Title' }, { key: 'stage', label: 'Stage' },
  { key: 'value', label: 'Value', align: 'right' as const }, { key: 'assignedTo', label: 'Assigned to' },
  { key: 'closeDate', label: 'Close date' }, { key: 'actions', label: '' },
];

function fmt(n: number) { return new Intl.NumberFormat('en', { minimumFractionDigits: 2 }).format(n); }

export function DealListPage() {
  const subscription = useAuthStore(s => s.subscription);
  const hasCrm = !subscription || ['standard', 'premium'].includes(subscription.plan);
  const qc = useQueryClient();
  const [page, setPage]   = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['crm-deals', page, status], queryFn: () => listDeals({ page, limit: 20, status: status || undefined }), enabled: hasCrm });
  const deleteMut = useMutation({ mutationFn: deleteDeal, onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['crm-deals'] }); }, onError: (e: Error) => toast.error(e.message) });

  function renderCell(deal: Deal, key: string) {
    switch (key) {
      case 'title':      return <Link to={`/deals/${deal._id}`} className="font-semibold hover:underline" style={{ color: 'var(--brand-primary)' }}>{deal.title}</Link>;
      case 'stage':      return <SBadge color={STATUS_COLOR[deal.status] ?? 'neutral'}>{deal.stage}</SBadge>;
      case 'value':      return <span className="font-semibold tabular-nums">{fmt(deal.value.amount)} {deal.value.currency}</span>;
      case 'assignedTo': return <span style={{ color: 'var(--muted)' }}>{typeof deal.assignedTo === 'object' ? `${deal.assignedTo.firstName} ${deal.assignedTo.lastName}` : '—'}</span>;
      case 'closeDate':  return <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>{deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : '—'}</span>;
      case 'actions':    return (
        <div className="flex items-center justify-end gap-1">
          {deal.status === 'open' && <Link to={`/deals/${deal._id}/edit`}><Btn variant="ghost" size="sm"><Pencil width={13} height={13} /></Btn></Link>}
          <Btn variant="danger-soft" size="sm" onClick={() => { if (confirm('Delete?')) deleteMut.mutate(deal._id); }}><TrashBin width={13} height={13} /></Btn>
        </div>
      );
      default: return null;
    }
  }

  return (
    <PlanGate allowed={hasCrm} feature="CRM — Deals">
      <PageShell title="Deals" subtitle="Track opportunities through your pipeline."
        actions={<>
          <Link to="/deals/board"><Btn variant="secondary" size="sm"><SquareBars width={13} height={13} /> Board view</Btn></Link>
          <Link to="/deals/new"><Btn size="sm"><Plus width={14} height={14} /> New deal</Btn></Link>
        </>}
      >
        <div>
          <Field.Select options={STATUS_OPTIONS} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="w-44" />
        </div>
        <DataTable columns={COLS} rows={data?.docs ?? []} renderCell={renderCell} isLoading={isLoading}
          page={page} hasNextPage={data?.hasNextPage} hasPrevPage={data?.hasPrevPage} totalDocs={data?.totalDocs ?? 0} limit={20} onPageChange={setPage}
          emptyMessage="No deals yet."
        />
      </PageShell>
    </PlanGate>
  );
}
