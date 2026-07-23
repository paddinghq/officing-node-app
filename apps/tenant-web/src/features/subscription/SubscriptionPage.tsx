import { useQuery } from '@tanstack/react-query';
import { getSubscription } from '@officing/api-client';
import { Btn, SCard, SBadge, PageShell } from '../../components/ui/index';
import { Spinner } from '@heroui/react';
import { CreditCard, ArrowUpFromSquare, CircleCheck } from '@gravity-ui/icons';

const PLAN_COLOR: Record<string, 'neutral' | 'info' | 'brand' | 'success'> = {
  free: 'neutral', basic: 'info', standard: 'brand', premium: 'success',
};

const PLAN_FEATURES: Record<string, string[]> = {
  free:     ['Basic invoicing', 'Up to 5 customers', 'Email support'],
  basic:    ['Unlimited invoices', 'Bills management', 'Estimates', 'CSV exports'],
  standard: ['Everything in Basic', 'PDF exports', 'Reports & analytics', 'CRM module', 'Dashboard'],
  premium:  ['Everything in Standard', 'Priority support', 'Advanced analytics', 'API access'],
};

export function SubscriptionPage() {
  const { data, isLoading } = useQuery({ queryKey: ['subscription-detail'], queryFn: getSubscription });
  const sub = data?.subscription;

  if (isLoading) return <div className="flex items-center justify-center p-16"><Spinner /></div>;

  return (
    // Added a maxWidth to prevent the cards from stretching too far on large screens
    <PageShell title="Subscription" subtitle="Manage your billing plan and features." maxWidth="max-w-5xl">
      
      {/* Changed to CSS Grid. items-start prevents the right card from stretching to match the left card's height */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        
        <SCard title="Current plan">
          {sub ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="rounded-xl p-2.5 shrink-0"
                    style={{ background: 'color-mix(in srgb, var(--brand-primary) 12%, transparent)', color: 'var(--brand-primary)' }}
                  >
                    <CreditCard width={18} height={18} />
                  </div>
                  <div>
                    <p className="font-semibold capitalize leading-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
                      {sub.plan} plan
                    </p>
                    <p className="text-xs capitalize mt-0.5" style={{ color: 'var(--muted)' }}>{sub.billingCycle} billing</p>
                  </div>
                </div>
                <SBadge color={sub.accessActive ? 'success' : 'danger'}>
                  {sub.accessActive ? 'Active' : 'Expired'}
                </SBadge>
              </div>

              {sub.subExpDate && (
                <div className="rounded-xl p-3" style={{ background: 'var(--surface-secondary)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--muted)' }}>Expires</p>
                  <p className="font-mono text-sm" style={{ color: 'var(--foreground)' }}>
                    {new Date(sub.subExpDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Features */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>Included features</p>
                <ul className="space-y-3">
                  {(PLAN_FEATURES[sub.plan] ?? PLAN_FEATURES.free).map(feat => (
                    // Changed to items-start so checkmarks align properly if text wraps on small screens
                    <li key={feat} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--foreground)' }}>
                      <CircleCheck width={16} height={16} style={{ color: '#16a34a', flexShrink: 0, marginTop: '2px' }} />
                      <span className="leading-tight">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No subscription data available.</p>
          )}
        </SCard>

        <SCard title="Upgrade or renew">
          <div className="space-y-4">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              Subscription changes are handled offline. Contact support to upgrade your plan, renew, or switch billing cycles.
            </p>
            <Btn onClick={() => window.location.href = 'mailto:support@officing.app'}>
              <ArrowUpFromSquare width={14} height={14} /> Contact support
            </Btn>
          </div>
        </SCard>
        
      </div>
    </PageShell>
  );
}