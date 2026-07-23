import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { loseDeal } from '@officing/api-client';
import { ReasonModal } from '../../components/crm/ReasonModal';

interface Props { open: boolean; dealId: string; onClose: () => void; onSuccess: () => void; }

export function LoseDealModal({ open, dealId, onClose, onSuccess }: Props) {
  const mutation = useMutation({
    mutationFn: (reason: string) => loseDeal(dealId, reason),
    onSuccess: () => { toast.success('Deal marked as lost'); onSuccess(); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });
  return <ReasonModal open={open} title="Lose deal" actionLabel="Mark lost" onClose={onClose} onSubmit={reason => mutation.mutate(reason)} loading={mutation.isPending} />;
}
