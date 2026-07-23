import { SModal } from './ui/SModal';
import { Btn } from './ui/Btn';
import { useAuthStore } from '../store/auth';
import { Lock } from '@gravity-ui/icons';

interface Props { open: boolean; onClose: () => void; feature?: string; }

export function UpgradeModal({ open, onClose, feature }: Props) {
  const tenantName = useAuthStore(s => s.tenantName);
  return (
    <SModal open={open} onClose={onClose} title="Upgrade required" size="sm">
      <div className="flex flex-col items-center gap-4 text-center py-2">
        <div className="rounded-2xl p-4" style={{ background: 'rgba(217,119,6,0.1)', color: '#d97706' }}>
          <Lock width={28} height={28} />
        </div>
        <p className="text-sm" style={{ color: 'var(--foreground)' }}>
          {feature
            ? <><strong>{feature}</strong> requires a higher plan.</>
            : 'This feature is not available on your current plan.'}
        </p>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          Contact support to upgrade {tenantName}'s subscription.
        </p>
        <Btn fullWidth onClick={() => { window.location.href = 'mailto:support@officing.app'; }}>
          Contact support
        </Btn>
      </div>
    </SModal>
  );
}
