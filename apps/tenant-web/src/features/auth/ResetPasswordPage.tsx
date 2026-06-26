import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { resetPassword } from '@officing/api-client';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    const token = params.get('token') ?? '';
    const tokenId = params.get('tokenId') ?? '';
    setLoading(true);
    try {
      await resetPassword(token, tokenId, password);
      toast.success('Password reset — please login');
      navigate('/login');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Set New Password</h1>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="New Password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
            <Input label="Confirm Password" type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} />
            <Button type="submit" loading={loading} className="w-full justify-center">Reset Password</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
