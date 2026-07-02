import { useState } from 'react';
import { UserPlus, Trash2, Shield, Eye, Users } from 'lucide-react';
import { useUsers, useCreateUser } from '../api/users';
import type { User } from '@repo/shared';

const ROLE_META: Record<User['role'], { label: string; cls: string }> = {
  admin:  { label: 'Admin',  cls: 'bg-red-500/10 text-red-400' },
  member: { label: 'Member', cls: 'bg-blue-500/10 text-blue-400' },
  viewer: { label: 'Viewer', cls: 'bg-slate-700 text-slate-400' },
};

const ROLE_ICON: Record<User['role'], React.ReactNode> = {
  admin:  <Shield size={10} />,
  member: <Users size={10} />,
  viewer: <Eye size={10} />,
};

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  'bg-red-800',   'bg-blue-800', 'bg-violet-800',
  'bg-emerald-800','bg-amber-800','bg-cyan-800',
];

function avatarColor(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// ── Add user modal ─────────────────────────────────────────────────────────────

function AddUserModal({ onClose }: { onClose: () => void }) {
  const create = useCreateUser();
  const [name,  setName]  = useState('');
  const [email, setEmail] = useState('');
  const [role,  setRole]  = useState<User['role']>('member');

  const submit = () => {
    if (!name.trim() || !email.trim()) return;
    create.mutate({ name: name.trim(), email: email.trim(), role },
      { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#141720] border border-white/[0.08] rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <h2 className="text-base font-semibold text-slate-100 mb-5">Add User</h2>

        <div className="flex flex-col gap-3">
          <input
            autoFocus
            placeholder="Full name *"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
          />
          <input
            placeholder="Email *"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
          />
          <div>
            <label className="text-[11px] text-slate-500 mb-1 block">Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as User['role'])}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-brand-500"
            >
              <option value="viewer">Viewer</option>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!name.trim() || !email.trim() || create.isPending}
            className="px-4 py-2 text-sm bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {create.isPending ? 'Adding…' : 'Add user'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── UsersPage ──────────────────────────────────────────────────────────────────

export function UsersPage() {
  const { data: users = [], isLoading } = useUsers();
  const [modal, setModal] = useState(false);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-lg font-semibold text-slate-100 tracking-tight">Users</h1>
          <p className="text-[12px] text-slate-600 mt-0.5">{users.length} member{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-brand-500/40 bg-brand-500/10 text-brand-500 text-[13px] font-medium hover:bg-brand-500/18 transition-colors"
        >
          <UserPlus size={14} />
          Add user
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#141720] rounded-2xl border border-white/[0.05] overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-slate-600 text-sm">Loading…</div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center">
            <Users size={28} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-600 text-sm">No users yet.</p>
            <button onClick={() => setModal(true)} className="mt-2 text-brand-500 hover:text-brand-400 text-[13px]">
              Add the first user →
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.05]">
                <th className="text-left text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-5 py-3">User</th>
                <th className="text-left text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-5 py-3">Email</th>
                <th className="text-left text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-5 py-3">Role</th>
                <th className="text-left text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-5 py-3">Joined</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => {
                const rm = ROLE_META[user.role];
                const joined = new Date(user.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric',
                });
                return (
                  <tr
                    key={user.id}
                    className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors
                      ${i === users.length - 1 ? 'border-b-0' : ''}`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${avatarColor(user.id)}`}>
                          {initials(user.name)}
                        </div>
                        <span className="text-[13px] text-slate-200 font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[12px] text-slate-500 font-mono">{user.email}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${rm.cls}`}>
                        {ROLE_ICON[user.role]}
                        {rm.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[11px] text-slate-600">{joined}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        className="text-slate-700 hover:text-red-400 p-1 rounded transition-colors"
                        title="Remove user"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal && <AddUserModal onClose={() => setModal(false)} />}
    </div>
  );
}
