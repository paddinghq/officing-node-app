import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  listInvoices, deleteInvoice, exportInvoicesCSV, downloadInvoicePDF,
  sendInvoice, markInvoiceSent, duplicateInvoice, downloadBlob,
} from '@officing/api-client';
import type { Invoice } from '@officing/api-client';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { PaymentModal } from './PaymentModal';
import { useAuthStore } from '../../store/auth';

type Color = 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'purple';
const statusColor: Record<string, Color> = {
  draft: 'gray', sent: 'blue', paid: 'green', partial: 'yellow', overdue: 'red', cancelled: 'gray',
};

function fmt(n: number) {
  return new Intl.NumberFormat('en', { minimumFractionDigits: 2 }).format(n);
}

export function InvoiceListPage() {
  const qc = useQueryClient();
  const subscription = useAuthStore(s => s.subscription);
  const hasPdf = !subscription || ['standard', 'premium'].includes(subscription.plan);

  const [page, setPage] = useState(1);
  const [sendModal, setSendModal] = useState<Invoice | null>(null);
  const [payModal, setPayModal] = useState<Invoice | null>(null);
  const [sendMsg, setSendMsg] = useState('');
  const [sendLoading, setSendLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page],
    queryFn: () => listInvoices({ page, limit: 20 }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['invoices'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const dupMut = useMutation({
    mutationFn: duplicateInvoice,
    onSuccess: () => { toast.success('Duplicated'); qc.invalidateQueries({ queryKey: ['invoices'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleExport() {
    try {
      const blob = await exportInvoicesCSV();
      downloadBlob(blob, 'invoices.csv');
    } catch (e: unknown) { toast.error((e as Error).message); }
  }

  async function handlePDF(id: string, num: string) {
    if (!hasPdf) { toast.error('PDF export requires Standard plan'); return; }
    try {
      const blob = await downloadInvoicePDF(id);
      downloadBlob(blob, `invoice-${num}.pdf`);
    } catch (e: unknown) { toast.error((e as Error).message); }
  }

  async function handleSend() {
    if (!sendModal) return;
    setSendLoading(true);
    try {
      await sendInvoice(sendModal._id, sendMsg);
      toast.success('Invoice sent');
      setSendModal(null); setSendMsg('');
      qc.invalidateQueries({ queryKey: ['invoices'] });
    } catch (e: unknown) { toast.error((e as Error).message); }
    finally { setSendLoading(false); }
  }

  return (
    <div className="p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Invoices</h2>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleExport}>Export CSV</Button>
          <Link to="/invoices/new"><Button size="sm">+ New Invoice</Button></Link>
        </div>
      </div>

      {/* Summary */}
      {data?.summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(data.summary).map(([k, v]) => (
            <div key={k} className="bg-white border rounded-lg p-3 shadow-sm">
              <p className="text-xs text-gray-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</p>
              <p className="font-bold">{typeof v === 'number' ? fmt(v) : String(v)}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Number', 'Customer', 'Status', 'Due Date', 'Total', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>}
            {!isLoading && data?.docs?.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No invoices yet.</td></tr>
            )}
            {data?.docs?.map(inv => {
              const cust = typeof inv.customer === 'object' ? inv.customer : null;
              const custName = cust ? `${cust.firstName} ${cust.lastName}` : 'Unknown';
              return (
                <tr key={inv._id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    <Link to={`/invoices/${inv._id}`} className="text-[var(--brand-primary)] hover:underline">
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{custName}</td>
                  <td className="px-4 py-3"><Badge color={statusColor[inv.status] ?? 'gray'}>{inv.status}</Badge></td>
                  <td className="px-4 py-3 text-gray-600">{inv.dueDate?.slice(0, 10)}</td>
                  <td className="px-4 py-3 font-medium">{fmt(inv.total)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={`/invoices/${inv._id}/edit`}>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => setSendModal(inv)}>Send</Button>
                      <Button variant="ghost" size="sm" onClick={() => setPayModal(inv)}>Pay</Button>
                      <Button variant="ghost" size="sm" onClick={() => handlePDF(inv._id, inv.invoiceNumber)}>PDF</Button>
                      <Button variant="ghost" size="sm" onClick={() => dupMut.mutate(inv._id)}>Dup</Button>
                      <Button variant="danger" size="sm"
                        onClick={() => { if (confirm('Delete?')) deleteMut.mutate(inv._id); }}
                      >Del</Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {data && (
          <div className="px-4 pb-4">
            <Pagination
              page={page}
              hasNextPage={data.hasNextPage}
              hasPrevPage={data.hasPrevPage}
              totalDocs={data.totalDocs}
              limit={20}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Send modal */}
      <Modal open={!!sendModal} onClose={() => { setSendModal(null); setSendMsg(''); }} title="Send Invoice">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Send invoice <strong>{sendModal?.invoiceNumber}</strong> to customer email.
          </p>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            rows={3}
            placeholder="Optional message…"
            value={sendMsg}
            onChange={e => setSendMsg(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setSendModal(null)}>Cancel</Button>
            <Button loading={sendLoading} onClick={handleSend}>Send</Button>
          </div>
        </div>
      </Modal>

      {/* Payment modal */}
      {payModal && (
        <PaymentModal
          open={!!payModal}
          invoiceId={payModal._id}
          onClose={() => setPayModal(null)}
          onSuccess={() => { setPayModal(null); qc.invalidateQueries({ queryKey: ['invoices'] }); }}
        />
      )}
    </div>
  );
}
