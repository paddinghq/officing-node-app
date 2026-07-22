import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  listInvoices, deleteInvoice, exportInvoicesCSV, downloadInvoicePDF,
  sendInvoice, markInvoiceSent, duplicateInvoice, downloadBlob,
} from '@officing/api-client';
import type { Invoice } from '@officing/api-client';
import { useAuthStore } from '../../store/auth';
import { Btn, SBadge, DataTable, SModal, PageShell } from '../../components/ui/index';
import { Field } from '../../components/ui/Field';
import { PaymentModal } from './PaymentModal';
import {
  Plus, ArrowDownToSquare, FileDollar, FileText,
  Pencil, TrashBin, ArrowUpFromSquare, CreditCard, FilePlus, PaperPlane,
} from '@gravity-ui/icons';

const STATUS_COLOR: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
  draft: 'neutral', sent: 'info', paid: 'success', partial: 'warning', overdue: 'danger', cancelled: 'neutral',
};

function fmt(n: number) {
  return new Intl.NumberFormat('en', { minimumFractionDigits: 2 }).format(n);
}

const COLS = [
  { key: 'invoiceNumber', label: 'Number' },
  { key: 'customer',      label: 'Customer' },
  { key: 'status',        label: 'Status' },
  { key: 'dueDate',       label: 'Due date' },
  { key: 'total',         label: 'Total', align: 'right' as const },
  { key: 'actions',       label: '' },
];

