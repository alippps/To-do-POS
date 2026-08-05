import PageHeader from '@/components/admin/PageHeader';
import AccessManager from '@/components/admin/AccessManager';
import { createClient, getSessionUser } from '@/lib/supabase/server';
import { ROLES, ACCESS_MATRIX, SECURITY_LAYERS } from '@/lib/access';
import { requirePageAccess } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Hak Akses' };

const MARK = {
  y: { symbol: '✓', className: 'text-emerald-600', label: 'Boleh' },
  n: { symbol: '✕', className: 'text-slate-300', label: 'Tidak boleh' },
  o: { symbol: '◐', className: 'text-amber-600', label: 'Sebagian' },
};

/**
 * Halaman rujukan hak akses: siapa boleh apa, dan ID akun mana
 * yang saat ini memegang akses admin.
 */
export default async function AdminAksesPage() {
  await requirePageAccess('/admin/akses'); // kasir tidak boleh mengubah role siapa pun
  const supabase = createClient();
  const { user } = await getSessionUser();

  const { data: users, error } = await supabase.rpc('admin_list_users');

  return (
    <>
      <PageHeader
        title="Hak Akses"
        description="Daftar lengkap siapa boleh mengakses apa, plus ID akun mana saja yang memegang akses admin saat ini."
      />

      {error && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          Gagal memuat daftar akun: {error.message}. Pastikan{' '}
          <code className="font-semibold">supabase/schema.sql</code> versi terbaru sudah dijalankan
          agar fungsi <code className="font-semibold">admin_list_users()</code> tersedia.
        </div>
      )}

      {/* Penjelasan tiap role */}
      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Object.values(ROLES).map((role) => (
          <div key={role.key} className="card-accent p-5">
            <h2 className="text-lg font-bold text-slate-900">{role.label}</h2>
            <p className="mt-2 text-sm text-slate-500">{role.who}</p>
            <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
              {role.identity}
            </p>
          </div>
        ))}
      </section>

      {/* Daftar akun + ID */}
      <section className="mb-10">
        <h2 className="mb-1 text-lg font-bold text-slate-900">Akun Terdaftar</h2>
        <p className="mb-5 text-sm text-slate-500">
          Klik ID untuk menyalinnya. Menaikkan role ke admin memberi akses penuh ke seluruh area
          /admin — Anda tidak bisa menurunkan role akun Anda sendiri agar selalu tersisa minimal satu
          admin.
        </p>
        <AccessManager users={users || []} currentUserId={user?.id} />
      </section>

      {/* Matriks hak akses */}
      <section className="mb-10">
        <h2 className="mb-1 text-lg font-bold text-slate-900">Matriks Hak Akses</h2>
        <p className="mb-5 text-sm text-slate-500">
          Aturan di bawah ditegakkan oleh middleware, layout admin, server action, dan Row Level
          Security di Supabase.
        </p>

        <div className="card overflow-hidden p-0">
          <div className="scroll-slim overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/70">
                <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">Halaman / Aksi</th>
                  <th className="px-5 py-3.5 text-center">Tamu</th>
                  <th className="px-5 py-3.5 text-center">User</th>
                  <th className="px-5 py-3.5 text-center">Kasir</th>
                  <th className="px-5 py-3.5 text-center">Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ACCESS_MATRIX.map((group) => (
                  <FragmentRows key={group.area} group={group} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3.5 text-xs text-slate-500">
            {Object.values(MARK).map((m) => (
              <span key={m.label} className="flex items-center gap-1.5">
                <span className={`text-base font-bold ${m.className}`}>{m.symbol}</span>
                {m.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Lapisan pengamanan */}
      <section>
        <h2 className="mb-1 text-lg font-bold text-slate-900">Empat Lapis Pengamanan</h2>
        <p className="mb-5 text-sm text-slate-500">
          Akses admin diperiksa berulang kali, jadi melewati satu lapis saja tidak cukup.
        </p>

        <ol className="grid gap-4 sm:grid-cols-2">
          {SECURITY_LAYERS.map((layer, i) => (
            <li key={layer.title} className="card flex gap-4 p-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{layer.title}</p>
                <code className="mt-1 block truncate text-[11px] text-brand-700">{layer.file}</code>
                <p className="mt-2 text-sm text-slate-500">{layer.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

function FragmentRows({ group }) {
  return (
    <>
      <tr className="bg-slate-50/40">
        <td colSpan={5} className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {group.area}
        </td>
      </tr>
      {group.rows.map((row) => (
        <tr key={row.name}>
          <td className="px-5 py-3.5">
            <p className="font-medium text-slate-800">{row.name}</p>
            {row.note && <p className="mt-0.5 text-xs text-slate-500">{row.note}</p>}
          </td>
          {['guest', 'user', 'kasir', 'admin'].map((role) => {
            const mark = MARK[row[role]] || MARK.n;
            return (
              <td key={role} className="px-5 py-3.5 text-center">
                <span className={`text-base font-bold ${mark.className}`} title={mark.label}>
                  {mark.symbol}
                </span>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
