import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createBill, updateBill, getBill, listMerchants } from '@officing/api-client';
import type { LineItem } from '@officing/api-client';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { LineItemsEditor } from '../invoices/LineItemsEditor';

export function BillFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({ merchant: '', dueDate: '' });
  const [items, setItems] = useState<LineItem[]>([{ name: '', quantity: 1, rate: 0 }]);
  const { data: bill } = useQuery({ queryKey: ['bill', id], queryFn: () => getBill(id!), enabled: isEdit });
  const { data: merchants } = useQuery({ queryKey: ['merchants-select'], queryFn: () => listMerchants({ limit: 200 }) });
  useEffect(() => {
    if (bill?.data) {
      const d = bill.data;
      setForm({ merchant: typeof d.merchant === 'object' ? d.merchant._id : (d.merchant ?? ''), dueDate: d.dueDate?.slice(0, 10) ?? '' });
      if (d.inventory?.items) setItems(d.inventory.items);
    }
  }, [bill]);
  const mutation = useMutation({
    mutationFn: () => {
      const body = { merchant: form.merchant, dueDate: form.dueDate, inventory: { items } };
      return isEdit ? updateBill(id!, body) : createBill(body);
    },
    onSuccess: () => { toast.success(isEdit ? 'Updated' : 'Created'); qc.invalidateQueries({ queryKey: ['bills'] }); navigate('/bills'); },
    onError: (e: Error) => toast.error(e.message),
  });
  const merOptions = [{ value: '', label: '— Select merchant —' }, ...(merchants?.docs ?? []).map(m => ({ value: m._id, label: `${m.firstName} ${m.lastName}` }))];
  return (
    <div className="p-8 max-w-2xl space-y-6">
      <h2 className="text-xl font-semibold">{isEdit ? 'Edit Bill' : 'New Bill'}</h2>
      <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-6">
        <Card>
          <div className="space-y-4">
            <Select label="Merchant *" options={merOptions} value={form.merchant} onChange={e => setForm(f => ({ ...f, merchant: e.target.value }))} />
            <Input label="Due Date" type="date" required value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>
        </Card>
        <Card title="Line Items"><LineItemsEditor items={items} onChange={setItems} /></Card>
        <div className="flex gap-3">
          <Button type="submit" loading={mutation.isPending}>{isEdit ? 'Update' : 'Create'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/bills')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
