import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createDeal, updateDeal, getDeal, getCrmSettings, listLeads, listCustomers, listUsers } from '@officing/api-client';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';

export function DealFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const presetLeadId = searchParams.get('leadId') ?? '';
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [sourceType, setSourceType] = useState<'lead' | 'customer'>(presetLeadId ? 'lead' : 'lead');
  const [form, setForm] = useState({
    title: '', leadId: presetLeadId, customerId: '',
    amount: '', currency: 'NGN', exchangeRateToBase: '',
    expectedCloseDate: '', assignedTo: '', productsOfInterest: '', notes: '',
  });

  const { data: deal } = useQuery({ queryKey: ['crm-deal', id], queryFn: () => getDeal(id!), enabled: isEdit });
  const { data: settings } = useQuery({ queryKey: ['crm-settings'], queryFn: getCrmSettings });
  const { data: leads } = useQuery({ queryKey: ['leads-select'], queryFn: () => listLeads({ status: 'qualified', limit: 200 }) });
  const { data: customers } = useQuery({ queryKey: ['customers-select'], queryFn: () => listCustomers({ limit: 200 }) });
  const { data: users } = useQuery({ queryKey: ['users-select'], queryFn: listUsers });

  const baseCurrency = settings?.data?.baseCurrency ?? 'NGN';
  const needsExchangeRate = form.currency.toUpperCase() !== baseCurrency.toUpperCase();

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
        productsOfInterest: d.productsOfInterest ?? '',
        notes: d.notes ?? '',
      });
    }
  }, [deal]);

  const mutation = useMutation({
    mutationFn: () => {
      const value: Record<string, unknown> = { amount: Number(form.amount), currency: form.currency.toUpperCase() };
      if (needsExchangeRate) value.exchangeRateToBase = Number(form.exchangeRateToBase);

      const body: Record<string, unknown> = {
        title: form.title,
        value,
        expectedCloseDate: form.expectedCloseDate ? new Date(form.expectedCloseDate).toISOString() : undefined,
        assignedTo: form.assignedTo || undefined,
        productsOfInterest: form.productsOfInterest || undefined,
        notes: form.notes || undefined,
      };

      if (!isEdit) {
        if (sourceType === 'lead') body.leadId = form.leadId;
        else body.customerId = form.customerId;
      }

      return isEdit ? updateDeal(id!, body) : createDeal(body);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Deal updated' : 'Deal created');
      qc.invalidateQueries({ queryKey: ['crm-deals'] });
      navigate('/deals');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const leadOptions = [
    { value: '', label: '— Select prospect —' },
    ...(leads?.docs ?? []).map(l => ({ value: l._id, label: `${l.contact.firstName} ${l.contact.lastName}${l.contact.companyName ? ` (${l.contact.companyName})` : ''}` })),
  ];
  const customerOptions = [
    { value: '', label: '— Select customer —' },
    ...(customers?.docs ?? []).map(c => ({ value: c._id, label: `${c.firstName} ${c.lastName}` })),
  ];
  const userOptions = [
    { value: '', label: '— Unassigned —' },
    ...(users?.data ?? []).map(u => ({ value: u._id, label: `${u.firstName} ${u.lastName}` })),
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isEdit && sourceType === 'lead' && !form.leadId) { toast.error('Please select a prospect'); return; }
    if (!isEdit && sourceType === 'customer' && !form.customerId) { toast.error('Please select a customer'); return; }
    if (needsExchangeRate && !form.exchangeRateToBase) { toast.error('Exchange rate to base currency is required'); return; }
    mutation.mutate();
  }

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <h2 className="text-xl font-semibold">{isEdit ? 'Edit Deal' : 'New Deal'}</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <div className="space-y-4">
            <Input label="Title *" required value={form.title} onChange={set('title')} />

            {!isEdit && (
              <>
                <Select
                  label="Link to"
                  options={[{ value: 'lead', label: 'Prospect' }, { value: 'customer', label: 'Existing Customer' }]}
                  value={sourceType}
                  onChange={e => setSourceType(e.target.value as 'lead' | 'customer')}
                />
                {sourceType === 'lead'
                  ? <Select label="Prospect *" options={leadOptions} value={form.leadId} onChange={set('leadId')} />
                  : <Select label="Customer *" options={customerOptions} value={form.customerId} onChange={set('customerId')} />}
              </>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input label="Amount *" type="number" step="0.01" min="0" required value={form.amount} onChange={set('amount')} />
              <Input label="Currency *" required value={form.currency} onChange={set('currency')} />
            </div>
            {needsExchangeRate && (
              <Input
                label={`Exchange Rate to ${baseCurrency} *`}
                type="number"
                step="0.0001"
                min="0"
                required
                helpText={`Units of ${baseCurrency} per 1 unit of ${form.currency.toUpperCase()}`}
                value={form.exchangeRateToBase}
                onChange={set('exchangeRateToBase')}
              />
            )}

            <Input label="Expected Close Date" type="date" value={form.expectedCloseDate} onChange={set('expectedCloseDate')} />
            <Select label="Assigned To" options={userOptions} value={form.assignedTo} onChange={set('assignedTo')} />
            <Input label="Products/Services of Interest" value={form.productsOfInterest} onChange={set('productsOfInterest')} />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Notes</label>
              <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={mutation.isPending}>{isEdit ? 'Update Deal' : 'Create Deal'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/deals')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
