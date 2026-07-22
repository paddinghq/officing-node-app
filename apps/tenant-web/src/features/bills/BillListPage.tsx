import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listBills, deleteBill, exportBillsCSV, downloadBillPDF, sendBill, downloadBlob } from '@officing/api-client';
import type { Bill } from '@officing/api-client';
import { useAuthStore } from '../../store/auth';
import { Btn, SBadge, DataTable, SModal, PageShell } from '../../components/ui/index';
import { Field } from '../../components/ui/Field';
import { BillPaymentModal } from './BillPaymentModal';
import { Plus, ArrowDownToSquare, Pencil, TrashBin, CreditCard, PaperPlane } from '@gravity-ui/icons';

const STATUS_COLOR: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
  draft: 'neutral', sent: 'info', paid: 'success', partial: 'warning', overdue: 'danger',
};
const COLS = [
  { key: 'billNumber', label: 'Number' }, { key: 'merchant', label: 'Merchant' },
  { key: 'status', label: 'Status' }, { key: 'dueDate', label: 'Due date' },
  { key: 'total', label: 'Total', align: 'right' as const }, { key: 'actions', label: '' },
];

export function BillListPage() {
  const qc           = useQueryClient();
  const subscription = useAuthStore(s => s.subscription);
  const hasPdf       = !subscription || ['standard', 'premium'].includes(subscription.plan);
  const [page, setPage]           = useState(1);
  const [sendModal, setSendModal] = useState<Bill | null>(null);
  const [payModal, setPayModal]   = useState<Bill | null>(null);
  const [sendMsg, setSendMsg]     = useState('');
  const [sendLoading, setSendLoading] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ['bills', page], queryFn: () => listBills({ page, limit: 20 }) });
  const deleteMut = useMutation({ mutationFn: deleteBill, onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['bills'] }); }, onError: (e: Error) => toast.error(e.message) });

  async function handleExport() { try { downloadBlob(await exportBillsCSV(), 'bills.csv'); } catch (e: unknown) { toast.error((e as Error).message); } }
  async function handlePDF(id: string, num: string) {
    if (!hasPdf) { toast.error('PDF requires Standard plan'); return; }
    try { downloadBlob(await downloadBillPDF(id), `bill-${num}.pdf`); } catch (e: unknown) { toast.error((e as Error).message); }
  }
  async function handleSend() {
    if (!sendModal) return;
    setSendLoading(true);
    try { await sendBill(sendModal._id, sendMsg); toast.success('Bill sent'); setSendModal(null); setSendMsg(''); qc.invalidateQueries({ queryKey: ['bills'] }); }
    catch (e: unknown) { toast.error((e as Error).message); }
    finally { setSendLoading(false); }
  }

  function renderCell(bill: Bill, key: string) {
    const m = typeof bill.merchant === 'object' ? bill.merchant : null;
    switch (key) {
      case 'billNumber': return <Link to={`/bills/${bill._id}`} className="font-semibold hover:underline" style={{ color: 'var(--brand-primary)' }}>{bill.billNumber}</Link>;
      case 'merchant':   return <span>{m ? `${m.contact?.firstName ?? m.firstName ?? ''} ${m.contact?.lastName ?? m.lastName ?? ''}`.trim() : '—'}</span>;
      case 'status':     return <SBadge color={STATUS_COLOR[bill.status] ?? 'neutral'}>{bill.status}</SBadge>;
      case 'dueDate':    return <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>{bill.dueDate?.slice(0, 10)}</span>;
      case 'total':      return <span className="font-semibold tabular-nums">{bill.total?.toLocaleString()}</span>;
      case 'actions':    return (
        <div className="flex items-center justify-end gap-1">
          <Link to={`/bills/${bill._id}/edit`}><Btn variant="ghost" size="sm"><Pencil width={13} height={13} /></Btn></Link>
          <Btn variant="ghost" size="sm" onClick={() => setSendModal(bill)}><PaperPlane width={13} height={13} /></Btn>
          <Btn variant="ghost" size="sm" onClick={() => setPayModal(bill)}><CreditCard width={13} height={13} /></Btn>
          <Btn variant="ghost" size="sm" onClick={() => handlePDF(bill._id, bill.billNumber)}><ArrowDownToSquare width={13} height={13} /></Btn>
          <Btn variant="danger-soft" size="sm" onClick={() => { if (confirm('Delete bill?')) deleteMut.mutate(bill._id); }}><TrashBin width={13} height={13} /></Btn>
        </div>
      );
      default: return null;
    }
  }

  return (
    <PageShell title="Bills" subtitle="Track payables to your vendors and merchants."
      actions={<>
        <Btn variant="secondary" size="sm" onClick={handleExport}><ArrowDownToSquare width={14} height={14} /> Export CSV</Btn>
        <Link to="/bills/new"><Btn size="sm"><Plus width={14} height={14} /> New bill</Btn></Link>
      </>}
    >
      <DataTable columns={COLS} rows={data?.docs ?? []} renderCell={renderCell} isLoading={isLoading}
        page={page} hasNextPage={data?.hasNextPage} hasPrevPage={data?.hasPrevPage} totalDocs={data?.totalDocs ?? 0} limit={20} onPageChange={setPage}
        emptyMessage="No bills yet."
      />

      <SModal open={!!sendModal} onClose={() => { setSendModal(null); setSendMsg(''); }} title="Send bill" size="sm"
        footer={<div className="flex justify-end gap-2"><Btn variant="secondary" onClick={() => setSendModal(null)}>Cancel</Btn><Btn loading={sendLoading} onClick={handleSend}><PaperPlane width={14} height={14} /> Send</Btn></div>}
      >
        <Field.Textarea label="Optional message" rows={3} placeholder="Add a note…" value={sendMsg} onChange={e => setSendMsg(e.target.value)} />
      </SModal>

      {payModal && <BillPaymentModal open={!!payModal} billId={payModal._id} onClose={() => setPayModal(null)} onSuccess={() => { setPayModal(null); qc.invalidateQueries({ queryKey: ['bills'] }); }} />}
    </PageShell>
  );
}
