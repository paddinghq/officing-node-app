/**
 * PlanGate — renders children if plan allows, otherwise shows an upgrade notice.
 */
import type { ReactNode } from 'react';
import { Lock } from '@gravity-ui/icons';
import { Btn } from './Btn';

interface Props {
  allowed: boolean;
  feature: string;
  children: ReactNode;
}

export function PlanGate({ allowed, feature, children }: Props) {
  if (allowed) return <>{children}</>;

  return (
    <div className="p-5 sm:p-7">
      <div
        className="rounded-2xl border p-10 flex flex-col items-center text-center gap-4"
        style={{ background: 'rgba(245,158,11,0.05)', borderColor: 'rgba(217,119,6,0.25)' }}
      >
        <div className="rounded-2xl p-4" style={{ background: 'rgba(217,119,6,0.1)', color: '#d97706' }}>
          <Lock width={28} height={28} />
        </div>
        <p className="text-base font-semibold" style={{ color: '#d97706' }}>
          {feature} requires Standard plan or above.
        </p>
        <Btn
          variant="secondary"
          onClick={() => { window.location.href = 'mailto:support@officing.app'; }}
        >
          Contact support to upgrade
        </Btn>
      </div>
    </div>
  );
}
