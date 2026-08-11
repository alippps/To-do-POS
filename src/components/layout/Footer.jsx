'use client';

import Link from 'next/link';
import Logo from './Logo';
import { useTenant, useTenantHref } from '@/components/tenant/TenantProvider';
import { waLinkOf } from '@/lib/tenant';

/*
  Komponen klien sejak v4.

  Bukan karena butuh interaktivitas — isinya tetap statis — melainkan karena
  identitas outlet datang dari `TenantProvider`, dan context hanya terbaca di
  sisi klien. Alternatifnya menurunkan objek tenant sebagai prop dari layout
  server melewati setiap lapisan; untuk footer yang isinya memang cuma teks,
  itu ongkos yang lebih besar daripada manfaatnya.
*/

// Nama halaman sama persis dengan yang dipakai navbar — lihat catatan
// istilah di src/components/layout/Navbar.jsx.
const COLUMNS = [
  {
    title: 'Halaman',
    links: [
      { href: '/', label: 'Home' },
      { href: '/katalog', label: 'Menu' },
      { href: '/about', label: 'About' },
      { href: '/kontak', label: 'Kontak' },
    ],
  },
  {
    title: 'Pesan tanpa login',
    links: [
      { href: '/meja', label: 'Ketersediaan Meja' },
      { href: '/menu', label: 'Pesan Online' },
      { href: '/promo', label: 'Promo Hari Ini' },
      { href: '/#qr', label: 'QR Ordering' },
      { href: '/#faq', label: 'FAQ' },
    ],
  },
  // Tidak ada kolom "Staf & Admin" di sini, dan itu disengaja: daftar tautan
  // yang sejajar dengan halaman pelanggan membuat pintu staf terbaca sebagai
  // salah satu langkah pemesanan. Yang ada hanya SATU tautan "Masuk Staf" di
  // baris paling bawah — lihat catatan di dekatnya. `/register` dan `/admin`
  // tetap tidak pernah ditautkan dari sisi publik.
];

export default function Footer() {
  const tenant = useTenant();
  const t = useTenantHref();

  return (
    <footer className="mt-24 border-t border-slate-200 bg-slate-50">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo />
            {tenant.description && (
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500">
                {tenant.description}
              </p>
            )}
            <div className="mt-6 space-y-2 text-sm text-slate-500">
              {tenant.address && (
                <p className="flex items-start gap-2">
                  <span className="mt-0.5 text-brand-600">📍</span> {tenant.address}
                </p>
              )}
              {tenant.hours && (
                <p className="flex items-center gap-2">
                  <span className="text-brand-600">🕘</span> {tenant.hours}
                </p>
              )}
              {tenant.email && (
                <p className="flex items-center gap-2">
                  <span className="text-brand-600">✉️</span> {tenant.email}
                </p>
              )}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900">
                {col.title}
              </h4>
              <ul className="space-y-2.5 text-sm">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link href={t(link.href)} className="link-muted">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row">
          <div className="flex flex-col items-center gap-x-4 gap-y-2 sm:flex-row">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} {tenant.name}. Seluruh hak cipta dilindungi.
            </p>

            {/*
              Satu-satunya tautan ke sisi staf dari seluruh halaman publik.

              Tempatnya di baris paling bawah, bukan di navbar: pelanggan yang
              baru memindai QR di mejanya tidak pernah menggulung sejauh ini di
              tengah memesan, sedangkan kasir yang mencarinya tahu footer adalah
              tempat yang lazim. Menaruhnya di navbar — bersebelahan dengan
              "Pesan Sekarang" — adalah cara paling cepat membuat pelanggan
              mengira ia harus punya akun dulu, padahal justru sebaliknya.

              Satu tautan untuk SEMUA staf, bukan satu per role: form login-nya
              memang cuma satu, dan role-lah yang menentukan tujuannya setelah
              masuk (STAFF_HOME di src/lib/access.js).

              Diletakkan di sisi KIRI, sebaris dengan hak cipta, bukan ikut ke
              kelompok kanan bersama kanal sosial. Tombol WhatsApp mengambang
              (`fixed bottom-* right-*`, lihat WhatsappFloat.jsx) menutupi sudut
              kanan-bawah tepat ketika halaman digulung sampai habis — persis
              keadaan saat orang sedang mencari tautan ini.
            */}
            <span aria-hidden className="hidden h-4 w-px bg-slate-300 sm:block" />
            <Link href={t('/login')} className="link-muted text-sm">
              Masuk Staf
            </Link>
          </div>

          <div className="flex items-center gap-4 text-sm">
            {tenant.instagram && (
              <a href={tenant.instagram} target="_blank" rel="noreferrer" className="link-muted">
                Instagram
              </a>
            )}
            {tenant.tiktok && (
              <a href={tenant.tiktok} target="_blank" rel="noreferrer" className="link-muted">
                TikTok
              </a>
            )}
            {tenant.wa_number && (
              <a
                href={waLinkOf(tenant)}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-emerald-600 hover:text-emerald-700"
              >
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
