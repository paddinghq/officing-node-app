import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getDealsBoard, changeDealStage } from '@officing/api-client';
import { useAuthStore } from '../../store/auth';
import { Btn, PageShell, PlanGate, SBadge } from '../../components/ui/index';
import { Spinner } from '@heroui/react';
import { ListUl } from '@gravity-ui/icons';

function fmt(n: number) { return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n); }

export function DealBoardPage() {
  const subscription = useAuthStore(s => s.subscription);
  const hasCrm = !subscription || ['standard', 'premium'].includes(subscription.plan);
  const qc = useQueryClient();
  const [dragOver, setDragOver] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['crm-deals-board'], queryFn: getDealsBoard, enabled: hasCrm });

  const stageMut = useMutation({
    mutationFn: ({ dealId, stage }: { dealId: string; stage: string }) => changeDealStage(dealId, stage),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-deals-board'] }),
    onError: (e: Error) => toast.error(e.message),
  });

  function handleDrop(e: React.DragEvent, stage: string) {
    e.preventDefault();
    setDragOver(null);
    const dealId = e.dataTransfer.getData('text/plain');
    if (dealId) stageMut.mutate({ dealId, stage });
  }

  return (
    <PlanGate allowed={hasCrm} feature="CRM — Deal board">
      <PageShell title="Deals — Board view" subtitle="Drag cards between columns to update stage."
        actions={<Link to="/deals"><Btn variant="secondary" size="sm"><ListUl width={13} height={13} /> Table view</Btn></Link>}
      >
        {isLoading && <div className="flex justify-center py-16"><Spinner /></div>}

        {!isLoading && (
          <div className="flex gap-4 overflow-x-auto pb-6">
            {data?.board.map(group => (
              <div
                key={group.stage}
                onDragOver={e => { e.preventDefault(); setDragOver(group.stage); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={e => handleDrop(e, group.stage)}
                className="shrink-0 w-72 flex flex-col gap-3 rounded-2xl p-3 transition-colors"
                style={{
                  background: dragOver === group.stage
                    ? 'color-mix(in srgb, var(--brand-primary) 8%, var(--surface-secondary))'
                    : 'var(--surface-secondary)',
                  border: `2px solid ${dragOver === group.stage ? 'var(--brand-primary)' : 'transparent'}`,
                }}
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--foreground)' }}>
                    {group.label}
                  </span>
                  <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
                    {group.count} · {fmt(group.totalValue)}
                  </span>
                </div>

                {/* Cards */}
                {group.deals.map(deal => (
                  <div
                    key={deal._id}
                    draggable
                    onDragStart={e => e.dataTransfer.setData('text/plain', deal._id)}
                    className="rounded-xl border p-3 cursor-grab active:cursor-grabbing shadow-sm transition-shadow hover:shadow-md"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                  >
                    <Link
                      to={`/deals/${deal._id}`}
                      className="block text-sm font-semibold hover:underline truncate mb-1.5"
                      style={{ color: 'var(--foreground)' }}
                    >
                      {deal.title}
                    </Link>
                    <p className="text-xs font-semibold tabular-nums mb-1.5" style={{ color: 'var(--brand-primary)' }}>
                      {deal.value.amount.toLocaleString()} {deal.value.currency}
                    </p>
                    {typeof deal.assignedTo === 'object' && deal.assignedTo && (
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>
                        {deal.assignedTo.firstName} {deal.assignedTo.lastName}
                      </p>
                    )}
                  </div>
                ))}

                {group.deals.length === 0 && (
                  <p className="text-xs text-center py-6" style={{ color: 'var(--muted)' }}>
                    No deals in this stage
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </PageShell>
    </PlanGate>
  );
}
