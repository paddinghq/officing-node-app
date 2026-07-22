import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listUsers, inviteUser, removeUser, updateUser, listRoles } from '@officing/api-client';
import type { UserEntry } from '@officing/api-client';
import { Btn, DataTable, SModal, PageShell } from '../../components/ui/index';
import { Field } from '../../components/ui/Field';
import { Plus, TrashBin, LetterGroup, CrownDiamond, Pencil } from '@gravity-ui/icons';

const COLS = [
  { key: 'name',   label: 'Name'   },
  { key: 'email',  label: 'Email'  },
  { key: 'role',   label: 'Role'   },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: ''      },
];

export function UsersPage() {
  const qc = useQueryClient();

  // ── Invite modal state ───────────────────────────────────────────────────
  const [inviteOpen, setInviteOpen]   = useState(false);
  const [inviteForm, setInviteForm]   = useState({ email: '', firstName: '', lastName: '', roleId: '' });
  const [inviteLoading, setInviteLoading] = useState(false);

  // ── Edit modal state ─────────────────────────────────────────────────────
  const [editOpen, setEditOpen]     = useState(false);
  const [editTarget, setEditTarget] = useState<UserEntry | null>(null);
  const [editForm, setEditForm]     = useState({ firstName: '', lastName: '', roleId: '' });

  const { data: usersRes } = useQuery({ queryKey: ['users'], queryFn: listUsers });
  const { data: rolesRes  } = useQuery({ queryKey: ['roles'], queryFn: listRoles  });

  const removeMut = useMutation({
    mutationFn: removeUser,
    onSuccess: () => { toast.success('User removed'); qc.invalidateQueries({ queryKey: ['users'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const editMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => updateUser(id, body),
    onSuccess: () => {
      toast.success('User updated');
      qc.invalidateQueries({ queryKey: ['users'] });
      setEditOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteLoading(true);
    try {
      await inviteUser(inviteForm);
      toast.success('Invite sent — magic link emailed');
      setInviteOpen(false);
      setInviteForm({ email: '', firstName: '', lastName: '', roleId: '' });
      qc.invalidateQueries({ queryKey: ['users'] });
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setInviteLoading(false);
    }
  }

  function openEdit(entry: UserEntry) {
    setEditTarget(entry);
    setEditForm({
      firstName: entry.user.firstName,
      lastName:  entry.user.lastName,
      roleId:    entry.user.companyRole?._id ?? entry.user.role?._id ?? '',
    });
    setEditOpen(true);
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    editMut.mutate({ id: editTarget.user._id, body: editForm });
  }

  const roleOptions = [
    { value: '', label: '— Select role —' },
    ...(rolesRes?.data ?? []).map(r => ({ value: r._id, label: r.name })),
  ];

  const entries: UserEntry[] = usersRes?.data ?? [];

  function renderCell(entry: UserEntry, key: string) {
    const u = entry.user;
    switch (key) {
      case 'name':   return <span className="font-medium">{u.firstName} {u.lastName}</span>;
      case 'email':  return <span style={{ color: 'var(--muted)' }}>{u.email}</span>;
      case 'role':   return (
        <span style={{ color: 'var(--muted)' }}>
          {u.companyRole?.name ?? (typeof u.role === 'object' ? u.role?.name : null) ?? '—'}
        </span>
      );
      case 'status': return (
        <span className="capitalize text-xs px-2 py-0.5 rounded-full"
          style={{
            background: entry.status === 'active' ? 'color-mix(in srgb, #22c55e 12%, transparent)' : 'var(--surface-secondary)',
            color: entry.status === 'active' ? '#16a34a' : 'var(--muted)',
          }}>
          {entry.status}
        </span>
      );
      case 'actions': return (
        <div className="flex items-center justify-end gap-1">
          <Btn variant="ghost" size="sm" onClick={() => openEdit(entry)}>
            <Pencil width={13} height={13} />
          </Btn>
          <Btn variant="danger-soft" size="sm"
            onClick={() => { if (confirm('Remove this user?')) removeMut.mutate(u._id); }}>
            <TrashBin width={13} height={13} />
          </Btn>
        </div>
      );
      default: return null;
    }
  }

  return (
    <PageShell title="People" subtitle="Manage team members and access permissions."
      actions={
        <>
          <Link to="/people/roles">
            <Btn variant="secondary" size="sm"><CrownDiamond width={13} height={13} /> Manage roles</Btn>
          </Link>
          <Btn size="sm" onClick={() => setInviteOpen(true)}>
            <Plus width={14} height={14} /> Invite user
          </Btn>
        </>
      }
    >
      <DataTable columns={COLS} rows={entries} renderCell={renderCell} emptyMessage="No users found." />

      {/* ── Invite modal ─────────────────────────────────────────────── */}
      <SModal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite user" size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Btn variant="secondary" onClick={() => setInviteOpen(false)}>Cancel</Btn>
            <Btn loading={inviteLoading}
              onClick={() => document.getElementById('invite-form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}>
              <LetterGroup width={14} height={14} /> Send invite
            </Btn>
          </div>
        }
      >
        <form id="invite-form" onSubmit={handleInvite} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name *" required value={inviteForm.firstName}
              onChange={e => setInviteForm(f => ({ ...f, firstName: e.target.value }))} />
            <Field label="Last name *"  required value={inviteForm.lastName}
              onChange={e => setInviteForm(f => ({ ...f, lastName:  e.target.value }))} />
          </div>
          <Field label="Email *" type="email" required value={inviteForm.email}
            onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} />
          <Field.Select label="Role *" options={roleOptions} value={inviteForm.roleId}
            onChange={e => setInviteForm(f => ({ ...f, roleId: e.target.value }))} />
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            An invite link will be emailed. The recipient does not need a password until they set one.
          </p>
        </form>
      </SModal>

      {/* ── Edit user modal ──────────────────────────────────────────── */}
      <SModal open={editOpen} onClose={() => setEditOpen(false)} title="Edit user" size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Btn variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Btn>
            <Btn loading={editMut.isPending}
              onClick={() => document.getElementById('edit-user-form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}>
              Save changes
            </Btn>
          </div>
        }
      >
        <form id="edit-user-form" onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name *" required value={editForm.firstName}
              onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))} />
            <Field label="Last name *"  required value={editForm.lastName}
              onChange={e => setEditForm(f => ({ ...f, lastName:  e.target.value }))} />
          </div>
          <Field.Select label="Role" options={roleOptions} value={editForm.roleId}
            onChange={e => setEditForm(f => ({ ...f, roleId: e.target.value }))} />
        </form>
      </SModal>
    </PageShell>
  );
}
