import { useQuery } from '@tanstack/react-query';
import { getOverview } from '@officing/api-client';
import { Skeleton } from '@heroui/react';
import {
  OfficeBadge,
  CircleCheck,
  Clock,
  Ban,
  CircleXmark,
  CrownDiamond,
  Star,
  Box,
  ChartLine,
} from '@gravity-ui/icons';

function getPlanIcon(plan: string) {
  const l = plan.toLowerCase();
  if (l === 'enterprise' || l === 'pro') return <CrownDiamond width={16} height={16} />;
  if (l === 'premium' || l === 'plus') return <Star width={16} height={16} />;
  return <Box width={16} height={16} />;
}

const STATUS_CARDS = [
  { key: 'active',       label: 'Active',       icon: CircleCheck, color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
  { key: 'provisioning', label: 'Provisioning', icon: Clock,       color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
  { key: 'suspended',    label: 'Suspended',    icon: Ban,         color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
  { key: 'deactivated',  label: 'Deactivated',  icon: CircleXmark, color: 'var(--muted)', bg: 'var(--surface-secondary)' },
] as const;

const PLAN_COLORS: Record<string, string> = {
  free:     '#6b7280',
  basic:    '#6366f1',
  standard: '#f59e0b',
  premium:  '#16a34a',
};

export function OverviewPage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-overview'], queryFn: getOverview });
  const d = data?.overview;

  return (
    <div className="space-y-8 pb-8">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <h2
          className="text-2xl font-semibold tracking-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
        >
          Platform overview
        </h2>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Real-time metrics and tenant distribution across the system.
        </p>
      </div>

      {/* Hero + status grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">

        {/* Hero stat */}
        <div
          className="relative col-span-1 overflow-hidden rounded-2xl p-6 sm:col-span-2 lg:p-8"
          style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 -top-8 opacity-10"
          >
            <OfficeBadge width={200} height={200} />
          </div>
          <p
            className="text-xs font-semibold uppercase tracking-widest opacity-75"
          >
            Total network tenants
          </p>
          {isLoading ? (
            <Skeleton className="mt-4 h-12 w-24 rounded-lg opacity-30" />
          ) : (
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-5xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                {d?.totalTenants ?? 0}
              </span>
              <span className="text-sm font-medium opacity-70">registered entities</span>
            </div>
          )}
        </div>

        {/* Status cards */}
        {STATUS_CARDS.map(s => {
          const Icon = s.icon;
          const count = (d as Record<string, unknown> | undefined)?.[s.key] as number ?? 0;
          return (
            <div
              key={s.key}
              className="rounded-2xl border p-5 flex flex-col justify-between gap-4"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div
                className="w-fit rounded-xl p-2.5"
                style={{ background: s.bg, color: s.color }}
              >
                <Icon width={18} height={18} />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-7 w-12 rounded-md" />
                ) : (
                  <p
                    className="text-2xl font-bold"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
                  >
                    {count}
                  </p>
                )}
                <p
                  className="mt-0.5 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--muted)' }}
                >
                  {s.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subscription tiers */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3 px-6 py-5" style={{ borderBottom: '1px solid var(--separator)' }}>
          <ChartLine width={18} height={18} style={{ color: 'var(--accent)' }} />
          <div>
            <h3
              className="text-base font-semibold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
            >
              Subscription tiers
            </h3>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Tenant distribution across active billing plans
            </p>
          </div>
        </div>
        <div className="p-6">
          {isLoading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          )}

          {!isLoading && !d?.byPlan && (
            <p className="py-8 text-center text-sm" style={{ color: 'var(--muted)' }}>
              No subscription data available yet.
            </p>
          )}

          {!isLoading && d?.byPlan && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Object.entries(d.byPlan).map(([plan, count]) => {
                const color = PLAN_COLORS[plan] ?? 'var(--accent)';
                return (
                  <div
                    key={plan}
                    className="flex items-center gap-4 rounded-xl border p-4 transition-colors"
                    style={{
                      borderColor: 'var(--border)',
                      background: 'var(--surface-secondary)',
                    }}
                  >
                    <div
                      className="shrink-0 rounded-xl p-3"
                      style={{ background: `${color}18`, color }}
                    >
                      {getPlanIcon(plan)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-sm font-semibold capitalize"
                        style={{ color: 'var(--foreground)' }}
                      >
                        {plan}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>
                        Active accounts
                      </p>
                    </div>
                    <span
                      className="font-mono text-xl font-bold"
                      style={{ color: 'var(--foreground)' }}
                    >
                      {String(count)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
