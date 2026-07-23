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

  // Consolidated company profile state
  const [companyForm, setCompanyForm] = useState({
    name: '',
    email: '',
    address: ''
  });
  
  const [companyLoaded, setCompanyLoaded] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      const d = companyData.data as any;
      const c = d.company || d;
      
      setCompanyForm({
        name: c?.name ?? '',
        email: c?.profile?.email ?? c?.email ?? '',
        address: c?.profile?.address ?? c?.address ?? ''
      });
      setCompanyLoaded(true);
    }
  }, [companyData, companyLoaded]);

  const financeMut = useMutation({
    mutationFn: () => updateFinanceSettings('general', { invoicePrefix, taxRate: parseFloat(taxRate) }),
    onSuccess: () => toast.success('Settings saved'),
    onError: (e: any) => toast.error(e.message),
  });

  const companyMut = useMutation({
    mutationFn: () => {
      setErrors({});
      
      const payload = {
        name: companyForm.name,
        profile:{          
          email: companyForm.email,
          address: companyForm.address
        }
      };
      
      return updateCompany({ company: payload });
    },
    onSuccess: () => {
      toast.success('Company profile saved');
      setBranding({ name: companyForm.name || undefined });
    },
    onError: (err: any) => {
      const backendDetails = err?.response?.data?.details || err?.data?.details || err?.details;

      if (Array.isArray(backendDetails)) {
        const newErrors: Record<string, string> = {};
        
        backendDetails.forEach((detail: any) => {
          const fieldKey = detail.context?.key || detail.context?.label;
          if (fieldKey) {
            newErrors[fieldKey] = detail.message.replace(/"/g, ''); 
          }
        });
        
        setErrors(newErrors);
        toast.error('Please fix the errors in the form');
      } else {
        toast.error(err.message || 'Failed to save company profile');
      }
    },
  });

  if (isLoading) return <div className="flex items-center justify-center p-16"><Spinner /></div>;

  return (
    // Increased max-width to 5xl for the grid layout
    <PageShell title="Settings" subtitle="Manage finance preferences and company profile." maxWidth="max-w-5xl">
      
      {/* Added CSS Grid and items-start to prevent vertical stretching */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        
        {/* Finance settings */}
        <SCard title="Finance settings">
          <form onSubmit={e => { e.preventDefault(); financeMut.mutate(); }} className="space-y-4">
            <Field 
              label="Invoice number prefix" 
              value={invoicePrefix} 
              onChange={e => setInvoicePrefix(e.target.value)} 
              placeholder="INV-" 
            />
            <Field 
              label="Tax rate (%)" 
              type="number" 
              step="0.01" 
              value={taxRate} 
              onChange={e => setTaxRate(e.target.value)} 
            />
            <Btn type="submit" loading={financeMut.isPending}>Save settings</Btn>
          </form>
        </SCard>

        {/* Company Profile */}
        <SCard title="Company profile">
          <form onSubmit={e => { e.preventDefault(); companyMut.mutate(); }} className="space-y-4">
            <Field 
              label="Company name" 
              value={companyForm.name} 
              onChange={e => setCompanyForm(prev => ({ ...prev, name: e.target.value }))} 
              error={errors.name} 
            />
            <Field 
              label="Company email" 
              type="email" 
              value={companyForm.email} 
              onChange={e => setCompanyForm(prev => ({ ...prev, email: e.target.value }))} 
              error={errors.email} 
            />
            <Field.Textarea 
              label="Company address" 
              value={companyForm.address} 
              onChange={e => setCompanyForm(prev => ({ ...prev, address: e.target.value }))} 
              placeholder="123 Main St, Lagos" 
              error={errors.address} 
            />
            <Btn type="submit" loading={companyMut.isPending}>Save company profile</Btn>
          </form>
        </SCard>
        
      </div>
    </PageShell>
  );
}