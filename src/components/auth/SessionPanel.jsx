'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { initials } from '@/lib/format';

/**
 * Panel sesi staf — tampil di `/login` saat sudah ada yang masuk.
 *
 * Sisi publik tidak lagi memuat identitas akun maupun tombol Keluar (lihat
 * catatan isolasi di src/components/layout/Navbar.jsx), jadi halaman inilah
 * satu-satunya tempat staf bisa melihat sedang masuk sebagai siapa dan keluar
 * dari sesinya. Tanpa panel ini, akun ber-role `user` akan terkunci: tidak
 * bisa membuka /admin, tidak bisa keluar dari mana pun.
 */
export default function SessionPanel({ email, fullName, role }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isAdmin = role === 'admin';

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

      {isAdmin ? (
        <div className="mt-5 space-y-3">
          <Button href="/admin" size="lg" className="w-full">
            Buka Dashboard Admin
          </Button>
          <Button variant="secondary" size="lg" className="w-full" onClick={handleLogout} disabled={loading}>
            {loading ? 'Keluar...' : 'Keluar'}
          </Button>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
            <p className="text-sm font-semibold text-amber-900">Akun ini belum punya akses admin</p>
            <p className="mt-1 text-xs leading-snug text-amber-800">
              Role <span className="font-bold">user</span> belum bisa membuka dashboard. Minta admin
              yang sudah ada menaikkan role akun ini lewat halaman Hak Akses.
            </p>
          </div>
          <Button size="lg" className="w-full" onClick={handleLogout} disabled={loading}>
            {loading ? 'Keluar...' : 'Keluar dari akun ini'}
          </Button>
        </div>
      )}

      <p className="mt-6 text-center text-sm">
        <Link href="/menu" className="link-muted">
          Buka halaman pemesanan pelanggan →
        </Link>
      </p>
    </div>
  );
}
