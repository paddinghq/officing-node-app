import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface Props {
  open: boolean;
  title: string;
  actionLabel: string;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  loading?: boolean;
}

export function ReasonModal({ open, title, actionLabel, onClose, onSubmit, loading }: Props) {
  const [reason, setReason] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return;
    onSubmit(reason.trim());
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Reason *</label>
          <textarea
            required
            rows={3}
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="danger" type="submit" loading={loading}>{actionLabel}</Button>
        </div>
      </form>
    </Modal>
  );
}
