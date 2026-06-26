import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyEmail } from '@officing/api-client';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const id = params.get('id') ?? '';
    const token = params.get('token') ?? '';
    const uuid = params.get('uuid') ?? '';
    verifyEmail(id, token, uuid)
      .then(res => { setStatus(res.success ? 'success' : 'error'); setMessage(res.message); })
      .catch(err => { setStatus('error'); setMessage(err.message); });
  }, [params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm text-center space-y-4">
        {status === 'loading' && <><div className="text-4xl">⏳</div><p>Verifying your email…</p></>}
        {status === 'success' && (
          <>
            <div className="text-4xl">✅</div>
            <p className="text-gray-700 font-medium">{message || 'Email verified!'}</p>
            <Link to="/login" className="text-[var(--brand-primary)] underline text-sm">Go to login</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-4xl">❌</div>
            <p className="text-red-600">{message || 'Verification failed.'}</p>
            <Link to="/login" className="text-[var(--brand-primary)] underline text-sm">Go to login</Link>
          </>
        )}
      </div>
    </div>
  );
}
