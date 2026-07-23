import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getSecuritySettings, changePassword, updateRecoveryEmail, toggleMFA } from '@officing/api-client';
import { Btn, SCard, PageShell } from '../../components/ui/index';
import { Field } from '../../components/ui/Field';

export function SecurityPage() {
  const { data } = useQuery({ queryKey: ['security-settings'], queryFn: getSecuritySettings });
  const [pwForm, setPwForm]     = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [recoveryEmail, setRE]  = useState('');
  const [pwLoading, setPwLoad]  = useState(false);
  const [emLoading, setEmLoad]  = useState(false);

  const mfaMut = useMutation({ mutationFn: (en: boolean) => toggleMFA(en), onSuccess: () => toast.success('MFA updated'), onError: (e: Error) => toast.error(e.message) });

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
    setPwLoad(true);
    try { await changePassword(pwForm.currentPassword, pwForm.newPassword); toast.success('Password changed'); setPwForm({ currentPassword: '', newPassword: '', confirm: '' }); }
    catch (e: unknown) { toast.error((e as Error).message); }
    finally { setPwLoad(false); }
  }

  async function handleRecoveryEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmLoad(true);
    try { await updateRecoveryEmail(recoveryEmail); toast.success('Recovery email updated — check inbox for OTP'); setRE(''); }
    catch (e: unknown) { toast.error((e as Error).message); }
    finally { setEmLoad(false); }
  }

  const sec = data?.data as Record<string, unknown> | undefined;

  return (
    <PageShell title="Security" subtitle="Manage account security settings." maxWidth="max-w-lg">
      <SCard title="Change password">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Field label="Current password" type="password" required value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} />
          <Field label="New password"     type="password" required value={pwForm.newPassword}     onChange={e => setPwForm(f => ({ ...f, newPassword:     e.target.value }))} />
          <Field label="Confirm password" type="password" required value={pwForm.confirm}          onChange={e => setPwForm(f => ({ ...f, confirm:          e.target.value }))} />
          <Btn type="submit" loading={pwLoading}>Change password</Btn>
        </form>
      </SCard>

      <SCard title="Recovery email">
        <form onSubmit={handleRecoveryEmail} className="space-y-4">
          {!!sec?.recoveryEmail && (
            <p className="text-sm rounded-xl p-3" style={{ background: 'var(--surface-secondary)', color: 'var(--muted)' }}>
              Current: <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{String(sec.recoveryEmail)}</span>
            </p>
          )}
          <Field label="New recovery email" type="email" value={recoveryEmail} onChange={e => setRE(e.target.value)} />
          <Btn type="submit" loading={emLoading}>Update recovery email</Btn>
        </form>
      </SCard>

      <SCard title="Multi-factor authentication">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold" style={{ color: 'var(--foreground)' }}>Email MFA</p>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {sec?.mfaEnabled ? 'Currently enabled — a code will be emailed on each login.' : 'Currently disabled.'}
            </p>
          </div>
          <Btn
            variant={sec?.mfaEnabled ? 'danger-soft' : 'brand'}
            loading={mfaMut.isPending}
            onClick={() => mfaMut.mutate(!sec?.mfaEnabled)}
          >
            {sec?.mfaEnabled ? 'Disable' : 'Enable'} MFA
          </Btn>
        </div>
      </SCard>
    </PageShell>
  );
}
