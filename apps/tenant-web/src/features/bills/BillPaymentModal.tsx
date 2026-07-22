import { useState } from 'react';
import toast from 'react-hot-toast';
import { recordBillPayment } from '@officing/api-client';
import { SModal } from '../../components/ui/SModal';
import { Btn } from '../../components/ui/Btn';
import { Field } from '../../components/ui/Field';

const MODES = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash',  label: 'Cash' },
  { value: 'card',  label: 'Card' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
];

interface Props { open: boolean; billId: string; onClose: () => void; onSuccess: () => void; }

export function BillPaymentModal({ open, billId, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({ amount: '', paymentDate: '', paymentMode: 'bank_transfer' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await recordBillPayment(billId, { amount: parseFloat(form.amount), paymentDate: form.paymentDate, paymentMode: form.paymentMode });
      toast.success('Payment recorded');
      onSuccess();
    } catch (e: unknown) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <SModal open={open} onClose={onClose} title="Record bill payment" size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" loading={loading} onClick={() => document.getElementById('bill-pay-form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}>
            Record
          </Btn>
        </div>
      }
    >
      <form id="bill-pay-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Amount" type="number" step="0.01" required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
        <Field label="Payment date" type="date" required value={form.paymentDate} onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))} />
        <Field.Select label="Payment mode" options={MODES} value={form.paymentMode} onChange={e => setForm(f => ({ ...f, paymentMode: e.target.value }))} />
      </form>
    </SModal>
  );
}
