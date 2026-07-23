import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { winDeal } from '@officing/api-client';
import type { Deal } from '@officing/api-client';
import { SModal } from '../../components/ui/SModal';
import { Btn } from '../../components/ui/Btn';
import { Medal, CircleCheck } from '@gravity-ui/icons';

interface Props { open: boolean; dealId: string; onClose: () => void; onSuccess: () => void; }

export function WinDealModal({ open, dealId, onClose, onSuccess }: Props) {
  const [createEstimate, setCreateEstimate] = useState(false);
  const [createInvoice,  setCreateInvoice]  = useState(false);
  const [wonDeal, setWonDeal]               = useState<Deal | null>(null);

  const mutation = useMutation({
    mutationFn: () => winDeal(dealId, { createEstimate, createInvoice }),
    onSuccess: res => { toast.success('Deal marked as won'); setWonDeal(res.data); onSuccess(); },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleClose() { setWonDeal(null); setCreateEstimate(false); setCreateInvoice(false); onClose(); }

  const labelCls = 'flex items-center gap-2.5 text-sm cursor-pointer';

  return (
    <SModal open={open} onClose={handleClose} title="Win deal" size="sm"
      footer={wonDeal ? (
        <Btn variant="secondary" fullWidth onClick={handleClose}>Close</Btn>
      ) : (
        <div className="flex justify-end gap-2">
          <Btn variant="secondary" onClick={handleClose}>Cancel</Btn>
          <Btn loading={mutation.isPending} onClick={() => mutation.mutate()}>
            <CircleCheck width={13} height={13} /> Mark won
          </Btn>
        </div>
      )}
    >
      {!wonDeal ? (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Mark this deal as won. A customer record will be created (or reused).
          </p>
          <label className={labelCls} style={{ color: 'var(--foreground)' }}>
            <input type="checkbox" checked={createEstimate} onChange={e => setCreateEstimate(e.target.checked)} style={{ accentColor: 'var(--brand-primary)' }} />
            Create a draft estimate for the deal value
          </label>
          <label className={labelCls} style={{ color: 'var(--foreground)' }}>
            <input type="checkbox" checked={createInvoice} onChange={e => setCreateInvoice(e.target.checked)} style={{ accentColor: 'var(--brand-primary)' }} />
            Create a draft invoice for the deal value
          </label>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#16a34a' }}>
            <CircleCheck width={16} height={16} /> Deal marked as won
          </div>
          {wonDeal.estimate && (
            <Link to={`/estimates/${wonDeal.estimate._id}/edit`} className="block text-sm hover:underline" style={{ color: 'var(--brand-primary)' }}>
              Open draft estimate
            </Link>
          )}
          {wonDeal.invoice && (
            <Link to={`/invoices/${wonDeal.invoice._id}/edit`} className="block text-sm hover:underline" style={{ color: 'var(--brand-primary)' }}>
              Open draft invoice
            </Link>
          )}
        </div>
      )}
    </SModal>
  );
}
