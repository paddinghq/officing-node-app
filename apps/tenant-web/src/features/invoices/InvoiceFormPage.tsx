import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createInvoice, updateInvoice, getInvoice, listCustomers } from '@officing/api-client';
import type { LineItem } from '@officing/api-client';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { LineItemsEditor } from './LineItemsEditor';

export function InvoiceFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    customer: '',
    dueDate: '',
    currency: 'NGN',
  });
  const [items, setItems] = useState<LineItem[]>([{ name: '', quantity: 1, rate: 0 }]);
  const [image, setImage] = useState<File | null>(null);

  const { data: inv } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoice(id!),
    enabled: isEdit,
  });

  const { data: customers } = useQuery({
    queryKey: ['customers-select'],
    queryFn: () => listCustomers({ limit: 200 }),
  });

  useEffect(() => {
    if (inv?.data) {
      const d = inv.data;
      setForm({
        customer: typeof d.customer === 'object' ? d.customer._id : (d.customer ?? ''),
        dueDate: d.dueDate?.slice(0, 10) ?? '',
        currency: d.currency ?? 'NGN',
      });
      if (d.inventory?.items) setItems(d.inventory.items);
    }
  }, [inv]);

  const mutation = useMutation({
    mutationFn: async () => {
      const body = {
        customer: form.customer,
        dueDate: form.dueDate,
        currency: form.currency,
        inventory: { items },
      };
      if (image) {
        const fd = new FormData();
        fd.append('customer', form.customer);
        fd.append('dueDate', form.dueDate);
        fd.append('currency', form.currency);
        fd.append('inventory[items]', JSON.stringify(items));
        fd.append('inventory[inventoryImage]', image);
        return isEdit ? updateInvoice(id!, body) : createInvoice(fd);
      }
      return isEdit ? updateInvoice(id!, body) : createInvoice(body);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Invoice updated' : 'Invoice created');
      qc.invalidateQueries({ queryKey: ['invoices'] });
      navigate('/invoices');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const custOptions = [
    { value: '', label: '— Select customer —' },
    ...(customers?.docs ?? []).map(c => ({
      value: c._id,
      label: `${c.firstName} ${c.lastName}${c.companyName ? ` (${c.companyName})` : ''}`,
    })),
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customer) { toast.error('Please select a customer'); return; }
    mutation.mutate();
  }

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <h2 className="text-xl font-semibold">{isEdit ? 'Edit Invoice' : 'New Invoice'}</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <div className="space-y-4">
            <Select
              label="Customer *"
              options={custOptions}
              value={form.customer}
              onChange={e => setForm(f => ({ ...f, customer: e.target.value }))}
            />
            <Input
              label="Due Date"
              type="date"
              required
              value={form.dueDate}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
            />
            <Input
              label="Currency"
              value={form.currency}
              onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
            />
          </div>
        </Card>

        <Card title="Line Items">
          <LineItemsEditor items={items} onChange={setItems} />
        </Card>

        <Card title="Attachment (optional)">
          <input type="file" accept="image/*" onChange={e => setImage(e.target.files?.[0] ?? null)} />
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={mutation.isPending}>{isEdit ? 'Update Invoice' : 'Create Invoice'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/invoices')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
