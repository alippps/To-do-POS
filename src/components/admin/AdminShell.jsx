'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from '@/components/layout/Logo';
import { createClient } from '@/lib/supabase/client';
import { initials } from '@/lib/format';
import { canOpenAdminPath, ROLES, stripTenantPrefix } from '@/lib/access';
import { useTenantHref } from '@/components/tenant/TenantProvider';

const MENU = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: (
      <>
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </>
    ),
  },
  {
    // Layar yang paling sering dipakai saat jam sibuk — ditaruh tinggi.
    href: '/admin/kasir',
    label: 'Kasir',
    icon: (
      <>
        <rect x="3" y="8" width="18" height="12" rx="2" />
        <path d="M7 8V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3" strokeLinecap="round" />
        <path d="M7 13h4" strokeLinecap="round" />
      </>
    ),
  },
  {
    href: '/admin/produk',
    label: 'Daftar Produk',
    icon: (
      <>
        <path d="M20 7 12 3 4 7v10l8 4 8-4V7Z" strokeLinejoin="round" />
        <path d="m4 7 8 4 8-4M12 11v10" />
      </>
    ),
  },
  {
    href: '/admin/meja',
    label: 'Denah Meja',
    icon: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
  },
  {
    href: '/admin/transaksi',
    label: 'Daftar Transaksi',
    icon: (
      <>
        <path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2Z" strokeLinejoin="round" />
        <path d="M9 7h6M9 11h6M9 15h3" strokeLinecap="round" />
      </>
    ),
  },
  {
    href: '/admin/akses',
    label: 'Hak Akses',
    icon: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" strokeLinecap="round" />
        <circle cx="12" cy="15.5" r="1.5" />
      </>
    ),
  },
];

export default function AdminShell({ profile, email, role = 'admin', tenant, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTenantHref();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(t('/login'));
    router.refresh();
  }

  // Dibandingkan tanpa awalan outlet — ADMIN_PAGES ditulis tanpa slug.
  const rute = stripTenantPrefix(pathname);
  const isActive = (href) => (href === '/admin' ? rute === '/admin' : rute.startsWith(href));

  /*
    Menu disaring, bukan sekadar dinonaktifkan. Kasir tidak perlu melihat
    Produk / Denah Meja / Hak Akses sama sekali — menampilkan pintu yang
    pasti tertutup hanya menimbulkan pertanyaan saat jam sibuk.

    Ini murni kenyamanan; penolakan sebenarnya dilakukan middleware, penjaga
    halaman, server action, dan RLS.
  */
  const menu = MENU.filter((item) => canOpenAdminPath(role, item.href));

  const nav = (
    <nav className="flex flex-col gap-1">
      {menu.map((item) => (
        <Link
          key={item.href}
          href={t(item.href)}
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
            isActive(item.href)
              ? 'bg-brand-600 text-white shadow-pop'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            {item.icon}
          </svg>
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar desktop */}
      {/*
        `overflow-y-auto` bukan pemanis: sidebar ini `inset-y-0`, jadi tingginya
        terkunci setinggi layar. Di laptop berlayar pendek (≤700px), enam item
        menu + kartu profil + tombol Keluar melewati batas itu dan bagian
        bawahnya terpotong tanpa cara apa pun untuk dijangkau.
      */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col overflow-y-auto scroll-slim border-r border-slate-200 bg-white p-6 lg:flex">
        <Logo />

        <div className="mt-8 flex-1">
          {/* Nama outlet ditulis eksplisit: satu orang bisa memegang lebih dari
              satu outlet, dan dashboard keduanya terlihat identik. */}
          <p className="mb-3 truncate px-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {tenant?.name || 'Menu Admin'}
          </p>
          {nav}
        </div>

        <div className="space-y-3 border-t border-slate-100 pt-5">
          <Link
            href={t('/')}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
          >
            ← Lihat website
          </Link>
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
              {initials(profile?.full_name || email)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {profile?.full_name || ROLES[role]?.label || 'Staf'}
              </p>
              <p className="truncate text-[11px] text-slate-400">{email}</p>
              {/* Role ditulis eksplisit supaya staf tahu kenapa menunya lebih sedikit. */}
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-600">
                {ROLES[role]?.label || role}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
          >
            Keluar
          </button>
        </div>
      </aside>

      {/* Topbar mobile */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <Logo compact />
        <span className="text-sm font-bold text-slate-900">Admin Panel</span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu admin"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" /> : <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />}
          </svg>
        </button>
      </header>

      {open && (
        <div className="border-b border-slate-200 bg-white p-4 lg:hidden">
          {nav}
          <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
            <Link
              href={t('/')}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-600"
            >
              Website
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600"
            >
              Keluar
            </button>
          </div>
        </div>
      )}

      <main className="lg:pl-72">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">{children}</div>
      </main>
    </div>
  );
}
