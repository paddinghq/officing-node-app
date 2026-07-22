import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listExpenses, deleteExpense, exportExpensesCSV, downloadBlob } from '@officing/api-client';
import type { Expense } from '@officing/api-client';
import { Btn, DataTable, PageShell } from '../../components/ui/index';
import { Plus, ArrowDownToSquare, Pencil, TrashBin } from '@gravity-ui/icons';

const COLS = [
  { key: 'expenseDate', label: 'Date' }, { key: 'category', label: 'Category' },
  { key: 'description', label: 'Description' }, { key: 'amount', label: 'Amount', align: 'right' as const },
  { key: 'actions', label: '' },
];

export function ExpenseListPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({ queryKey: ['expenses', page], queryFn: () => listExpenses({ page, limit: 20 }) });
  const deleteMut = useMutation({ mutationFn: deleteExpense, onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['expenses'] }); }, onError: (e: Error) => toast.error(e.message) });

  async function handleExport() { try { downloadBlob(await exportExpensesCSV(), 'expenses.csv'); } catch (e: unknown) { toast.error((e as Error).message); } }

  function renderCell(exp: Expense, key: string) {
    const cat = typeof exp.category === 'object' ? exp.category : null;
    switch (key) {
      case 'expenseDate': return <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>{exp.expenseDate?.slice(0, 10)}</span>;
      case 'category':    return <span className="font-medium">{cat?.name ?? 'Uncategorized'}</span>;
      case 'description': return <span style={{ color: 'var(--muted)' }}>{exp.description ?? '—'}</span>;
      case 'amount':      return <span className="font-semibold tabular-nums">{exp.amount?.toLocaleString()}</span>;
      case 'actions':     return (
        <div className="flex items-center justify-end gap-1">
          <Link to={`/expenses/${exp._id}/edit`}><Btn variant="ghost" size="sm"><Pencil width={13} height={13} /></Btn></Link>
          <Btn variant="danger-soft" size="sm" onClick={() => { if (confirm('Delete?')) deleteMut.mutate(exp._id); }}><TrashBin width={13} height={13} /></Btn>
        </div>
      );
      default: return null;
    }
  }

  return (
    <PageShell title="Expenses" subtitle="Track business spending by category."
      actions={<>
        <Btn variant="secondary" size="sm" onClick={handleExport}><ArrowDownToSquare width={14} height={14} /> Export CSV</Btn>
        <Link to="/expenses/new"><Btn size="sm"><Plus width={14} height={14} /> New expense</Btn></Link>
      </>}
    >
      <DataTable columns={COLS} rows={data?.docs ?? []} renderCell={renderCell} isLoading={isLoading}
        page={page} hasNextPage={data?.hasNextPage} hasPrevPage={data?.hasPrevPage} totalDocs={data?.totalDocs ?? 0} limit={20} onPageChange={setPage}
        emptyMessage="No expenses recorded yet."
      />
    </PageShell>
  );
}
