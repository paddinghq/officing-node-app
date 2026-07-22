import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getBill, deleteBill, downloadBillPDF, downloadBlob } from '@officing/api-client';
import { useAuthStore } from '../../store/auth';
import { Btn, SBadge, SCard } from '../../components/ui/index';
import { BillPaymentModal } from './BillPaymentModal';
import { Spinner } from '@heroui/react';
import { ArrowLeft, Pencil, ArrowDownToSquare, CreditCard, TrashBin } from '@gravity-ui/icons';

const STATUS_COLOR: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
  draft: 'neutral', sent: 'info', paid: 'success', partial: 'warning', overdue: 'danger',
};

export function BillDetailPage() {
  const { id }       = useParams<{ id: string }>();
  const navigate     = useNavigate();
  const qc           = useQueryClient();
  const subscription = useAuthStore(s => s.subscription);
  const hasPdf       = !subscription || ['standard', 'premium'].includes(subscription.plan);
  const [payModal, setPayModal] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ['bill', id], queryFn: () => getBill(id!), enabled: !!id });
  const deleteMut = useMutation({ mutationFn: () => deleteBill(id!), onSuccess: () => { toast.success('Deleted'); navigate('/bills'); }, onError: (e: Error) => toast.error(e.message) });

  async function handlePDF() {
    if (!hasPdf) { toast.error('PDF requires Standard plan'); return; }
    try { downloadBlob(await downloadBillPDF(id!), `bill-${data?.data.billNumber}.pdf`); }
    catch (e: unknown) { toast.error((e as Error).message); }
  }

  const bill = data?.data;
  if (isLoading) return <div className="flex items-center justify-center p-16"><Spinner /></div>;
  if (!bill)     return <div className="p-8 text-center" style={{ color: 'var(--danger)' }}>Bill not found.</div>;

  const m = typeof bill.merchant === 'object' ? bill.merchant : null;

  return (
    <div className="p-5 sm:p-7 max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <Link to="/bills" className="rounded-xl p-1.5" style={{ color: 'var(--muted)' }}><ArrowLeft width={18} height={18} /></Link>
          <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>{bill.billNumber}</h1>
          <SBadge color={STATUS_COLOR[bill.status] ?? 'neutral'}>{bill.status}</SBadge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/bills/${id}/edit`}><Btn variant="secondary" size="sm"><Pencil width={13} height={13} /> Edit</Btn></Link>
          <Btn variant="secondary" size="sm" onClick={handlePDF}><ArrowDownToSquare width={13} height={13} /> PDF</Btn>
          <Btn size="sm" onClick={() => setPayModal(true)}><CreditCard width={13} height={13} /> Record payment</Btn>
          <Btn variant="danger-soft" size="sm" onClick={() => { if (confirm('Delete bill?')) deleteMut.mutate(); }}><TrashBin width={13} height={13} /></Btn>
        </div>
      </div>

      <SCard>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          {[
            { label: 'Merchant', value: m ? `${m.contact?.firstName ?? m.firstName ?? ''} ${m.contact?.lastName ?? m.lastName ?? ''}`.trim() : '—' },
            { label: 'Due date', value: bill.dueDate?.slice(0, 10) },
            { label: 'Total', value: bill.total?.toLocaleString() },
            { label: 'Amount due', value: bill.amountDue?.toLocaleString() },
          ].map(r => (
            <div key={r.label}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--muted)' }}>{r.label}</p>
              <p className="font-semibold tabular-nums" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-display)' }}>{r.value}</p>
            </div>
          ))}
        </div>

        {bill.inventory?.items?.length > 0 && (
          <div className="mt-6" style={{ borderTop: '1px solid var(--separator)', paddingTop: '1.5rem' }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>Line items</p>
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <table className="w-full text-sm">
                <thead><tr style={{ background: 'var(--surface-secondary)', borderBottom: '1px solid var(--separator)' }}>
                  {['Item', 'Qty', 'Amount'].map(h => <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {bill.inventory.items.map((item, i) => (
                    <tr key={i} style={{ borderBottom: i < bill.inventory.items.length - 1 ? '1px solid var(--separator)' : 'none' }}>
                      <td className="px-4 py-2.5">{typeof item.asset === 'object' ? item.asset.name : item.asset}</td>
                      <td className="px-4 py-2.5 font-mono text-xs" style={{ color: 'var(--muted)' }}>{item.quantity}</td>
                      <td className="px-4 py-2.5 font-semibold tabular-nums">{item.amount?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SCard>

      {payModal && <BillPaymentModal open={payModal} billId={id!} onClose={() => setPayModal(false)} onSuccess={() => { setPayModal(false); qc.invalidateQueries({ queryKey: ['bill', id] }); }} />}
    </div>
  );
}
