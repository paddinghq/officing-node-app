import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getCrmSettings, updateCrmSettings } from '@officing/api-client';
import type { PipelineStage } from '@officing/api-client';
import { useAuthStore } from '../../store/auth';
import { Btn, SCard, PageShell, PlanGate } from '../../components/ui/index';
import { Field } from '../../components/ui/Field';
import { Plus, Xmark } from '@gravity-ui/icons';

export function CrmSettingsPage() {
  const subscription = useAuthStore(s => s.subscription);
  const hasCrm = !subscription || ['standard', 'premium'].includes(subscription.plan);
  const { data, isLoading } = useQuery({ queryKey: ['crm-settings'], queryFn: getCrmSettings, enabled: hasCrm });

  const [stages, setStages]           = useState<PipelineStage[]>([]);
  const [baseCurrency, setBase]       = useState('NGN');
  const [rottenDays, setRotten]       = useState('14');
  const [hasTarget, setHasTarget]     = useState(false);
  const [targetAmount, setTargetAmt]  = useState('');
  const [targetPeriod, setTargetPer]  = useState<'monthly' | 'quarterly'>('monthly');
  const [captureKey, setCaptureKey]   = useState('');
  const [loaded, setLoaded]           = useState(false);

  useEffect(() => {
    if (data?.data && !loaded) {
      const s = data.data;
      setStages(s.pipelineStages);
      setBase(s.baseCurrency);
      setRotten(String(s.dealRottenAfterDays));
      if (s.revenueTarget) { setHasTarget(true); setTargetAmt(String(s.revenueTarget.amount)); setTargetPer(s.revenueTarget.period); }
      setCaptureKey(s.captureApiKey ?? '');
      setLoaded(true);
    }
  }, [data, loaded]);

  const mutation = useMutation({
    mutationFn: () => updateCrmSettings({
      pipelineStages: stages,
      baseCurrency: baseCurrency.toUpperCase(),
      dealRottenAfterDays: Number(rottenDays),
      revenueTarget: hasTarget ? { amount: Number(targetAmount), currency: baseCurrency.toUpperCase(), period: targetPeriod } : null,
      captureApiKey: captureKey || undefined,
    }),
    onSuccess: () => toast.success('CRM settings saved'),
    onError: (e: Error) => toast.error(e.message),
  });

  function updateStage(i: number, patch: Partial<PipelineStage>) {
    setStages(s => s.map((st, idx) => idx === i ? { ...st, ...patch } : st));
  }

  return (
    <PlanGate allowed={hasCrm} feature="CRM Settings">
      <PageShell title="CRM settings" subtitle="Configure your pipeline, currencies and targets." maxWidth="max-w-2xl">
        <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-5">
          {/* Pipeline stages */}
          <SCard title="Pipeline stages">
            {!isLoading && (
              <>
                <div className="grid grid-cols-12 gap-2 mb-2 px-1">
                  {['Key', 'Label', 'Order', 'Prob.', 'Color', ''].map((h, i) => (
                    <span key={i} className={`text-[11px] font-bold uppercase tracking-wide ${i < 3 ? 'col-span-3' : i === 3 ? 'col-span-2' : i === 4 ? 'col-span-1' : 'col-span-1'}`} style={{ color: 'var(--muted)' }}>{h}</span>
                  ))}
                </div>
                {stages.map((st, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-start mb-2">
                    <div className="col-span-3"><Field value={st.key}   onChange={e => updateStage(i, { key: e.target.value })} /></div>
                    <div className="col-span-3"><Field value={st.label} onChange={e => updateStage(i, { label: e.target.value })} /></div>
                    <div className="col-span-3"><Field type="number" value={st.order} onChange={e => updateStage(i, { order: Number(e.target.value) })} /></div>
                    <div className="col-span-2"><Field type="number" value={st.defaultProbability} onChange={e => updateStage(i, { defaultProbability: Number(e.target.value) })} /></div>
                    <div className="col-span-1">
                      <input type="color" value={st.color ?? '#6366f1'} onChange={e => updateStage(i, { color: e.target.value })} className="w-8 h-8 rounded-lg cursor-pointer border" style={{ borderColor: 'var(--border)' }} />
                    </div>
                    <div className="col-span-1 pt-2">
                      <button type="button" onClick={() => setStages(s => s.filter((_, idx) => idx !== i))} className="rounded-lg p-1" style={{ color: 'var(--muted)' }}>
                        <Xmark width={14} height={14} />
                      </button>
                    </div>
                  </div>
                ))}
                <Btn type="button" variant="ghost" size="sm" onClick={() => setStages(s => [...s, { key: '', label: '', order: s.length, defaultProbability: 0 }])}>
                  <Plus width={13} height={13} /> Add stage
                </Btn>
              </>
            )}
          </SCard>

          {/* General */}
          <SCard title="General">
            <div className="space-y-4">
              <Field label="Base currency" value={baseCurrency} onChange={e => setBase(e.target.value)} />
              <Field label="Deal rotten after (days)" type="number" min="1" value={rottenDays} onChange={e => setRotten(e.target.value)} />
            </div>
          </SCard>

          {/* Revenue target */}
          <SCard title="Revenue target">
            <div className="space-y-4">
              <label className="flex items-center gap-2.5 text-sm cursor-pointer" style={{ color: 'var(--foreground)' }}>
                <input type="checkbox" checked={hasTarget} onChange={e => setHasTarget(e.target.checked)} style={{ accentColor: 'var(--brand-primary)' }} />
                Set a company-wide revenue target
              </label>
              {hasTarget && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label={`Amount (${baseCurrency})`} type="number" min="0" value={targetAmount} onChange={e => setTargetAmt(e.target.value)} />
                  <Field.Select label="Period" options={[{ value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }]} value={targetPeriod} onChange={e => setTargetPer(e.target.value as 'monthly' | 'quarterly')} />
                </div>
              )}
            </div>
          </SCard>

          {/* Lead capture */}
          <SCard title="Public lead capture">
            <Field
              label="Capture API key (optional)"
              value={captureKey}
              onChange={e => setCaptureKey(e.target.value)}
              helpText="If set, your website must send this as x-crm-capture-key when POSTing to /crm/leads/capture."
            />
          </SCard>

          <Btn type="submit" loading={mutation.isPending}>Save settings</Btn>
        </form>
      </PageShell>
    </PlanGate>
  );
}
