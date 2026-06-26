import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listEstimates, deleteEstimate, downloadEstimatePDF, markEstimateSent, downloadBlob } from '@officing/api-client';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { useAuthStore } from '../../store/auth';

type Color = 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'purple';
const statusColor: Record<string, Color> = { draft: 'gray', sent: 'blue', accepted: 'green', declined: 'red', expired: 'yellow' };

export function EstimateListPage() {
  const qc = useQueryClient();
  const subscription = useAuthStore(s => s.subscription);
  const hasPdf = !subscription || ['standard', 'premium'].includes(subscription.plan);
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({ queryKey: ['estimates', page], queryFn: () => listEstimates({ page, limit: 20 }) });
  const deleteMut = useMutation({ mutationFn: deleteEstimate, onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['estimates'] }); }, onError: (e: Error) => toast.error(e.message) });

  async function handlePDF(id: string, num: string) {
    if (!hasPdf) { toast.error('PDF requires Standard plan'); return; }
    try { downloadBlob(await downloadEstimatePDF(id), `estimate-${num}.pdf`); } catch (e: unknown) { toast.error((e as Error).message); }
  }

  async function handleMarkSent(id: string) {
    try { await markEstimateSent(id); toast.success('Marked as sent'); qc.invalidateQueries({ queryKey: ['estimates'] }); }
    catch (e: unknown) { toast.error((e as Error).message); }
  }

  return (
    <div className="p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Estimates</h2>
        <Link to="/estimates/new"><Button size="sm">+ New Estimate</Button></Link>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['Number', 'Customer', 'Status', 'Total', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>)}</tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>}
            {!isLoading && !data?.docs?.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No estimates.</td></tr>}
            {data?.docs?.map(est => {
              const c = typeof est.customer === 'object' ? est.customer : null;
              return (
                <tr key={est._id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium"><Link to={`/estimates/${est._id}`} className="text-[var(--brand-primary)] hover:underline">{est.estimateNumber}</Link></td>
                  <td className="px-4 py-3">{c ? `${c.firstName} ${c.lastName}` : 'Unknown'}</td>
                  <td className="px-4 py-3"><Badge color={statusColor[est.status] ?? 'gray'}>{est.status}</Badge></td>
                  <td className="px-4 py-3 font-medium">{est.total?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link to={`/estimates/${est._id}/edit`}><Button variant="ghost" size="sm">Edit</Button></Link>
                      <Button variant="ghost" size="sm" onClick={() => handleMarkSent(est._id)}>Mark Sent</Button>
                      <Button variant="ghost" size="sm" onClick={() => handlePDF(est._id, est.estimateNumber)}>PDF</Button>
                      <Button variant="danger" size="sm" onClick={() => { if (confirm('Delete?')) deleteMut.mutate(est._id); }}>Del</Button>
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
