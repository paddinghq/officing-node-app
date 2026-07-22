import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { getKpiSummary, getKpiFunnel, getKpiPipeline, getKpiLeaderboard } from '@officing/api-client';
import { useAuthStore } from '../../store/auth';
import { Btn, SCard, PageShell, PlanGate, SBadge } from '../../components/ui/index';
import { Field } from '../../components/ui/Field';
import { Skeleton } from '@heroui/react';

function today()       { return new Date().toISOString().slice(0, 10); }
function monthStart()  { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); }
function quarterStart(){ const d = new Date(); const q = Math.floor(d.getMonth() / 3) * 3; d.setMonth(q, 1); return d.toISOString().slice(0, 10); }
function yearStart()   { const d = new Date(); d.setMonth(0, 1); return d.toISOString().slice(0, 10); }

type Period = 'month' | 'quarter' | 'year' | 'custom';

function fmtN(n: number) { return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n); }

function KpiTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border p-4 flex flex-col gap-2" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{label}</p>
      <p className="text-xl font-bold tabular-nums" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>{value}</p>
      {sub && <p className="text-xs" style={{ color: 'var(--muted)' }}>{sub}</p>}
    </div>
  );
}

const CHART_STYLE = { background: 'var(--overlay)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12, color: 'var(--foreground)' };
const TICK = { fontSize: 11, fill: 'var(--muted)' } as React.SVGProps<SVGTextElement>;

export function CrmDashboardPage() {
  const subscription = useAuthStore(s => s.subscription);
  const primaryColor = useAuthStore(s => s.primaryColor);
  const hasCrm = !subscription || ['standard', 'premium'].includes(subscription.plan);
  const [period, setPeriod]     = useState<Period>('month');
  const [customFrom, setCF]     = useState(monthStart());
  const [customTo, setCT]       = useState(today());
  const [compare, setCompare]   = useState(false);

  const from = period === 'month' ? monthStart() : period === 'quarter' ? quarterStart() : period === 'year' ? yearStart() : customFrom;
  const to   = period === 'custom' ? customTo : today();

  const summaryQ    = useQuery({ queryKey: ['crm-kpi-summary', from, to, compare],  queryFn: () => getKpiSummary(from, to, compare), enabled: hasCrm });
  const funnelQ     = useQuery({ queryKey: ['crm-kpi-funnel', from, to],            queryFn: () => getKpiFunnel(from, to),           enabled: hasCrm });
  const pipelineQ   = useQuery({ queryKey: ['crm-kpi-pipeline'],                    queryFn: getKpiPipeline,                         enabled: hasCrm });
  const leaderboardQ = useQuery({ queryKey: ['crm-kpi-leaderboard', from, to],
    queryFn: async () => {
      try { return await getKpiLeaderboard(from, to); } catch (e) { if ((e as { status?: number }).status === 403) return null; throw e; }
    }, enabled: hasCrm });

  const summary    = summaryQ.data?.data;
  const funnel     = funnelQ.data?.data;
  const pipeline   = pipelineQ.data?.data;
  const leaderboard = leaderboardQ.data?.data;

  const PERIODS: { key: Period; label: string }[] = [
    { key: 'month', label: 'This month' }, { key: 'quarter', label: 'This quarter' },
    { key: 'year',  label: 'This year' },  { key: 'custom',  label: 'Custom' },
  ];

  return (
    <PlanGate allowed={hasCrm} feature="CRM Dashboard">
      <PageShell title="CRM Dashboard" subtitle="Performance metrics, pipeline health, and team leaderboard.">
        {/* Period picker */}
        <div className="flex flex-wrap items-center gap-2">
          {PERIODS.map(p => (
            <Btn key={p.key} size="sm" variant={period === p.key ? 'brand' : 'secondary'} onClick={() => setPeriod(p.key)}>
              {p.label}
            </Btn>
          ))}
          {period === 'custom' && (
            <>
              <Field label="" type="date" value={customFrom} onChange={e => setCF(e.target.value)} className="w-36" />
              <Field label="" type="date" value={customTo}   onChange={e => setCT(e.target.value)} className="w-36" />
            </>
          )}
          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--foreground)' }}>
            <input type="checkbox" checked={compare} onChange={e => setCompare(e.target.checked)} style={{ accentColor: 'var(--brand-primary)' }} />
            Compare to previous period
          </label>
        </div>

        {/* KPI grid */}
        {summaryQ.isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        ) : summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <KpiTile label="Leads created"        value={fmtN(summary.leadsCreated)} />
            <KpiTile label="Lead → prospect rate"  value={`${summary.leadToProspectRate.toFixed(1)}%`} />
            <KpiTile label="Prospect → deal rate"  value={`${summary.prospectToDealRate.toFixed(1)}%`} />
            <KpiTile label="Win rate"              value={`${summary.winRate.toFixed(1)}%`} />
            <KpiTile label={`Revenue won (${summary.baseCurrency})`} value={fmtN(summary.revenueWon)} sub={summary.comparison ? `${summary.comparison.revenueChange >= 0 ? '+' : ''}${fmtN(summary.comparison.revenueChange)} vs prev` : undefined} />
            <KpiTile label="Pipeline value"        value={fmtN(summary.pipelineValue)} />
            <KpiTile label="Weighted pipeline"     value={fmtN(summary.weightedPipeline)} />
            <KpiTile label="Avg deal size"         value={fmtN(summary.averageDealSize)} />
            <KpiTile label="Rotting deals"         value={fmtN(summary.rottingDealsCount)} />
            <KpiTile label="Follow-ups due"        value={fmtN(summary.followUpsDueCount)} />
            <KpiTile label="Overdue tasks"         value={fmtN(summary.overdueTasksCount)} />
            {summary.revenueTarget && (
              <KpiTile
                label={`Target (${summary.revenueTarget.period})`}
                value={`${fmtN(summary.revenueWon)} / ${fmtN(summary.revenueTarget.amount)}`}
              />
            )}
          </div>
        )}

        {/* Funnel chart */}
        {funnel && (
          <SCard title="Lead funnel">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={funnel.stages} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--separator)" vertical={false} />
                <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} />
                <YAxis tick={TICK} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CHART_STYLE} />
                <Bar dataKey="count" fill={primaryColor || 'var(--brand-primary)'} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </SCard>
        )}

        {/* Pipeline by stage */}
        {pipeline && (
          <SCard title="Pipeline by stage">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={pipeline.byStage} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--separator)" vertical={false} />
                <XAxis dataKey="_id" tick={TICK} axisLine={false} tickLine={false} />
                <YAxis tick={TICK} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CHART_STYLE} />
                <Bar dataKey="totalValue" name="Total value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {pipeline.topLossReasons.length > 0 && (
              <div className="mt-4" style={{ borderTop: '1px solid var(--separator)', paddingTop: '1rem' }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>Top loss reasons</p>
                <div className="flex flex-wrap gap-2">
                  {pipeline.topLossReasons.map(r => (
                    <SBadge key={r._id} color="danger">{r._id}: {r.count}</SBadge>
                  ))}
                </div>
              </div>
            )}
          </SCard>
        )}

        {/* Leaderboard */}
        {leaderboard && (
          <SCard title="Team leaderboard">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--separator)' }}>
                    {['Rep', 'Deals won', `Revenue (${leaderboard.baseCurrency})`, 'Leads handled'].map(h => (
                      <th key={h} className="pb-2 text-left text-xs font-semibold uppercase tracking-wide pr-4" style={{ color: 'var(--muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.entries.map(e => (
                    <tr key={e.userId} style={{ borderBottom: '1px solid var(--separator)' }}>
                      <td className="py-2.5 pr-4 font-medium" style={{ color: 'var(--foreground)' }}>{e.name}</td>
                      <td className="py-2.5 pr-4 tabular-nums">{e.dealsWon}</td>
                      <td className="py-2.5 pr-4 tabular-nums font-semibold" style={{ color: 'var(--brand-primary)' }}>{fmtN(e.revenue)}</td>
                      <td className="py-2.5 tabular-nums">{e.leadsHandled}</td>
                    </tr>
                  ))}
                  {leaderboard.entries.length === 0 && (
                    <tr><td colSpan={4} className="py-8 text-center" style={{ color: 'var(--muted)' }}>No wins recorded in this period.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </SCard>
        )}
      </PageShell>
    </PlanGate>
  );
}
