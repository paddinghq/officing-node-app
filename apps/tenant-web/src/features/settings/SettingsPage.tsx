import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getFinanceSettings, updateFinanceSettings, getCompany, updateCompany } from '@officing/api-client';
import { useAuthStore } from '../../store/auth';
import { Btn, SCard, PageShell } from '../../components/ui/index';
import { Field } from '../../components/ui/Field';
import { Spinner } from '@heroui/react';

export function SettingsPage() {
  const { setBranding }  = useAuthStore();
  const { data, isLoading } = useQuery({ queryKey: ['finance-settings'], queryFn: getFinanceSettings });
  const { data: companyData } = useQuery({ queryKey: ['company'], queryFn: getCompany });

  const [invoicePrefix, setInvoicePrefix] = useState('');
  const [taxRate,        setTaxRate]       = useState('');
  const [loaded,         setLoaded]        = useState(false);

  // Company branding
  const [companyName,   setCompanyName]   = useState('');
  const [logoUrl,       setLogoUrl]       = useState('');
  const [primaryColor,  setPrimaryColor]  = useState('');
  const [companyLoaded, setCompanyLoaded] = useState(false);

  useEffect(() => {
    if (data?.data && !loaded) {
      const d = data.data as Record<string, unknown>;
      setInvoicePrefix((d.invoicePrefix as string) ?? '');
      setTaxRate(String((d.taxRate as number) ?? ''));
      setLoaded(true);
    }
  }, [data, loaded]);

  useEffect(() => {
    if (companyData?.data && !companyLoaded) {
      const d = companyData.data as Record<string, unknown>;
      setCompanyName((d.name as string) ?? '');
      setLogoUrl((d.logoUrl as string) ?? '');
      setPrimaryColor((d.primaryColor as string) ?? '');
      setCompanyLoaded(true);
    }
  }, [companyData, companyLoaded]);

  const financeMut = useMutation({
    mutationFn: () => updateFinanceSettings('general', { invoicePrefix, taxRate: parseFloat(taxRate) }),
    onSuccess: () => toast.success('Settings saved'),
    onError: (e: Error) => toast.error(e.message),
  });

  const brandingMut = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      if (companyName)  fd.append('name', companyName);
      if (logoUrl)      fd.append('logoUrl', logoUrl);
      if (primaryColor) fd.append('primaryColor', primaryColor);
      return updateCompany(fd);
    },
    onSuccess: () => {
      toast.success('Branding saved');
      setBranding({ primaryColor: primaryColor || undefined, logoUrl: logoUrl || undefined, name: companyName || undefined });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="flex items-center justify-center p-16"><Spinner /></div>;

  return (
    <PageShell title="Settings" subtitle="Manage finance preferences and company branding." maxWidth="max-w-lg">
      {/* Finance settings */}
      <SCard title="Finance settings">
        <form onSubmit={e => { e.preventDefault(); financeMut.mutate(); }} className="space-y-4">
          <Field label="Invoice number prefix" value={invoicePrefix} onChange={e => setInvoicePrefix(e.target.value)} placeholder="INV-" />
          <Field label="Tax rate (%)" type="number" step="0.01" value={taxRate} onChange={e => setTaxRate(e.target.value)} />
          <Btn type="submit" loading={financeMut.isPending}>Save settings</Btn>
        </form>
      </SCard>

      {/* Company branding */}
      <SCard title="Company branding">
        <form onSubmit={e => { e.preventDefault(); brandingMut.mutate(); }} className="space-y-4">
          <Field label="Company name" value={companyName} onChange={e => setCompanyName(e.target.value)} />
          <Field label="Logo URL" type="url" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://…" />
          <div>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Field label="Brand primary color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} placeholder="#6366f1" />
              </div>
              {primaryColor && (
                <div
                  className="h-10 w-10 shrink-0 rounded-xl border shadow-sm"
                  style={{ background: primaryColor, borderColor: 'var(--border)' }}
                />
              )}
            </div>
            <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
              This color will be applied throughout your workspace.
            </p>
          </div>
          <Btn type="submit" loading={brandingMut.isPending}>Save branding</Btn>
        </form>
      </SCard>
    </PageShell>
  );
}
