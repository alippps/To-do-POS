'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from './Logo';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { initials } from '@/lib/format';

/** Navigasi pelanggan — semua tautan di bawah bisa dibuka tanpa login. */
const NAV_LINKS = [
  { href: '/', label: 'Home' },
  // "Fitur Utama" adalah istilah yang dipakai ketentuan lomba untuk halaman
  // jual beli; "Menu" adalah istilah yang lebih dimengerti pelanggan.
  { href: '/menu', label: 'Menu (Fitur Utama)' },
  { href: '/meja', label: 'Meja' },
  { href: '/about', label: 'About' },
  { href: '/kontak', label: 'Kontak' },
];

export default function Navbar({ user, profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  const isActive = (href) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const isAdmin = profile?.role === 'admin';

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b transition-all ${
        scrolled ? 'border-slate-200/80 bg-white/85 backdrop-blur-md' : 'border-transparent bg-white'
      }`}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4 sm:h-[72px]">
        <Logo />

        <nav className="hidden items-center gap-1 xl:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                isActive(link.href)
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className="ml-1 rounded-lg border border-brand-200 px-3.5 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
            >
              Dashboard
            </Link>
          )}
        </nav>

        <div className="hidden items-center gap-3 xl:flex">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
                  {initials(profile?.full_name || user.email)}
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="max-w-[140px] truncate text-sm font-medium text-slate-700">
                    {profile?.full_name || user.email}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                    {isAdmin ? 'Admin' : 'User'}
                  </span>
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Keluar
              </Button>
            </div>
          ) : (
            <>
              {/*
                Login diperuntukkan bagi STAF/ADMIN, bukan pelanggan.
                Pelanggan cukup menekan "Pesan Sekarang" — tanpa akun.
              */}
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:text-brand-700"
              >
                Login staf
              </Link>
              <Button href="/meja" size="sm">
                Pesan Sekarang
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Buka menu"
          aria-expanded={open}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 xl:hidden"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white xl:hidden">
          <div className="container-page flex flex-col gap-1 py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive(link.href) ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className="rounded-xl px-4 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50"
              >
                Dashboard Admin
              </Link>
            )}

            <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-4">
              {user ? (
                <>
                  <p className="px-1 text-sm text-slate-500">
                    Masuk sebagai{' '}
                    <span className="font-semibold text-slate-800">
                      {profile?.full_name || user.email}
                    </span>{' '}
                    <span className="font-bold uppercase text-brand-600">
                      ({isAdmin ? 'admin' : 'user'})
                    </span>
                  </p>
                  <Button variant="secondary" onClick={handleLogout}>
                    Keluar
                  </Button>
                </>
              ) : (
                <>
                  <Button href="/meja">Pesan Sekarang</Button>
                  <Link
                    href="/login"
                    className="rounded-xl px-4 py-3 text-center text-sm font-medium text-slate-500 transition hover:bg-slate-50"
                  >
                    Login staf / admin
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
