import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listCustomers, deactivateCustomer } from '@officing/api-client';
import type { Customer } from '@officing/api-client';
import { Btn, DataTable, PageShell } from '../../components/ui/index';
import { Plus, Pencil, Ban } from '@gravity-ui/icons';

const COLS = [
  { key: 'name',    label: 'Name'    },
  { key: 'company', label: 'Company' },
  { key: 'email',   label: 'Email'   },
  { key: 'phone',   label: 'Phone'   },
  { key: 'type',    label: 'Type'    },
  { key: 'actions', label: ''        },
];

export function CustomerListPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['customers', page],
    queryFn: () => listCustomers({ page, limit: 20 }),
  });
  const deactivateMut = useMutation({
    mutationFn: deactivateCustomer,
    onSuccess: () => { toast.success('Deactivated'); qc.invalidateQueries({ queryKey: ['customers'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  function renderCell(c: Customer, key: string) {
    // Support both nested `contact` shape (API) and legacy flat shape
    const firstName   = c.contact?.firstName   ?? c.firstName   ?? '';
    const lastName    = c.contact?.lastName    ?? c.lastName    ?? '';
    const companyName = c.contact?.companyName ?? c.companyName ?? '';
    const email       = c.contact?.email       ?? c.email       ?? '';
    const phoneNumber = c.contact?.phoneNumber ?? c.phoneNumber ?? '';
    const type        = c.contact?.type;

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
          <Link to={`/customers/${c._id}/edit`}>
            <Btn variant="ghost" size="sm"><Pencil width={13} height={13} /></Btn>
          </Link>
          <Btn variant="danger-soft" size="sm"
            onClick={() => { if (confirm('Deactivate this customer?')) deactivateMut.mutate(c._id); }}>
            <Ban width={13} height={13} />
          </Btn>
        </div>
      );
      default: return null;
    }
  }

  return (
    <PageShell title="Customers" subtitle="Manage your customer contacts."
      actions={<Link to="/customers/new"><Btn size="sm"><Plus width={14} height={14} /> New customer</Btn></Link>}
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
        emptyMessage="No customers yet."
      />
    </PageShell>
  );
}
