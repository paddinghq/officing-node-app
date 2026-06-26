import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createTenant } from '@officing/api-client';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export function TenantCreatePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({ slug: '', name: '', supportEmail: '' });

  const mutation = useMutation({
    mutationFn: () => createTenant(form),
    onSuccess: (res) => {
      toast.success('Tenant created');
      qc.invalidateQueries({ queryKey: ['admin-tenants'] });
      navigate(`/admin/tenants/${res.data?.slug ?? ''}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <div className="p-8 max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/admin/tenants" className="text-gray-400 hover:text-gray-600">← Tenants</Link>
        <h2 className="text-xl font-semibold">New Tenant</h2>
      </div>
      <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        <Card>
          <div className="space-y-4">
            <Input label="Slug *" required placeholder="acme" value={form.slug} onChange={set('slug')} helpText="Lowercase letters and hyphens only. Cannot be changed later." />
            <Input label="Company Name *" required value={form.name} onChange={set('name')} />
            <Input label="Support Email" type="email" value={form.supportEmail} onChange={set('supportEmail')} />
          </div>
        </Card>
        <div className="flex gap-3">
          <Button type="submit" loading={mutation.isPending} style={{ backgroundColor: '#4f46e5' }}>Create Tenant</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/tenants')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
