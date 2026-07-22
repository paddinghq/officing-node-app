import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getDeal, deleteDeal } from '@officing/api-client';
import { Btn, SBadge, SCard } from '../../components/ui/index';
import { ActivityTimeline } from '../../components/crm/ActivityTimeline';
import { WinDealModal } from './WinDealModal';
import { LoseDealModal } from './LoseDealModal';
import { Spinner } from '@heroui/react';
import { ArrowLeft, Pencil, TrashBin, Medal, CircleXmark } from '@gravity-ui/icons';

const STATUS_COLOR: Record<string, 'success' | 'danger' | 'info'> = {
  won: 'success', lost: 'danger', open: 'info',
};

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--muted)' }}>{label}</p>
      <div className="text-sm" style={{ color: 'var(--foreground)' }}>{value}</div>
    </div>
  );
}

export function DealDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc       = useQueryClient();
  const [winOpen, setWinOpen]   = useState(false);
  const [loseOpen, setLoseOpen] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ['crm-deal', id], queryFn: () => getDeal(id!), enabled: !!id });
  const deal = data?.data;

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['crm-deal', id] });
    qc.invalidateQueries({ queryKey: ['crm-deals'] });
    qc.invalidateQueries({ queryKey: ['crm-deals-board'] });
  }

  const deleteMut = useMutation({ mutationFn: () => deleteDeal(id!), onSuccess: () => { toast.success('Deleted'); navigate('/deals'); }, onError: (e: Error) => toast.error(e.message) });

  if (isLoading) return <div className="flex items-center justify-center p-16"><Spinner /></div>;
  if (!deal)     return <div className="p-8 text-center" style={{ color: 'var(--danger)' }}>Deal not found.</div>;

  return (
    <div className="p-5 sm:p-7 max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => navigate(-1)} className="rounded-xl p-1.5" style={{ color: 'var(--muted)' }}><ArrowLeft width={18} height={18} /></button>
          <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>{deal.title}</h1>
          <SBadge color={STATUS_COLOR[deal.status] ?? 'neutral'}>{deal.status}</SBadge>
        </div>
        <div className="flex flex-wrap gap-2">
          {deal.status === 'open' && <Link to={`/deals/${id}/edit`}><Btn variant="secondary" size="sm"><Pencil width={13} height={13} /> Edit</Btn></Link>}
          <Btn variant="danger-soft" size="sm" onClick={() => { if (confirm('Delete deal?')) deleteMut.mutate(); }}><TrashBin width={13} height={13} /></Btn>
        </div>
      </div>

      <SCard title="Deal details">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Detail label="Stage"       value={deal.stage} />
          <Detail label="Value"       value={<span className="font-bold tabular-nums">{deal.value.amount.toLocaleString()} {deal.value.currency}</span>} />
          <Detail label="Probability" value={`${deal.probability}%`} />
          <Detail label="Assigned to" value={typeof deal.assignedTo === 'object' ? `${deal.assignedTo.firstName} ${deal.assignedTo.lastName}` : '—'} />
          {deal.expectedCloseDate && <Detail label="Expected close" value={new Date(deal.expectedCloseDate).toLocaleDateString()} />}
          {deal.productsOfInterest && <Detail label="Products" value={deal.productsOfInterest} />}
          {deal.notes && <Detail label="Notes" value={deal.notes} />}
          {deal.lostReason && <Detail label="Lost reason" value={deal.lostReason} />}
        </div>
      </SCard>

      <SCard title="Stage history">
        <div className="space-y-2">
          {deal.stageHistory.map((h, i) => (
            <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: i < deal.stageHistory.length - 1 ? '1px solid var(--separator)' : 'none' }}>
              <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{h.stage}</span>
              <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>{new Date(h.enteredAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </SCard>

      {deal.status === 'open' && (
        <div className="flex gap-2">
          <Btn size="sm" onClick={() => setWinOpen(true)}><Medal width={13} height={13} /> Win deal</Btn>
          <Btn size="sm" variant="danger-soft" onClick={() => setLoseOpen(true)}><CircleXmark width={13} height={13} /> Lose deal</Btn>
        </div>
      )}

      <ActivityTimeline kind="deal" id={id!} />

      <WinDealModal  open={winOpen}  dealId={id!} onClose={() => setWinOpen(false)}  onSuccess={invalidate} />
      <LoseDealModal open={loseOpen} dealId={id!} onClose={() => setLoseOpen(false)} onSuccess={invalidate} />
    </div>
  );
}
