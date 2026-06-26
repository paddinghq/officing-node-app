import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createExpense, updateExpense, getExpense, listExpenseCategories } from '@officing/api-client';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';

export function ExpenseFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({ amount: '', category: '', expenseDate: '', description: '' });
  const { data: exp } = useQuery({ queryKey: ['expense', id], queryFn: () => getExpense(id!), enabled: isEdit });
  const { data: cats } = useQuery({ queryKey: ['expense-categories'], queryFn: listExpenseCategories });
  useEffect(() => {
    if (exp?.data) {
      const d = exp.data;
      setForm({
        amount: String(d.amount ?? ''),
        category: typeof d.category === 'object' ? d.category._id : (d.category ?? ''),
        expenseDate: d.expenseDate?.slice(0, 10) ?? '',
        description: d.description ?? '',
      });
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
    <div className="p-8 max-w-lg space-y-6">
      <h2 className="text-xl font-semibold">{isEdit ? 'Edit Expense' : 'New Expense'}</h2>
      <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-6">
        <Card>
          <div className="space-y-4">
            <Input label="Amount" type="number" step="0.01" required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            <Select label="Category" options={catOptions} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
            <Input label="Expense Date" type="date" required value={form.expenseDate} onChange={e => setForm(f => ({ ...f, expenseDate: e.target.value }))} />
            <Input label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
        </Card>
        <div className="flex gap-3">
          <Button type="submit" loading={mutation.isPending}>{isEdit ? 'Update' : 'Create'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/expenses')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
