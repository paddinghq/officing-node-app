import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listExpenses, deleteExpense, exportExpensesCSV, downloadBlob } from '@officing/api-client';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Pagination';

export function ExpenseListPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({ queryKey: ['expenses', page], queryFn: () => listExpenses({ page, limit: 20 }) });
  const deleteMut = useMutation({ mutationFn: deleteExpense, onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['expenses'] }); }, onError: (e: Error) => toast.error(e.message) });
  async function handleExport() {
    try { downloadBlob(await exportExpensesCSV(), 'expenses.csv'); } catch (e: unknown) { toast.error((e as Error).message); }
  }
  return (
    <div className="p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Expenses</h2>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleExport}>Export CSV</Button>
          <Link to="/expenses/new"><Button size="sm">+ New Expense</Button></Link>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['Date', 'Category', 'Description', 'Amount', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>)}</tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>}
            {!isLoading && !data?.docs?.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No expenses.</td></tr>}
            {data?.docs?.map(exp => {
              const cat = typeof exp.category === 'object' ? exp.category : null;
              return (
                <tr key={exp._id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">{exp.expenseDate?.slice(0, 10)}</td>
                  <td className="px-4 py-3">{cat?.name ?? 'Uncategorized'}</td>
                  <td className="px-4 py-3 text-gray-600">{exp.description}</td>
                  <td className="px-4 py-3 font-medium">{exp.amount?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link to={`/expenses/${exp._id}/edit`}><Button variant="ghost" size="sm">Edit</Button></Link>
                      <Button variant="danger" size="sm" onClick={() => { if (confirm('Delete?')) deleteMut.mutate(exp._id); }}>Del</Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {data && <div className="px-4 pb-4"><Pagination page={page} hasNextPage={data.hasNextPage} hasPrevPage={data.hasPrevPage} totalDocs={data.totalDocs} limit={20} onPageChange={setPage} /></div>}
      </div>
    </div>
  );
}
