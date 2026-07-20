import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listActivities, createActivity, updateActivity } from '@officing/api-client';
import type { ActivityRelatedKind, ActivityType } from '@officing/api-client';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';

interface Props {
  kind: ActivityRelatedKind;
  id: string;
}

const TYPE_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: 'note', label: 'Note' },
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'task', label: 'Task' },
];

const TYPE_ICON: Record<ActivityType, string> = {
  note: '📝', call: '📞', email: '✉️', meeting: '📅', task: '✅', status_change: '🔄',
};

export function ActivityTimeline({ kind, id }: Props) {
  const qc = useQueryClient();
  const [type, setType] = useState<ActivityType>('note');
  const [body, setBody] = useState('');
  const [dueAt, setDueAt] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['crm-activities', kind, id],
    queryFn: () => listActivities(kind, id, { limit: 50 }),
  });

  const addMutation = useMutation({
    mutationFn: () => createActivity({
      type,
      relatedTo: { kind, id },
      body,
      ...(type === 'task' && dueAt ? { dueAt: new Date(dueAt).toISOString() } : {}),
    }),
    onSuccess: () => {
      toast.success('Activity added');
      setBody(''); setDueAt('');
      qc.invalidateQueries({ queryKey: ['crm-activities', kind, id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const completeMutation = useMutation({
    mutationFn: (activityId: string) => updateActivity(activityId, { completedAt: new Date().toISOString() }),
    onSuccess: () => {
      toast.success('Task completed');
      qc.invalidateQueries({ queryKey: ['crm-activities', kind, id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    addMutation.mutate();
  }

  return (
    <Card title="Activity">
      <form onSubmit={handleSubmit} className="space-y-3 mb-5">
        <div className="grid grid-cols-3 gap-2">
          <Select
            options={TYPE_OPTIONS}
            value={type}
            onChange={e => setType(e.target.value as ActivityType)}
          />
          {type === 'task' && (
            <input
              type="date"
              value={dueAt}
              onChange={e => setDueAt(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          )}
        </div>
        <textarea
          required
          rows={2}
          placeholder="Add a note, call log, or task…"
          value={body}
          onChange={e => setBody(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent"
        />
        <Button type="submit" size="sm" loading={addMutation.isPending}>Add</Button>
      </form>

      {isLoading && <p className="text-sm text-gray-400">Loading activity…</p>}
      {!isLoading && !data?.docs?.length && <p className="text-sm text-gray-400">No activity yet.</p>}
      <div className="space-y-3">
        {data?.docs?.map(a => (
          <div key={a._id} className="flex items-start gap-3 border-b border-gray-100 pb-3 last:border-0">
            <span className="text-lg shrink-0">{TYPE_ICON[a.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800">{a.body}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(a.createdAt).toLocaleString()}
                {a.dueAt && ` · Due ${new Date(a.dueAt).toLocaleDateString()}`}
                {a.completedAt && ' · Completed'}
              </p>
            </div>
            {a.type === 'task' && !a.completedAt && (
              <Button
                variant="ghost"
                size="sm"
                loading={completeMutation.isPending && completeMutation.variables === a._id}
                onClick={() => completeMutation.mutate(a._id)}
              >
                Complete
              </Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
