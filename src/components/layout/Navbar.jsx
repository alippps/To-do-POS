'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import Button from '@/components/ui/Button';

/**
 * Navigasi pelanggan.
 *
 * ISOLASI SISI PUBLIK ↔ ADMIN
 * Navbar ini sengaja tidak tahu apa-apa soal sesi login: tidak ada tautan
 * Dashboard, tidak ada tombol Login/Keluar, tidak ada identitas akun — bahkan
 * ketika yang membuka adalah admin. Sisi publik hanya melayani pemesanan.
 *
 * Konsekuensinya yang harus diingat saat menyunting berkas ini:
 *   - Pintu masuk staf hanya lewat URL langsung `/login` (tidak ditautkan).
 *   - Kendali sesi (siapa yang masuk, tombol keluar) ada di `/login` dan di
 *     AdminShell — bukan di sini. Jangan dikembalikan ke navbar.
 */
const NAV_LINKS = [
  { href: '/', label: 'Home' },
  // "Fitur Utama" adalah istilah yang dipakai ketentuan lomba untuk halaman
  // jual beli; "Menu" adalah istilah yang lebih dimengerti pelanggan.
  { href: '/menu', label: 'Menu (Fitur Utama)' },
  { href: '/meja', label: 'Meja' },
  { href: '/about', label: 'About' },
  { href: '/kontak', label: 'Kontak' },
];

export default function Navbar() {
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

  const isActive = (href) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

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
        </nav>

        <div className="hidden items-center gap-3 xl:flex">
          <Button href="/meja" size="sm">
            Pesan Sekarang
          </Button>
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

            <div className="mt-3 border-t border-slate-100 pt-4">
              <Button href="/meja" className="w-full">
                Pesan Sekarang
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
