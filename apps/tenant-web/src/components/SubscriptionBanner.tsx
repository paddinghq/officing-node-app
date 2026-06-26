import React from 'react';
import { useAuthStore } from '../store/auth';

export function SubscriptionBanner() {
  const subscription = useAuthStore(s => s.subscription);

  if (!subscription || subscription.accessActive) return null;

  return (
    <div className="bg-red-600 text-white px-4 py-2 text-sm text-center font-medium">
      ⚠️ Your subscription has expired. Some features are restricted.{' '}
      <a href="mailto:support@officing.app" className="underline font-bold">Contact support to renew.</a>
    </div>
  );
}
