import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createCustomer, updateCustomer, getCustomer } from '@officing/api-client';
import { Btn, SCard, PageShell } from '../../components/ui/index';
import { Field } from '../../components/ui/Field';

const TYPE_OPTIONS = [
  { value: 'company', label: 'Company' }, 
  { value: 'individual', label: 'Individual' }
];

export function CustomerFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  
  const [form, setForm] = useState({ 
    type: 'company', 
    companyName: '', 
    firstName: '', 
    lastName: '', 
    email: '', 
    phoneNumber: '', 
    currency: 'NGN',
    website: ''
  });

  const { data: cust } = useQuery({ queryKey: ['customer', id], queryFn: () => getCustomer(id!), enabled: isEdit });
  
  useEffect(() => {
    if (cust?.data) {
      const d = cust.data;
      setForm({
        type:        d.contact?.type        ?? 'company',
        companyName: d.contact?.companyName ?? d.companyName ?? '',
        firstName:   d.contact?.firstName   ?? d.firstName   ?? '',
        lastName:    d.contact?.lastName    ?? d.lastName    ?? '',
        email:       d.contact?.email       ?? d.email       ?? '',
        phoneNumber: d.contact?.phoneNumber ?? d.phoneNumber ?? '',
        currency:    d.contact?.currency    ?? 'NGN',
        website:     d.contact?.website     ?? '',
      });
    }
  }, [cust]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = { contact: form };
      return isEdit ? updateCustomer(id!, payload) : createCustomer(payload);
    },
    onSuccess: () => { 
      toast.success(isEdit ? 'Updated' : 'Created'); 
      qc.invalidateQueries({ queryKey: ['customers'] }); 
      navigate('/customers'); 
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <PageShell title={isEdit ? 'Edit customer' : 'New customer'} maxWidth="max-w-lg">
      <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-5">
        <SCard>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field.Select 
                label="Type" 
                options={TYPE_OPTIONS} 
                value={form.type} 
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))} 
                disabled={isEdit}
              />
              <Field 
                label="Currency" 
                value={form.currency} 
                onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} 
                disabled={isEdit}
              />
            </div>

            <Field 
              label="Company name" 
              value={form.companyName} 
              onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} 
              disabled={isEdit}
            />

            <div className="grid grid-cols-2 gap-3">
              {/* These contact fields are disabled in edit mode */}
              <Field 
                label="First name *" 
                required 
                value={form.firstName} 
                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} 
               
              />
              <Field 
                label="Last name *" 
                required 
                value={form.lastName} 
                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} 
              
              />
            </div>
            
            <Field 
              label="Email" 
              type="email" 
              value={form.email} 
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} 
          
            />
            <Field 
              label="Phone" 
              value={form.phoneNumber} 
              onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))} 
              
            />
            <Field 
              label="Website" 
              type="url" 
              placeholder="https://" 
              value={form.website} 
              disabled={isEdit}
              onChange={e => setForm(f => ({ ...f, website: e.target.value }))} 
            />
          </div>
        </SCard>
        <div className="flex gap-3">
          <Btn type="submit" loading={mutation.isPending}>{isEdit ? 'Update' : 'Create customer'}</Btn>
          <Btn type="button" variant="secondary" onClick={() => navigate('/customers')}>Cancel</Btn>
        </div>
      </form>
    </PageShell>
  );
}