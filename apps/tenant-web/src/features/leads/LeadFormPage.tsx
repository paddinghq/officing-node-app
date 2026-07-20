import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createLead, updateLead, getLead, listUsers } from '@officing/api-client';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';

const SOURCE_OPTIONS = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'social', label: 'Social' },
  { value: 'event', label: 'Event' },
  { value: 'other', label: 'Other' },
];

export function LeadFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/prospects') ? '/prospects' : '/leads';
  const qc = useQueryClient();

  const [form, setForm] = useState({
    type: 'individual' as 'individual' | 'company',
    firstName: '', lastName: '', email: '', phoneNumber: '',
    companyName: '', website: '', currency: 'NGN',
    source: 'website', assignedTo: '', tags: '', nextFollowUpAt: '', expectedInterest: '',
  });

  const { data: lead } = useQuery({ queryKey: ['crm-lead', id], queryFn: () => getLead(id!), enabled: isEdit });
  const { data: users } = useQuery({ queryKey: ['users-select'], queryFn: listUsers });

  useEffect(() => {
    if (lead?.data) {
      const d = lead.data;
      setForm({
        type: d.contact.type,
        firstName: d.contact.firstName,
        lastName: d.contact.lastName,
        email: d.contact.email,
        phoneNumber: d.contact.phoneNumber,
        companyName: d.contact.companyName ?? '',
        website: d.contact.website ?? '',
        currency: d.contact.currency ?? 'NGN',
        source: d.source,
        assignedTo: typeof d.assignedTo === 'object' && d.assignedTo ? d.assignedTo._id : (d.assignedTo ?? ''),
        tags: d.tags.join(', '),
        nextFollowUpAt: d.nextFollowUpAt?.slice(0, 10) ?? '',
        expectedInterest: d.expectedInterest ?? '',
      });
    }
  }, [lead]);

  const mutation = useMutation({
    mutationFn: () => {
      const body = {
        contact: {
          type: form.type,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phoneNumber: form.phoneNumber,
          companyName: form.type === 'company' ? form.companyName : '',
          website: form.type === 'company' ? form.website : '',
          currency: form.currency,
        },
        source: form.source,
        assignedTo: form.assignedTo || undefined,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        nextFollowUpAt: form.nextFollowUpAt ? new Date(form.nextFollowUpAt).toISOString() : undefined,
        expectedInterest: form.expectedInterest || undefined,
      };
      return isEdit ? updateLead(id!, body) : createLead(body);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Lead updated' : 'Lead created');
      qc.invalidateQueries({ queryKey: ['crm-leads'] });
      qc.invalidateQueries({ queryKey: ['crm-prospects'] });
      navigate(basePath);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const userOptions = [
    { value: '', label: '— Unassigned —' },
    ...(users?.data ?? []).map(u => ({ value: u._id, label: `${u.firstName} ${u.lastName}` })),
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <h2 className="text-xl font-semibold">{isEdit ? 'Edit Lead' : 'New Lead'}</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="Contact">
          <div className="space-y-4">
            <Select
              label="Type"
              options={[{ value: 'individual', label: 'Individual' }, { value: 'company', label: 'Company' }]}
              value={form.type}
              onChange={set('type')}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input label="First Name *" required value={form.firstName} onChange={set('firstName')} />
              <Input label="Last Name *" required value={form.lastName} onChange={set('lastName')} />
            </div>
            <Input label="Email *" type="email" required value={form.email} onChange={set('email')} />
            <Input label="Phone *" required value={form.phoneNumber} onChange={set('phoneNumber')} />
            {form.type === 'company' && (
              <>
                <Input label="Company Name *" required value={form.companyName} onChange={set('companyName')} />
                <Input label="Website *" required value={form.website} onChange={set('website')} />
              </>
            )}
            <Input label="Currency" value={form.currency} onChange={set('currency')} />
          </div>
        </Card>

        <Card title="Lead Details">
          <div className="space-y-4">
            <Select label="Source" options={SOURCE_OPTIONS} value={form.source} onChange={set('source')} />
            <Select label="Assigned To" options={userOptions} value={form.assignedTo} onChange={set('assignedTo')} />
            <Input label="Tags (comma-separated)" value={form.tags} onChange={set('tags')} placeholder="saas, q3" />
            <Input label="Next Follow-up" type="date" value={form.nextFollowUpAt} onChange={set('nextFollowUpAt')} />
            <Input label="Expected Interest" value={form.expectedInterest} onChange={set('expectedInterest')} placeholder="Annual ERP license" />
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={mutation.isPending}>{isEdit ? 'Update Lead' : 'Create Lead'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate(basePath)}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
