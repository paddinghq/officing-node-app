import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getTenant, suspendTenant, activateTenant,
  updateBranding, updateSubscription, renewSubscription, provisionMasterAdmin,
} from '@officing/api-client';
import type { Plan, BillingCycle } from '@officing/api-client';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { useAdminStore } from '../../store/auth';

type Color = 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'purple';
const statusColor: Record<string, Color> = { active: 'green', suspended: 'red', inactive: 'gray' };
const planColor: Record<string, Color> = { free: 'gray', basic: 'blue', standard: 'purple', premium: 'green' };

const PLANS = [
  { value: 'free', label: 'Free' },
  { value: 'basic', label: 'Basic' },
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
];

const CYCLES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export function TenantDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const qc = useQueryClient();
  const admin = useAdminStore(s => s.admin);
  const isSuperAdmin = admin?.role === 'superadmin';

  const { data, isLoading } = useQuery({ queryKey: ['admin-tenant', slug], queryFn: () => getTenant(slug!), enabled: !!slug });
  const tenant = data?.tenant;

  // Branding state
  const [branding, setBranding] = useState({ logoUrl: '', primaryColor: '', frontendBaseURL: '', supportEmail: '' });
  const [brandingLoaded, setBrandingLoaded] = useState(false);

  // Subscription state
  const [subForm, setSubForm] = useState({ plan: 'basic', isActive: true, subExpDate: '', billingCycle: 'yearly', supportNotes: '' });
  const [subLoaded, setSubLoaded] = useState(false);

  // Provision master admin
  const [provisionModal, setProvisionModal] = useState(false);
  const [provForm, setProvForm] = useState({ email: '', firstName: '', lastName: '', password: '', companyName: '' });
  const [tempPassword, setTempPassword] = useState('');

  React.useEffect(() => {
    if (tenant) {
      if (!brandingLoaded) {
        setBranding({
          logoUrl: tenant.branding.logoUrl ?? '',
          primaryColor: tenant.branding.primaryColor ?? '',
          frontendBaseURL: tenant.branding.frontendBaseURL ?? '',
          supportEmail: tenant.branding.supportEmail ?? '',
        });
        setBrandingLoaded(true);
      }
      if (!subLoaded) {
        setSubForm({
          plan: tenant.subscription.plan ?? 'basic',
          isActive: tenant.subscription.isActive ?? true,
          subExpDate: tenant.subscription.subExpDate?.slice(0, 10) ?? '',
          billingCycle: tenant.subscription.billingCycle ?? 'yearly',
          supportNotes: tenant.subscription.supportNotes ?? '',
        });
        setSubLoaded(true);
      }
    }
  }, [tenant, brandingLoaded, subLoaded]);

  const suspendMut = useMutation({ mutationFn: () => suspendTenant(slug!), onSuccess: () => { toast.success('Suspended'); qc.invalidateQueries({ queryKey: ['admin-tenant', slug] }); }, onError: (e: Error) => toast.error(e.message) });
  const activateMut = useMutation({ mutationFn: () => activateTenant(slug!), onSuccess: () => { toast.success('Activated'); qc.invalidateQueries({ queryKey: ['admin-tenant', slug] }); }, onError: (e: Error) => toast.error(e.message) });

  const brandingMut = useMutation({
    mutationFn: () => updateBranding(slug!, branding),
    onSuccess: () => { toast.success('Branding saved'); qc.invalidateQueries({ queryKey: ['admin-tenant', slug] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const subMut = useMutation({
    mutationFn: () => updateSubscription(slug!, {
      plan: subForm.plan as Plan,
      isActive: subForm.isActive,
      subExpDate: subForm.subExpDate || undefined,
      billingCycle: subForm.billingCycle as BillingCycle,
      supportNotes: subForm.supportNotes || undefined,
    }),
    onSuccess: () => { toast.success('Subscription updated'); qc.invalidateQueries({ queryKey: ['admin-tenant', slug] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const provisionMut = useMutation({
    mutationFn: () => provisionMasterAdmin(slug!, provForm),
    onSuccess: (res) => {
      toast.success('Master admin provisioned');
      if (res.temporaryPassword) setTempPassword(res.temporaryPassword);
      else setProvisionModal(false);
      qc.invalidateQueries({ queryKey: ['admin-tenant', slug] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="p-8 text-gray-400">Loading…</div>;
  if (!tenant) return <div className="p-8 text-red-600">Tenant not found.</div>;

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link to="/admin/tenants" className="text-gray-400 hover:text-gray-600">← Tenants</Link>
        <h2 className="text-xl font-semibold">{tenant.name}</h2>
        <Badge color={statusColor[tenant.status] ?? 'gray'}>{tenant.status}</Badge>
        <Badge color={planColor[tenant.subscription.plan] ?? 'gray'}>{tenant.subscription.plan}</Badge>
      </div>

      {/* Info + Actions */}
      <Card title="Tenant Info" actions={isSuperAdmin ? (
        <div className="flex gap-2">
          {tenant.status !== 'suspended' && (
            <Button variant="danger" size="sm" loading={suspendMut.isPending} onClick={() => { if (confirm('Suspend?')) suspendMut.mutate(); }}>Suspend</Button>
          )}
          {tenant.status === 'suspended' && (
            <Button size="sm" loading={activateMut.isPending} onClick={() => activateMut.mutate()} style={{ backgroundColor: '#4f46e5' }}>Activate</Button>
          )}
          <Button size="sm" onClick={() => setProvisionModal(true)} style={{ backgroundColor: '#4f46e5' }}>Provision Admin</Button>
        </div>
      ) : undefined}>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-gray-500">Slug</p><p className="font-mono">{tenant.slug}</p></div>
          <div><p className="text-gray-500">Created</p><p>{new Date(tenant.createdAt).toLocaleDateString()}</p></div>
          {tenant.branding.supportEmail && <div><p className="text-gray-500">Support Email</p><p>{tenant.branding.supportEmail}</p></div>}
          {tenant.branding.frontendBaseURL && <div><p className="text-gray-500">Frontend URL</p><p>{tenant.branding.frontendBaseURL}</p></div>}
        </div>
      </Card>

      {/* Branding */}
      {isSuperAdmin && (
        <Card title="Branding">
          <form onSubmit={e => { e.preventDefault(); brandingMut.mutate(); }} className="space-y-4">
            <Input label="Logo URL" value={branding.logoUrl} onChange={e => setBranding(b => ({ ...b, logoUrl: e.target.value }))} />
            <div className="flex gap-3 items-end">
              <Input label="Primary Color" value={branding.primaryColor} onChange={e => setBranding(b => ({ ...b, primaryColor: e.target.value }))} placeholder="#6366f1" />
              {branding.primaryColor && <div className="w-10 h-10 rounded-lg border border-gray-300 shrink-0" style={{ backgroundColor: branding.primaryColor }} />}
            </div>
            <Input label="Frontend Base URL" value={branding.frontendBaseURL} onChange={e => setBranding(b => ({ ...b, frontendBaseURL: e.target.value }))} />
            <Input label="Support Email" type="email" value={branding.supportEmail} onChange={e => setBranding(b => ({ ...b, supportEmail: e.target.value }))} />
            <Button type="submit" loading={brandingMut.isPending} style={{ backgroundColor: '#4f46e5' }}>Save Branding</Button>
          </form>
        </Card>
      )}

      {/* Subscription */}
      {isSuperAdmin && (
        <Card title="Subscription">
          <form onSubmit={e => { e.preventDefault(); subMut.mutate(); }} className="space-y-4">
            <Select label="Plan" options={PLANS} value={subForm.plan} onChange={e => setSubForm(f => ({ ...f, plan: e.target.value }))} />
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={subForm.isActive} onChange={e => setSubForm(f => ({ ...f, isActive: e.target.checked }))} />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active (payment confirmed)</label>
            </div>
            <Input label="Expiry Date" type="date" value={subForm.subExpDate} onChange={e => setSubForm(f => ({ ...f, subExpDate: e.target.value }))} />
            <Select label="Billing Cycle" options={CYCLES} value={subForm.billingCycle} onChange={e => setSubForm(f => ({ ...f, billingCycle: e.target.value }))} />
            <Input label="Support Notes" value={subForm.supportNotes} onChange={e => setSubForm(f => ({ ...f, supportNotes: e.target.value }))} placeholder="e.g. Paid via bank transfer" />
            <Button type="submit" loading={subMut.isPending} style={{ backgroundColor: '#4f46e5' }}>Update Subscription</Button>
          </form>
        </Card>
      )}

      {/* Provision modal */}
      <Modal open={provisionModal} onClose={() => { setProvisionModal(false); setTempPassword(''); }} title="Provision Master Admin">
        {tempPassword ? (
          <div className="space-y-4">
            <p className="text-green-700 font-medium">✅ Master admin created!</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800 font-medium">Temporary Password</p>
              <p className="font-mono text-lg mt-1">{tempPassword}</p>
              <p className="text-xs text-yellow-700 mt-1">Share this securely with the tenant admin. It is only shown once.</p>
            </div>
            <Button onClick={() => { setProvisionModal(false); setTempPassword(''); }} style={{ backgroundColor: '#4f46e5' }}>Done</Button>
          </div>
        ) : (
          <form onSubmit={e => { e.preventDefault(); provisionMut.mutate(); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="First Name *" required value={provForm.firstName} onChange={e => setProvForm(f => ({ ...f, firstName: e.target.value }))} />
              <Input label="Last Name *" required value={provForm.lastName} onChange={e => setProvForm(f => ({ ...f, lastName: e.target.value }))} />
            </div>
            <Input label="Email *" type="email" required value={provForm.email} onChange={e => setProvForm(f => ({ ...f, email: e.target.value }))} />
            <Input label="Password (leave blank to auto-generate)" type="password" value={provForm.password} onChange={e => setProvForm(f => ({ ...f, password: e.target.value }))} />
            <Input label="Company Name" value={provForm.companyName} onChange={e => setProvForm(f => ({ ...f, companyName: e.target.value }))} />
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="secondary" onClick={() => setProvisionModal(false)}>Cancel</Button>
              <Button type="submit" loading={provisionMut.isPending} style={{ backgroundColor: '#4f46e5' }}>Provision</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
