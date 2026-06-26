import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSubscription } from '@officing/api-client';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

const planColor: Record<string, 'gray' | 'blue' | 'purple' | 'green'> = {
  free: 'gray', basic: 'blue', standard: 'purple', premium: 'green',
};

export function SubscriptionPage() {
  const { data, isLoading } = useQuery({ queryKey: ['subscription-detail'], queryFn: getSubscription });
  const sub = data?.subscription;
  if (isLoading) return <div className="p-8 text-gray-400">Loading…</div>;
  return (
    <div className="p-8 max-w-md space-y-6">
      <h2 className="text-xl font-semibold">Subscription</h2>
      <Card>
        {sub ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between"><span className="text-gray-600">Plan</span><Badge color={planColor[sub.plan] ?? 'gray'}>{sub.plan.toUpperCase()}</Badge></div>
            <div className="flex items-center justify-between"><span className="text-gray-600">Status</span><Badge color={sub.accessActive ? 'green' : 'red'}>{sub.accessActive ? 'Active' : 'Expired'}</Badge></div>
            {sub.subExpDate && <div className="flex items-center justify-between"><span className="text-gray-600">Expires</span><span className="font-medium">{new Date(sub.subExpDate).toLocaleDateString()}</span></div>}
            <div className="flex items-center justify-between"><span className="text-gray-600">Billing Cycle</span><span className="font-medium capitalize">{sub.billingCycle}</span></div>
          </div>
        ) : <p className="text-gray-400">No subscription data.</p>}
      </Card>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        Subscription changes are handled offline. Contact <a href="mailto:support@officing.app" className="underline font-medium">support@officing.app</a> to upgrade or renew.
      </div>
    </div>
  );
}
