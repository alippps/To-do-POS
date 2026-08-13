import Link from 'next/link';
import PlatformLogo from './PlatformLogo';
import { platform } from '@/lib/site';
import { tenantPath } from '@/lib/tenant';

/**
 * Footer PLATFORM.
 *
 * Berbeda dari footer outlet pada satu hal yang menentukan: di sini TIDAK ada
 * tautan "Masuk Staf". Login itu selalu milik sebuah outlet — `/login`
 * sendirian bukan alamat yang sah sejak v4 — jadi menaruhnya di halaman
 * platform berarti menawarkan pintu yang tidak tahu hendak membuka rumah yang
 * mana. Staf masuk lewat footer outletnya sendiri.
 *
 * Komponen server: isinya tidak butuh apa pun dari browser. Daftar outletnya
 * dikirim sebagai prop oleh layout, yang memang sudah membacanya.
 */
export default function PlatformFooter({ outlets = [] }) {
  return (
    <footer className="mt-24 border-t border-slate-200 bg-slate-50">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <PlatformLogo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500">
              {platform.description}
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/#fitur" className="link-muted">
                  Fitur
                </Link>
              </li>
              <li>
                <Link href="/#cara-kerja" className="link-muted">
                  Cara Kerja
                </Link>
              </li>
              <li>
                <Link href="/#keunggulan" className="link-muted">
                  Keunggulan
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="link-muted">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/#kontak" className="link-muted">
                  Kontak
                </Link>
              </li>
              <li>
                <Link href="/daftar-outlet" className="font-semibold text-brand-600 hover:text-brand-700">
                  Daftarkan UMKM
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900">
              Outlet
            </h4>
            {outlets.length === 0 ? (
              <p className="text-sm text-slate-400">Belum ada outlet terdaftar.</p>
            ) : (
              <ul className="space-y-2.5 text-sm">
                {outlets.slice(0, 6).map((o) => (
                  <li key={o.id}>
                    <Link href={tenantPath(o.slug)} className="link-muted">
                      {o.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-12 border-t border-slate-200 pt-6">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} {platform.name}. Seluruh hak cipta dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
}
