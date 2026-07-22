import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listEstimates, deleteEstimate, downloadEstimatePDF, markEstimateSent, downloadBlob } from '@officing/api-client';
import type { Estimate } from '@officing/api-client';
import { useAuthStore } from '../../store/auth';
import { Btn, SBadge, DataTable, PageShell } from '../../components/ui/index';
import { Plus, ArrowDownToSquare, Pencil, TrashBin, ArrowUpFromSquare } from '@gravity-ui/icons';

const STATUS_COLOR: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
  draft: 'neutral', sent: 'info', accepted: 'success', declined: 'danger', expired: 'warning',
};
const COLS = [
  { key: 'estimateNumber', label: 'Number' }, { key: 'customer', label: 'Customer' },
  { key: 'status', label: 'Status' }, { key: 'total', label: 'Total', align: 'right' as const },
  { key: 'actions', label: '' },
];

export function EstimateListPage() {
  const qc           = useQueryClient();
  const subscription = useAuthStore(s => s.subscription);
  const hasPdf       = !subscription || ['standard', 'premium'].includes(subscription.plan);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({ queryKey: ['estimates', page], queryFn: () => listEstimates({ page, limit: 20 }) });
  const deleteMut = useMutation({ mutationFn: deleteEstimate, onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['estimates'] }); }, onError: (e: Error) => toast.error(e.message) });

  async function handlePDF(id: string, num: string) {
    if (!hasPdf) { toast.error('PDF requires Standard plan'); return; }
    try { downloadBlob(await downloadEstimatePDF(id), `estimate-${num}.pdf`); } catch (e: unknown) { toast.error((e as Error).message); }
  }
  async function handleMarkSent(id: string) {
    try { await markEstimateSent(id); toast.success('Marked as sent'); qc.invalidateQueries({ queryKey: ['estimates'] }); } catch (e: unknown) { toast.error((e as Error).message); }
  }

  function renderCell(est: Estimate, key: string) {
    const c = typeof est.customer === 'object' ? est.customer : null;
    switch (key) {
      case 'estimateNumber': return <Link to={`/estimates/${est._id}`} className="font-semibold hover:underline" style={{ color: 'var(--brand-primary)' }}>{est.estimateNumber}</Link>;
      case 'customer':       return <span>{c ? `${c.contact?.firstName ?? c.firstName ?? ''} ${c.contact?.lastName ?? c.lastName ?? ''}`.trim() : '—'}</span>;
      case 'status':         return <SBadge color={STATUS_COLOR[est.status] ?? 'neutral'}>{est.status}</SBadge>;
      case 'total':          return <span className="font-semibold tabular-nums">{est.total?.toLocaleString()}</span>;
      case 'actions':        return (
        <div className="flex items-center justify-end gap-1">
          <Link to={`/estimates/${est._id}/edit`}><Btn variant="ghost" size="sm"><Pencil width={13} height={13} /></Btn></Link>
          <Btn variant="ghost" size="sm" onClick={() => handleMarkSent(est._id)}><ArrowUpFromSquare width={13} height={13} /></Btn>
          <Btn variant="ghost" size="sm" onClick={() => handlePDF(est._id, est.estimateNumber)}><ArrowDownToSquare width={13} height={13} /></Btn>
          <Btn variant="danger-soft" size="sm" onClick={() => { if (confirm('Delete?')) deleteMut.mutate(est._id); }}><TrashBin width={13} height={13} /></Btn>
        </div>
      );
      default: return null;
    }
  }

  return (
    <PageShell title="Estimates" subtitle="Create and send quotes to your customers."
      actions={<Link to="/estimates/new"><Btn size="sm"><Plus width={14} height={14} /> New estimate</Btn></Link>}
    >
      <DataTable columns={COLS} rows={data?.docs ?? []} renderCell={renderCell} isLoading={isLoading}
        page={page} hasNextPage={data?.hasNextPage} hasPrevPage={data?.hasPrevPage} totalDocs={data?.totalDocs ?? 0} limit={20} onPageChange={setPage}
        emptyMessage="No estimates yet."
      />
    </PageShell>
  );
}
