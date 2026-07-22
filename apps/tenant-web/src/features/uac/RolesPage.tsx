import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listRoles, createRole, updateRole, deleteRole } from '@officing/api-client';
import type { Role } from '@officing/api-client';
import { Btn, SCard, SModal, PageShell } from '../../components/ui/index';
import { Field } from '../../components/ui/Field';
import { Plus, TrashBin, Pencil, ArrowLeft } from '@gravity-ui/icons';

export function RolesPage() {
  const qc = useQueryClient();

  // ── Create state ────────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName]        = useState('');

  // ── Edit state ──────────────────────────────────────────────────────────
  const [editOpen, setEditOpen]     = useState(false);
  const [editTarget, setEditTarget] = useState<Role | null>(null);
  const [editName, setEditName]     = useState('');

  const { data: roles } = useQuery({ queryKey: ['roles'], queryFn: listRoles });

  const createMut = useMutation({
    mutationFn: () => createRole({ name: newName, permissions: [] }),
    onSuccess: () => {
      toast.success('Role created');
      qc.invalidateQueries({ queryKey: ['roles'] });
      setCreateOpen(false);
      setNewName('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const editMut = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateRole(id, { name, permissions: [] }),
    onSuccess: () => {
      toast.success('Role updated');
      qc.invalidateQueries({ queryKey: ['roles'] });
      setEditOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['roles'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  function openEdit(role: Role) {
    setEditTarget(role);
    setEditName(role.name);
    setEditOpen(true);
  }

  const allRoles = roles?.data ?? [];

  return (
    <PageShell title="Roles" subtitle="Define access roles for team members."
      actions={
        <>
          <Link to="/people">
            <Btn variant="secondary" size="sm"><ArrowLeft width={13} height={13} /> Back to People</Btn>
          </Link>
          <Btn size="sm" onClick={() => setCreateOpen(true)}>
            <Plus width={14} height={14} /> New role
          </Btn>
        </>
      }
    >
      <SCard noPadding>
        {allRoles.length === 0 && (
          <p className="px-5 py-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
            No roles created yet.
          </p>
        )}
        {allRoles.map((r, i) => (
          <div
            key={r._id}
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: i < allRoles.length - 1 ? '1px solid var(--separator)' : 'none' }}
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium" style={{ color: 'var(--foreground)' }}>{r.name}</p>
              {(r as Role & { description?: string }).description && (
                <p className="mt-0.5 text-xs truncate" style={{ color: 'var(--muted)' }}>
                  {(r as Role & { description?: string }).description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 ml-3 shrink-0">
              <Btn variant="ghost" size="sm" onClick={() => openEdit(r)}>
                <Pencil width={13} height={13} />
              </Btn>
              <Btn variant="danger-soft" size="sm"
                onClick={() => { if (confirm('Delete this role?')) deleteMut.mutate(r._id); }}>
                <TrashBin width={13} height={13} />
              </Btn>
            </div>
          </div>
        ))}
      </SCard>

      {/* ── Create role modal ─────────────────────────────────────────── */}
      <SModal open={createOpen} onClose={() => setCreateOpen(false)} title="New role" size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Btn variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Btn>
            <Btn loading={createMut.isPending}
              onClick={() => document.getElementById('role-form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}>
              Create role
            </Btn>
          </div>
        }
      >
        <form id="role-form" onSubmit={e => { e.preventDefault(); createMut.mutate(); }} className="space-y-4">
          <Field label="Role name *" required value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="e.g. Finance Manager" />
        </form>
      </SModal>

      {/* ── Edit role modal ───────────────────────────────────────────── */}
      <SModal open={editOpen} onClose={() => setEditOpen(false)} title="Edit role" size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Btn variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Btn>
            <Btn loading={editMut.isPending}
              onClick={() => document.getElementById('edit-role-form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}>
              Save changes
            </Btn>
          </div>
        }
      >
        <form id="edit-role-form"
          onSubmit={e => { e.preventDefault(); if (editTarget) editMut.mutate({ id: editTarget._id, name: editName }); }}
          className="space-y-4"
        >
          <Field label="Role name *" required value={editName}
            onChange={e => setEditName(e.target.value)}
            placeholder="e.g. Senior Accountant" />
        </form>
      </SModal>
    </PageShell>
  );
}
