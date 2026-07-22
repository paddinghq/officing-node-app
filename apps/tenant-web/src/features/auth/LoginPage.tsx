import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { signIn, getCompany, getSubscription } from '@officing/api-client';
import { useAuthStore } from '../../store/auth';
import { Button, Spinner } from '@heroui/react';
import { Envelope, Eye, EyeSlash, SquareLetterT } from '@gravity-ui/icons';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, setBranding, setSubscription } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '', rememberMe: false });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signIn(form.email, form.password, form.rememberMe);
      if (res.success) {
        login(res.user, res.accessToken, res.refreshToken, res.user.tenantSlug);

        // Load branding and subscription in parallel
        try {
          const [companyRes, subRes] = await Promise.allSettled([
            getCompany(),
            getSubscription(),
          ]);
          if (companyRes.status === 'fulfilled') {
            const co = companyRes.value.data as Record<string, unknown>;
            setBranding({
              primaryColor: co.primaryColor as string | undefined,
              logoUrl: co.logoUrl as string | undefined,
              name: co.name as string | undefined,
            });
          }
          if (subRes.status === 'fulfilled') {
            setSubscription(subRes.value.subscription);
          }
        } catch {
          // non-fatal
        }

        navigate('/dashboard');
      } else {
        toast.error(res.message || 'Login failed');
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
            'radial-gradient(ellipse 70% 40% at 50% -5%, color-mix(in srgb, var(--brand-primary) 14%, transparent), transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div
            className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg"
            style={{ background: 'var(--brand-primary)', color: '#fff' }}
          >
            <SquareLetterT width={26} height={26} />
          </div>
          <h1
            className="text-3xl font-semibold tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
          >
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--muted)' }}>
            Sign in to your Officing account
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
                Email address
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
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm"
                  style={{
                    background: 'var(--field-background)',
                    borderColor: 'var(--field-border)',
                    color: 'var(--field-foreground)',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium"
                  style={{ color: 'var(--foreground)' }}
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium hover:underline"
                  style={{ color: 'var(--brand-primary)' }}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full rounded-xl border py-2.5 pl-4 pr-10 text-sm"
                  style={{
                    background: 'var(--field-background)',
                    borderColor: 'var(--field-border)',
                    color: 'var(--field-foreground)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--muted)' }}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeSlash width={16} height={16} /> : <Eye width={16} height={16} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label
              className="flex items-center gap-2.5 text-sm cursor-pointer"
              style={{ color: 'var(--foreground)' }}
            >
              <input
                type="checkbox"
                checked={form.rememberMe}
                onChange={e => setForm(f => ({ ...f, rememberMe: e.target.checked }))}
                className="h-4 w-4 rounded border"
                style={{ accentColor: 'var(--brand-primary)' }}
              />
              Remember me for 30 days
            </label>

            <Button
              type="submit"
              variant="primary"
              className="mt-1 w-full justify-center font-semibold"
              isDisabled={loading}
              style={{ background: 'var(--brand-primary)', color: '#fff' }}
            >
              {loading ? (
                <><Spinner size="sm" /> Signing in</>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs" style={{ color: 'var(--muted)' }}>
          No account?{' '}
          <a
            href="mailto:support@officing.app"
            className="font-medium hover:underline"
            style={{ color: 'var(--brand-primary)' }}
          >
            Contact support
          </a>{' '}
          to get access.
        </p>
      </div>
    </div>
  );
}
