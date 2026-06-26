import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { recordInvoicePayment } from '@officing/api-client';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';

interface Props {
  open: boolean;
  invoiceId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PAYMENT_MODES = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
];

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
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Record Payment">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Amount"
          type="number"
          step="0.01"
          required
          value={form.amount}
          onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
        />
        <Input
          label="Payment Date"
          type="date"
          required
          value={form.paymentDate}
          onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))}
        />
        <Select
          label="Payment Mode"
          options={PAYMENT_MODES}
          value={form.paymentMode}
          onChange={e => setForm(f => ({ ...f, paymentMode: e.target.value }))}
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Receipt (optional)</label>
          <input type="file" accept="image/*,.pdf" onChange={e => setReceipt(e.target.files?.[0] ?? null)} />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Record Payment</Button>
        </div>
      </form>
    </Modal>
  );
}
