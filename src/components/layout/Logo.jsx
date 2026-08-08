'use client';

import Link from 'next/link';
import { useTenant, useTenantHref } from '@/components/tenant/TenantProvider';

/**
 * Lencana outlet.
 *
 * Namanya dibaca dari outlet yang sedang dibuka, bukan dari konstanta — sejak
 * satu pemasangan melayani banyak UMKM, "To Do" bukan lagi jawaban yang selalu
 * benar. Tautannya pun pulang ke beranda OUTLET ITU, bukan ke direktori
 * platform: pelanggan yang memindai QR di Kopi Pagi tidak sedang mencari
 * daftar penyewa.
 */
export default function Logo({ href, dark = false, compact = false }) {
  const tenant = useTenant();
  const t = useTenantHref();

  return (
    <Link href={href || t('/')} className="group inline-flex items-center gap-2.5">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-pop transition group-hover:scale-105">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" strokeLinejoin="round" />
          <path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17" strokeLinecap="round" />
          <path d="M8 3v2M12 3v2" strokeLinecap="round" />
        </svg>
      </span>
      {!compact && (
        <span className="flex min-w-0 flex-col leading-none">
          <span
            className={`truncate text-lg font-extrabold tracking-tight ${
              dark ? 'text-white' : 'text-slate-900'
            }`}
          >
            {tenant.name}
          </span>
          <span className={`mt-1 truncate text-[11px] font-medium ${dark ? 'text-brand-100' : 'text-slate-400'}`}>
            {tenant.tagline}
          </span>
        </span>
      )}
    </Link>
  );
}
