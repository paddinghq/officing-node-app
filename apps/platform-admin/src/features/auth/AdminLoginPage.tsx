import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminLogin, loadAdminToken } from '@officing/api-client';
import { useAdminStore } from '../../store/auth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const login = useAdminStore(s => s.login);
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await adminLogin(form.email, form.password);
      if (res.success && res.accessToken) {
        login(res.admin, res.accessToken);
        navigate('/admin/overview');
      } else {
        toast.error('Login failed');
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-700">Officing</h1>
          <p className="text-gray-500 mt-1">Platform Administration</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Admin Email" type="email" required autoComplete="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="admin@officing.app" />
            <Input label="Password" type="password" required autoComplete="current-password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            <Button type="submit" loading={loading} className="w-full justify-center" size="lg" style={{ backgroundColor: '#4f46e5' }}>Sign In</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
