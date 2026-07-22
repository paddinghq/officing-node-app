import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { forgotPassword } from '@officing/api-client';
import { Spinner } from '@heroui/react';
import { Envelope, ArrowLeft, CircleCheck } from '@gravity-ui/icons';

export function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reset link');
    } finally { setLoading(false); }
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10"
      style={{ background: 'var(--background)', fontFamily: 'var(--font-sans)' }}
    >
      <div className="relative w-full max-w-sm">
        <Link
          to="/login"
          className="mb-6 flex items-center gap-2 text-sm hover:underline"
          style={{ color: 'var(--muted)' }}
        >
          <ArrowLeft width={15} height={15} /> Back to login
        </Link>

        <div className="mb-7 text-center">
          <h1
            className="text-2xl font-semibold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
          >
            Reset your password
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--muted)' }}>
            Enter your email and we will send a reset link.
          </p>
        </div>

        <div
          className="rounded-2xl border p-7 shadow-sm"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          {sent ? (
            <div className="flex flex-col items-center gap-4 text-center py-2">
              <div
                className="rounded-full p-3"
                style={{ background: 'rgba(22,163,74,0.1)', color: '#16a34a' }}
              >
                <CircleCheck width={28} height={28} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                Reset link sent to <strong>{email}</strong>
              </p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Check your inbox. The link expires in 30 minutes.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                  Email address
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }}>
                    <Envelope width={15} height={15} />
                  </span>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)]"
                    style={{ background: 'var(--field-background)', borderColor: 'var(--field-border)', color: 'var(--field-foreground)' }}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                style={{ background: 'var(--brand-primary)' }}
              >
                {loading ? <span className="flex items-center justify-center gap-2"><Spinner size="sm" /> Sending…</span> : 'Send reset link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
