import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listBills, deleteBill, exportBillsCSV, downloadBillPDF, sendBill, downloadBlob } from '@officing/api-client';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { useAuthStore } from '../../store/auth';
import type { Bill } from '@officing/api-client';
import { BillPaymentModal } from './BillPaymentModal';

type Color = 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'purple';
const statusColor: Record<string, Color> = { draft: 'gray', sent: 'blue', paid: 'green', partial: 'yellow', overdue: 'red' };

export function BillListPage() {
  const qc = useQueryClient();
  const subscription = useAuthStore(s => s.subscription);
  const hasPdf = !subscription || ['standard', 'premium'].includes(subscription.plan);
  const [page, setPage] = useState(1);
  const [sendModal, setSendModal] = useState<Bill | null>(null);
  const [payModal, setPayModal] = useState<Bill | null>(null);
  const [sendMsg, setSendMsg] = useState('');
  const [sendLoading, setSendLoading] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ['bills', page], queryFn: () => listBills({ page, limit: 20 }) });

  const deleteMut = useMutation({
    mutationFn: deleteBill,
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['bills'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleExport() {
    try { downloadBlob(await exportBillsCSV(), 'bills.csv'); } catch (e: unknown) { toast.error((e as Error).message); }
  }

  async function handlePDF(id: string, num: string) {
    if (!hasPdf) { toast.error('PDF requires Standard plan'); return; }
    try { downloadBlob(await downloadBillPDF(id), `bill-${num}.pdf`); } catch (e: unknown) { toast.error((e as Error).message); }
  }

  async function handleSend() {
    if (!sendModal) return;
    setSendLoading(true);
    try {
      await sendBill(sendModal._id, sendMsg);
      toast.success('Bill sent');
      setSendModal(null); setSendMsg('');
      qc.invalidateQueries({ queryKey: ['bills'] });
    } catch (e: unknown) { toast.error((e as Error).message); }
    finally { setSendLoading(false); }
  }

  return (
    <div className="p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Bills</h2>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleExport}>Export CSV</Button>
          <Link to="/bills/new"><Button size="sm">+ New Bill</Button></Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['Number', 'Merchant', 'Status', 'Due Date', 'Total', 'Actions'].map(h => (
              <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>}
            {!isLoading && !data?.docs?.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No bills yet.</td></tr>}
            {data?.docs?.map(bill => {
              const m = typeof bill.merchant === 'object' ? bill.merchant : null;
              return (
                <tr key={bill._id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    <Link to={`/bills/${bill._id}`} className="text-[var(--brand-primary)] hover:underline">{bill.billNumber}</Link>
                  </td>
                  <td className="px-4 py-3">{m ? `${m.firstName} ${m.lastName}` : 'Unknown'}</td>
                  <td className="px-4 py-3"><Badge color={statusColor[bill.status] ?? 'gray'}>{bill.status}</Badge></td>
                  <td className="px-4 py-3">{bill.dueDate?.slice(0, 10)}</td>
                  <td className="px-4 py-3 font-medium">{bill.total?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link to={`/bills/${bill._id}/edit`}><Button variant="ghost" size="sm">Edit</Button></Link>
                      <Button variant="ghost" size="sm" onClick={() => setSendModal(bill)}>Send</Button>
                      <Button variant="ghost" size="sm" onClick={() => setPayModal(bill)}>Pay</Button>
                      <Button variant="ghost" size="sm" onClick={() => handlePDF(bill._id, bill.billNumber)}>PDF</Button>
                      <Button variant="danger" size="sm" onClick={() => { if (confirm('Delete?')) deleteMut.mutate(bill._id); }}>Del</Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {data && <div className="px-4 pb-4"><Pagination page={page} hasNextPage={data.hasNextPage} hasPrevPage={data.hasPrevPage} totalDocs={data.totalDocs} limit={20} onPageChange={setPage} /></div>}
      </div>

      <Modal open={!!sendModal} onClose={() => { setSendModal(null); setSendMsg(''); }} title="Send Bill">
        <div className="space-y-4">
          <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3} placeholder="Optional message…" value={sendMsg} onChange={e => setSendMsg(e.target.value)} />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setSendModal(null)}>Cancel</Button>
            <Button loading={sendLoading} onClick={handleSend}>Send</Button>
          </div>
        </div>
      </Modal>

      {payModal && <BillPaymentModal open={!!payModal} billId={payModal._id} onClose={() => setPayModal(null)} onSuccess={() => { setPayModal(null); qc.invalidateQueries({ queryKey: ['bills'] }); }} />}
    </div>
  );
}
