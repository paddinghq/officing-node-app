import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createBill, updateBill, getBill, listMerchants, listAssets } from '@officing/api-client';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { InventoryEditor, computeInventoryPayload, type InventoryState } from '../invoices/InventoryEditor';

export function BillFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({ merchant: '', dueDate: '' });
  const [inventoryState, setInventoryState] = useState<InventoryState>({ items: [{ asset: '', quantity: 1 }], shipping: 0, discount: 0 });
  const { data: bill } = useQuery({ queryKey: ['bill', id], queryFn: () => getBill(id!), enabled: isEdit });
  const { data: merchants } = useQuery({ queryKey: ['merchants-select'], queryFn: () => listMerchants({ limit: 200 }) });
  const { data: assetsRes } = useQuery({ queryKey: ['assets-select'], queryFn: () => listAssets({ limit: 200 }) });
  const assets = assetsRes?.docs ?? [];
  useEffect(() => {
    if (bill?.data) {
      const d = bill.data;
      setForm({ merchant: typeof d.merchant === 'object' ? d.merchant._id : (d.merchant ?? ''), dueDate: d.dueDate?.slice(0, 10) ?? '' });
      if (d.inventory?.items) {
        setInventoryState({
          items: d.inventory.items.map(it => ({
            asset: typeof it.asset === 'object' ? it.asset._id : it.asset,
            quantity: it.quantity,
          })),
          shipping: d.inventory.shipping ?? 0,
          discount: d.inventory.discount ?? 0,
        });
      }
    }
  }, [bill]);
  const mutation = useMutation({
    mutationFn: () => {
      const inventory = computeInventoryPayload(inventoryState, assets);
      const body = { merchant: form.merchant, dueDate: form.dueDate, inventory };
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
        <Card title="Line Items"><InventoryEditor assets={assets} state={inventoryState} onChange={setInventoryState} /></Card>
        <div className="flex gap-3">
          <Button type="submit" loading={mutation.isPending}>{isEdit ? 'Update' : 'Create'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/bills')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
