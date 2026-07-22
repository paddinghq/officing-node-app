import { useState } from 'react';
import { SModal } from '../ui/SModal';
import { Btn } from '../ui/Btn';
import { Field } from '../ui/Field';

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
    <SModal open={open} onClose={onClose} title={title} size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Btn variant="secondary" type="button" onClick={onClose}>Cancel</Btn>
          <Btn variant="danger" type="submit" loading={loading}
            onClick={() => document.getElementById('reason-form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}
          >
            {actionLabel}
          </Btn>
        </div>
      }
    >
      <form id="reason-form" onSubmit={handleSubmit}>
        <Field.Textarea
          label="Reason *"
          required
          rows={3}
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Provide a reason…"
        />
      </form>
    </SModal>
  );
}
