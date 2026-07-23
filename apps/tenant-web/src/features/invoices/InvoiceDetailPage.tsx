import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getInvoice, deleteInvoice, downloadInvoicePDF, downloadBlob, markInvoiceSent } from '@officing/api-client';
import { useAuthStore } from '../../store/auth';
import { Btn, SBadge, SCard } from '../../components/ui/index';
import { PaymentModal } from './PaymentModal';
import { Spinner } from '@heroui/react';
import { ArrowLeft, Pencil, ArrowDownToSquare, CreditCard, TrashBin, ArrowUpFromSquare } from '@gravity-ui/icons';

const STATUS_COLOR: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
  draft: 'neutral', sent: 'info', paid: 'success', partial: 'warning', overdue: 'danger', cancelled: 'neutral',
};

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--muted)' }}>{label}</p>
      <div style={{ color: 'var(--foreground)' }}>{children}</div>
    </div>
  );
}

export function InvoiceDetailPage() {
  const { id }       = useParams<{ id: string }>();
  const navigate     = useNavigate();
  const qc           = useQueryClient();
  const subscription = useAuthStore(s => s.subscription);
  const hasPdf       = !subscription || ['standard', 'premium'].includes(subscription.plan);
  const [payModal, setPayModal] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ['invoice', id], queryFn: () => getInvoice(id!), enabled: !!id });
  const deleteMut = useMutation({ mutationFn: () => deleteInvoice(id!), onSuccess: () => { toast.success('Deleted'); navigate('/invoices'); }, onError: (e: Error) => toast.error(e.message) });

  async function handlePDF() {
    if (!hasPdf) { toast.error('PDF requires Standard plan'); return; }
    try { downloadBlob(await downloadInvoicePDF(id!), `invoice-${data?.data.invoiceNumber}.pdf`); }
    catch (e: unknown) { toast.error((e as Error).message); }
  }
  async function handleMarkSent() {
    try { await markInvoiceSent(id!); toast.success('Marked as sent'); qc.invalidateQueries({ queryKey: ['invoice', id] }); }
    catch (e: unknown) { toast.error((e as Error).message); }
  }

  const inv = data?.data;

  if (isLoading) return <div className="flex items-center justify-center p-16"><Spinner /></div>;
  if (!inv) return <div className="p-8 text-center" style={{ color: 'var(--danger)' }}>Invoice not found.</div>;

  const cust = typeof inv.customer === 'object' ? inv.customer : null;

  return (
    <div className="p-5 sm:p-7 max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <Link to="/invoices" className="rounded-xl p-1.5 transition-colors" style={{ color: 'var(--muted)' }}>
            <ArrowLeft width={18} height={18} />
          </Link>
          <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
            {inv.invoiceNumber}
          </h1>
          <SBadge color={STATUS_COLOR[inv.status] ?? 'neutral'}>{inv.status}</SBadge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/invoices/${id}/edit`}><Btn variant="secondary" size="sm"><Pencil width={13} height={13} /> Edit</Btn></Link>
          <Btn variant="secondary" size="sm" onClick={handleMarkSent}><ArrowUpFromSquare width={13} height={13} /> Mark sent</Btn>
          <Btn variant="secondary" size="sm" onClick={handlePDF}><ArrowDownToSquare width={13} height={13} /> PDF</Btn>
          <Btn size="sm" onClick={() => setPayModal(true)}><CreditCard width={13} height={13} /> Record payment</Btn>
          <Btn variant="danger-soft" size="sm" onClick={() => { if (confirm('Delete invoice?')) deleteMut.mutate(); }}><TrashBin width={13} height={13} /></Btn>
        </div>
      </div>

      <SCard>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          <InfoRow label="Customer">
            <p className="font-medium">{cust ? `${cust.contact?.firstName ?? cust.firstName ?? ''} ${cust.contact?.lastName ?? cust.lastName ?? ''}`.trim() : '—'}</p>
            {cust && (cust.contact?.email ?? cust.email) && <p className="text-xs" style={{ color: 'var(--muted)' }}>{cust.contact?.email ?? cust.email}</p>}
          </InfoRow>
          <InfoRow label="Due date">
            <p className="font-mono text-sm">{inv.dueDate?.slice(0, 10)}</p>
          </InfoRow>
          <InfoRow label="Total">
            <p className="text-2xl font-bold tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>
              {inv.total?.toLocaleString()}
            </p>
          </InfoRow>
          <InfoRow label="Amount due">
            <p className="text-2xl font-bold tabular-nums" style={{ fontFamily: 'var(--font-display)', color: '#dc2626' }}>
              {inv.amountDue?.toLocaleString()}
            </p>
          </InfoRow>
        </div>

        {inv.inventory?.items?.length > 0 && (
          <div className="mt-6" style={{ borderTop: '1px solid var(--separator)', paddingTop: '1.5rem' }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>Line items</p>
            <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--surface-secondary)', borderBottom: '1px solid var(--separator)' }}>
                    {['Item', 'Qty', 'Amount'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {inv.inventory.items.map((item, i) => (
                    <tr key={i} style={{ borderBottom: i < inv.inventory.items.length - 1 ? '1px solid var(--separator)' : 'none' }}>
                      <td className="px-4 py-2.5" style={{ color: 'var(--foreground)' }}>{typeof item.asset === 'object' ? item.asset.name : item.asset}</td>
                      <td className="px-4 py-2.5 tabular-nums" style={{ color: 'var(--muted)' }}>{item.quantity}</td>
                      <td className="px-4 py-2.5 font-semibold tabular-nums" style={{ color: 'var(--foreground)' }}>{item.amount?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payments history */}
        {inv.payments && inv.payments.length > 0 && (
          <div className="mt-6" style={{ borderTop: '1px solid var(--separator)', paddingTop: '1.5rem' }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>Payment history</p>
            <div className="space-y-2">
              {inv.payments.map((p, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl px-4 py-2.5" style={{ background: 'var(--surface-secondary)' }}>
                  <p className="text-sm font-medium">{p.paymentMode.replace(/_/g, ' ')}</p>
                  <p className="text-xs font-mono" style={{ color: 'var(--muted)' }}>{p.paymentDate?.slice(0, 10)}</p>
                  <p className="font-semibold tabular-nums">{p.amount?.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </SCard>

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
