import { useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getLead, qualifyLead, disqualifyLead, dropLead, convertLead, deleteLead } from '@officing/api-client';
import { Btn, SBadge, SCard } from '../../components/ui/index';
import { Field } from '../../components/ui/Field';
import { SModal } from '../../components/ui/SModal';
import { ReasonModal } from '../../components/crm/ReasonModal';
import { ActivityTimeline } from '../../components/crm/ActivityTimeline';
import { Spinner } from '@heroui/react';
import { ArrowLeft, Pencil, TrashBin, CircleCheck, CircleXmark, ArrowRightToSquare } from '@gravity-ui/icons';

const STATUS_COLOR: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
  new: 'info', contacted: 'warning', qualified: 'success', disqualified: 'danger',
};

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--muted)' }}>{label}</p>
      <div className="text-sm" style={{ color: 'var(--foreground)' }}>{value}</div>
    </div>
  );
}

export function LeadDetailPage() {
  const { id }       = useParams<{ id: string }>();
  const navigate     = useNavigate();
  const location     = useLocation();
  const basePath     = location.pathname.startsWith('/prospects') ? '/prospects' : '/leads';
  const qc           = useQueryClient();
  const [qualifyOpen, setQualifyOpen]       = useState(false);
  const [disqualifyOpen, setDisqualifyOpen] = useState(false);
  const [dropOpen, setDropOpen]             = useState(false);
  const [score, setScore]                   = useState('');
  const [notes, setNotes]                   = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['crm-lead', id], queryFn: () => getLead(id!), enabled: !!id });
  const lead = data?.data;

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['crm-lead', id] });
    qc.invalidateQueries({ queryKey: ['crm-leads'] });
    qc.invalidateQueries({ queryKey: ['crm-prospects'] });
  }

  const qualifyMut   = useMutation({ mutationFn: () => qualifyLead(id!, { score: score ? Number(score) : undefined, notes: notes || undefined }), onSuccess: () => { toast.success('Qualified'); setQualifyOpen(false); invalidate(); }, onError: (e: Error) => toast.error(e.message) });
  const disqualifyMut = useMutation({ mutationFn: (r: string) => disqualifyLead(id!, r), onSuccess: () => { toast.success('Disqualified'); setDisqualifyOpen(false); invalidate(); }, onError: (e: Error) => toast.error(e.message) });
  const dropMut      = useMutation({ mutationFn: (r: string) => dropLead(id!, r), onSuccess: () => { toast.success('Dropped'); setDropOpen(false); invalidate(); }, onError: (e: Error) => toast.error(e.message) });
  const convertMut   = useMutation({ mutationFn: () => convertLead(id!), onSuccess: () => { toast.success('Converted to customer'); invalidate(); }, onError: (e: Error) => toast.error(e.message) });
  const deleteMut    = useMutation({ mutationFn: () => deleteLead(id!), onSuccess: () => { toast.success('Deleted'); navigate(basePath); }, onError: (e: Error) => toast.error(e.message) });

  if (isLoading) return <div className="flex items-center justify-center p-16"><Spinner /></div>;
  if (!lead)     return <div className="p-8 text-center" style={{ color: 'var(--danger)' }}>Lead not found.</div>;

  return (
    <div className="p-5 sm:p-7 max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => navigate(-1)} className="rounded-xl p-1.5" style={{ color: 'var(--muted)' }}><ArrowLeft width={18} height={18} /></button>
          <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
            {lead.contact.firstName} {lead.contact.lastName}
          </h1>
          <SBadge color={STATUS_COLOR[lead.status] ?? 'neutral'}>{lead.status}</SBadge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`${basePath}/${id}/edit`}><Btn variant="secondary" size="sm"><Pencil width={13} height={13} /> Edit</Btn></Link>
          <Btn variant="danger-soft" size="sm" onClick={() => { if (confirm('Delete lead?')) deleteMut.mutate(); }}><TrashBin width={13} height={13} /></Btn>
        </div>
      </div>

      <SCard title="Lead details">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Detail label="Email"      value={lead.contact.email} />
          <Detail label="Phone"      value={lead.contact.phoneNumber} />
          <Detail label="Source"     value={<span className="capitalize">{lead.contact.type}</span>} />
          {lead.contact.companyName && <Detail label="Company" value={lead.contact.companyName} />}
          <Detail label="Assigned to" value={typeof lead.assignedTo === 'object' && lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : '—'} />
          {lead.nextFollowUpAt && <Detail label="Next follow-up" value={new Date(lead.nextFollowUpAt).toLocaleDateString()} />}
          {lead.expectedInterest && <Detail label="Expected interest" value={lead.expectedInterest} />}
          {lead.tags.length > 0 && <Detail label="Tags" value={lead.tags.join(', ')} />}
          {lead.disqualifiedReason && <Detail label="Disqualified reason" value={lead.disqualifiedReason} />}
          {lead.droppedReason      && <Detail label="Dropped reason"      value={lead.droppedReason} />}
          {lead.qualification && <Detail label="Qualification notes" value={`${lead.qualification.notes || '—'} ${lead.qualification.score != null ? `(score: ${lead.qualification.score})` : ''}`} />}
        </div>
      </SCard>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {(lead.status === 'new' || lead.status === 'contacted') && (
          <>
            <Btn size="sm" onClick={() => setQualifyOpen(true)}><CircleCheck width={13} height={13} /> Qualify</Btn>
            <Btn size="sm" variant="danger-soft" onClick={() => setDisqualifyOpen(true)}><CircleXmark width={13} height={13} /> Disqualify</Btn>
          </>
        )}
        {lead.status === 'qualified' && !lead.convertedCustomerId && (
          <>
            <Link to={`/deals/new?leadId=${id}`}><Btn size="sm">Create deal</Btn></Link>
            <Btn size="sm" variant="secondary" loading={convertMut.isPending} onClick={() => convertMut.mutate()}>
              <ArrowRightToSquare width={13} height={13} /> Convert to customer
            </Btn>
            <Btn size="sm" variant="danger-soft" onClick={() => setDropOpen(true)}>Drop</Btn>
          </>
        )}
        {lead.convertedCustomerId && <SBadge color="success">Converted to customer</SBadge>}
      </div>

      <ActivityTimeline kind="lead" id={id!} />

      <SModal open={qualifyOpen} onClose={() => setQualifyOpen(false)} title="Qualify lead" size="sm"
        footer={<div className="flex justify-end gap-2"><Btn variant="secondary" onClick={() => setQualifyOpen(false)}>Cancel</Btn><Btn loading={qualifyMut.isPending} onClick={() => qualifyMut.mutate()}><CircleCheck width={13} height={13} /> Qualify</Btn></div>}
      >
        <div className="space-y-4">
          <Field label="Score (0–100, optional)" type="number" min="0" max="100" value={score} onChange={e => setScore(e.target.value)} />
          <Field.Textarea label="Notes (optional)" rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
      </SModal>

      <ReasonModal open={disqualifyOpen} title="Disqualify lead" actionLabel="Disqualify" onClose={() => setDisqualifyOpen(false)} onSubmit={r => disqualifyMut.mutate(r)} loading={disqualifyMut.isPending} />
      <ReasonModal open={dropOpen} title="Drop prospect" actionLabel="Drop" onClose={() => setDropOpen(false)} onSubmit={r => dropMut.mutate(r)} loading={dropMut.isPending} />
    </div>
  );
}
