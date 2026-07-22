import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createEstimate, updateEstimate, getEstimate, listCustomers, listAssets } from '@officing/api-client';
import { Btn, SCard, PageShell } from '../../components/ui/index';
import { Field } from '../../components/ui/Field';
import { InventoryEditor, computeInventoryPayload, type InventoryState } from '../invoices/InventoryEditor';

export function EstimateFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({ customer: '', expiryDate: '' });
  const [inv, setInv]   = useState<InventoryState>({ items: [{ asset: '', quantity: 1 }], shipping: 0, discount: 0 });

  const { data: est }       = useQuery({ queryKey: ['estimate', id],    queryFn: () => getEstimate(id!),          enabled: isEdit });
  const { data: customers } = useQuery({ queryKey: ['customers-select'], queryFn: () => listCustomers({ limit: 200 }) });
  const { data: assetsRes } = useQuery({ queryKey: ['assets-select'],   queryFn: () => listAssets({ limit: 200 }) });
  const assets = assetsRes?.docs ?? [];

  useEffect(() => {
    if (est?.data) {
      const d = est.data;
      setForm({ customer: typeof d.customer === 'object' ? d.customer._id : (d.customer ?? ''), expiryDate: d.expiryDate?.slice(0, 10) ?? '' });
      if (d.inventory?.items) setInv({ items: d.inventory.items.map(it => ({ asset: typeof it.asset === 'object' ? it.asset._id : it.asset, quantity: it.quantity })), shipping: d.inventory.shipping ?? 0, discount: d.inventory.discount ?? 0 });
    }
  }, [est]);

  const mutation = useMutation({
    mutationFn: () => {
      const inventory = computeInventoryPayload(inv, assets);
      const body = { customer: form.customer, expiryDate: form.expiryDate, inventory };
      return isEdit ? updateEstimate(id!, body) : createEstimate(body);
    },
    onSuccess: () => { toast.success(isEdit ? 'Updated' : 'Created'); qc.invalidateQueries({ queryKey: ['estimates'] }); navigate('/estimates'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const custOptions = [{ value: '', label: '— Select customer —' }, ...(customers?.docs ?? []).map(c => ({
    value: c._id,
    label: `${c.contact?.firstName ?? c.firstName ?? ''} ${c.contact?.lastName ?? c.lastName ?? ''}`.trim(),
  }))];

  return (
    <PageShell title={isEdit ? 'Edit estimate' : 'New estimate'} maxWidth="max-w-2xl">
      <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-5">
        <SCard title="Estimate details">
          <div className="space-y-4">
            <Field.Select label="Customer *" required options={custOptions} value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} />
            <Field label="Expiry date" type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
          </div>
        </SCard>
        <SCard title="Line items"><InventoryEditor assets={assets} state={inv} onChange={setInv} /></SCard>
        <div className="flex gap-3">
          <Btn type="submit" loading={mutation.isPending}>{isEdit ? 'Update estimate' : 'Create estimate'}</Btn>
          <Btn type="button" variant="secondary" onClick={() => navigate('/estimates')}>Cancel</Btn>
        </div>
      </form>
    </PageShell>
  );
}
