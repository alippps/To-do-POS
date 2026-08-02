'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

/**
 * Tombol aksi pada halaman struk. Diberi kelas `no-print` supaya
 * tidak ikut tercetak — yang keluar dari printer hanya `.receipt-paper`.
 */
export default function PrintReceiptBar({
  auto = false,
  backHref = '/admin/transaksi',
  backLabel = 'Kembali',
}) {
  const [copied, setCopied] = useState(false);

  // Dibuka dari tombol "Cetak Struk" (…?auto=1) → langsung munculkan dialog cetak.
  useEffect(() => {
    if (!auto) return;
    const id = setTimeout(() => window.print(), 600);
    return () => clearTimeout(id);
  }, [auto]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="no-print mx-auto mt-6 w-full max-w-[340px] space-y-3">
      <Button className="w-full" size="lg" onClick={() => window.print()}>
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 9V4h12v5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="3" y="9" width="18" height="8" rx="2" />
          <path d="M6 17h12v4H6z" strokeLinejoin="round" />
        </svg>
        Cetak Struk
      </Button>

      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={handleCopy}>
          {copied ? 'Tersalin ✓' : 'Salin tautan'}
        </Button>
        <Link
          href={backHref}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
        >
          {backLabel}
        </Link>
      </div>

      <p className="text-center text-[11px] leading-snug text-slate-400">
        Yang tercetak hanya struk ini, bukan seluruh halaman web.
      </p>
    </div>
  );
}
