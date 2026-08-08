'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import SearchInput from '@/components/ui/SearchInput';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from './ConfirmDialog';
import Toast from './Toast';
import { formatDate } from '@/lib/format';
import { ROLES, ASSIGNABLE_ROLES } from '@/lib/access';
import { useTenant } from '@/components/tenant/TenantProvider';
import { setUserRole } from '@/app/k/[slug]/admin/akses/actions';

/** Akibat nyata dari tiap pilihan — ditulis di dialog konfirmasi. */
const PENJELASAN_ROLE = {
  admin:
    'Akun ini akan bisa membuka SELURUH area /admin: mengubah produk, denah meja, menghapus transaksi, dan mengatur role akun lain.',
  kasir:
    'Akun ini hanya bisa membuka Dashboard, Kasir, dan Daftar Transaksi. Bisa membuat pesanan dan menandai lunas, tapi tidak bisa mengubah produk, denah meja, menghapus transaksi, maupun mengatur role.',
  user: 'Akun ini akan kehilangan seluruh akses ke area /admin.',
};

/**
 * Daftar akun beserta ID dan role-nya — menjawab pertanyaan
 * "ID mana saja yang punya akses admin".
 */
export default function AccessManager({ users = [], currentUserId }) {
  const router = useRouter();
  const tenant = useTenant();

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

  const jumlah = (r) => users.filter((u) => u.role === r).length;

  async function handleConfirm() {
    if (!pending) return;
    setLoading(true);
    const res = await setUserRole(tenant.slug, pending.user.id, pending.nextRole);
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
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Akun</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{users.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Admin</p>
          <p className="mt-2 text-2xl font-extrabold text-amber-600">{jumlah('admin')}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Kasir</p>
          <p className="mt-2 text-2xl font-extrabold text-emerald-600">{jumlah('kasir')}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">User</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{jumlah('user')}</p>
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
          {ASSIGNABLE_ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLES[r].label}
            </option>
          ))}
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
                  const peran = ROLES[u.role] || ROLES.user;
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
                        <Badge tone={peran.badge}>{peran.label}</Badge>
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-500">
                        {u.last_sign_in_at ? formatDate(u.last_sign_in_at) : 'Belum pernah'}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {/*
                          Tombol dua-arah diganti pemilih role sejak ada tiga
                          peran — "Jadikan Admin" tidak lagi cukup menjelaskan
                          pilihan yang tersedia.
                        */}
                        {isSelf && isAdmin ? (
                          <span className="text-xs text-slate-400">Tidak bisa diubah sendiri</span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) =>
                              e.target.value !== u.role &&
                              setPending({ user: u, nextRole: e.target.value })
                            }
                            aria-label={`Ubah role ${u.email}`}
                            className="input-base w-auto cursor-pointer py-2 text-xs"
                          >
                            {ASSIGNABLE_ROLES.map((r) => (
                              <option key={r} value={r}>
                                {ROLES[r].label}
                              </option>
                            ))}
                          </select>
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
        confirmLabel={`Ya, jadikan ${ROLES[pending?.nextRole]?.label || 'role baru'}`}
        title={`Ubah role ${pending?.user?.email} menjadi ${
          ROLES[pending?.nextRole]?.label || pending?.nextRole
        }?`}
        description={PENJELASAN_ROLE[pending?.nextRole] || ''}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
