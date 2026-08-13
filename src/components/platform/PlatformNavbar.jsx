'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Button from '@/components/ui/Button';
import PlatformLogo from './PlatformLogo';

/**
 * Navigasi PLATFORM — halaman yang tidak berada di dalam outlet mana pun.
 *
 * Isinya bicara kepada calon pemilik usaha, bukan kepada pelanggan kedai:
 * apa sistem ini, apa untungnya, dan di mana mendaftarkannya. Navigasi
 * pelanggan hidup terpisah di `layout/Navbar.jsx` dan hanya memuat lima
 * halaman kedai.
 *
 * Tautannya berbentuk `/#fitur`, bukan `#fitur`, supaya tetap bekerja dari
 * `/daftar-outlet` — di sana tidak ada elemen bernama itu untuk diloncati,
 * dan anchor tanpa path akan berhenti di halaman yang sama.
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
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b transition-all ${
        scrolled ? 'border-slate-200/80 bg-white/85 backdrop-blur-md' : 'border-transparent bg-white'
      }`}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4 sm:h-[72px]">
        <PlatformLogo />

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button href="/daftar-outlet" size="sm">
            Daftarkan UMKM
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={open}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 lg:hidden"
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
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <div className="container-page flex flex-col gap-1 py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-3 border-t border-slate-100 pt-4">
              <Button href="/daftar-outlet" className="w-full">
                Daftarkan UMKM
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
