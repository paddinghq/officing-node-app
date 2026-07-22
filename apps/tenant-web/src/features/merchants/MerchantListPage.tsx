import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listMerchants, deleteMerchant } from '@officing/api-client';
import type { Merchant } from '@officing/api-client';
import { Btn, DataTable, PageShell } from '../../components/ui/index';
import { Plus, Pencil, TrashBin } from '@gravity-ui/icons';

const COLS = [
  { key: 'name',    label: 'Name'    },
  { key: 'company', label: 'Company' },
  { key: 'email',   label: 'Email'   },
  { key: 'phone',   label: 'Phone'   },
  { key: 'type',    label: 'Type'    },
  { key: 'actions', label: ''        },
];

export function MerchantListPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['merchants', page],
    queryFn: () => listMerchants({ page, limit: 20 }),
  });
  const deleteMut = useMutation({
    mutationFn: deleteMerchant,
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['merchants'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  function renderCell(m: Merchant, key: string) {
    // Support both nested `contact` shape (API) and legacy flat shape
    const firstName   = m.contact?.firstName   ?? m.firstName   ?? '';
    const lastName    = m.contact?.lastName    ?? m.lastName    ?? '';
    const companyName = m.contact?.companyName ?? m.companyName ?? '';
    const email       = m.contact?.email       ?? m.email       ?? '';
    const phoneNumber = m.contact?.phoneNumber ?? m.phoneNumber ?? '';
    const type        = m.contact?.type;

    switch (key) {
      case 'name':    return <span className="font-medium">{firstName} {lastName}</span>;
      case 'company': return <span style={{ color: 'var(--muted)' }}>{companyName || '—'}</span>;
      case 'email':   return <span style={{ color: 'var(--muted)' }}>{email || '—'}</span>;
      case 'phone':   return <span style={{ color: 'var(--muted)' }}>{phoneNumber || '—'}</span>;
      case 'type':    return (
        <span className="capitalize text-xs px-2 py-0.5 rounded-full"
          style={{ background: 'var(--surface-secondary)', color: 'var(--muted)' }}>
          {type ?? '—'}
        </span>
      );
      case 'actions': return (
        <div className="flex items-center justify-end gap-1">
          <Link to={`/merchants/${m._id}/edit`}>
            <Btn variant="ghost" size="sm"><Pencil width={13} height={13} /></Btn>
          </Link>
          <Btn variant="danger-soft" size="sm"
            onClick={() => { if (confirm('Delete this merchant?')) deleteMut.mutate(m._id); }}>
            <TrashBin width={13} height={13} />
          </Btn>
        </div>
      );
      default: return null;
    }
  }

  return (
    <PageShell title="Merchants" subtitle="Manage your vendor and supplier contacts."
      actions={<Link to="/merchants/new"><Btn size="sm"><Plus width={14} height={14} /> New merchant</Btn></Link>}
    >
      <DataTable
        columns={COLS}
        rows={data?.docs ?? []}
        renderCell={renderCell}
        isLoading={isLoading}
        page={page}
        hasNextPage={data?.hasNextPage}
        hasPrevPage={data?.hasPrevPage}
        totalDocs={data?.totalDocs ?? 0}
        limit={20}
        onPageChange={setPage}
        emptyMessage="No merchants yet."
      />
    </PageShell>
  );
}
