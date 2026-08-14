'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { rupiah } from '@/lib/format';
import { PARAM_DEMO } from '@/lib/demo';
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
export default function ScanIntentDialog({
  tableNo,
  billCount = 0,
  billTotal = 0,
  demo = false,
}) {
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
  const q = `?meja=${encodeURIComponent(tableNo)}&src=qr${demo ? `&${PARAM_DEMO}=1` : ''}`;
  const adaTagihan = billCount > 0;

  const tambah = {
    href: t(`/menu${q}&mode=tambah`),
    title: 'Tambah Pesanan',
    desc: adaTagihan
      ? `Masuk ke tagihan meja ini — sekarang ${billCount} pesanan, ${rupiah(billTotal)}`
      : 'Sudah pernah pesan di meja ini? Tambahannya jadi satu tagihan',
  };

  const langsung = {
    href: t(`/menu${q}`),
    title: 'Langsung Pesan',
    desc: `Mulai dari sini — pesananmu tercatat untuk Meja ${tableNo}`,
  };

  /*
    SATU tombol besar, satu tautan kecil — bukan dua pilihan sejajar.

    Keduanya berakhir di halaman menu yang sama; yang membedakan cuma kalimat
    pengantarnya. Menyodorkannya sebagai dua kartu setara membuat pelanggan
    mengira ia sedang memilih dua ALUR yang berbeda, lalu berhenti untuk
    menimbang mana yang benar untuknya — keputusan yang tidak ada taruhannya,
    diminta pada detik pertama sesudah ia memindai QR.

    Keadaan mejanya sudah cukup untuk menebak: meja yang punya tagihan berjalan
    hampir pasti mau nambah, meja yang bersih hampir pasti baru mulai. Yang
    tertebak jadi tombol; yang tersisa tetap ada, satu baris di bawah, untuk
    yang tebakannya meleset.
  */
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

        <div className="mt-6">
          <Pilihan option={utama} />

          <p className="mt-4 text-center text-sm">
            <Link
              href={kedua.href}
              className="font-semibold text-slate-500 underline-offset-4 transition hover:text-brand-700 hover:underline"
            >
              {kedua.title} →
            </Link>
          </p>
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

/** Aksi utama — satu-satunya tombol di popup ini. */
function Pilihan({ option }) {
  return (
    <Link
      href={option.href}
      className="flex items-center gap-4 rounded-2xl bg-brand-600 p-5 text-white shadow-pop transition hover:bg-brand-700"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-extrabold">{option.title}</span>
        <span className="mt-0.5 block text-xs leading-snug text-brand-50">{option.desc}</span>
      </span>

      <span aria-hidden="true" className="shrink-0 text-xl text-white/70">
        →
      </span>
    </Link>
  );
}