export function InvoiceListPage() {
  const qc           = useQueryClient();
  const subscription = useAuthStore(s => s.subscription);
  const hasPdf       = !subscription || ['standard', 'premium'].includes(subscription.plan);

  const [page, setPage]           = useState(1);
  const [sendModal, setSendModal] = useState<Invoice | null>(null);
  const [payModal, setPayModal]   = useState<Invoice | null>(null);
  const [sendMsg, setSendMsg]     = useState('');
  const [sendLoading, setSendLoading] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ['invoices', page], queryFn: () => listInvoices({ page, limit: 20 }) });

  const deleteMut = useMutation({ mutationFn: deleteInvoice, onSuccess: () => { toast.success('Invoice deleted'); qc.invalidateQueries({ queryKey: ['invoices'] }); }, onError: (e: Error) => toast.error(e.message) });
  const dupMut    = useMutation({ mutationFn: duplicateInvoice, onSuccess: () => { toast.success('Duplicated'); qc.invalidateQueries({ queryKey: ['invoices'] }); }, onError: (e: Error) => toast.error(e.message) });

  async function handleExport() {
    try { downloadBlob(await exportInvoicesCSV(), 'invoices.csv'); } catch (e: unknown) { toast.error((e as Error).message); }
  }
  async function handlePDF(id: string, num: string) {
    if (!hasPdf) { toast.error('PDF export requires Standard plan'); return; }
    try { downloadBlob(await downloadInvoicePDF(id), `invoice-${num}.pdf`); } catch (e: unknown) { toast.error((e as Error).message); }
  }
  async function handleMarkSent(id: string) {
    try { await markInvoiceSent(id); toast.success('Marked as sent'); qc.invalidateQueries({ queryKey: ['invoices'] }); } catch (e: unknown) { toast.error((e as Error).message); }
  }
  async function handleSend() {
    if (!sendModal) return;
    setSendLoading(true);
    try { await sendInvoice(sendModal._id, sendMsg); toast.success('Invoice sent'); setSendModal(null); setSendMsg(''); qc.invalidateQueries({ queryKey: ['invoices'] }); }
    catch (e: unknown) { toast.error((e as Error).message); }
    finally { setSendLoading(false); }
  }

  function renderCell(inv: Invoice, key: string) {
    const cust = typeof inv.customer === 'object' ? inv.customer : null;
    switch (key) {
      case 'invoiceNumber':
        return (
          <Link to={`/invoices/${inv._id}`} className="font-semibold hover:underline" style={{ color: 'var(--brand-primary)' }}>
            {inv.invoiceNumber}
          </Link>
        );
      case 'customer':   return <span style={{ color: 'var(--foreground)' }}>{cust ? `${cust.contact?.firstName ?? cust.firstName ?? ''} ${cust.contact?.lastName ?? cust.lastName ?? ''}`.trim() : '—'}</span>;
      case 'status':     return <SBadge color={STATUS_COLOR[inv.status] ?? 'neutral'}>{inv.status}</SBadge>;
      case 'dueDate':    return <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>{inv.dueDate?.slice(0, 10)}</span>;
      case 'total':      return <span className="font-semibold tabular-nums">{fmt(inv.total)}</span>;
      case 'actions':
        return (
          <div className="flex items-center justify-end gap-1 flex-wrap">
            <Link to={`/invoices/${inv._id}/edit`}>
              <Btn variant="ghost" size="sm"><Pencil width={13} height={13} /></Btn>
            </Link>
            <Btn variant="ghost" size="sm" onClick={() => setSendModal(inv)}><PaperPlane width={13} height={13} /></Btn>
            <Btn variant="ghost" size="sm" onClick={() => handleMarkSent(inv._id)}><ArrowUpFromSquare width={13} height={13} /></Btn>
            <Btn variant="ghost" size="sm" onClick={() => setPayModal(inv)}><CreditCard width={13} height={13} /></Btn>
            <Btn variant="ghost" size="sm" onClick={() => handlePDF(inv._id, inv.invoiceNumber)}><ArrowDownToSquare width={13} height={13} /></Btn>
            <Btn variant="ghost" size="sm" onClick={() => dupMut.mutate(inv._id)}><FilePlus width={13} height={13} /></Btn>
            <Btn variant="danger-soft" size="sm" onClick={() => { if (confirm('Delete invoice?')) deleteMut.mutate(inv._id); }}><TrashBin width={13} height={13} /></Btn>
          </div>
        );
      default: return null;
    }
  }

  return (
    <PageShell
      title="Invoices"
      subtitle="Manage your sales invoices and payments."
      actions={
        <>
          <Btn variant="secondary" size="sm" onClick={handleExport}>
            <ArrowDownToSquare width={14} height={14} /> Export CSV
          </Btn>
          <Link to="/invoices/new">
            <Btn size="sm"><Plus width={14} height={14} /> New invoice</Btn>
          </Link>
        </>
      }
    >
      {/* Summary strip */}
      {data?.summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(data.summary).map(([k, v]) => (
            <div
              key={k}
              className="rounded-2xl border p-4"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>
                {k.replace(/([A-Z])/g, ' $1').trim()}
              </p>
              <p className="text-xl font-bold tabular-nums" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
                {typeof v === 'number' ? fmt(v) : String(v)}
              </p>
            </div>
          ))}
        </div>
      )}

      <DataTable
        columns={COLS}
        rows={data?.docs ?? []}
        renderCell={renderCell}
        isLoading={isLoading}
        page={page}
        hasNextPage={data?.hasNextPage}
        hasPrevPage={data?.hasPrevPage}
        totalDocs={data?.totalDocs ?? 0}
        limit={20}
        onPageChange={setPage}
        emptyMessage="No invoices yet. Create your first invoice."
      />

      <SModal open={!!sendModal} onClose={() => { setSendModal(null); setSendMsg(''); }} title="Send invoice" size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Btn variant="secondary" onClick={() => setSendModal(null)}>Cancel</Btn>
            <Btn loading={sendLoading} onClick={handleSend}>
              <PaperPlane width={14} height={14} /> Send
            </Btn>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Send invoice <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{sendModal?.invoiceNumber}</span> to the customer's email.
          </p>
          <Field.Textarea
            label="Optional message"
            rows={3}
            placeholder="Add a personal note…"
            value={sendMsg}
            onChange={e => setSendMsg(e.target.value)}
          />
        </div>
      </SModal>

      {payModal && (
        <PaymentModal
          open={!!payModal}
          invoiceId={payModal._id}
          onClose={() => setPayModal(null)}
          onSuccess={() => { setPayModal(null); qc.invalidateQueries({ queryKey: ['invoices'] }); }}
        />
      )}
    </PageShell>
  );
}
