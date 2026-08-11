'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { initials } from '@/lib/format';
import { STAFF_ROLES, staffHomePath } from '@/lib/access';
import { useTenant, useTenantHref } from '@/components/tenant/TenantProvider';

/**
 * Panel sesi staf — tampil di `/login` saat sudah ada yang masuk.
 *
 * Sisi publik tidak lagi memuat identitas akun maupun tombol Keluar (lihat
 * catatan isolasi di src/components/layout/Navbar.jsx), jadi halaman inilah
 * satu-satunya tempat staf bisa melihat sedang masuk sebagai siapa dan keluar
 * dari sesinya. Tanpa panel ini, akun ber-role `user` akan terkunci: tidak
 * bisa membuka /admin, tidak bisa keluar dari mana pun.
 */
export default function SessionPanel({ email, fullName, role, outletSendiri = true }) {
  const router = useRouter();
  const tenant = useTenant();
  const t = useTenantHref();
  const [loading, setLoading] = useState(false);

  /*
    Staf = admin ATAU kasir — DI OUTLET INI.

    Sejak satu pemasangan melayani banyak UMKM, role saja tidak cukup: admin
    Kopi Pagi yang membuka /k/roti-88/login memang sedang masuk, tapi dashboard
    yang ada di halaman ini bukan miliknya. Menawarkan tombolnya hanya
    mengantar ke penolakan middleware.
  */
  const isStaf = STAFF_ROLES.includes(role) && outletSendiri;

  async function handleLogout() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Sesi staf aktif</h1>
      <p className="mt-2 text-sm text-slate-500">
        Kamu sudah masuk. Halaman ini juga tempatnya keluar dari sesi.
      </p>

      <div className="mt-8 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
          {initials(fullName || email)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">{fullName || email}</p>
          <p className="truncate text-xs text-slate-500">{email}</p>
          <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-widest text-brand-600">
            Role: {role || 'user'}
          </span>
        </div>
      </div>

      {isStaf ? (
        <div className="mt-5 space-y-3">
          {/*
            Tujuan & tulisannya mengikuti role, sama seperti sesudah login
            (STAFF_HOME) — kalau tombol ini tetap "Buka Dashboard" ke /admin,
            kasir yang sudah masuk mendarat di tempat berbeda dari kasir yang
            baru saja masuk, lewat halaman yang sama persis.
          */}
          <Button href={t(staffHomePath(role))} size="lg" className="w-full">
            {role === 'kasir' ? 'Buka Layar Kasir' : 'Buka Dashboard'}
          </Button>
          <Button variant="secondary" size="lg" className="w-full" onClick={handleLogout} disabled={loading}>
            {loading ? 'Keluar...' : 'Keluar'}
          </Button>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
            {outletSendiri ? (
              <>
                <p className="text-sm font-semibold text-amber-900">
                  Akun ini belum punya akses staf
                </p>
                <p className="mt-1 text-xs leading-snug text-amber-800">
                  Role <span className="font-bold">user</span> belum bisa membuka dashboard. Minta
                  admin {tenant.name} menaikkan role akun ini menjadi{' '}
                  <span className="font-bold">Kasir</span> atau <span className="font-bold">Admin</span>{' '}
                  lewat halaman Hak Akses.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-amber-900">Akun ini milik outlet lain</p>
                <p className="mt-1 text-xs leading-snug text-amber-800">
                  Kamu sedang masuk dengan akun yang terdaftar di outlet berbeda, jadi dashboard{' '}
                  <span className="font-bold">{tenant.name}</span> tidak bisa dibuka dari sini. Buka
                  halaman masuk outletmu sendiri, atau keluar lalu masuk dengan akun yang benar.
                </p>
              </>
            )}
          </div>
          <Button size="lg" className="w-full" onClick={handleLogout} disabled={loading}>
            {loading ? 'Keluar...' : 'Keluar dari akun ini'}
          </Button>
        </div>
      )}

      <p className="mt-6 text-center text-sm">
        <Link href={t('/menu')} className="link-muted">
          Buka halaman pemesanan pelanggan →
        </Link>
      </p>
    </div>
  );
}
