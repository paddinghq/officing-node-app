import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getTenant, suspendTenant, activateTenant,
  updateBranding, updateSubscription, provisionMasterAdmin,
} from '@officing/api-client';
import type { Plan, BillingCycle } from '@officing/api-client';
import { Button, Spinner } from '@heroui/react';
import { ArrowLeft, TriangleExclamation, CircleCheck } from '@gravity-ui/icons';
import { useAdminStore } from '../../store/auth';

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  active:    { bg: 'rgba(22,163,74,0.12)',  text: '#16a34a' },
  suspended: { bg: 'rgba(220,38,38,0.12)',  text: '#dc2626' },
  inactive:  { bg: 'var(--surface-secondary)', text: 'var(--muted)' },
};
const PLAN_BADGE: Record<string, { bg: string; text: string }> = {
  free:     { bg: 'var(--surface-secondary)', text: 'var(--muted)' },
  basic:    { bg: 'rgba(99,102,241,0.12)',  text: '#6366f1' },
  standard: { bg: 'rgba(245,158,11,0.12)',  text: '#d97706' },
  premium:  { bg: 'rgba(22,163,74,0.12)',   text: '#16a34a' },
};

const PLANS   = ['free','basic','standard','premium'];
const CYCLES  = ['monthly','quarterly','yearly'];

