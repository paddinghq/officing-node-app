import React from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { useAuthStore } from '../store/auth';

interface Props {
  open: boolean;
  onClose: () => void;
  feature?: string;
}

export function UpgradeModal({ open, onClose, feature }: Props) {
  const tenantName = useAuthStore(s => s.tenantName);

  return (
    <Modal open={open} onClose={onClose} title="Upgrade Required" size="sm">
      <div className="text-center space-y-4">
        <div className="text-4xl">🔒</div>
        <p className="text-gray-700">
          {feature ? `The <strong>${feature}</strong> feature requires a higher plan.` : 'This feature is not available on your current plan.'}
        </p>
        <p className="text-sm text-gray-500">Contact support to upgrade {tenantName}'s subscription.</p>
        <Button
          className="w-full justify-center"
          onClick={() => { window.location.href = 'mailto:support@officing.app'; }}
        >
          Contact Support
        </Button>
      </div>
    </Modal>
  );
}
