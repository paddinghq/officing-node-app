import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listCustomers, deleteCustomer } from '@officing/api-client';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Pagination';

export function CustomerListPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({ queryKey: ['customers', page], queryFn: () => listCustomers({ page, limit: 20 }) });
  const deleteMut = useMutation({ mutationFn: deleteCustomer, onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['customers'] }); }, onError: (e: Error) => toast.error(e.message) });
  return (
    <div className="p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Customers</h2>
        <Link to="/customers/new"><Button size="sm">+ New Customer</Button></Link>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>{['Name', 'Company', 'Email', 'Phone', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>)}</tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>}
            {!isLoading && !data?.docs?.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No customers.</td></tr>}
            {data?.docs?.map(c => (
              <tr key={c._id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{c.firstName} {c.lastName}</td>
                <td className="px-4 py-3 text-gray-600">{c.companyName}</td>
                <td className="px-4 py-3 text-gray-600">{c.email}</td>
                <td className="px-4 py-3 text-gray-600">{c.phoneNumber}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link to={`/customers/${c._id}/edit`}><Button variant="ghost" size="sm">Edit</Button></Link>
                    <Button variant="danger" size="sm" onClick={() => { if (confirm('Delete?')) deleteMut.mutate(c._id); }}>Del</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && <div className="px-4 pb-4"><Pagination page={page} hasNextPage={data.hasNextPage} hasPrevPage={data.hasPrevPage} totalDocs={data.totalDocs} limit={20} onPageChange={setPage} /></div>}
      </div>
    </div>
  );
}