function Chip({ label, color }: { label: string; color: { bg: string; text: string } }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
      style={{ background: color.bg, color: color.text }}
    >
      {label}
    </span>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div
        className="px-6 py-4"
        style={{ borderBottom: '1px solid var(--separator)' }}
      >
        <h3
          className="text-base font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
        >
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function FieldInput({
  label, id, type = 'text', value, onChange, placeholder, helpText
}: {
  label: string; id: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; helpText?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border px-3 py-2.5 text-sm transition-colors"
        style={{
          background: 'var(--field-background)',
          borderColor: 'var(--field-border)',
          color: 'var(--field-foreground)',
        }}
      />
      {helpText && (
        <p className="text-xs" style={{ color: 'var(--muted)' }}>{helpText}</p>
      )}
    </div>
  );
}

function FieldSelect({
  label, id, value, onChange, options
}: {
  label: string; id: string; value: string;
  onChange: (v: string) => void; options: string[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl border px-3 py-2.5 text-sm"
        style={{
          background: 'var(--field-background)',
          borderColor: 'var(--field-border)',
          color: 'var(--field-foreground)',
        }}
      >
        {options.map(o => (
          <option key={o} value={o} style={{ textTransform: 'capitalize' }}>
            {o.charAt(0).toUpperCase() + o.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Provision modal ──────────────────────────────────────────────────────────
function ProvisionModal({
  slug,
  onClose,
}: {
  slug: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', password: '', companyName: '' });
  const [tempPassword, setTempPassword] = useState('');

  const mut = useMutation({
    mutationFn: () => provisionMasterAdmin(slug, form),
    onSuccess: res => {
      toast.success('Master admin provisioned');
      if (res.temporaryPassword) setTempPassword(res.temporaryPassword);
      else onClose();
      qc.invalidateQueries({ queryKey: ['admin-tenant', slug] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--separator)' }}
        >
          <h3
            className="text-lg font-semibold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
          >
            Provision master admin
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors"
            style={{ color: 'var(--muted)' }}
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {tempPassword ? (
            <div className="space-y-4">
              <p className="flex items-center gap-2 font-medium" style={{ color: '#16a34a' }}>
                <CircleCheck width={18} height={18} />
                Master admin created
              </p>
              <div
                className="rounded-xl border p-4"
                style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.3)' }}
              >
                <p className="text-xs font-semibold" style={{ color: '#d97706' }}>
                  Temporary password — share securely, shown once only
                </p>
                <p
                  className="font-mono text-2xl mt-2 tracking-widest select-all"
                  style={{ color: 'var(--foreground)' }}
                >
                  {tempPassword}
                </p>
              </div>
              <Button variant="primary" className="w-full justify-center" onPress={onClose}>
                Done
              </Button>
            </div>
          ) : (
            <form
              id="prov-form"
              onSubmit={e => { e.preventDefault(); mut.mutate(); }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <FieldInput label="First name" id="prov-first" value={form.firstName} onChange={set('firstName')} />
                <FieldInput label="Last name"  id="prov-last"  value={form.lastName}  onChange={set('lastName')}  />
              </div>
              <FieldInput label="Email"        id="prov-email" type="email" value={form.email}       onChange={set('email')}       />
              <FieldInput label="Password"     id="prov-pw"    type="password" value={form.password} onChange={set('password')} helpText="Leave blank to auto-generate" />
              <FieldInput label="Company name" id="prov-co"    value={form.companyName}               onChange={set('companyName')} />

              <div
                className="flex justify-end gap-3 pt-2"
                style={{ borderTop: '1px solid var(--separator)' }}
              >
                <Button variant="ghost" onPress={onClose}>Cancel</Button>
                <Button
                  variant="primary"
                  type="submit"
                  form="prov-form"
                  isDisabled={mut.isPending}
                >
                  {mut.isPending ? <><Spinner size="sm" /> Provisioning…</> : 'Provision'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function TenantDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const qc = useQueryClient();
  const admin = useAdminStore(s => s.admin);
  const isSuperAdmin = admin?.role === 'superadmin';

  const { data, isLoading } = useQuery({
    queryKey: ['admin-tenant', slug],
    queryFn: () => getTenant(slug!),
    enabled: !!slug,
  });
  const tenant = data?.tenant;

  const [branding, setBranding] = useState({ logoUrl: '', primaryColor: '', frontendBaseURL: '', supportEmail: '' });
  const [brandingLoaded, setBrandingLoaded] = useState(false);
  const [sub, setSub] = useState({ plan: 'basic', isActive: true, subExpDate: '', billingCycle: 'yearly', supportNotes: '' });
  const [subLoaded, setSubLoaded] = useState(false);
  const [showProvision, setShowProvision] = useState(false);

  useEffect(() => {
    if (!tenant) return;
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
      setSub({
        plan: tenant.subscription.plan ?? 'basic',
        isActive: tenant.subscription.isActive ?? true,
        subExpDate: tenant.subscription.subExpDate?.slice(0, 10) ?? '',
        billingCycle: tenant.subscription.billingCycle ?? 'yearly',
        supportNotes: tenant.subscription.supportNotes ?? '',
      });
      setSubLoaded(true);
    }
  }, [tenant, brandingLoaded, subLoaded]);

  const suspendMut  = useMutation({ mutationFn: () => suspendTenant(slug!),  onSuccess: () => { toast.success('Suspended');  qc.invalidateQueries({ queryKey: ['admin-tenant', slug] }); }, onError: (e: Error) => toast.error(e.message) });
  const activateMut = useMutation({ mutationFn: () => activateTenant(slug!), onSuccess: () => { toast.success('Activated');  qc.invalidateQueries({ queryKey: ['admin-tenant', slug] }); }, onError: (e: Error) => toast.error(e.message) });
  const brandingMut = useMutation({ mutationFn: () => updateBranding(slug!, branding), onSuccess: () => { toast.success('Branding saved'); qc.invalidateQueries({ queryKey: ['admin-tenant', slug] }); }, onError: (e: Error) => toast.error(e.message) });
  const subMut = useMutation({
    mutationFn: () => updateSubscription(slug!, {
      plan: sub.plan as Plan,
      isActive: sub.isActive,
      subExpDate: sub.subExpDate || undefined,
      billingCycle: sub.billingCycle as BillingCycle,
      supportNotes: sub.supportNotes || undefined,
    }),
    onSuccess: () => { toast.success('Subscription updated'); qc.invalidateQueries({ queryKey: ['admin-tenant', slug] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }
  if (!tenant) {
    return (
      <div
        className="rounded-2xl border p-8 text-center"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <p style={{ color: 'var(--danger)' }}>Tenant not found.</p>
      </div>
    );
  }

  const statusBadge = STATUS_BADGE[tenant.status] ?? STATUS_BADGE.inactive;
  const planBadge   = PLAN_BADGE[tenant.subscription.plan] ?? PLAN_BADGE.free;

  return (
    <div className="space-y-6 pb-10 max-w-4xl">
      {/* Breadcrumb + Title */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/admin/tenants"
          className="rounded-xl p-2 transition-colors"
          style={{ color: 'var(--muted)' }}
        >
          <ArrowLeft width={18} height={18} />
        </Link>
        <h2
          className="text-2xl font-semibold tracking-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
        >
          {tenant.name}
        </h2>
        <Chip label={tenant.status}              color={statusBadge} />
        <Chip label={tenant.subscription.plan}   color={planBadge} />
      </div>

      {/* Info + Actions */}
      <SectionCard title="Tenant info">
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm sm:grid-cols-4">
            <div>
              <p className="mb-0.5 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Slug</p>
              <p className="font-mono font-medium" style={{ color: 'var(--foreground)' }}>{tenant.slug}</p>
            </div>
            <div>
              <p className="mb-0.5 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Created</p>
              <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                {new Date(tenant.createdAt).toLocaleDateString()}
              </p>
            </div>
            {tenant.branding.supportEmail && (
              <div>
                <p className="mb-0.5 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Support email</p>
                <p className="font-medium truncate" style={{ color: 'var(--foreground)' }}>{tenant.branding.supportEmail}</p>
              </div>
            )}
            {tenant.branding.frontendBaseURL && (
              <div>
                <p className="mb-0.5 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Frontend URL</p>
                <p className="font-medium truncate" style={{ color: 'var(--foreground)' }}>{tenant.branding.frontendBaseURL}</p>
              </div>
            )}
          </div>

          {isSuperAdmin && (
            <div
              className="flex flex-wrap gap-2 pt-4"
              style={{ borderTop: '1px solid var(--separator)' }}
            >
              {tenant.status !== 'suspended' ? (
                <Button
                  variant="danger-soft"
                  isDisabled={suspendMut.isPending}
                  onPress={() => { if (confirm('Suspend this tenant?')) suspendMut.mutate(); }}
                >
                  {suspendMut.isPending ? <><Spinner size="sm" /> Suspending…</> : (
                    <><TriangleExclamation width={14} height={14} /> Suspend</>
                  )}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  isDisabled={activateMut.isPending}
                  onPress={() => activateMut.mutate()}
                >
                  {activateMut.isPending ? <><Spinner size="sm" /> Activating…</> : 'Activate'}
                </Button>
              )}
              <Button
                variant="outline"
                onPress={() => setShowProvision(true)}
              >
                Provision admin
              </Button>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Branding + Subscription forms */}
      {isSuperAdmin && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Branding */}
          <SectionCard title="Branding">
            <form
              onSubmit={e => { e.preventDefault(); brandingMut.mutate(); }}
              className="p-6 space-y-4"
            >
              <FieldInput label="Logo URL"          id="b-logo"    value={branding.logoUrl}        onChange={v => setBranding(b => ({ ...b, logoUrl: v }))} />
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <FieldInput label="Primary color" id="b-color"  value={branding.primaryColor}   onChange={v => setBranding(b => ({ ...b, primaryColor: v }))} placeholder="#6366f1" />
                </div>
                {branding.primaryColor && (
                  <div
                    className="w-10 h-10 shrink-0 rounded-xl border shadow-inner"
                    style={{ backgroundColor: branding.primaryColor, borderColor: 'var(--border)' }}
                  />
                )}
              </div>
              <FieldInput label="Frontend base URL" id="b-url"    value={branding.frontendBaseURL} onChange={v => setBranding(b => ({ ...b, frontendBaseURL: v }))} />
              <FieldInput label="Support email"     id="b-email"  type="email" value={branding.supportEmail}   onChange={v => setBranding(b => ({ ...b, supportEmail: v }))} />
              <Button
                type="submit"
                variant="primary"
                isDisabled={brandingMut.isPending}
                className="mt-2"
              >
                {brandingMut.isPending ? <><Spinner size="sm" /> Saving…</> : 'Save branding'}
              </Button>
            </form>
          </SectionCard>

          {/* Subscription */}
          <SectionCard title="Subscription">
            <form
              onSubmit={e => { e.preventDefault(); subMut.mutate(); }}
              className="p-6 space-y-4"
            >
              <FieldSelect label="Plan"          id="s-plan"  value={sub.plan}         onChange={v => setSub(s => ({ ...s, plan: v }))}         options={PLANS} />
              <FieldSelect label="Billing cycle" id="s-cycle" value={sub.billingCycle} onChange={v => setSub(s => ({ ...s, billingCycle: v }))} options={CYCLES} />
              <FieldInput  label="Expiry date"   id="s-exp"   type="date" value={sub.subExpDate} onChange={v => setSub(s => ({ ...s, subExpDate: v }))} />
              <FieldInput  label="Support notes" id="s-notes" value={sub.supportNotes} onChange={v => setSub(s => ({ ...s, supportNotes: v }))} placeholder="e.g. Paid via bank transfer" />
              <label className="flex items-center gap-2.5 text-sm cursor-pointer" style={{ color: 'var(--foreground)' }}>
                <input
                  type="checkbox"
                  checked={sub.isActive}
                  onChange={e => setSub(s => ({ ...s, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border"
                  style={{ accentColor: 'var(--accent)' }}
                />
                Active (payment confirmed)
              </label>
              <Button
                type="submit"
                variant="primary"
                isDisabled={subMut.isPending}
                className="mt-2"
              >
                {subMut.isPending ? <><Spinner size="sm" /> Updating…</> : 'Update subscription'}
              </Button>
            </form>
          </SectionCard>
        </div>
      )}

      {/* Provision modal */}
      {showProvision && (
        <ProvisionModal slug={slug!} onClose={() => setShowProvision(false)} />
      )}
    </div>
  );
}
