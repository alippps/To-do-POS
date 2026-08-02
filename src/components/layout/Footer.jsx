import Link from 'next/link';
import Logo from './Logo';
import { site, waLink } from '@/lib/site';

const COLUMNS = [
  {
    title: 'Halaman',
    links: [
      { href: '/', label: 'Home' },
      { href: '/fitur', label: 'Fitur Utama' },
      { href: '/about', label: 'About' },
      { href: '/kontak', label: 'Kontak' },
    ],
  },
  {
    title: 'Produk',
    links: [
      { href: '/fitur', label: 'Pesan Online' },
      { href: '/#layanan', label: 'Layanan' },
      { href: '/#portfolio', label: 'Portfolio' },
      { href: '/#faq', label: 'FAQ' },
    ],
  },
  {
    title: 'Akun',
    links: [
      { href: '/login', label: 'Masuk' },
      { href: '/register', label: 'Daftar' },
      { href: '/admin', label: 'Dashboard Admin' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-slate-200 bg-slate-50">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500">{site.description}</p>
            <div className="mt-6 space-y-2 text-sm text-slate-500">
              <p className="flex items-start gap-2">
                <span className="mt-0.5 text-brand-600">📍</span> {site.address}
              </p>
              <p className="flex items-center gap-2">
                <span className="text-brand-600">🕘</span> {site.hours}
              </p>
              <p className="flex items-center gap-2">
                <span className="text-brand-600">✉️</span> {site.email}
              </p>
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
                    <Link href={link.href} className="link-muted">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} {site.name}. Seluruh hak cipta dilindungi.
          </p>
          <div className="flex items-center gap-4 text-sm">
            <a href={site.social.instagram} target="_blank" rel="noreferrer" className="link-muted">
              Instagram
            </a>
            <a href={site.social.tiktok} target="_blank" rel="noreferrer" className="link-muted">
              TikTok
            </a>
            <a href={waLink()} target="_blank" rel="noreferrer" className="font-semibold text-emerald-600 hover:text-emerald-700">
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
