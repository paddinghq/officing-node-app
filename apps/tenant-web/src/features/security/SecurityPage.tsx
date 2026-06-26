import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getSecuritySettings, changePassword, updateRecoveryEmail, toggleMFA } from '@officing/api-client';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export function SecurityPage() {
  const { data } = useQuery({ queryKey: ['security-settings'], queryFn: getSecuritySettings });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  const mfaMut = useMutation({
    mutationFn: (enabled: boolean) => toggleMFA(enabled),
    onSuccess: () => toast.success('MFA updated'),
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
    setPwLoading(true);
    try {
      await changePassword(pwForm.currentPassword, pwForm.newPassword);
      toast.success('Password changed');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (e: unknown) { toast.error((e as Error).message); }
    finally { setPwLoading(false); }
  }

  async function handleRecoveryEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailLoading(true);
    try {
      await updateRecoveryEmail(recoveryEmail);
      toast.success('Recovery email updated — check inbox for OTP');
      setRecoveryEmail('');
    } catch (e: unknown) { toast.error((e as Error).message); }
    finally { setEmailLoading(false); }
  }

  const sec = data?.data as Record<string, unknown> | undefined;

  return (
    <div className="p-8 max-w-lg space-y-6">
      <h2 className="text-xl font-semibold">Security</h2>
      <Card title="Change Password">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input label="Current Password" type="password" required value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} />
          <Input label="New Password" type="password" required value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} />
          <Input label="Confirm New Password" type="password" required value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
          <Button type="submit" loading={pwLoading}>Change Password</Button>
        </form>
      </Card>
      <Card title="Recovery Email">
        <form onSubmit={handleRecoveryEmail} className="space-y-4">
          {!!sec?.recoveryEmail && <p className="text-sm text-gray-600">Current: <strong>{String(sec.recoveryEmail)}</strong></p>}
          <Input label="New Recovery Email" type="email" value={recoveryEmail} onChange={e => setRecoveryEmail(e.target.value)} />
          <Button type="submit" loading={emailLoading}>Update Recovery Email</Button>
        </form>
      </Card>
      <Card title="Multi-Factor Authentication">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Email MFA</p>
            <p className="text-sm text-gray-500">{sec?.mfaEnabled ? 'Enabled' : 'Disabled'}</p>
          </div>
          <Button variant={sec?.mfaEnabled ? 'danger' : 'primary'} size="sm" loading={mfaMut.isPending} onClick={() => mfaMut.mutate(!sec?.mfaEnabled)}>
            {sec?.mfaEnabled ? 'Disable MFA' : 'Enable MFA'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
