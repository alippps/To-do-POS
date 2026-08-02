'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import SearchInput from '@/components/ui/SearchInput';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from './ConfirmDialog';
import Toast from './Toast';
import { formatDate } from '@/lib/format';
import { ROLES } from '@/lib/access';
import { setUserRole } from '@/app/admin/akses/actions';

/**
 * Daftar akun beserta ID dan role-nya — menjawab pertanyaan
 * "ID mana saja yang punya akses admin".
 */
export default function AccessManager({ users = [], currentUserId }) {
  const router = useRouter();

  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState('Semua');
  const [pending, setPending] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [copiedId, setCopiedId] = useState('');

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return users.filter((u) => {
      const cocokKata =
        !q ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.full_name || '').toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q);
      const cocokRole = roleFilter === 'Semua' || u.role === roleFilter;
      return cocokKata && cocokRole;
    });
  }, [users, keyword, roleFilter]);

  const adminCount = users.filter((u) => u.role === 'admin').length;

  async function handleConfirm() {
    if (!pending) return;
    setLoading(true);
    const res = await setUserRole(pending.user.id, pending.nextRole);
    setLoading(false);
    setPending(null);
    if (res.ok) router.refresh();
    setToast({ ok: res.ok, message: res.message });
  }

  async function copyId(id) {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(''), 1800);
    } catch {
      setToast({ ok: false, message: 'Browser menolak akses clipboard.' });
    }
  }

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Akun</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{users.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Akses Admin</p>
          <p className="mt-2 text-2xl font-extrabold text-brand-700">{adminCount}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Role User</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{users.length - adminCount}</p>
        </div>
      </div>

      <div className="card mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <SearchInput
          value={keyword}
          onChange={setKeyword}
          placeholder="Cari email, nama, atau ID akun..."
          className="flex-1"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          aria-label="Filter role"
          className="input-base cursor-pointer sm:w-48"
        >
          <option value="Semua">Semua role</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Akun tidak ditemukan"
          description="Belum ada akun yang cocok. Akun baru muncul di sini setelah mendaftar lewat /register."
        />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="scroll-slim overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/70">
                <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">Akun</th>
                  <th className="px-5 py-3.5">ID (UUID)</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Terakhir masuk</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => {
                  const isAdmin = u.role === 'admin';
                  const isSelf = u.id === currentUserId;

                  return (
                    <tr key={u.id} className="align-middle">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{u.full_name || '—'}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                        {isSelf && (
                          <span className="mt-1 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-700">
                            Akun Anda
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => copyId(u.id)}
                          title="Klik untuk menyalin ID"
                          className="group flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 font-mono text-[11px] text-slate-600 transition hover:bg-slate-100"
                        >
                          <span className="max-w-[220px] truncate">{u.id}</span>
                          <span className="shrink-0 text-[10px] font-bold uppercase text-brand-600">
                            {copiedId === u.id ? 'tersalin' : 'salin'}
                          </span>
                        </button>
                      </td>

                      <td className="px-5 py-4">
                        <Badge tone={isAdmin ? 'amber' : 'slate'}>
                          {isAdmin ? 'Admin' : 'User'}
                        </Badge>
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-500">
                        {u.last_sign_in_at ? formatDate(u.last_sign_in_at) : 'Belum pernah'}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {isSelf && isAdmin ? (
                          <span className="text-xs text-slate-400">Tidak bisa diubah sendiri</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setPending({ user: u, nextRole: isAdmin ? 'user' : 'admin' })
                            }
                            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                              isAdmin
                                ? 'text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50'
                                : 'bg-brand-600 text-white hover:bg-brand-700'
                            }`}
                          >
                            {isAdmin ? 'Turunkan ke User' : 'Jadikan Admin'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pending)}
        onClose={() => setPending(null)}
        onConfirm={handleConfirm}
        loading={loading}
        confirmLabel={pending?.nextRole === 'admin' ? 'Ya, jadikan admin' : 'Ya, turunkan'}
        title={
          pending?.nextRole === 'admin'
            ? `Beri akses admin ke ${pending?.user?.email}?`
            : `Cabut akses admin ${pending?.user?.email}?`
        }
        description={
          pending?.nextRole === 'admin'
            ? ROLES.admin.who + ' Akun ini akan bisa membuka seluruh area /admin dan mengubah data.'
            : 'Akun ini akan kehilangan akses ke seluruh area /admin.'
        }
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
