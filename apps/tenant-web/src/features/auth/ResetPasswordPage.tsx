import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { resetPassword } from '@officing/api-client';
import { Spinner } from '@heroui/react';
import { Lock } from '@gravity-ui/icons';

export function ResetPasswordPage() {
  const [params]              = useSearchParams();
  const navigate              = useNavigate();
  const [password, setPass]   = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    const token   = params.get('token')   ?? '';
    const tokenId = params.get('tokenId') ?? '';
    setLoading(true);
    try {
      await resetPassword(token, tokenId, password);
      toast.success('Password reset — please sign in');
      navigate('/login');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Reset failed');
    } finally { setLoading(false); }
  }

  function PasswordField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{label}</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }}>
            <Lock width={14} height={14} />
          </span>
          <input
            id={id}
            type="password"
            required
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
            style={{ background: 'var(--field-background)', borderColor: 'var(--field-border)', color: 'var(--field-foreground)' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-10"
      style={{ background: 'var(--background)', fontFamily: 'var(--font-sans)' }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-7 text-center">
          <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
            Set new password
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--muted)' }}>Choose a strong password for your account.</p>
        </div>
        <div className="rounded-2xl border p-7 shadow-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <PasswordField id="pw"  label="New password"     value={password} onChange={setPass}   />
            <PasswordField id="cpw" label="Confirm password" value={confirm}  onChange={setConfirm} />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
              style={{ background: 'var(--brand-primary)' }}
            >
              {loading ? <span className="flex items-center justify-center gap-2"><Spinner size="sm" />Resetting…</span> : 'Reset password'}
            </button>
          </form>
          <Link to="/login" className="mt-4 block text-center text-xs hover:underline" style={{ color: 'var(--muted)' }}>
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
