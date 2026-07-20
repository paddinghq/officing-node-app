import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getKpiSummary, getKpiFunnel, getKpiPipeline, getKpiLeaderboard } from '@officing/api-client';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/auth';

function fmt(n: number) {
  return new Intl.NumberFormat('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function today() { return new Date().toISOString().slice(0, 10); }
function monthStart() { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); }
function quarterStart() { const d = new Date(); const q = Math.floor(d.getMonth() / 3) * 3; d.setMonth(q, 1); return d.toISOString().slice(0, 10); }
function yearStart() { const d = new Date(); d.setMonth(0, 1); return d.toISOString().slice(0, 10); }

type Period = 'month' | 'quarter' | 'year' | 'custom';

export function CrmDashboardPage() {
  const subscription = useAuthStore(s => s.subscription);
  const hasCrm = !subscription || ['standard', 'premium'].includes(subscription.plan);
  const [period, setPeriod] = useState<Period>('month');
  const [customFrom, setCustomFrom] = useState(monthStart());
  const [customTo, setCustomTo] = useState(today());
  const [compare, setCompare] = useState(false);

  const from = period === 'month' ? monthStart() : period === 'quarter' ? quarterStart() : period === 'year' ? yearStart() : customFrom;
  const to = period === 'custom' ? customTo : today();

  const summaryQuery = useQuery({ queryKey: ['crm-kpi-summary', from, to, compare], queryFn: () => getKpiSummary(from, to, compare), enabled: hasCrm });
  const funnelQuery = useQuery({ queryKey: ['crm-kpi-funnel', from, to], queryFn: () => getKpiFunnel(from, to), enabled: hasCrm });
  const pipelineQuery = useQuery({ queryKey: ['crm-kpi-pipeline'], queryFn: getKpiPipeline, enabled: hasCrm });
  const leaderboardQuery = useQuery({
    queryKey: ['crm-kpi-leaderboard', from, to],
    queryFn: async () => {
      try {
        return await getKpiLeaderboard(from, to);
      } catch (e) {
        if ((e as { status?: number }).status === 403) return null;
        throw e;
      }
    },
    enabled: hasCrm,
  });

  if (!hasCrm) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold mb-4">CRM Dashboard</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-yellow-800 font-medium">CRM is available on Standard plan and above.</p>
          <a href="mailto:support@officing.app" className="text-[var(--brand-primary)] underline text-sm mt-2 inline-block">Contact support to upgrade</a>
        </div>
      </div>
    );
  }

  const summary = summaryQuery.data?.data;
  const funnel = funnelQuery.data?.data;
  const pipeline = pipelineQuery.data?.data;
  const leaderboard = leaderboardQuery.data?.data;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-semibold">CRM Dashboard</h2>
        <div className="flex items-center gap-2">
          {(['month', 'quarter', 'year', 'custom'] as Period[]).map(p => (
            <Button key={p} size="sm" variant={period === p ? 'primary' : 'secondary'} onClick={() => setPeriod(p)}>
              {p === 'month' ? 'This Month' : p === 'quarter' ? 'This Quarter' : p === 'year' ? 'This Year' : 'Custom'}
            </Button>
          ))}
          {period === 'custom' && (
            <>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
            </>
          )}
          <label className="flex items-center gap-1.5 text-sm text-gray-600">
            <input type="checkbox" checked={compare} onChange={e => setCompare(e.target.checked)} /> Compare to previous
          </label>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Leads Created', value: fmt(summary.leadsCreated) },
            { label: 'Lead → Prospect Rate', value: `${summary.leadToProspectRate.toFixed(1)}%` },
            { label: 'Prospect → Deal Rate', value: `${summary.prospectToDealRate.toFixed(1)}%` },
            { label: 'Win Rate', value: `${summary.winRate.toFixed(1)}%` },
            { label: `Revenue Won (${summary.baseCurrency})`, value: fmt(summary.revenueWon) },
            { label: 'Pipeline Value', value: fmt(summary.pipelineValue) },
            { label: 'Weighted Pipeline', value: fmt(summary.weightedPipeline) },
            { label: 'Avg Deal Size', value: fmt(summary.averageDealSize) },
            { label: 'Rotting Deals', value: fmt(summary.rottingDealsCount) },
            { label: 'Follow-ups Due', value: fmt(summary.followUpsDueCount) },
            { label: 'Overdue Tasks', value: fmt(summary.overdueTasksCount) },
          ].map(tile => (
            <div key={tile.label} className="bg-white border rounded-lg p-3 shadow-sm">
              <p className="text-xs text-gray-500">{tile.label}</p>
              <p className="font-bold text-lg">{tile.value}</p>
            </div>
          ))}
          {summary.comparison && (
            <div className="bg-white border rounded-lg p-3 shadow-sm col-span-2">
              <p className="text-xs text-gray-500">Revenue vs Previous Period</p>
              <p className={`font-bold text-lg ${summary.comparison.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.comparison.revenueChange >= 0 ? '+' : ''}{fmt(summary.comparison.revenueChange)}
                {summary.comparison.revenueChangePercent != null && ` (${summary.comparison.revenueChangePercent.toFixed(1)}%)`}
              </p>
            </div>
          )}
          {summary.revenueTarget && (
            <div className="bg-white border rounded-lg p-3 shadow-sm col-span-2">
              <p className="text-xs text-gray-500">Target ({summary.revenueTarget.period})</p>
              <p className="font-bold text-lg">{fmt(summary.revenueWon)} / {fmt(summary.revenueTarget.amount)}</p>
            </div>
          )}
        </div>
      )}

      {funnel && (
        <Card title="Funnel">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={funnel.stages}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {pipeline && (
        <Card title="Pipeline by Stage">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={pipeline.byStage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalValue" fill="#8b5cf6" name="Total Value" />
            </BarChart>
          </ResponsiveContainer>
          {pipeline.topLossReasons.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Top Loss Reasons</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {pipeline.topLossReasons.map(r => <li key={r._id}>{r._id}: {r.count}</li>)}
              </ul>
            </div>
          )}
        </Card>
      )}

      {leaderboard && (
        <Card title="Leaderboard">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500"><th className="pb-2">Rep</th><th className="pb-2">Deals Won</th><th className="pb-2">Revenue</th><th className="pb-2">Leads Handled</th></tr></thead>
            <tbody>
              {leaderboard.entries.map(entry => (
                <tr key={entry.userId} className="border-t">
                  <td className="py-2">{entry.name}</td>
                  <td className="py-2">{entry.dealsWon}</td>
                  <td className="py-2">{fmt(entry.revenue)} {leaderboard.baseCurrency}</td>
                  <td className="py-2">{entry.leadsHandled}</td>
                </tr>
              ))}
              {leaderboard.entries.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-gray-400">No wins in this period yet.</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
