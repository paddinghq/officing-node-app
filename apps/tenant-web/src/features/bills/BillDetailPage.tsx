import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getBill, deleteBill } from '@officing/api-client';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';

type Color = 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'purple';
const statusColor: Record<string, Color> = { draft: 'gray', sent: 'blue', paid: 'green', partial: 'yellow', overdue: 'red' };

export function BillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['bill', id], queryFn: () => getBill(id!), enabled: !!id });
  const deleteMut = useMutation({ mutationFn: () => deleteBill(id!), onSuccess: () => { toast.success('Deleted'); navigate('/bills'); }, onError: (e: Error) => toast.error(e.message) });
  const bill = data?.data;
  if (isLoading) return <div className="p-8 text-gray-400">Loading…</div>;
  if (!bill) return <div className="p-8 text-red-600">Bill not found.</div>;
  const m = typeof bill.merchant === 'object' ? bill.merchant : null;
  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/bills" className="text-gray-400 hover:text-gray-600">← Bills</Link>
          <h2 className="text-xl font-semibold">{bill.billNumber}</h2>
          <Badge color={statusColor[bill.status] ?? 'gray'}>{bill.status}</Badge>
        </div>
        <div className="flex gap-2">
          <Link to={`/bills/${id}/edit`}><Button variant="secondary" size="sm">Edit</Button></Link>
          <Button variant="danger" size="sm" onClick={() => { if (confirm('Delete?')) deleteMut.mutate(); }}>Delete</Button>
        </div>
      </div>
      <Card>
        <div className="grid grid-cols-2 gap-6">
          <div><p className="text-sm text-gray-500">Merchant</p><p className="font-medium">{m ? `${m.firstName} ${m.lastName}` : 'N/A'}</p></div>
          <div><p className="text-sm text-gray-500">Due Date</p><p className="font-medium">{bill.dueDate?.slice(0, 10)}</p></div>
          <div><p className="text-sm text-gray-500">Total</p><p className="text-xl font-bold">{bill.total?.toLocaleString()}</p></div>
          <div><p className="text-sm text-gray-500">Amount Due</p><p className="text-xl font-bold text-red-600">{bill.amountDue?.toLocaleString()}</p></div>
        </div>
      </Card>
    </div>
  );
}
