import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createEstimate, updateEstimate, getEstimate, listCustomers } from '@officing/api-client';
import type { LineItem } from '@officing/api-client';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { LineItemsEditor } from '../invoices/LineItemsEditor';

export function EstimateFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({ customer: '', expiryDate: '' });
  const [items, setItems] = useState<LineItem[]>([{ name: '', quantity: 1, rate: 0 }]);
  const { data: est } = useQuery({ queryKey: ['estimate', id], queryFn: () => getEstimate(id!), enabled: isEdit });
  const { data: customers } = useQuery({ queryKey: ['customers-select'], queryFn: () => listCustomers({ limit: 200 }) });
  useEffect(() => {
    if (est?.data) {
      const d = est.data;
      setForm({ customer: typeof d.customer === 'object' ? d.customer._id : (d.customer ?? ''), expiryDate: d.expiryDate?.slice(0, 10) ?? '' });
      if (d.inventory?.items) setItems(d.inventory.items);
    }
  }, [est]);
  const mutation = useMutation({
    mutationFn: () => {
      const body = { customer: form.customer, expiryDate: form.expiryDate, inventory: { items } };
      return isEdit ? updateEstimate(id!, body) : createEstimate(body);
    },
    onSuccess: () => { toast.success(isEdit ? 'Updated' : 'Created'); qc.invalidateQueries({ queryKey: ['estimates'] }); navigate('/estimates'); },
    onError: (e: Error) => toast.error(e.message),
  });
  const custOptions = [{ value: '', label: '— Select customer —' }, ...(customers?.docs ?? []).map(c => ({ value: c._id, label: `${c.firstName} ${c.lastName}` }))];
  return (
    <div className="p-8 max-w-2xl space-y-6">
      <h2 className="text-xl font-semibold">{isEdit ? 'Edit Estimate' : 'New Estimate'}</h2>
      <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-6">
        <Card>
          <div className="space-y-4">
            <Select label="Customer *" options={custOptions} value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} />
            <Input label="Expiry Date" type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
          </div>
        </Card>
        <Card title="Line Items"><LineItemsEditor items={items} onChange={setItems} /></Card>
        <div className="flex gap-3">
          <Button type="submit" loading={mutation.isPending}>{isEdit ? 'Update' : 'Create'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/estimates')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
