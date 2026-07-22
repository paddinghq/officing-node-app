import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createBill, updateBill, getBill, listMerchants, listAssets } from '@officing/api-client';
import { Btn, SCard, PageShell } from '../../components/ui/index';
import { Field } from '../../components/ui/Field';
import { InventoryEditor, computeInventoryPayload, type InventoryState } from '../invoices/InventoryEditor';

export function BillFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({ merchant: '', dueDate: '' });
  const [inv, setInv]   = useState<InventoryState>({ items: [{ asset: '', quantity: 1 }], shipping: 0, discount: 0 });

  const { data: bill }      = useQuery({ queryKey: ['bill', id],        queryFn: () => getBill(id!),           enabled: isEdit });
  const { data: merchants } = useQuery({ queryKey: ['merchants-select'], queryFn: () => listMerchants({ limit: 200 }) });
  const { data: assetsRes } = useQuery({ queryKey: ['assets-select'],    queryFn: () => listAssets({ limit: 200 }) });
  const assets = assetsRes?.docs ?? [];

  useEffect(() => {
    if (bill?.data) {
      const d = bill.data;
      setForm({ merchant: typeof d.merchant === 'object' ? d.merchant._id : (d.merchant ?? ''), dueDate: d.dueDate?.slice(0, 10) ?? '' });
      if (d.inventory?.items) setInv({ items: d.inventory.items.map(it => ({ asset: typeof it.asset === 'object' ? it.asset._id : it.asset, quantity: it.quantity })), shipping: d.inventory.shipping ?? 0, discount: d.inventory.discount ?? 0 });
    }
  }, [bill]);

  const mutation = useMutation({
    mutationFn: () => {
      const inventory = computeInventoryPayload(inv, assets);
      const body = { merchant: form.merchant, dueDate: form.dueDate, inventory };
      return isEdit ? updateBill(id!, body) : createBill(body);
    },
    onSuccess: () => { toast.success(isEdit ? 'Updated' : 'Created'); qc.invalidateQueries({ queryKey: ['bills'] }); navigate('/bills'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const merOptions = [{ value: '', label: '— Select merchant —' }, ...(merchants?.docs ?? []).map(m => ({
    value: m._id,
    label: `${m.contact?.firstName ?? m.firstName ?? ''} ${m.contact?.lastName ?? m.lastName ?? ''}`.trim(),
  }))];

  return (
    <PageShell title={isEdit ? 'Edit bill' : 'New bill'} maxWidth="max-w-2xl">
      <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-5">
        <SCard title="Bill details">
          <div className="space-y-4">
            <Field.Select label="Merchant *" required options={merOptions} value={form.merchant} onChange={e => setForm(f => ({ ...f, merchant: e.target.value }))} />
            <Field label="Due date *" type="date" required value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>
        </SCard>
        <SCard title="Line items">
          <InventoryEditor assets={assets} state={inv} onChange={setInv} />
        </SCard>
        <div className="flex gap-3">
          <Btn type="submit" loading={mutation.isPending}>{isEdit ? 'Update bill' : 'Create bill'}</Btn>
          <Btn type="button" variant="secondary" onClick={() => navigate('/bills')}>Cancel</Btn>
        </div>
      </form>
    </PageShell>
  );
}
