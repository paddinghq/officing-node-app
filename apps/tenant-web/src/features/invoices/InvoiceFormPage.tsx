import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createInvoice, updateInvoice, getInvoice, listCustomers, listAssets } from '@officing/api-client';
import { Btn, SCard, PageShell } from '../../components/ui/index';
import { Field } from '../../components/ui/Field';
import { InventoryEditor, computeInventoryPayload, type InventoryState } from './InventoryEditor';

export function InvoiceFormPage() {
  const { id }  = useParams<{ id: string }>();
  const isEdit  = !!id;
  const navigate = useNavigate();
  const qc      = useQueryClient();

  const [form, setForm]         = useState({ customer: '', dueDate: '', currency: 'NGN' });
  const [inv, setInv]           = useState<InventoryState>({ items: [{ asset: '', quantity: 1 }], shipping: 0, discount: 0 });
  const [image, setImage]       = useState<File | null>(null);

  const { data: invoice }   = useQuery({ queryKey: ['invoice', id], queryFn: () => getInvoice(id!), enabled: isEdit });
  const { data: customers } = useQuery({ queryKey: ['customers-select'], queryFn: () => listCustomers({ limit: 200 }) });
  const { data: assetsRes } = useQuery({ queryKey: ['assets-select'], queryFn: () => listAssets({ limit: 25 }) });
  const assets = assetsRes?.docs ?? [];

  useEffect(() => {
    if (invoice?.data) {
      const d = invoice.data;
      setForm({ customer: typeof d.customer === 'object' ? d.customer._id : (d.customer ?? ''), dueDate: d.dueDate?.slice(0, 10) ?? '', currency: d.currency ?? 'NGN' });
      if (d.inventory?.items) {
        setInv({ items: d.inventory.items.map(it => ({ asset: typeof it.asset === 'object' ? it.asset._id : it.asset, quantity: it.quantity })), shipping: d.inventory.shipping ?? 0, discount: d.inventory.discount ?? 0 });
      }
    }
  }, [invoice]);

  const mutation = useMutation({
    mutationFn: async () => {
      const inventory = computeInventoryPayload(inv, assets);
      const body = { customer: form.customer, dueDate: form.dueDate, currency: form.currency, inventory };
      if (image && !isEdit) {
        const fd = new FormData();
        Object.entries({ customer: form.customer, dueDate: form.dueDate, currency: form.currency }).forEach(([k, v]) => fd.append(k, v));
        fd.append('inventory[items]', JSON.stringify(inventory.items));
        fd.append('inventory[taxRate]', String(inventory.taxRate));
        fd.append('inventory[shipping]', String(inventory.shipping));
        fd.append('inventory[discount]', String(inventory.discount));
        fd.append('inventory[subtotal]', String(inventory.subtotal));
        fd.append('inventory[total]', String(inventory.total));
        fd.append('inventory[inventoryImage]', image);
        return createInvoice(fd);
      }
      return isEdit ? updateInvoice(id!, body) : createInvoice(body);
    },
    onSuccess: () => { toast.success(isEdit ? 'Invoice updated' : 'Invoice created'); qc.invalidateQueries({ queryKey: ['invoices'] }); navigate('/invoices'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const custOptions = [{ value: '', label: '— Select customer —' }, ...(customers?.docs ?? []).map(c => {
    const fn = c.contact?.firstName ?? c.firstName ?? '';
    const ln = c.contact?.lastName  ?? c.lastName  ?? '';
    const cn = c.contact?.companyName ?? c.companyName ?? '';
    return { value: c._id, label: `${fn} ${ln}${cn ? ` (${cn})` : ''}`.trim() };
  })];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customer) { toast.error('Please select a customer'); return; }
    mutation.mutate();
  }

  return (
    <PageShell title={isEdit ? 'Edit invoice' : 'New invoice'} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <SCard title="Invoice details">
          <div className="space-y-4">
            <Field.Select label="Customer *" required options={custOptions} value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Due date" type="date" required value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              <Field label="Currency" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} />
            </div>
          </div>
        </SCard>

        <SCard title="Line items">
          <InventoryEditor assets={assets} state={inv} onChange={setInv} />
        </SCard>

        <SCard title="Attachment (optional)">
          <input type="file" accept="image/*" onChange={e => setImage(e.target.files?.[0] ?? null)} style={{ color: 'var(--foreground)' }} className="text-sm" />
        </SCard>

        <div className="flex gap-3">
          <Btn type="submit" loading={mutation.isPending}>{isEdit ? 'Update invoice' : 'Create invoice'}</Btn>
          <Btn type="button" variant="secondary" onClick={() => navigate('/invoices')}>Cancel</Btn>
        </div>
      </form>
    </PageShell>
  );
}
