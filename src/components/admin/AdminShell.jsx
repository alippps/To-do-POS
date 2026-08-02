'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from '@/components/layout/Logo';
import { createClient } from '@/lib/supabase/client';
import { initials } from '@/lib/format';

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
    href: '/admin/transaksi',
    label: 'Daftar Transaksi',
    icon: (
      <>
        <path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2Z" strokeLinejoin="round" />
        <path d="M9 7h6M9 11h6M9 15h3" strokeLinecap="round" />
      </>
    ),
  },
];

export default function AdminShell({ profile, email, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const isActive = (href) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

  const nav = (
    <nav className="flex flex-col gap-1">
      {MENU.map((item) => (
        <Link
          key={item.href}
          href={item.href}
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
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-slate-200 bg-white p-6 lg:flex">
        <Logo />

        <div className="mt-8 flex-1">
          <p className="mb-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Menu Admin
          </p>
          {nav}
        </div>

        <div className="space-y-3 border-t border-slate-100 pt-5">
          <Link
            href="/"
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
                {profile?.full_name || 'Admin'}
              </p>
              <p className="truncate text-[11px] text-slate-400">{email}</p>
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
              href="/"
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
