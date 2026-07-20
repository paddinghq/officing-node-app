import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getDeal, deleteDeal } from '@officing/api-client';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ActivityTimeline } from '../../components/crm/ActivityTimeline';
import { WinDealModal } from './WinDealModal';
import { LoseDealModal } from './LoseDealModal';

export function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [winOpen, setWinOpen] = useState(false);
  const [loseOpen, setLoseOpen] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ['crm-deal', id], queryFn: () => getDeal(id!), enabled: !!id });
  const deal = data?.data;

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['crm-deal', id] });
    qc.invalidateQueries({ queryKey: ['crm-deals'] });
    qc.invalidateQueries({ queryKey: ['crm-deals-board'] });
  }

  const deleteMut = useMutation({
    mutationFn: () => deleteDeal(id!),
    onSuccess: () => { toast.success('Deal deleted'); navigate('/deals'); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="p-8 text-gray-400">Loading…</div>;
  if (!deal) return <div className="p-8 text-red-600">Deal not found.</div>;

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate(-1)} className="text-sm text-gray-400 hover:text-gray-600 mb-1">← Back</button>
          <h2 className="text-xl font-semibold">{deal.title}</h2>
        </div>
        <div className="flex gap-2">
          {deal.status === 'open' && <Link to={`/deals/${id}/edit`}><Button variant="secondary" size="sm">Edit</Button></Link>}
          <Button variant="danger" size="sm" onClick={() => { if (confirm('Delete this deal?')) deleteMut.mutate(); }}>Delete</Button>
        </div>
      </div>

      <Card title="Details">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-gray-500">Status</p><Badge color={deal.status === 'won' ? 'green' : deal.status === 'lost' ? 'red' : 'blue'}>{deal.status}</Badge></div>
          <div><p className="text-gray-500">Stage</p><p>{deal.stage}</p></div>
          <div><p className="text-gray-500">Value</p><p>{deal.value.amount.toLocaleString()} {deal.value.currency}</p></div>
          <div><p className="text-gray-500">Probability</p><p>{deal.probability}%</p></div>
          <div><p className="text-gray-500">Assigned To</p><p>{typeof deal.assignedTo === 'object' ? `${deal.assignedTo.firstName} ${deal.assignedTo.lastName}` : '—'}</p></div>
          {deal.expectedCloseDate && <div><p className="text-gray-500">Expected Close</p><p>{new Date(deal.expectedCloseDate).toLocaleDateString()}</p></div>}
          {deal.productsOfInterest && <div className="col-span-2"><p className="text-gray-500">Products/Services</p><p>{deal.productsOfInterest}</p></div>}
          {deal.notes && <div className="col-span-2"><p className="text-gray-500">Notes</p><p>{deal.notes}</p></div>}
          {deal.lostReason && <div className="col-span-2"><p className="text-gray-500">Lost Reason</p><p>{deal.lostReason}</p></div>}
        </div>
      </Card>

      <Card title="Stage History">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-500"><th className="pb-2">Stage</th><th className="pb-2">Entered</th></tr></thead>
          <tbody>
            {deal.stageHistory.map((h, i) => (
              <tr key={i} className="border-t"><td className="py-2">{h.stage}</td><td className="py-2 text-gray-500">{new Date(h.enteredAt).toLocaleString()}</td></tr>
            ))}
          </tbody>
        </table>
      </Card>

      {deal.status === 'open' && (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setWinOpen(true)}>Win Deal</Button>
          <Button size="sm" variant="danger" onClick={() => setLoseOpen(true)}>Lose Deal</Button>
        </div>
      )}

      <ActivityTimeline kind="deal" id={id!} />

      <WinDealModal open={winOpen} dealId={id!} onClose={() => setWinOpen(false)} onSuccess={invalidate} />
      <LoseDealModal open={loseOpen} dealId={id!} onClose={() => setLoseOpen(false)} onSuccess={invalidate} />
    </div>
  );
}
