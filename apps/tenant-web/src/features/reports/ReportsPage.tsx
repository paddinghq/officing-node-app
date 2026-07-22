import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { getProfitLoss, getARaging, getAPaging, getExpensesByCategory } from '@officing/api-client';
import { useAuthStore } from '../../store/auth';
import { Btn, SCard, PageShell, PlanGate } from '../../components/ui/index';
import { Field } from '../../components/ui/Field';
import { Skeleton } from '@heroui/react';

const PALETTE = ['var(--brand-primary)', '#16a34a', '#d97706', '#dc2626', '#8b5cf6', '#06b6d4'];

function today()          { return new Date().toISOString().slice(0, 10); }
function sixMonthsAgo()   { const d = new Date(); d.setMonth(d.getMonth() - 6); return d.toISOString().slice(0, 10); }

function MetricBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--surface-secondary)' }}>
      <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>{label}</p>
      <p className="text-xl font-bold tabular-nums" style={{ fontFamily: 'var(--font-display)', color: color ?? 'var(--foreground)' }}>{value}</p>
    </div>
  );
}

export function ReportsPage() {
  const subscription = useAuthStore(s => s.subscription);
  const primaryColor = useAuthStore(s => s.primaryColor);
  const hasReports   = !subscription || ['standard', 'premium'].includes(subscription.plan);
  const [from, setFrom] = useState(sixMonthsAgo());
  const [to, setTo]     = useState(today());

  const plQuery  = useQuery({ queryKey: ['report-pl', from, to], queryFn: () => getProfitLoss(from, to),    enabled: hasReports });
  const arQuery  = useQuery({ queryKey: ['report-ar'],           queryFn: getARaging,                       enabled: hasReports });
  const apQuery  = useQuery({ queryKey: ['report-ap'],           queryFn: getAPaging,                       enabled: hasReports });
  const expQuery = useQuery({ queryKey: ['report-exp', from, to], queryFn: () => getExpensesByCategory(from, to), enabled: hasReports });

  const colors = [primaryColor || 'var(--brand-primary)', '#16a34a', '#d97706', '#dc2626', '#8b5cf6', '#06b6d4'];

  const CHART_STYLE = {
    background: 'var(--overlay)', border: '1px solid var(--border)', borderRadius: 12,
    fontSize: 12, color: 'var(--foreground)',
  };
  const TICK = { fontSize: 11, fill: 'var(--muted)' } as React.SVGProps<SVGTextElement>;

  return (
    <PlanGate allowed={hasReports} feature="Reports">
      <PageShell title="Reports" subtitle="Financial analytics and aging reports."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Period:</span>
            <Field label="" type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-36" />
            <span className="text-xs" style={{ color: 'var(--muted)' }}>to</span>
            <Field label="" type="date" value={to}   onChange={e => setTo(e.target.value)}   className="w-36" />
          </div>
        }
      >
        {/* Profit & Loss */}
        <SCard title="Profit and loss">
          {plQuery.isLoading ? <Skeleton className="h-40 w-full rounded-xl" /> : (() => {
            const pl = plQuery.data?.report;
            return (
              <>
                {pl && (
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <MetricBox label="Revenue"    value={pl.totalRevenue?.toLocaleString() ?? '—'} color="#16a34a" />
                    <MetricBox label="Expenses"   value={pl.totalExpenses?.toLocaleString() ?? '—'} color="#dc2626" />
                    <MetricBox label="Net profit" value={pl.netProfit?.toLocaleString() ?? '—'} color={primaryColor || undefined} />
                  </div>
                )}
                {pl?.months && pl.months.length > 0 && (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={pl.months} barCategoryGap="25%">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--separator)" vertical={false} />
                      <XAxis dataKey="month" tick={TICK} axisLine={false} tickLine={false} />
                      <YAxis tick={TICK} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={CHART_STYLE} />
                      <Legend wrapperStyle={{ fontSize: 12, color: 'var(--muted)' }} />
                      <Bar dataKey="revenue"  fill="#16a34a" name="Revenue"  radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" fill="#dc2626" name="Expenses" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </>
            );
          })()}
        </SCard>

        {/* AR / AP Aging */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[
            { title: 'AR Aging (Receivables)', query: arQuery },
            { title: 'AP Aging (Payables)',    query: apQuery },
          ].map(({ title, query }) => (
            <SCard key={title} title={title}>
              {query.isLoading ? <Skeleton className="h-32 w-full rounded-xl" /> : (() => {
                const report = query.data?.report;
                return (
                  <>
                    <p className="text-lg font-bold tabular-nums mb-3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
                      Total outstanding: {report?.totalOutstanding?.toLocaleString() ?? '—'}
                    </p>
                    <table className="w-full text-sm">
                      <thead><tr style={{ background: 'var(--surface-secondary)' }}>
                        {['Bucket', 'Count', 'Total'].map(h => <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {(report?.buckets ?? []).map((b, i) => (
                          <tr key={i} style={{ borderTop: '1px solid var(--separator)' }}>
                            <td className="px-3 py-2">{b.label}</td>
                            <td className="px-3 py-2 font-mono text-xs" style={{ color: 'var(--muted)' }}>{b.count}</td>
                            <td className="px-3 py-2 font-semibold tabular-nums">{b.total?.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                );
              })()}
            </SCard>
          ))}
        </div>

        {/* Expenses by category */}
        <SCard title="Expenses by category">
          {expQuery.isLoading ? <Skeleton className="h-52 w-full rounded-xl" /> : (() => {
            const cats = expQuery.data?.report?.categories;
            if (!cats?.length) return <p className="text-sm py-6 text-center" style={{ color: 'var(--muted)' }}>No expense data for this period.</p>;
            return (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={cats} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                    label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {cats.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => v.toLocaleString()} contentStyle={CHART_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 12, color: 'var(--muted)' }} />
                </PieChart>
              </ResponsiveContainer>
            );
          })()}
        </SCard>
      </PageShell>
    </PlanGate>
  );
}
