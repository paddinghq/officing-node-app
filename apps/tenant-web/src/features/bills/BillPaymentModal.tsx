import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { recordBillPayment } from '@officing/api-client';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';

const MODES = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
];

export function BillPaymentModal({ open, billId, onClose, onSuccess }: { open: boolean; billId: string; onClose: () => void; onSuccess: () => void }) {
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
    <Modal open={open} onClose={onClose} title="Record Bill Payment">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Amount" type="number" step="0.01" required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
        <Input label="Payment Date" type="date" required value={form.paymentDate} onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))} />
        <Select label="Payment Mode" options={MODES} value={form.paymentMode} onChange={e => setForm(f => ({ ...f, paymentMode: e.target.value }))} />
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Record</Button>
        </div>
      </form>
    </Modal>
  );
}
