import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createDeal, updateDeal, getDeal, getCrmSettings, listLeads, listCustomers, listUsers } from '@officing/api-client';
import { Btn, SCard, PageShell } from '../../components/ui/index';
import { Field } from '../../components/ui/Field';

export function DealFormPage() {
  const { id }          = useParams<{ id: string }>();
  const [searchParams]  = useSearchParams();
  const presetLeadId    = searchParams.get('leadId') ?? '';
  const isEdit          = !!id;
  const navigate        = useNavigate();
  const qc              = useQueryClient();

  const [sourceType, setSourceType] = useState<'lead' | 'customer'>(presetLeadId ? 'lead' : 'lead');
  const [form, setForm] = useState({
    title: '', leadId: presetLeadId, customerId: '',
    amount: '', currency: 'NGN', exchangeRateToBase: '',
    expectedCloseDate: '', assignedTo: '', productsOfInterest: '', notes: '',
  });

  const { data: deal }      = useQuery({ queryKey: ['crm-deal', id],        queryFn: () => getDeal(id!),                              enabled: isEdit });
  const { data: settings }  = useQuery({ queryKey: ['crm-settings'],         queryFn: getCrmSettings });
  const { data: leads }     = useQuery({ queryKey: ['leads-select'],          queryFn: () => listLeads({ status: 'qualified', limit: 200 }) });
  const { data: customers } = useQuery({ queryKey: ['customers-select'],      queryFn: () => listCustomers({ limit: 200 }) });
  const { data: users }     = useQuery({ queryKey: ['users-select'],          queryFn: listUsers });

  const baseCurrency     = settings?.data?.baseCurrency ?? 'NGN';
  const needsExchange    = form.currency.toUpperCase() !== baseCurrency.toUpperCase();

  useEffect(() => {
    if (deal?.data) {
      const d = deal.data;
      setSourceType(d.leadId ? 'lead' : 'customer');
      setForm({
        title: d.title,
        leadId: typeof d.leadId === 'object' && d.leadId ? d.leadId._id : (d.leadId ?? ''),
        customerId: typeof d.customerId === 'object' && d.customerId ? d.customerId._id : (d.customerId ?? ''),
        amount: String(d.value.amount),
        currency: d.value.currency,
        exchangeRateToBase: d.value.exchangeRateToBase != null ? String(d.value.exchangeRateToBase) : '',
        expectedCloseDate: d.expectedCloseDate?.slice(0, 10) ?? '',
        assignedTo: typeof d.assignedTo === 'object' && d.assignedTo ? d.assignedTo._id : (d.assignedTo ?? ''),
        productsOfInterest: d.productsOfInterest ?? '', notes: d.notes ?? '',
      });
    }
  }, [deal]);

  const mutation = useMutation({
    mutationFn: () => {
      const value: Record<string, unknown> = { amount: Number(form.amount), currency: form.currency.toUpperCase() };
      if (needsExchange) value.exchangeRateToBase = Number(form.exchangeRateToBase);
      const body: Record<string, unknown> = {
        title: form.title, value,
        expectedCloseDate: form.expectedCloseDate ? new Date(form.expectedCloseDate).toISOString() : undefined,
        assignedTo: form.assignedTo || undefined,
        productsOfInterest: form.productsOfInterest || undefined,
        notes: form.notes || undefined,
      };
      if (!isEdit) { if (sourceType === 'lead') body.leadId = form.leadId; else body.customerId = form.customerId; }
      return isEdit ? updateDeal(id!, body) : createDeal(body);
    },
    onSuccess: () => { toast.success(isEdit ? 'Updated' : 'Created'); qc.invalidateQueries({ queryKey: ['crm-deals'] }); navigate('/deals'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  const leadOptions     = [{ value: '', label: '— Select prospect —' }, ...(leads?.docs ?? []).map(l => ({ value: l._id, label: `${l.contact.firstName} ${l.contact.lastName}${l.contact.companyName ? ` (${l.contact.companyName})` : ''}` }))];
  const custOptions     = [{ value: '', label: '— Select customer —' }, ...(customers?.docs ?? []).map(c => ({
    value: c._id,
    label: `${c.contact?.firstName ?? c.firstName ?? ''} ${c.contact?.lastName ?? c.lastName ?? ''}`.trim(),
  }))];
  const userOptions     = [{ value: '', label: '— Unassigned —' }, ...(users?.data ?? []).map(e => ({ value: e.user._id, label: `${e.user.firstName} ${e.user.lastName}` }))];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isEdit && sourceType === 'lead'     && !form.leadId)     { toast.error('Please select a prospect');  return; }
    if (!isEdit && sourceType === 'customer' && !form.customerId) { toast.error('Please select a customer');  return; }
    if (needsExchange && !form.exchangeRateToBase)                { toast.error('Exchange rate is required'); return; }
    mutation.mutate();
  }

  return (
    <PageShell title={isEdit ? 'Edit deal' : 'New deal'} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <SCard>
          <div className="space-y-4">
            <Field label="Title *" required value={form.title} onChange={set('title')} />
            {!isEdit && (
              <>
                <Field.Select label="Link to" options={[{ value: 'lead', label: 'Prospect' }, { value: 'customer', label: 'Existing Customer' }]} value={sourceType} onChange={e => setSourceType(e.target.value as 'lead' | 'customer')} />
                {sourceType === 'lead' ? <Field.Select label="Prospect *" options={leadOptions} value={form.leadId} onChange={set('leadId')} /> : <Field.Select label="Customer *" options={custOptions} value={form.customerId} onChange={set('customerId')} />}
              </>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount *" type="number" step="0.01" min="0" required value={form.amount} onChange={set('amount')} />
              <Field label="Currency *" required value={form.currency} onChange={set('currency')} />
            </div>
            {needsExchange && <Field label={`Exchange rate to ${baseCurrency} *`} type="number" step="0.0001" required value={form.exchangeRateToBase} onChange={set('exchangeRateToBase')} helpText={`Units of ${baseCurrency} per 1 unit of ${form.currency.toUpperCase()}`} />}
            <Field label="Expected close date" type="date" value={form.expectedCloseDate} onChange={set('expectedCloseDate')} />
            <Field.Select label="Assigned to" options={userOptions} value={form.assignedTo} onChange={set('assignedTo')} />
            <Field label="Products/services of interest" value={form.productsOfInterest} onChange={set('productsOfInterest')} />
            <Field.Textarea label="Notes" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </SCard>
        <div className="flex gap-3">
          <Btn type="submit" loading={mutation.isPending}>{isEdit ? 'Update deal' : 'Create deal'}</Btn>
          <Btn type="button" variant="secondary" onClick={() => navigate('/deals')}>Cancel</Btn>
        </div>
      </form>
    </PageShell>
  );
}
