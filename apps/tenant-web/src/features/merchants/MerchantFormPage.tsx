import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createMerchant, updateMerchant, getMerchant } from '@officing/api-client';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export function MerchantFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phoneNumber: '', companyName: '' });
  const { data: mer } = useQuery({ queryKey: ['merchant', id], queryFn: () => getMerchant(id!), enabled: isEdit });
  useEffect(() => {
    if (mer?.data) {
      const d = mer.data;
      setForm({ firstName: d.firstName ?? '', lastName: d.lastName ?? '', email: d.email ?? '', phoneNumber: d.phoneNumber ?? '', companyName: d.companyName ?? '' });
    }
  }, [mer]);
  const mutation = useMutation({
    mutationFn: () => isEdit ? updateMerchant(id!, form) : createMerchant(form),
    onSuccess: () => { toast.success(isEdit ? 'Updated' : 'Created'); qc.invalidateQueries({ queryKey: ['merchants'] }); navigate('/merchants'); },
    onError: (e: Error) => toast.error(e.message),
  });
  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [field]: e.target.value }));
  return (
    <div className="p-8 max-w-lg space-y-6">
      <h2 className="text-xl font-semibold">{isEdit ? 'Edit Merchant' : 'New Merchant'}</h2>
      <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        <Card>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="First Name *" required value={form.firstName} onChange={set('firstName')} />
              <Input label="Last Name *" required value={form.lastName} onChange={set('lastName')} />
            </div>
            <Input label="Email" type="email" value={form.email} onChange={set('email')} />
            <Input label="Phone" value={form.phoneNumber} onChange={set('phoneNumber')} />
            <Input label="Company Name" value={form.companyName} onChange={set('companyName')} />
          </div>
        </Card>
        <div className="flex gap-3">
          <Button type="submit" loading={mutation.isPending}>{isEdit ? 'Update' : 'Create'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/merchants')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
