import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getDealsBoard, changeDealStage } from '@officing/api-client';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/auth';

function fmt(n: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

export function DealBoardPage() {
  const subscription = useAuthStore(s => s.subscription);
  const hasCrm = !subscription || ['standard', 'premium'].includes(subscription.plan);
  const qc = useQueryClient();
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['crm-deals-board'], queryFn: getDealsBoard, enabled: hasCrm });

  const stageMutation = useMutation({
    mutationFn: ({ dealId, stage }: { dealId: string; stage: string }) => changeDealStage(dealId, stage),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-deals-board'] }),
    onError: (e: Error) => toast.error(e.message),
  });

  function handleDrop(e: React.DragEvent, stage: string) {
    e.preventDefault();
    setDragOverStage(null);
    const dealId = e.dataTransfer.getData('text/plain');
    if (dealId) stageMutation.mutate({ dealId, stage });
  }

  if (!hasCrm) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold mb-4">Deals — Board</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-yellow-800 font-medium">CRM is available on Standard plan and above.</p>
          <a href="mailto:support@officing.app" className="text-[var(--brand-primary)] underline text-sm mt-2 inline-block">Contact support to upgrade</a>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="p-8 text-gray-400">Loading board…</div>;

  return (
    <div className="p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Deals — Board</h2>
        <Link to="/deals"><Button variant="secondary" size="sm">Table View</Button></Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {data?.board.map(group => (
          <div
            key={group.stage}
            onDragOver={e => { e.preventDefault(); setDragOverStage(group.stage); }}
            onDragLeave={() => setDragOverStage(null)}
            onDrop={e => handleDrop(e, group.stage)}
            className={`flex-shrink-0 w-72 bg-gray-50 rounded-xl border ${dragOverStage === group.stage ? 'border-[var(--brand-primary)]' : 'border-gray-200'} p-3`}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="font-semibold text-sm text-gray-700">{group.label}</h3>
              <span className="text-xs text-gray-400">{group.count} · {fmt(group.totalValue)}</span>
            </div>
            <div className="space-y-2">
              {group.deals.map(deal => (
                <div
                  key={deal._id}
                  draggable
                  onDragStart={e => e.dataTransfer.setData('text/plain', deal._id)}
                  className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm cursor-grab active:cursor-grabbing"
                >
                  <Link to={`/deals/${deal._id}`} className="text-sm font-medium text-gray-900 hover:underline block truncate">
                    {deal.title}
                  </Link>
                  <p className="text-xs text-gray-500 mt-1">{deal.value.amount.toLocaleString()} {deal.value.currency}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {typeof deal.assignedTo === 'object' ? `${deal.assignedTo.firstName} ${deal.assignedTo.lastName}` : ''}
                  </p>
                </div>
              ))}
              {group.deals.length === 0 && <p className="text-xs text-gray-300 text-center py-4">No deals</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
