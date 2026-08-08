'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { rupiah } from '@/lib/format';
import { useTenantHref } from '@/components/tenant/TenantProvider';

/**
 * Popup yang muncul begitu QR meja dipindai.
 *
 * Tugasnya memotong satu pertanyaan yang selalu muncul di kepala pelanggan:
 * "saya ini mau mulai pesan, atau nambah ke pesanan tadi?" — dua-duanya
 * berakhir di halaman menu yang sama, tapi ditulis berbeda supaya pelanggan
 * tahu tambahannya menempel ke tagihan meja, bukan jadi tagihan terpisah.
 *
 * Mana yang ditonjolkan ditentukan keadaan meja, bukan tebakan: kalau meja itu
 * sudah punya tagihan berjalan, "Tambah Pesanan" yang jadi tombol utama.
 *
 * Ditutup → layar hub di belakangnya tetap bisa dipakai (Menu, Bayar, Promo).
 */
export default function ScanIntentDialog({ tableNo, billCount = 0, billTotal = 0 }) {
  const t = useTenantHref();
  const [open, setOpen] = useState(true);

  /*
    Perilakunya disamakan dengan `Modal`: Escape menutup, dan latar dikunci
    supaya hub di belakangnya tidak ikut bergulir. Ini layar PERTAMA sesudah
    memindai QR — latar yang bergeser di balik popup membuat pelanggan mengira
    pindaiannya gagal dan mencoba memindai ulang.
  */
  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  // `src=qr` menandai asal-usul meja untuk stepper di halaman menu — lihat
  // catatan di ScanHub.
  const q = `?meja=${encodeURIComponent(tableNo)}&src=qr`;
  const adaTagihan = billCount > 0;

  const tambah = {
    href: t(`/menu${q}&mode=tambah`),
    title: 'Tambah Pesanan',
    desc: adaTagihan
      ? `Langsung masuk ke kasir — tagihan meja ini sekarang ${billCount} pesanan, ${rupiah(billTotal)}`
      : 'Sudah pernah pesan di meja ini? Tambahannya jadi satu tagihan',
  };

  const langsung = {
    href: t(`/menu${q}`),
    title: 'Langsung Pesan',
    desc: `Belum pesan apa pun? Mulai dari sini — Meja ${tableNo}`,
  };

  // Yang paling mungkin dimaksud pelanggan ditaruh di atas dan diberi warna.
  const [utama, kedua] = adaTagihan ? [tambah, langsung] : [langsung, tambah];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="judul-scan"
        className="relative z-10 max-h-[92dvh] w-full max-w-md animate-fade-up overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl scroll-slim sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="eyebrow">Meja {tableNo} terbaca</p>
            <h2 id="judul-scan" className="mt-2.5 text-xl font-extrabold text-slate-900">
              {adaTagihan ? 'Mau nambah pesanan?' : 'Mau pesan apa?'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {adaTagihan
                ? 'Pesan sendiri dari sini — tidak perlu memanggil pelayan.'
                : 'Pesan sendiri dari meja ini, tanpa antre di kasir.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Tutup"
            className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mt-6 space-y-3">
          <Pilihan option={utama} primary />
          <Pilihan option={kedua} />
        </div>

        {/*
          Dua janji yang menentukan apakah pelanggan mau memakai QR ini alih-alih
          memanggil pelayan: pesanannya benar-benar sampai, dan bayarnya tidak
          jadi terpecah-pecah.
        */}
        <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-center text-xs leading-snug text-slate-500">
          Pesananmu <span className="font-semibold text-slate-700">langsung masuk ke kasir</span>
          {' '}begitu dikirim. Pembayaran tetap sekali saja di akhir, termasuk semua tambahan
          dari meja ini.
        </p>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-4 w-full rounded-xl py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
        >
          Lihat menu, tagihan, & promo dulu
        </button>
      </div>
    </div>
  );
}

function Pilihan({ option, primary = false }) {
  return (
    <Link
      href={option.href}
      className={`flex items-center gap-4 rounded-2xl border p-4 transition ${
        primary
          ? 'border-brand-300 bg-brand-600 text-white shadow-pop hover:bg-brand-700'
          : 'border-slate-200 bg-white hover:border-brand-200 hover:bg-brand-50/40'
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className={`block text-base font-bold ${primary ? 'text-white' : 'text-slate-900'}`}>
          {option.title}
        </span>
        <span
          className={`mt-0.5 block text-xs leading-snug ${primary ? 'text-brand-50' : 'text-slate-500'}`}
        >
          {option.desc}
        </span>
      </span>

      <span
        aria-hidden="true"
        className={`shrink-0 text-lg ${primary ? 'text-white/70' : 'text-slate-300'}`}
      >
        →
      </span>
    </Link>
  );
}
