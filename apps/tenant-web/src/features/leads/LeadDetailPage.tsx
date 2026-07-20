import React, { useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getLead, qualifyLead, disqualifyLead, dropLead, convertLead, deleteLead } from '@officing/api-client';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { ReasonModal } from '../../components/crm/ReasonModal';
import { ActivityTimeline } from '../../components/crm/ActivityTimeline';

export function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/prospects') ? '/prospects' : '/leads';
  const qc = useQueryClient();
  const [qualifyOpen, setQualifyOpen] = useState(false);
  const [disqualifyOpen, setDisqualifyOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [score, setScore] = useState('');
  const [notes, setNotes] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['crm-lead', id], queryFn: () => getLead(id!), enabled: !!id });
  const lead = data?.data;

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['crm-lead', id] });
    qc.invalidateQueries({ queryKey: ['crm-leads'] });
    qc.invalidateQueries({ queryKey: ['crm-prospects'] });
  }

  const qualifyMut = useMutation({
    mutationFn: () => qualifyLead(id!, { score: score ? Number(score) : undefined, notes: notes || undefined }),
    onSuccess: () => { toast.success('Lead qualified'); setQualifyOpen(false); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const disqualifyMut = useMutation({
    mutationFn: (reason: string) => disqualifyLead(id!, reason),
    onSuccess: () => { toast.success('Lead disqualified'); setDisqualifyOpen(false); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const dropMut = useMutation({
    mutationFn: (reason: string) => dropLead(id!, reason),
    onSuccess: () => { toast.success('Prospect dropped'); setDropOpen(false); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const convertMut = useMutation({
    mutationFn: () => convertLead(id!),
    onSuccess: () => { toast.success('Converted to customer'); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteLead(id!),
    onSuccess: () => { toast.success('Lead deleted'); qc.invalidateQueries({ queryKey: ['crm-leads'] }); qc.invalidateQueries({ queryKey: ['crm-prospects'] }); navigate(basePath); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="p-8 text-gray-400">Loading…</div>;
  if (!lead) return <div className="p-8 text-red-600">Lead not found.</div>;

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate(-1)} className="text-sm text-gray-400 hover:text-gray-600 mb-1">← Back</button>
          <h2 className="text-xl font-semibold">{lead.contact.firstName} {lead.contact.lastName}</h2>
        </div>
        <div className="flex gap-2">
          <Link to={`${basePath}/${id}/edit`}><Button variant="secondary" size="sm">Edit</Button></Link>
          <Button variant="danger" size="sm" onClick={() => { if (confirm('Delete this lead?')) deleteMut.mutate(); }}>Delete</Button>
        </div>
      </div>

      <Card title="Details">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-gray-500">Status</p><Badge color={lead.status === 'qualified' ? 'green' : lead.status === 'disqualified' ? 'red' : 'blue'}>{lead.status}</Badge></div>
          <div><p className="text-gray-500">Source</p><p>{lead.source}</p></div>
          <div><p className="text-gray-500">Email</p><p>{lead.contact.email}</p></div>
          <div><p className="text-gray-500">Phone</p><p>{lead.contact.phoneNumber}</p></div>
          {lead.contact.companyName && <div><p className="text-gray-500">Company</p><p>{lead.contact.companyName}</p></div>}
          <div><p className="text-gray-500">Assigned To</p><p>{typeof lead.assignedTo === 'object' && lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : '—'}</p></div>
          {lead.nextFollowUpAt && <div><p className="text-gray-500">Next Follow-up</p><p>{new Date(lead.nextFollowUpAt).toLocaleDateString()}</p></div>}
          {lead.expectedInterest && <div><p className="text-gray-500">Expected Interest</p><p>{lead.expectedInterest}</p></div>}
          {lead.tags.length > 0 && <div className="col-span-2"><p className="text-gray-500">Tags</p><p>{lead.tags.join(', ')}</p></div>}
          {lead.disqualifiedReason && <div className="col-span-2"><p className="text-gray-500">Disqualified Reason</p><p>{lead.disqualifiedReason}</p></div>}
          {lead.droppedReason && <div className="col-span-2"><p className="text-gray-500">Dropped Reason</p><p>{lead.droppedReason}</p></div>}
          {lead.qualification && <div className="col-span-2"><p className="text-gray-500">Qualification Notes</p><p>{lead.qualification.notes || '—'} {lead.qualification.score != null && `(score: ${lead.qualification.score})`}</p></div>}
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        {(lead.status === 'new' || lead.status === 'contacted') && (
          <>
            <Button size="sm" onClick={() => setQualifyOpen(true)}>Qualify</Button>
            <Button size="sm" variant="danger" onClick={() => setDisqualifyOpen(true)}>Disqualify</Button>
          </>
        )}
        {lead.status === 'qualified' && !lead.convertedCustomerId && (
          <>
            <Link to={`/deals/new?leadId=${id}`}><Button size="sm">Create Deal</Button></Link>
            <Button size="sm" variant="secondary" loading={convertMut.isPending} onClick={() => convertMut.mutate()}>Convert to Customer</Button>
            <Button size="sm" variant="danger" onClick={() => setDropOpen(true)}>Drop</Button>
          </>
        )}
        {lead.convertedCustomerId && <Badge color="green">Converted to customer</Badge>}
      </div>

      <ActivityTimeline kind="lead" id={id!} />

      <Modal open={qualifyOpen} onClose={() => setQualifyOpen(false)} title="Qualify Lead">
        <form onSubmit={e => { e.preventDefault(); qualifyMut.mutate(); }} className="space-y-4">
          <Input label="Score (0-100, optional)" type="number" min="0" max="100" value={score} onChange={e => setScore(e.target.value)} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Notes (optional)</label>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" type="button" onClick={() => setQualifyOpen(false)}>Cancel</Button>
            <Button type="submit" loading={qualifyMut.isPending}>Qualify</Button>
          </div>
        </form>
      </Modal>

      <ReasonModal
        open={disqualifyOpen}
        title="Disqualify Lead"
        actionLabel="Disqualify"
        onClose={() => setDisqualifyOpen(false)}
        onSubmit={reason => disqualifyMut.mutate(reason)}
        loading={disqualifyMut.isPending}
      />

      <ReasonModal
        open={dropOpen}
        title="Drop Prospect"
        actionLabel="Drop"
        onClose={() => setDropOpen(false)}
        onSubmit={reason => dropMut.mutate(reason)}
        loading={dropMut.isPending}
      />
    </div>
  );
}
