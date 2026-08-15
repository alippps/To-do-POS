import Link from 'next/link';
import PlatformLogo from './PlatformLogo';
import { platform } from '@/lib/site';
import { tenantPath } from '@/lib/tenant';
import { ArrowRight } from 'lucide-react';

/**
 * Footer PLATFORM.
 * Tanpa tautan "Masuk Staf" karena otentikasi bersifat spesifik per outlet (tenant-level).
 */
export default function PlatformFooter({ outlets = [] }) {
  return (
    <footer className="mt-24 border-t border-slate-200 bg-slate-50 relative overflow-hidden">
      {/* Dekorasi Aksent Halus */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      
      <div className="container-page py-16 sm:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 pr-8">
            <PlatformLogo />
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-slate-500">
              {platform.description}
            </p>
          </div>

          {/* Navigasi Platform */}
          <div>
            <h4 className="mb-6 text-xs font-bold uppercase tracking-widest text-slate-900">
              Platform
            </h4>
            <ul className="space-y-3.5 text-sm font-medium">
              {[
                { href: '/#fitur', label: 'Fitur' },
                { href: '/#cara-kerja', label: 'Cara Kerja' },
                { href: '/#keunggulan', label: 'Keunggulan' },
                { href: '/#faq', label: 'FAQ' },
                { href: '/#kontak', label: 'Kontak' },
              ].map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="group inline-flex items-center text-slate-500 transition-colors hover:text-brand-600"
                  >
                    <ArrowRight className="mr-2 h-3 w-3 -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                    <span className="transition-transform duration-300 group-hover:translate-x-1">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
              <li className="pt-2">
                <Link 
                  href="/daftar-outlet" 
                  className="inline-flex items-center text-brand-600 transition-colors hover:text-brand-700"
                >
                  Daftarkan UMKM <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Daftar Outlet (Directory Preview) */}
          <div>
            <h4 className="mb-6 text-xs font-bold uppercase tracking-widest text-slate-900">
              Outlet Mitra
            </h4>
            {outlets.length === 0 ? (
              <p className="text-sm text-slate-400 font-medium">Belum ada outlet terdaftar.</p>
            ) : (
              <ul className="space-y-3.5 text-sm font-medium">
                {outlets.slice(0, 6).map((o) => (
                  <li key={o.id}>
                    <Link 
                      href={tenantPath(o.slug)} 
                      className="group inline-flex items-center text-slate-500 transition-colors hover:text-brand-600"
                    >
                      <ArrowRight className="mr-2 h-3 w-3 -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                      <span className="transition-transform duration-300 group-hover:translate-x-1 truncate max-w-[180px]">
                        {o.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Hak Cipta */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-slate-200/80 pt-8 sm:flex-row">
          <p className="text-sm font-medium text-slate-500">
            © {new Date().getFullYear()} {platform.name}. Seluruh hak cipta dilindungi.
          </p>
          <div className="flex gap-4 text-sm font-medium text-slate-400">
            <span className="cursor-not-allowed hover:text-slate-600 transition-colors">Privasi</span>
            <span>·</span>
            <span className="cursor-not-allowed hover:text-slate-600 transition-colors">Syarat & Ketentuan</span>
          </div>
        </div>
      </div>
    </footer>
  );
}