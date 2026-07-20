import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { winDeal } from '@officing/api-client';
import type { Deal } from '@officing/api-client';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

interface Props {
  open: boolean;
  dealId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function WinDealModal({ open, dealId, onClose, onSuccess }: Props) {
  const [createEstimate, setCreateEstimate] = useState(false);
  const [createInvoice, setCreateInvoice] = useState(false);
  const [wonDeal, setWonDeal] = useState<Deal | null>(null);

  const mutation = useMutation({
    mutationFn: () => winDeal(dealId, { createEstimate, createInvoice }),
    onSuccess: (res) => {
      toast.success('Deal won');
      setWonDeal(res.data);
      onSuccess();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleClose() {
    setWonDeal(null);
    setCreateEstimate(false);
    setCreateInvoice(false);
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Win Deal">
      {!wonDeal ? (
        <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <p className="text-sm text-gray-600">Mark this deal as won. This creates (or reuses) a customer record.</p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={createEstimate} onChange={e => setCreateEstimate(e.target.checked)} />
            Create a draft estimate for the deal value
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={createInvoice} onChange={e => setCreateInvoice(e.target.checked)} />
            Create a draft invoice for the deal value
          </label>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" type="button" onClick={handleClose}>Cancel</Button>
            <Button type="submit" loading={mutation.isPending}>Mark Won</Button>
          </div>
        </form>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-green-700 font-medium">Deal marked as won.</p>
          {wonDeal.estimate && (
            <Link to={`/estimates/${wonDeal.estimate._id}/edit`} className="block text-sm text-[var(--brand-primary)] underline">
              View draft estimate →
            </Link>
          )}
          {wonDeal.invoice && (
            <Link to={`/invoices/${wonDeal.invoice._id}/edit`} className="block text-sm text-[var(--brand-primary)] underline">
              View draft invoice →
            </Link>
          )}
          <div className="flex justify-end">
            <Button variant="secondary" onClick={handleClose}>Close</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
