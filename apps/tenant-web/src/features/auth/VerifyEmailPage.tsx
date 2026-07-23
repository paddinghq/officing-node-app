import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyEmail } from '@officing/api-client';
import { Spinner } from '@heroui/react';
import { CircleCheck, CircleXmark } from '@gravity-ui/icons';

export function VerifyEmailPage() {
  const [params]  = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    verifyEmail(params.get('id') ?? '', params.get('token') ?? '', params.get('uuid') ?? '')
      .then(res => { setStatus(res.success ? 'success' : 'error'); setMessage(res.message); })
      .catch(err => { setStatus('error'); setMessage(err.message); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: 'var(--background)', fontFamily: 'var(--font-sans)' }}>
      <div className="w-full max-w-sm rounded-2xl border p-10 text-center shadow-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <Spinner />
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Verifying your email…</p>
          </div>
        )}
        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full p-3" style={{ background: 'rgba(22,163,74,0.1)', color: '#16a34a' }}>
              <CircleCheck width={32} height={32} />
            </div>
            <p className="font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
              {message || 'Email verified!'}
            </p>
            <Link to="/login" className="text-sm font-medium hover:underline" style={{ color: 'var(--brand-primary)' }}>
              Sign in to your account
            </Link>
          </div>
        )}
        {status === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full p-3" style={{ background: 'rgba(220,38,38,0.1)', color: '#dc2626' }}>
              <CircleXmark width={32} height={32} />
            </div>
            <p className="font-semibold" style={{ color: '#dc2626' }}>
              {message || 'Verification failed.'}
            </p>
            <Link to="/login" className="text-sm font-medium hover:underline" style={{ color: 'var(--brand-primary)' }}>
              Back to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
