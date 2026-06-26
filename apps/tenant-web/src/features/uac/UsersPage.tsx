import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listUsers, inviteUser, removeUser, listRoles } from '@officing/api-client';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Link } from 'react-router-dom';

export function UsersPage() {
  const qc = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', roleId: '' });
  const [loading, setLoading] = useState(false);

  const { data: users } = useQuery({ queryKey: ['users'], queryFn: listUsers });
  const { data: roles } = useQuery({ queryKey: ['roles'], queryFn: listRoles });
  const removeMut = useMutation({ mutationFn: removeUser, onSuccess: () => { toast.success('Removed'); qc.invalidateQueries({ queryKey: ['users'] }); }, onError: (e: Error) => toast.error(e.message) });

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await inviteUser(form);
      toast.success('Invite sent — magic link emailed');
      setInviteOpen(false);
      setForm({ email: '', firstName: '', lastName: '', roleId: '' });
      qc.invalidateQueries({ queryKey: ['users'] });
    } catch (e: unknown) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  }

  const roleOptions = [{ value: '', label: '— Select role —' }, ...(roles?.data ?? []).map(r => ({ value: r._id, label: r.name }))];

  return (
    <div className="p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">People</h2>
        <div className="flex gap-2">
          <Link to="/people/roles"><Button variant="secondary" size="sm">Manage Roles</Button></Link>
          <Button size="sm" onClick={() => setInviteOpen(true)}>+ Invite User</Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>{['Name', 'Email', 'Role', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>)}</tr></thead>
          <tbody>
            {!users?.data?.length && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No users found.</td></tr>}
            {users?.data?.map(u => (
              <tr key={u._id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.firstName} {u.lastName}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3 text-gray-600">{typeof u.role === 'object' ? u.role?.name : 'N/A'}</td>
                <td className="px-4 py-3">
                  <Button variant="danger" size="sm" onClick={() => { if (confirm('Remove user?')) removeMut.mutate(u._id); }}>Remove</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite User">
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name *" required value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
            <Input label="Last Name *" required value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
          </div>
          <Input label="Email *" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <Select label="Role *" options={roleOptions} value={form.roleId} onChange={e => setForm(f => ({ ...f, roleId: e.target.value }))} />
          <p className="text-xs text-gray-500">An invite link will be emailed. No password shown.</p>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" type="button" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button type="submit" loading={loading}>Send Invite</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
