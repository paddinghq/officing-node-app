import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getCrmSettings, updateCrmSettings } from '@officing/api-client';
import type { PipelineStage } from '@officing/api-client';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { useAuthStore } from '../../store/auth';

export function CrmSettingsPage() {
  const subscription = useAuthStore(s => s.subscription);
  const hasCrm = !subscription || ['standard', 'premium'].includes(subscription.plan);
  const { data, isLoading } = useQuery({ queryKey: ['crm-settings'], queryFn: getCrmSettings, enabled: hasCrm });

  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [baseCurrency, setBaseCurrency] = useState('NGN');
  const [dealRottenAfterDays, setDealRottenAfterDays] = useState('14');
  const [hasTarget, setHasTarget] = useState(false);
  const [targetAmount, setTargetAmount] = useState('');
  const [targetPeriod, setTargetPeriod] = useState<'monthly' | 'quarterly'>('monthly');
  const [captureApiKey, setCaptureApiKey] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (data?.data && !loaded) {
      const s = data.data;
      setStages(s.pipelineStages);
      setBaseCurrency(s.baseCurrency);
      setDealRottenAfterDays(String(s.dealRottenAfterDays));
      if (s.revenueTarget) {
        setHasTarget(true);
        setTargetAmount(String(s.revenueTarget.amount));
        setTargetPeriod(s.revenueTarget.period);
      }
      setCaptureApiKey(s.captureApiKey ?? '');
      setLoaded(true);
    }
  }, [data, loaded]);

  const mutation = useMutation({
    mutationFn: () => updateCrmSettings({
      pipelineStages: stages,
      baseCurrency: baseCurrency.toUpperCase(),
      dealRottenAfterDays: Number(dealRottenAfterDays),
      revenueTarget: hasTarget ? { amount: Number(targetAmount), currency: baseCurrency.toUpperCase(), period: targetPeriod } : null,
      captureApiKey: captureApiKey || undefined,
    }),
    onSuccess: () => toast.success('CRM settings saved'),
    onError: (e: Error) => toast.error(e.message),
  });

  function updateStage(i: number, patch: Partial<PipelineStage>) {
    setStages(s => s.map((stage, idx) => idx === i ? { ...stage, ...patch } : stage));
  }
  function addStage() {
    setStages(s => [...s, { key: '', label: '', order: s.length, defaultProbability: 0 }]);
  }
  function removeStage(i: number) {
    setStages(s => s.filter((_, idx) => idx !== i));
  }

  if (!hasCrm) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold mb-4">CRM Settings</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-yellow-800 font-medium">CRM is available on Standard plan and above.</p>
          <a href="mailto:support@officing.app" className="text-[var(--brand-primary)] underline text-sm mt-2 inline-block">Contact support to upgrade</a>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="p-8 text-gray-400">Loading…</div>;

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <h2 className="text-xl font-semibold">CRM Settings</h2>
      <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-6">
        <Card title="Pipeline Stages">
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
              <span className="col-span-3">Key</span>
              <span className="col-span-3">Label</span>
              <span className="col-span-2">Order</span>
              <span className="col-span-2">Probability</span>
              <span className="col-span-2">Color</span>
            </div>
            {stages.map((stage, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-3"><Input value={stage.key} onChange={e => updateStage(i, { key: e.target.value })} /></div>
                <div className="col-span-3"><Input value={stage.label} onChange={e => updateStage(i, { label: e.target.value })} /></div>
                <div className="col-span-2"><Input type="number" value={stage.order} onChange={e => updateStage(i, { order: Number(e.target.value) })} /></div>
                <div className="col-span-2"><Input type="number" value={stage.defaultProbability} onChange={e => updateStage(i, { defaultProbability: Number(e.target.value) })} /></div>
                <div className="col-span-1"><Input type="color" value={stage.color ?? '#6366f1'} onChange={e => updateStage(i, { color: e.target.value })} /></div>
                <div className="col-span-1"><button type="button" onClick={() => removeStage(i)} className="text-red-400 hover:text-red-600 text-lg">×</button></div>
              </div>
            ))}
            <Button type="button" variant="ghost" size="sm" onClick={addStage}>+ Add Stage</Button>
          </div>
        </Card>

        <Card title="General">
          <div className="space-y-4">
            <Input label="Base Currency" value={baseCurrency} onChange={e => setBaseCurrency(e.target.value)} />
            <Input label="Deal Rotten After (days)" type="number" min="1" value={dealRottenAfterDays} onChange={e => setDealRottenAfterDays(e.target.value)} />
          </div>
        </Card>

        <Card title="Revenue Target">
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={hasTarget} onChange={e => setHasTarget(e.target.checked)} /> Set a company-wide revenue target
            </label>
            {hasTarget && (
              <div className="grid grid-cols-2 gap-3">
                <Input label={`Amount (${baseCurrency})`} type="number" min="0" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} />
                <Select label="Period" options={[{ value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }]} value={targetPeriod} onChange={e => setTargetPeriod(e.target.value as 'monthly' | 'quarterly')} />
              </div>
            )}
          </div>
        </Card>

        <Card title="Public Lead Capture">
          <Input
            label="Capture API Key (optional)"
            value={captureApiKey}
            onChange={e => setCaptureApiKey(e.target.value)}
            helpText="If set, your website must send this as x-crm-capture-key when POSTing to /crm/leads/capture."
          />
        </Card>

        <Button type="submit" loading={mutation.isPending}>Save Settings</Button>
      </form>
    </div>
  );
}
