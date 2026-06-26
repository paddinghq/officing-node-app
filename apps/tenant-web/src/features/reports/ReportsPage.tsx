import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getProfitLoss, getARaging, getAPaging, getExpensesByCategory } from '@officing/api-client';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useAuthStore } from '../../store/auth';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function today() { return new Date().toISOString().slice(0, 10); }
function sixMonthsAgo() {
  const d = new Date(); d.setMonth(d.getMonth() - 6);
  return d.toISOString().slice(0, 10);
}

export function ReportsPage() {
  const subscription = useAuthStore(s => s.subscription);
  const hasReports = !subscription || ['standard', 'premium'].includes(subscription.plan);
  const [from, setFrom] = useState(sixMonthsAgo());
  const [to, setTo] = useState(today());

  const plQuery = useQuery({ queryKey: ['report-pl', from, to], queryFn: () => getProfitLoss(from, to), enabled: hasReports });
  const arQuery = useQuery({ queryKey: ['report-ar'], queryFn: getARaging, enabled: hasReports });
  const apQuery = useQuery({ queryKey: ['report-ap'], queryFn: getAPaging, enabled: hasReports });
  const expQuery = useQuery({ queryKey: ['report-exp', from, to], queryFn: () => getExpensesByCategory(from, to), enabled: hasReports });

  if (!hasReports) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold mb-4">Reports</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-yellow-800 font-medium">Reports are available on Standard plan and above.</p>
          <a href="mailto:support@officing.app" className="text-[var(--brand-primary)] underline text-sm mt-2 inline-block">Contact support to upgrade</a>
        </div>
      </div>
    );
  }

  const pl = plQuery.data?.report;
  const ar = arQuery.data?.report;
  const ap = apQuery.data?.report;
  const exp = expQuery.data?.report;

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Reports</h2>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
          <label className="text-sm text-gray-600">To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
        </div>
      </div>

      {/* P&L */}
      <Card title="Profit & Loss">
        {plQuery.isLoading ? <p className="text-gray-400">Loading…</p> : (
          <>
            {pl && (
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-green-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Revenue</p><p className="font-bold text-green-700">{pl.totalRevenue?.toLocaleString() ?? '—'}</p></div>
                <div className="bg-red-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Expenses</p><p className="font-bold text-red-700">{pl.totalExpenses?.toLocaleString() ?? '—'}</p></div>
                <div className="bg-blue-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Net Profit</p><p className="font-bold text-blue-700">{pl.netProfit?.toLocaleString() ?? '—'}</p></div>
              </div>
            )}
            {pl?.months && pl.months.length > 0 && (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={pl.months}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#22c55e" name="Revenue" />
                  <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </>
        )}
      </Card>

      {/* AR / AP aging */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="AR Aging (Receivables)">
          {arQuery.isLoading ? <p className="text-gray-400">Loading…</p> : (
            <>
              <p className="font-bold mb-3">Total Outstanding: {ar?.totalOutstanding?.toLocaleString()}</p>
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Bucket</th><th className="px-3 py-2 text-right">Count</th><th className="px-3 py-2 text-right">Total</th></tr></thead>
                <tbody>
                  {(ar?.buckets ?? []).map((b, i) => (
                    <tr key={i} className="border-t"><td className="px-3 py-2">{b.label}</td><td className="px-3 py-2 text-right">{b.count}</td><td className="px-3 py-2 text-right">{b.total?.toLocaleString()}</td></tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </Card>

        <Card title="AP Aging (Payables)">
          {apQuery.isLoading ? <p className="text-gray-400">Loading…</p> : (
            <>
              <p className="font-bold mb-3">Total Outstanding: {ap?.totalOutstanding?.toLocaleString()}</p>
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Bucket</th><th className="px-3 py-2 text-right">Count</th><th className="px-3 py-2 text-right">Total</th></tr></thead>
                <tbody>
                  {(ap?.buckets ?? []).map((b, i) => (
                    <tr key={i} className="border-t"><td className="px-3 py-2">{b.label}</td><td className="px-3 py-2 text-right">{b.count}</td><td className="px-3 py-2 text-right">{b.total?.toLocaleString()}</td></tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </Card>
      </div>

      {/* Expenses by category */}
      <Card title="Expenses by Category">
        {expQuery.isLoading ? <p className="text-gray-400">Loading…</p> : (
          exp?.categories && exp.categories.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={exp.categories} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {exp.categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => v.toLocaleString()} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400">No expense data for this period.</p>
        )}
      </Card>
    </div>
  );
}
