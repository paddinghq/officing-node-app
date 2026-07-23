import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getEstimate, deleteEstimate, downloadEstimatePDF, downloadBlob } from '@officing/api-client';
import { useAuthStore } from '../../store/auth';
import { Btn, SBadge, SCard } from '../../components/ui/index';
import { Spinner } from '@heroui/react';
import { ArrowLeft, Pencil, ArrowDownToSquare, TrashBin } from '@gravity-ui/icons';

const STATUS_COLOR: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
  draft: 'neutral', sent: 'info', accepted: 'success', declined: 'danger', expired: 'warning',
};

export function EstimateDetailPage() {
  const { id }       = useParams<{ id: string }>();
  const navigate     = useNavigate();
  const subscription = useAuthStore(s => s.subscription);
  const hasPdf       = !subscription || ['standard', 'premium'].includes(subscription.plan);

  const { data, isLoading } = useQuery({ queryKey: ['estimate', id], queryFn: () => getEstimate(id!), enabled: !!id });
  const deleteMut = useMutation({ mutationFn: () => deleteEstimate(id!), onSuccess: () => { toast.success('Deleted'); navigate('/estimates'); }, onError: (e: Error) => toast.error(e.message) });

  async function handlePDF() {
    if (!hasPdf) { toast.error('PDF requires Standard plan'); return; }
    try { downloadBlob(await downloadEstimatePDF(id!), `estimate-${data?.data.estimateNumber}.pdf`); }
    catch (e: unknown) { toast.error((e as Error).message); }
  }

  const est = data?.data;
  if (isLoading) return <div className="flex items-center justify-center p-16"><Spinner /></div>;
  if (!est)      return <div className="p-8 text-center" style={{ color: 'var(--danger)' }}>Estimate not found.</div>;

  const c = typeof est.customer === 'object' ? est.customer : null;

  return (
    <div className="p-5 sm:p-7 max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <Link to="/estimates" className="rounded-xl p-1.5" style={{ color: 'var(--muted)' }}><ArrowLeft width={18} height={18} /></Link>
          <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>{est.estimateNumber}</h1>
          <SBadge color={STATUS_COLOR[est.status] ?? 'neutral'}>{est.status}</SBadge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/estimates/${id}/edit`}><Btn variant="secondary" size="sm"><Pencil width={13} height={13} /> Edit</Btn></Link>
          <Btn variant="secondary" size="sm" onClick={handlePDF}><ArrowDownToSquare width={13} height={13} /> PDF</Btn>
          <Btn variant="danger-soft" size="sm" onClick={() => { if (confirm('Delete?')) deleteMut.mutate(); }}><TrashBin width={13} height={13} /></Btn>
        </div>
      </div>

      <SCard>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
          <div><p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--muted)' }}>Customer</p><p className="font-medium">{c ? `${c.contact?.firstName ?? c.firstName ?? ''} ${c.contact?.lastName ?? c.lastName ?? ''}`.trim() : '—'}</p></div>
          <div><p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--muted)' }}>Total</p><p className="text-2xl font-bold tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>{est.total?.toLocaleString()}</p></div>
          {est.expiryDate && <div><p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--muted)' }}>Expiry</p><p className="font-mono text-sm">{est.expiryDate?.slice(0, 10)}</p></div>}
        </div>

        {est.inventory?.items?.length > 0 && (
          <div className="mt-6" style={{ borderTop: '1px solid var(--separator)', paddingTop: '1.5rem' }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>Line items</p>
            <table className="w-full text-sm">
              <thead><tr style={{ background: 'var(--surface-secondary)' }}>
                {['Item', 'Qty', 'Amount'].map(h => <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {est.inventory.items.map((item, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--separator)' }}>
                    <td className="px-4 py-2">{typeof item.asset === 'object' ? item.asset.name : item.asset}</td>
                    <td className="px-4 py-2 font-mono text-xs" style={{ color: 'var(--muted)' }}>{item.quantity}</td>
                    <td className="px-4 py-2 font-semibold tabular-nums">{item.amount?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SCard>
    </div>
  );
}
