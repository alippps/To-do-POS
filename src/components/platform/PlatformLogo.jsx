import Link from 'next/link';
import { platform } from '@/lib/site';
import { Coffee } from 'lucide-react';

/**
 * Lencana PLATFORM — kembaran `layout/Logo.jsx` untuk halaman di luar outlet.
 *
 * Dipisah, bukan diberi prop, karena perbedaan mendasar rendering (Server vs Client).
 */
export default function PlatformLogo({ dark = false }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-3">
      {/* Container Logo dengan interaksi hover */}
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-md shadow-brand-600/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-brand-600/30">
        <Coffee className="h-5 w-5" strokeWidth={2.5} />
      </span>

      {/* Tipografi Logo */}
      <span className="flex min-w-0 flex-col leading-none">
        <span
          className={`truncate text-lg font-black tracking-tight transition-colors ${
            dark ? 'text-white' : 'text-slate-900 group-hover:text-brand-700'
          }`}
        >
          {platform.name}
        </span>
        <span
          className={`mt-1 truncate text-[11px] font-bold uppercase tracking-wider transition-colors ${
            dark ? 'text-brand-200' : 'text-slate-400 group-hover:text-brand-500'
          }`}
        >
          {platform.tagline}
        </span>
      </span>
    </Link>
  );
}