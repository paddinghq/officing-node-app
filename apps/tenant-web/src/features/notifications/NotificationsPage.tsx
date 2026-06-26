import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listNotifications, markNotificationRead } from '@officing/api-client';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export function NotificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: listNotifications });
  const markMut = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-xl font-semibold">Notifications</h2>
      {isLoading && <p className="text-gray-400">Loading…</p>}
      {!isLoading && !data?.data?.length && <p className="text-gray-400">No notifications.</p>}
      <div className="space-y-2">
        {data?.data?.map(n => (
          <div key={n._id} className={`bg-white border rounded-xl p-4 flex items-start justify-between gap-4 ${!n.isRead ? 'border-[var(--brand-primary)] bg-indigo-50' : 'border-gray-200'}`}>
            <div>
              <p className={`text-sm ${n.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>{n.message}</p>
              <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!n.isRead && <Badge color="blue">New</Badge>}
              {!n.isRead && <Button variant="ghost" size="sm" onClick={() => markMut.mutate(n._id)}>Mark read</Button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
