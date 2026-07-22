import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminLogin } from '@officing/api-client';
import { Button as HeroButton, Spinner } from '@heroui/react';
import { ShieldKeyhole, Envelope, Eye, EyeSlash } from '@gravity-ui/icons';
import { useAdminStore } from '../../store/auth';
import type { ReactNode } from 'react';

// HeroUI v3 Button doesn't expose children in its TS types — cast to avoid error
const Button = HeroButton as unknown as React.FC<React.ComponentPropsWithRef<'button'> & {
  variant?: string;
  isDisabled?: boolean;
  className?: string;
  type?: string;
  children?: ReactNode;
}>;

export function AdminLoginPage() {
  const navigate = useNavigate();
  const login = useAdminStore(s => s.login);
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await adminLogin(form.email, form.password);
      if (res.success && res.accessToken) {
        login(res.admin, res.accessToken);
        navigate('/admin/overview');
      } else {
        toast.error('Login failed');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10"
      style={{ background: 'var(--background)', fontFamily: 'var(--font-sans)' }}
    >
      {/* Ambient gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 40% at 50% -5%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div
            className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg"
            style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}
          >
            <ShieldKeyhole width={26} height={26} />
          </div>
          <h1
            className="text-3xl font-semibold tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
          >
            Officing
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--muted)' }}>
            Sign in to the platform admin
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border p-8 shadow-sm"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium"
                style={{ color: 'var(--foreground)' }}
              >
                Admin email
              </label>
              <div className="relative">
                <span
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--muted)' }}
                >
                  <Envelope width={16} height={16} />
                </span>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="admin@officing.app"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm transition-colors"
                  style={{
                    background: 'var(--field-background)',
                    borderColor: 'var(--field-border)',
                    color: 'var(--field-foreground)',
                    fontFamily: 'var(--font-sans)',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium"
                style={{ color: 'var(--foreground)' }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full rounded-xl border py-2.5 pl-4 pr-10 text-sm transition-colors"
                  style={{
                    background: 'var(--field-background)',
                    borderColor: 'var(--field-border)',
                    color: 'var(--field-foreground)',
                    fontFamily: 'var(--font-sans)',
                  }}
                />
                <button
                  type="button"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--muted)' }}
                >
                  {showPw ? <EyeSlash width={16} height={16} /> : <Eye width={16} height={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="mt-1 w-full justify-center font-semibold"
              isDisabled={loading}
            >
              {loading ? (
                <>
                  <Spinner size="sm" />
                  <span>Signing in</span>
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: 'var(--muted)' }}>
          Access is restricted to authorized platform administrators.
        </p>
      </div>
    </div>
  );
}
