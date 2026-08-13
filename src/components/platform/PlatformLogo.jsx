import Link from 'next/link';
import { platform } from '@/lib/site';

/**
 * Lencana PLATFORM — kembaran `layout/Logo.jsx` untuk halaman di luar outlet.
 *
 * Dipisah, bukan diberi prop, karena keduanya berbeda pada hal yang paling
 * mendasar: `Logo` membaca nama outlet dari `TenantProvider` dan karena itu
 * wajib jadi komponen klien, sementara di `/` tidak ada outlet sama sekali —
 * memaksa satu komponen melayani keduanya berarti menyeret context tenant ke
 * halaman yang tidak punya tenant, lalu menambahkan cabang "kalau null" di
 * setiap barisnya.
 */
export default function PlatformLogo({ dark = false }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-pop transition group-hover:scale-105">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" strokeLinejoin="round" />
          <path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17" strokeLinecap="round" />
          <path d="M8 3v2M12 3v2" strokeLinecap="round" />
        </svg>
      </span>
      <span className="flex min-w-0 flex-col leading-none">
        <span
          className={`truncate text-lg font-extrabold tracking-tight ${
            dark ? 'text-white' : 'text-slate-900'
          }`}
        >
          {platform.name}
        </span>
        <span
          className={`mt-1 truncate text-[11px] font-medium ${
            dark ? 'text-brand-100' : 'text-slate-400'
          }`}
        >
          {platform.tagline}
        </span>
      </span>
    </Link>
  );
}
