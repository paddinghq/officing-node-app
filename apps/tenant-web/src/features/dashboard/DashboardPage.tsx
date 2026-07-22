import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { getDashboard } from '@officing/api-client';
import { useAuthStore } from '../../store/auth';
import { Skeleton } from '@heroui/react';
import {
  ArrowUp,
  ArrowDown,
  TriangleExclamation,
  ChartLine,
  CircleDollar,
  FileDollar,
  FileExclamation,
} from '@gravity-ui/icons';

function fmt(n: number | undefined) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

function fmtFull(n: number | undefined) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  accentColor?: string;
  isLoading?: boolean;
}

function KpiCard({ label, value, icon, trend, trendLabel, accentColor = 'var(--brand-primary)', isLoading }: KpiCardProps) {
  return (
    <div
      className="rounded-2xl border p-5 flex flex-col gap-4"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between">
        <div
          className="rounded-xl p-2.5"
          style={{ background: `color-mix(in srgb, ${accentColor} 12%, transparent)`, color: accentColor }}
        >
          {icon}
        </div>
        {trend && trendLabel && (
          <span
            className="flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5"
            style={{
              background: trend === 'up' ? 'rgba(22,163,74,0.1)' : trend === 'down' ? 'rgba(220,38,38,0.1)' : 'var(--surface-secondary)',
              color: trend === 'up' ? '#16a34a' : trend === 'down' ? '#dc2626' : 'var(--muted)',
            }}
          >
            {trend === 'up' ? <ArrowUp width={11} height={11} /> : trend === 'down' ? <ArrowDown width={11} height={11} /> : null}
            {trendLabel}
          </span>
        )}
      </div>
      {isLoading ? (
        <Skeleton className="h-8 w-28 rounded-xl" />
      ) : (
        <div>
          <p
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
          >
            {value}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {label}
          </p>
        </div>
      )}
    </div>
  );
}

const DURATION_OPTIONS = [
  { value: 3,  label: '3 months' },
  { value: 6,  label: '6 months' },
  { value: 12, label: '12 months' },
];

export function DashboardPage() {
  const subscription = useAuthStore(s => s.subscription);
  const primaryColor = useAuthStore(s => s.primaryColor);
  const hasReports = !subscription || ['standard', 'premium'].includes(subscription.plan);
  const [duration, setDuration] = useState(6);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', duration],
    queryFn: () => getDashboard(duration),
    enabled: hasReports,
  });

  if (!hasReports) {
    return (
      <div className="p-6 sm:p-8">
        <div
          className="rounded-2xl border p-8 text-center"
          style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.25)' }}
        >
          <TriangleExclamation width={32} height={32} style={{ color: '#d97706', margin: '0 auto 12px' }} />
          <p className="font-semibold" style={{ color: '#d97706' }}>
            Dashboard is available on Standard plan and above.
          </p>
          <a
            href="mailto:support@officing.app"
            className="text-sm mt-2 inline-block hover:underline"
            style={{ color: 'var(--brand-primary)' }}
          >
            Contact support to upgrade
          </a>
        </div>
      </div>
    );
  }

  const d = data?.data;
  const chartData = d?.chartData as Array<{ month: string; inflow: number; outflow: number; profit: number }> | undefined;

  return (
    <div className="p-5 sm:p-8 space-y-6 max-w-7xl">
      {/* Page header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            className="text-2xl font-semibold tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
          >
            Dashboard
          </h2>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Financial overview and performance metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {DURATION_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => setDuration(o.value)}
              className="rounded-xl px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: duration === o.value ? 'var(--brand-primary)' : 'var(--surface-secondary)',
                color: duration === o.value ? '#fff' : 'var(--muted)',
                border: `1px solid ${duration === o.value ? 'var(--brand-primary)' : 'var(--border)'}`,
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total inflow"
          value={fmt(d?.totalInflow as number)}
          icon={<ArrowUp width={18} height={18} />}
          accentColor="#16a34a"
          isLoading={isLoading}
        />
        <KpiCard
          label="Total outflow"
          value={fmt(d?.totalOutflow as number)}
          icon={<ArrowDown width={18} height={18} />}
          accentColor="#dc2626"
          isLoading={isLoading}
        />
        <KpiCard
          label="Net profit"
          value={fmt(d?.profit as number)}
          icon={<ChartLine width={18} height={18} />}
          accentColor={primaryColor || 'var(--brand-primary)'}
          isLoading={isLoading}
        />
        <KpiCard
          label="Overdue amount"
          value={fmt(d?.overdueAmount as number)}
          icon={<FileExclamation width={18} height={18} />}
          accentColor="#d97706"
          isLoading={isLoading}
        />
      </div>

      {/* Cash flow chart */}
      {isLoading ? (
        <Skeleton className="h-72 w-full rounded-2xl" />
      ) : chartData && chartData.length > 0 ? (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3 px-6 py-5" style={{ borderBottom: '1px solid var(--separator)' }}>
            <CircleDollar width={18} height={18} style={{ color: 'var(--brand-primary)' }} />
            <div>
              <h3
                className="text-base font-semibold"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
              >
                Cash flow
              </h3>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Inflow vs outflow over the last {duration} months
              </p>
            </div>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--separator)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: 'var(--muted)' } as React.SVGProps<SVGTextElement>}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => fmt(v)}
                  tick={{ fontSize: 11, fill: 'var(--muted)' } as React.SVGProps<SVGTextElement>}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v: number) => fmtFull(v)}
                  contentStyle={{
                    background: 'var(--overlay)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    fontSize: 12,
                    color: 'var(--foreground)',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: 'var(--muted)' }}
                />
                <Area
                  type="monotone"
                  dataKey="inflow"
                  stroke="#16a34a"
                  strokeWidth={2}
                  fill="url(#inflowGrad)"
                  name="Inflow"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Area
                  type="monotone"
                  dataKey="outflow"
                  stroke="#dc2626"
                  strokeWidth={2}
                  fill="url(#outflowGrad)"
                  name="Outflow"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        !isLoading && (
          <div
            className="rounded-2xl border p-10 text-center"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <FileDollar width={36} height={36} style={{ color: 'var(--muted)', margin: '0 auto 8px', opacity: 0.5 }} />
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              No chart data available yet. Create invoices and expenses to see your cash flow.
            </p>
          </div>
        )
      )}
    </div>
  );
}
