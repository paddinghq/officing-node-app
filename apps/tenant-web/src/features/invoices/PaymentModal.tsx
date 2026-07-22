import { useState } from 'react';
import toast from 'react-hot-toast';
import { recordInvoicePayment } from '@officing/api-client';
import { SModal } from '../../components/ui/SModal';
import { Btn } from '../../components/ui/Btn';
import { Field } from '../../components/ui/Field';

const MODES = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash',          label: 'Cash' },
  { value: 'card',          label: 'Card' },
  { value: 'cheque',        label: 'Cheque' },
  { value: 'other',         label: 'Other' },
];

interface Props { open: boolean; invoiceId: string; onClose: () => void; onSuccess: () => void; }

export function PaymentModal({ open, invoiceId, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({ amount: '', paymentDate: '', paymentMode: 'bank_transfer' });
  const [receipt, setReceipt] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (receipt) {
        const fd = new FormData();
        fd.append('amount', form.amount);
        fd.append('paymentDate', form.paymentDate);
        fd.append('paymentMode', form.paymentMode);
        fd.append('paymentReceiptImage', receipt);
        await recordInvoicePayment(invoiceId, fd);
      } else {
        await recordInvoicePayment(invoiceId, {
          amount: parseFloat(form.amount),
          paymentDate: form.paymentDate,
          paymentMode: form.paymentMode,
        });
      }
      toast.success('Payment recorded');
      onSuccess();
    } catch (e: unknown) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <SModal open={open} onClose={onClose} title="Record payment" size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" loading={loading} onClick={() => document.getElementById('pay-form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}>
            Record payment
          </Btn>
        </div>
      }
    >
      <form id="pay-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Amount" type="number" step="0.01" required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
        <Field label="Payment date" type="date" required value={form.paymentDate} onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))} />
        <Field.Select label="Payment mode" options={MODES} value={form.paymentMode} onChange={e => setForm(f => ({ ...f, paymentMode: e.target.value }))} />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Receipt (optional)</label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={e => setReceipt(e.target.files?.[0] ?? null)}
            className="text-sm"
            style={{ color: 'var(--foreground)' }}
          />
        </div>
      </form>
    </SModal>
  );
}
