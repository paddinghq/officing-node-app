import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createExpense, updateExpense, getExpense, listExpenseCategories } from '@officing/api-client';
import { Btn, SCard, PageShell } from '../../components/ui/index';
import { Field } from '../../components/ui/Field';

export function ExpenseFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({ amount: '', category: '', expenseDate: '', description: '' });

  const { data: exp }  = useQuery({ queryKey: ['expense', id],       queryFn: () => getExpense(id!),          enabled: isEdit });
  const { data: cats } = useQuery({ queryKey: ['expense-categories'], queryFn: listExpenseCategories });

  useEffect(() => {
    if (exp?.data) {
      const d = exp.data;
      setForm({ amount: String(d.amount ?? ''), category: typeof d.category === 'object' ? d.category._id : (d.category ?? ''), expenseDate: d.expenseDate?.slice(0, 10) ?? '', description: d.description ?? '' });
    }
  }, [exp]);

  const mutation = useMutation({
    mutationFn: () => {
      const body = { amount: parseFloat(form.amount), category: form.category, expenseDate: form.expenseDate, description: form.description };
      return isEdit ? updateExpense(id!, body) : createExpense(body);
    },
    onSuccess: () => { toast.success(isEdit ? 'Updated' : 'Created'); qc.invalidateQueries({ queryKey: ['expenses'] }); navigate('/expenses'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const catOptions = [{ value: '', label: '— Select category —' }, ...(cats?.data ?? []).map(c => ({ value: c._id, label: c.name }))];

  return (
    <PageShell title={isEdit ? 'Edit expense' : 'New expense'} maxWidth="max-w-md">
      <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-5">
        <SCard>
          <div className="space-y-4">
            <Field label="Amount *" type="number" step="0.01" required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            <Field.Select label="Category" options={catOptions} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
            <Field label="Expense date *" type="date" required value={form.expenseDate} onChange={e => setForm(f => ({ ...f, expenseDate: e.target.value }))} />
            <Field label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
        </SCard>
        <div className="flex gap-3">
          <Btn type="submit" loading={mutation.isPending}>{isEdit ? 'Update' : 'Create'}</Btn>
          <Btn type="button" variant="secondary" onClick={() => navigate('/expenses')}>Cancel</Btn>
        </div>
      </form>
    </PageShell>
  );
}
