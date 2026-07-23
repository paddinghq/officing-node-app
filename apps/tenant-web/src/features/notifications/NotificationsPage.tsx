import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listNotifications, markNotificationRead } from '@officing/api-client';
import { Btn, PageShell, SBadge } from '../../components/ui/index';
import { Spinner } from '@heroui/react';
import { Bell, CircleCheck } from '@gravity-ui/icons';

export function NotificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: listNotifications });
  const markMut = useMutation({ mutationFn: markNotificationRead, onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }), onError: (e: Error) => toast.error(e.message) });

  return (
    <PageShell title="Notifications" subtitle="Stay up to date with your workspace activity.">
      {isLoading && <div className="flex items-center justify-center py-16"><Spinner /></div>}

      {!isLoading && !data?.data?.length && (
        <div className="rounded-2xl border p-12 flex flex-col items-center gap-3 text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="rounded-2xl p-4" style={{ background: 'color-mix(in srgb, var(--brand-primary) 10%, transparent)', color: 'var(--brand-primary)' }}>
            <Bell width={28} height={28} />
          </div>
          <p className="font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>No notifications</p>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>You are all caught up.</p>
        </div>
      )}

      {!isLoading && !!data?.data?.length && (
        <div className="space-y-2">
          {data.data.map(n => (
            <div
              key={n._id}
              className="rounded-2xl border p-4 flex items-start justify-between gap-4 transition-colors"
              style={{
                background: n.isRead ? 'var(--surface)' : 'color-mix(in srgb, var(--brand-primary) 5%, var(--surface))',
                borderColor: n.isRead ? 'var(--border)' : 'color-mix(in srgb, var(--brand-primary) 35%, var(--border))',
              }}
            >
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm ${n.isRead ? '' : 'font-semibold'}`}
                  style={{ color: 'var(--foreground)' }}
                >
                  {n.message}
                </p>
                <p className="text-xs mt-1 font-mono" style={{ color: 'var(--muted)' }}>
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!n.isRead && <SBadge color="brand">New</SBadge>}
                {!n.isRead && (
                  <Btn variant="ghost" size="sm" loading={markMut.isPending} onClick={() => markMut.mutate(n._id)}>
                    <CircleCheck width={14} height={14} /> Mark read
                  </Btn>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
