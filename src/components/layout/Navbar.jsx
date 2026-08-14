'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import { stripTenantPrefix } from '@/lib/access';
import { useTenantHref } from '@/components/tenant/TenantProvider';

/**
 * Navigasi pelanggan.
 *
 * ISOLASI SISI PUBLIK ↔ ADMIN
 * Navbar ini sengaja tidak tahu apa-apa soal sesi login: tidak ada tautan
 * Dashboard, tidak ada tombol Login/Keluar, tidak ada identitas akun — bahkan
 * ketika yang membuka adalah admin. Sisi publik hanya melayani pemesanan.
 *
 * Konsekuensinya yang harus diingat saat menyunting berkas ini:
 *   - Pintu masuk staf ada SATU dan bukan di sini: tautan "Masuk Staf" di
 *     baris paling bawah footer (src/components/layout/Footer.jsx). Alasan
 *     penempatannya ditulis di sana; yang penting di berkas ini, ia tidak
 *     boleh ikut naik ke navbar.
 *   - Kendali sesi (siapa yang masuk, tombol keluar) ada di `/login` dan di
 *     AdminShell — bukan di sini. Jangan dikembalikan ke navbar.
 */
/*
  Nama halaman memakai bahasa pelanggan, bukan bahasa dokumen.

  "Fitur Utama" adalah istilah ketentuan lomba untuk halaman jual beli, dan
  pelanggan kedai tidak punya konteks untuk memahaminya — pemetaan istilah itu
  tempatnya di README, bukan di navbar. Dua halaman menu juga dibedakan dengan
  kata kerjanya: "Menu" untuk membaca daftar, "Pesan" untuk bertransaksi.
*/
/*
  Lima halaman, dan "Meja" bukan salah satunya.

  Denah meja tetap hidup di `/meja` — ia tujuan tombol "Pesan Sekarang", jalan
  keluar kartu "Meja belum diketahui" di `/menu`, dan tautan "Duduk di meja
  lain?" pada layar hasil pindai. Yang dicabut hanya tempatnya di navbar:
  memilih meja bukan halaman yang orang tuju, melainkan satu langkah di tengah
  memesan, dan pelanggan yang baru memindai QR di mejanya sudah melewatinya
  tanpa sadar. Menyejajarkannya dengan Menu dan About membuat langkah itu
  terbaca sebagai tujuan tersendiri — lalu mengundang orang yang sudah duduk di
  Meja 07 untuk memilih meja lagi.
*/
/*
  "Menu" dan "Pesan" bersebelahan adalah dua kata yang berarti sama.

  Bagi kita bedanya jelas — yang satu katalog baca-saja, yang satu tempat
  bertransaksi. Bagi pengunjung yang baru duduk, keduanya sama-sama berarti
  "daftar yang dijual", dan yang bersebelahan justru terbaca sebagai satu
  tautan yang tidak sengaja tertulis dua kali. Yang lalu terjadi: ia menekan
  yang mana saja, lalu bingung kenapa yang satu punya keranjang dan yang lain
  tidak.

  "Daftar Harga" menghapus tumpang tindihnya tanpa perlu penjelasan: ia
  menyebut ISI halamannya (harga), bukan kategorinya (menu). Kata kerja
  "Pesan" jadi satu-satunya yang menjanjikan perbuatan, dan itu memang
  satu-satunya halaman tempat perbuatan itu terjadi.
*/
const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/katalog', label: 'Daftar Harga' },
  { href: '/menu', label: 'Pesan' },
  { href: '/about', label: 'About' },
  { href: '/kontak', label: 'Kontak' },
];

export default function Navbar() {
  const pathname = usePathname();
  const t = useTenantHref();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  /*
    Escape menutup panel, sama seperti dialog lain di aplikasi ini. Tanpa itu
    satu-satunya jalan keluar adalah menemukan lagi tombol yang sama — dan di
    layar sempit tombol itu sudah tertutup daftar tautan yang baru terbuka.
  */
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  /*
    Dibandingkan terhadap path TANPA awalan outlet. `/k/kopi-pagi/menu` harus
    menyalakan tautan "Pesan" yang href-nya `/k/kopi-pagi/menu`; membandingkan
    keduanya utuh tetap benar, tapi rapuh terhadap slug ber-encoding. Yang
    dibandingkan cukup bagian yang memang menentukan halaman.
  */
  const rute = stripTenantPrefix(pathname);
  const isActive = (href) => (href === '/' ? rute === '/' : rute.startsWith(href));

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b transition-all ${
        scrolled ? 'border-slate-200/80 bg-white/85 backdrop-blur-md' : 'border-transparent bg-white'
      }`}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4 sm:h-[72px]">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={t(link.href)}
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

        {/*
          Tanpa tombol "Pesan Sekarang" di sini.

          Ajakan memesan sudah berdiri di tempat yang lebih tepat: berdampingan
          dengan "Lihat Menu" di hero beranda, tempat pengunjung yang baru
          mendarat memang sedang memutuskan mau apa. Menyalinnya ke navbar
          membuat dua tombol dengan tujuan sama muncul dalam satu layar, dan
          yang di navbar terbaca sebagai ajakan ketiga di samping tautan "Pesan"
          yang persis di sebelahnya.
        */}

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
                href={t(link.href)}
                className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive(link.href) ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
