import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createTenant } from '@officing/api-client';
import { Button, Spinner } from '@heroui/react';
import { ArrowLeft } from '@gravity-ui/icons';

function FieldInput({
  label, id, type = 'text', value, onChange, placeholder, required, helpText
}: {
  label: string; id: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; required?: boolean; helpText?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
        {label}
        {required && <span style={{ color: 'var(--danger)' }}> *</span>}
      </label>
      <input
        id={id}
        type={type}
        required={required}
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

export function TenantCreatePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({ slug: '', name: '', supportEmail: '' });

  const mutation = useMutation({
    mutationFn: () => createTenant(form),
    onSuccess: res => {
      toast.success('Tenant created');
      qc.invalidateQueries({ queryKey: ['admin-tenants'] });
      navigate(`/admin/tenants/${res.tenant?.slug ?? ''}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="max-w-xl space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
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
          New tenant
        </h2>
      </div>

      {/* Form card */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div
          className="px-6 py-4"
          style={{ borderBottom: '1px solid var(--separator)' }}
        >
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Create a new tenant organization on the platform.
          </p>
        </div>

        <form
          onSubmit={e => { e.preventDefault(); mutation.mutate(); }}
          className="p-6 space-y-5"
        >
          <FieldInput
            label="Slug"
            id="slug"
            required
            value={form.slug}
            onChange={set('slug')}
            placeholder="acme-corp"
            helpText="Lowercase letters, numbers and hyphens only. Cannot be changed later."
          />
          <FieldInput
            label="Company name"
            id="name"
            required
            value={form.name}
            onChange={set('name')}
            placeholder="Acme Corporation"
          />
          <FieldInput
            label="Support email"
            id="supportEmail"
            type="email"
            value={form.supportEmail}
            onChange={set('supportEmail')}
            placeholder="support@acme.com"
          />

          <div
            className="flex gap-3 pt-2"
            style={{ borderTop: '1px solid var(--separator)' }}
          >
            <Button
              type="submit"
              variant="primary"
              isDisabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <><Spinner size="sm" /> Creating…</>
              ) : (
                'Create tenant'
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onPress={() => navigate('/admin/tenants')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
