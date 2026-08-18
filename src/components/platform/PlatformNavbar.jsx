'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Button from '@/components/ui/Button';
import PlatformLogo from './PlatformLogo';
import { Menu, X } from 'lucide-react';

/**
 * Navigasi PLATFORM — halaman yang tidak berada di dalam outlet mana pun.
 */
const NAV_LINKS = [
  { href: '/#fitur', label: 'Fitur' },
  { href: '/#cara-kerja', label: 'Cara Kerja' },
  { href: '/#keunggulan', label: 'Keunggulan' },
  { href: '/#outlet', label: 'Outlet' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/#kontak', label: 'Kontak' },
];

export default function PlatformNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Tutup menu saat rute berubah
  useEffect(() => setOpen(false), [pathname]);

  // Tutup menu dengan tombol Escape (Aksesibilitas)
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'border-b border-slate-200/60 bg-white/80 backdrop-blur-lg shadow-sm shadow-slate-900/5'
          : 'border-b border-transparent bg-white/0'
      }`}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4 sm:h-20">
        <PlatformLogo />

        {/* Menu Desktop */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100/80 hover:text-brand-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA Desktop */}
        <div className="hidden items-center gap-4 lg:flex">
          <Button href="/daftar-outlet" size="sm" className="shadow-sm">
            Daftarkan UMKM
          </Button>
        </div>

        {/* Hamburger Button Mobile */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={open}
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 lg:hidden"
        >
          {open ? (
            <X className="h-5 w-5 transition-transform duration-300" />
          ) : (
            <Menu className="h-5 w-5 transition-transform duration-300" />
          )}
        </button>
      </div>

      {/*
        Menu Mobile (Dropdown)
        Menggunakan grid-rows transition untuk efek slide-down yang mulus.
      */}
      <div
        className={`grid transition-all duration-300 ease-in-out lg:hidden ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden border-t border-slate-100 bg-white shadow-xl shadow-slate-900/5">
          <div className="container-page flex flex-col gap-1 py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-brand-600"
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-4 border-t border-slate-100 pt-5 pb-2">
              <Button href="/daftar-outlet" className="w-full">
                Daftarkan UMKM Sekarang
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}