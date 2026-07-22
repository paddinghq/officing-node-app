import { useAuthStore } from '../store/auth';
import { TriangleExclamation } from '@gravity-ui/icons';

export function SubscriptionBanner() {
  const subscription = useAuthStore(s => s.subscription);

  if (!subscription || subscription.accessActive) return null;

  return (
    <div
      className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-center"
      style={{ background: 'var(--danger)', color: 'var(--danger-foreground)' }}
    >
      <TriangleExclamation width={15} height={15} />
      Your subscription has expired. Some features are restricted.{' '}
      <a
        href="mailto:support@officing.app"
        className="underline font-bold ml-1 hover:opacity-80"
      >
        Contact support to renew.
      </a>
    </div>
  );
}
