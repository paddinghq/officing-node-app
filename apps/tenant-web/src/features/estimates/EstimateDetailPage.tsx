import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getEstimate, deleteEstimate } from '@officing/api-client';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';

type Color = 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'purple';
const statusColor: Record<string, Color> = { draft: 'gray', sent: 'blue', accepted: 'green', declined: 'red', expired: 'yellow' };

export function EstimateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['estimate', id], queryFn: () => getEstimate(id!), enabled: !!id });
  const deleteMut = useMutation({ mutationFn: () => deleteEstimate(id!), onSuccess: () => { toast.success('Deleted'); navigate('/estimates'); }, onError: (e: Error) => toast.error(e.message) });
  const est = data?.data;
  if (isLoading) return <div className="p-8 text-gray-400">Loading…</div>;
  if (!est) return <div className="p-8 text-red-600">Estimate not found.</div>;
  const c = typeof est.customer === 'object' ? est.customer : null;
  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/estimates" className="text-gray-400">← Estimates</Link>
          <h2 className="text-xl font-semibold">{est.estimateNumber}</h2>
          <Badge color={statusColor[est.status] ?? 'gray'}>{est.status}</Badge>
        </div>
        <div className="flex gap-2">
          <Link to={`/estimates/${id}/edit`}><Button variant="secondary" size="sm">Edit</Button></Link>
          <Button variant="danger" size="sm" onClick={() => { if (confirm('Delete?')) deleteMut.mutate(); }}>Delete</Button>
        </div>
      </div>
      <Card>
        <div className="grid grid-cols-2 gap-6">
          <div><p className="text-sm text-gray-500">Customer</p><p className="font-medium">{c ? `${c.firstName} ${c.lastName}` : 'N/A'}</p></div>
          <div><p className="text-sm text-gray-500">Total</p><p className="text-xl font-bold">{est.total?.toLocaleString()}</p></div>
        </div>
      </Card>
    </div>
  );
}
