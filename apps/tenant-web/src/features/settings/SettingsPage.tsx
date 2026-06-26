import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getFinanceSettings, updateFinanceSettings } from '@officing/api-client';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function SettingsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['finance-settings'], queryFn: getFinanceSettings });
  const [invoicePrefix, setInvoicePrefix] = useState('');
  const [taxRate, setTaxRate] = useState('');
  const [loaded, setLoaded] = useState(false);

  React.useEffect(() => {
    if (data?.data && !loaded) {
      const d = data.data as Record<string, unknown>;
      setInvoicePrefix((d.invoicePrefix as string) ?? '');
      setTaxRate(String((d.taxRate as number) ?? ''));
      setLoaded(true);
    }
  }, [data, loaded]);

  const mutation = useMutation({
    mutationFn: () => updateFinanceSettings('general', { invoicePrefix, taxRate: parseFloat(taxRate) }),
    onSuccess: () => toast.success('Settings saved'),
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="p-8 text-gray-400">Loading…</div>;

  return (
    <div className="p-8 max-w-lg space-y-6">
      <h2 className="text-xl font-semibold">Finance Settings</h2>
      <Card title="General">
        <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <Input label="Invoice Number Prefix" value={invoicePrefix} onChange={e => setInvoicePrefix(e.target.value)} placeholder="INV-" />
          <Input label="Tax Rate (%)" type="number" step="0.01" value={taxRate} onChange={e => setTaxRate(e.target.value)} />
          <Button type="submit" loading={mutation.isPending}>Save Settings</Button>
        </form>
      </Card>
      <Card title="Raw Settings">
        <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">{JSON.stringify(data?.data, null, 2)}</pre>
      </Card>
    </div>
  );
}
