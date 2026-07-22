import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listActivities, createActivity, updateActivity } from '@officing/api-client';
import type { ActivityRelatedKind, ActivityType } from '@officing/api-client';
import { Btn, SCard } from '../ui/index';
import { Field } from '../ui/Field';
import {
  Comment, Smartphone, Envelope, Calendar, CircleCheck,
  SquareCheck, ArrowsRotateLeft, Plus,
} from '@gravity-ui/icons';
import { Spinner } from '@heroui/react';

interface Props { kind: ActivityRelatedKind; id: string; }

const TYPE_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: 'note',    label: 'Note'    },
  { value: 'call',    label: 'Call'    },
  { value: 'email',   label: 'Email'   },
  { value: 'meeting', label: 'Meeting' },
  { value: 'task',    label: 'Task'    },
];

function ActivityIcon({ type }: { type: ActivityType }) {
  const ICO: Record<ActivityType, React.ComponentType<{ width?: number; height?: number }>> = {
    note: Comment, call: Smartphone, email: Envelope, meeting: Calendar,
    task: SquareCheck, status_change: ArrowsRotateLeft,
  };
  const Icon = ICO[type] ?? StickyNote;
  return (
    <div
      className="shrink-0 rounded-xl p-2 mt-0.5"
      style={{ background: 'color-mix(in srgb, var(--brand-primary) 10%, transparent)', color: 'var(--brand-primary)' }}
    >
      <Icon width={13} height={13} />
    </div>
  );
}

export function ActivityTimeline({ kind, id }: Props) {
  const qc = useQueryClient();
  const [type, setType]   = useState<ActivityType>('note');
  const [body, setBody]   = useState('');
  const [dueAt, setDueAt] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['crm-activities', kind, id], queryFn: () => listActivities(kind, id, { limit: 50 }) });

  const addMut = useMutation({
    mutationFn: () => createActivity({ type, relatedTo: { kind, id }, body, ...(type === 'task' && dueAt ? { dueAt: new Date(dueAt).toISOString() } : {}) }),
    onSuccess: () => { toast.success('Activity added'); setBody(''); setDueAt(''); qc.invalidateQueries({ queryKey: ['crm-activities', kind, id] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const completeMut = useMutation({
    mutationFn: (actId: string) => updateActivity(actId, { completedAt: new Date().toISOString() }),
    onSuccess: () => { toast.success('Task completed'); qc.invalidateQueries({ queryKey: ['crm-activities', kind, id] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <SCard title="Activity">
      {/* Compose */}
      <form onSubmit={e => { e.preventDefault(); if (body.trim()) addMut.mutate(); }} className="space-y-3 mb-5">
        <div className="flex gap-2 items-center flex-wrap">
          <Field.Select
            options={TYPE_OPTIONS}
            value={type}
            onChange={e => setType(e.target.value as ActivityType)}
            className="w-36"
          />
          {type === 'task' && (
            <Field type="date" value={dueAt} onChange={e => setDueAt(e.target.value)} className="w-40" label="" />
          )}
        </div>
        <Field.Textarea
          rows={2}
          placeholder="Add a note, call log, task…"
          value={body}
          onChange={e => setBody(e.target.value)}
        />
        <Btn type="submit" size="sm" loading={addMut.isPending}>
          <Plus width={13} height={13} /> Add
        </Btn>
      </form>

      {/* Timeline */}
      {isLoading && <div className="flex justify-center py-4"><Spinner /></div>}
      {!isLoading && !data?.docs?.length && (
        <p className="text-sm text-center py-4" style={{ color: 'var(--muted)' }}>No activity recorded yet.</p>
      )}

      <div className="space-y-3">
        {data?.docs?.map(a => (
          <div
            key={a._id}
            className="flex items-start gap-3 pb-3"
            style={{ borderBottom: '1px solid var(--separator)' }}
          >
            <ActivityIcon type={a.type} />
            <div className="flex-1 min-w-0">
              <p className="text-sm" style={{ color: 'var(--foreground)' }}>{a.body}</p>
              <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--muted)' }}>
                {new Date(a.createdAt).toLocaleString()}
                {a.dueAt && ` · Due ${new Date(a.dueAt).toLocaleDateString()}`}
                {a.completedAt && ' · Completed'}
              </p>
            </div>
            {a.type === 'task' && !a.completedAt && (
              <Btn variant="ghost" size="sm" loading={completeMut.isPending} onClick={() => completeMut.mutate(a._id)}>
                <CircleCheck width={13} height={13} /> Complete
              </Btn>
            )}
          </div>
        ))}
      </div>
    </SCard>
  );
}
