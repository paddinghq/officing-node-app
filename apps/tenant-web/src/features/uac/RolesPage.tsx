import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listRoles, createRole, deleteRole } from '@officing/api-client';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Link } from 'react-router-dom';

export function RolesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const { data: roles } = useQuery({ queryKey: ['roles'], queryFn: listRoles });
  const createMut = useMutation({
    mutationFn: () => createRole({ name, permissions: [] }),
    onSuccess: () => { toast.success('Role created'); qc.invalidateQueries({ queryKey: ['roles'] }); setOpen(false); setName(''); },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteMut = useMutation({ mutationFn: deleteRole, onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['roles'] }); }, onError: (e: Error) => toast.error(e.message) });

  return (
    <div className="p-8 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/people" className="text-gray-400 hover:text-gray-600">← People</Link>
          <h2 className="text-xl font-semibold">Roles</h2>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>+ New Role</Button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {roles?.data?.map(r => (
          <div key={r._id} className="flex items-center justify-between px-6 py-4 border-b last:border-0">
            <p className="font-medium">{r.name}</p>
            <Button variant="danger" size="sm" onClick={() => { if (confirm('Delete role?')) deleteMut.mutate(r._id); }}>Delete</Button>
          </div>
        ))}
        {!roles?.data?.length && <p className="px-6 py-8 text-center text-gray-400">No roles.</p>}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="New Role">
        <form onSubmit={e => { e.preventDefault(); createMut.mutate(); }} className="space-y-4">
          <Input label="Role Name *" required value={name} onChange={e => setName(e.target.value)} />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createMut.isPending}>Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
