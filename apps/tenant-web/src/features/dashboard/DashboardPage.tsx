import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getDashboard } from '@officing/api-client';
import { Card } from '../../components/ui/Card';
import { useAuthStore } from '../../store/auth';

function StatCard({ label, value, color = 'gray' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 text-${color}-700`}>{value}</p>
    </div>
  );
}

function fmt(n: number | undefined) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

export function DashboardPage() {
  const subscription = useAuthStore(s => s.subscription);
  const hasReports = !subscription || ['standard', 'premium'].includes(subscription.plan);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => getDashboard(),
    enabled: hasReports,
  });

  if (!hasReports) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-yellow-800 font-medium">Dashboard is available on Standard plan and above.</p>
          <a href="mailto:support@officing.app" className="text-[var(--brand-primary)] underline text-sm mt-2 inline-block">
            Contact support to upgrade
          </a>
        </div>
      </div>
    );
  }

  const d = data?.data;

  return (
    <div className="p-8 space-y-6">
      <h2 className="text-xl font-semibold">Dashboard</h2>

      {isLoading ? (
        <p className="text-gray-400">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Inflow" value={fmt(d?.totalInflow as number)} color="green" />
            <StatCard label="Total Outflow" value={fmt(d?.totalOutflow as number)} color="red" />
            <StatCard label="Net Profit" value={fmt(d?.profit as number)} color="blue" />
            <StatCard label="Overdue Amount" value={fmt(d?.overdueAmount as number)} color="yellow" />
          </div>

          {d?.chartData && Array.isArray(d.chartData) && d.chartData.length > 0 && (
            <Card title="Inflow vs Outflow (6 months)">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={d.chartData as unknown[]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v: number) => fmt(v)} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Bar dataKey="inflow" fill="#22c55e" name="Inflow" />
                  <Bar dataKey="outflow" fill="#ef4444" name="Outflow" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
