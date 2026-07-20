import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getInvoice, deleteInvoice, downloadInvoicePDF, downloadBlob, markInvoiceSent,
} from '@officing/api-client';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { PaymentModal } from './PaymentModal';
import { useAuthStore } from '../../store/auth';

type Color = 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'purple';
const statusColor: Record<string, Color> = {
  draft: 'gray', sent: 'blue', paid: 'green', partial: 'yellow', overdue: 'red', cancelled: 'gray',
};

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const subscription = useAuthStore(s => s.subscription);
  const hasPdf = !subscription || ['standard', 'premium'].includes(subscription.plan);
  const [payModal, setPayModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoice(id!),
    enabled: !!id,
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteInvoice(id!),
    onSuccess: () => { toast.success('Deleted'); navigate('/invoices'); },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handlePDF() {
    if (!hasPdf) { toast.error('PDF export requires Standard plan'); return; }
    try {
      const blob = await downloadInvoicePDF(id!);
      downloadBlob(blob, `invoice-${data?.data.invoiceNumber}.pdf`);
    } catch (e: unknown) { toast.error((e as Error).message); }
  }

  const inv = data?.data;

  if (isLoading) return <div className="p-8 text-gray-400">Loading…</div>;
  if (!inv) return <div className="p-8 text-red-600">Invoice not found.</div>;

  const cust = typeof inv.customer === 'object' ? inv.customer : null;

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/invoices" className="text-gray-400 hover:text-gray-600">← Invoices</Link>
          <h2 className="text-xl font-semibold">{inv.invoiceNumber}</h2>
          <Badge color={statusColor[inv.status] ?? 'gray'}>{inv.status}</Badge>
        </div>
        <div className="flex gap-2">
          <Link to={`/invoices/${id}/edit`}><Button variant="secondary" size="sm">Edit</Button></Link>
          <Button variant="secondary" size="sm" onClick={handlePDF}>Download PDF</Button>
          <Button size="sm" onClick={() => setPayModal(true)}>Record Payment</Button>
          <Button variant="danger" size="sm" onClick={() => { if (confirm('Delete?')) deleteMut.mutate(); }}>Delete</Button>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500">Customer</p>
            <p className="font-medium">{cust ? `${cust.firstName} ${cust.lastName}` : 'N/A'}</p>
            {cust?.email && <p className="text-sm text-gray-500">{cust.email}</p>}
          </div>
          <div>
            <p className="text-sm text-gray-500">Due Date</p>
            <p className="font-medium">{inv.dueDate?.slice(0, 10)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-xl font-bold">{inv.total?.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Amount Due</p>
            <p className="text-xl font-bold text-red-600">{inv.amountDue?.toLocaleString()}</p>
          </div>
        </div>

        {inv.inventory?.items?.length > 0 && (
          <div className="mt-6">
            <p className="font-medium mb-2 text-sm text-gray-700">Line Items</p>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Item', 'Qty', 'Amount'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-medium text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inv.inventory.items.map((item, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2">{typeof item.asset === 'object' ? item.asset.name : item.asset}</td>
                    <td className="px-3 py-2">{item.quantity}</td>
                    <td className="px-3 py-2">{item.amount?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {payModal && (
        <PaymentModal
          open={payModal}
          invoiceId={id!}
          onClose={() => setPayModal(false)}
          onSuccess={() => { setPayModal(false); qc.invalidateQueries({ queryKey: ['invoice', id] }); }}
        />
      )}
    </div>
  );
}
