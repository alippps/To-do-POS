'use client';

import Link from 'next/link';
import ScanIntentDialog from './ScanIntentDialog';
import { rupiah } from '@/lib/format';
import { PARAM_DEMO } from '@/lib/demo';
import { useTenantHref } from '@/components/tenant/TenantProvider';

/**
 * Layar pertama setelah pelanggan men-scan QR meja.
 *
 * Dulu hasil scan langsung menampilkan grid ketersediaan meja — padahal yang
 * memindai QR meja 07 memang sedang duduk di meja 07, jadi ia disuruh memilih
 * sesuatu yang sudah jelas. Sekarang yang muncul empat pilihan yang benar-benar
 * ia butuhkan, dengan nomor mejanya terbawa ke mana-mana.
 *
 * Grid ketersediaan meja tetap ada di `/meja` tanpa parameter, dan ditautkan
 * di bawah untuk kasus "saya pindah meja".
 */
export default function ScanHub({
  table,
  billTotal = 0,
  billCount = 0,
  promoCount = 0,
  demo = false,
}) {
  const t = useTenantHref();
  const meja = table.table_no;
  const sufiksDemo = demo ? `&${PARAM_DEMO}=1` : '';
  const q = `?meja=${encodeURIComponent(meja)}${sufiksDemo}`;

  /*
    Halaman menu perlu tahu mejanya datang dari QR, bukan dari denah — di sana
    stepper berhenti menyuruh "pilih meja". Ditandai di sini, bukan dibaca dari
    URL masuk, supaya QR lama yang terlanjur tercetak (tanpa `src`) tetap ikut
    benar: sampai di layar ini artinya memang habis memindai.
  */
  const qQr = `?meja=${encodeURIComponent(meja)}&src=qr${sufiksDemo}`;

  /*
    SATU aksi utama, sisanya tautan kecil.

    Sebelumnya keempatnya kartu sebesar telapak tangan dalam grid dua kolom,
    dan tiga di antaranya berdiri sejajar dengan yang benar-benar dituju
    orangnya. Yang memindai QR di mejanya datang untuk MEMESAN — "lihat menu",
    "cek tagihan", dan "lihat promo" adalah hal-hal yang mungkin ia inginkan,
    bukan hal yang ia datangi. Empat pilihan setara memaksanya memutuskan
    sesuatu sebelum boleh mulai, dan itu terjadi tepat di layar pertama sesudah
    memindai — saat ia paling tidak sabar.

    Ketiganya tidak dihapus: yang berubah cuma bobotnya. Yang mencarinya tetap
    menemukannya satu baris di bawah.
  */
  const TAUTAN_KECIL = [
    {
      href: t(`/katalog${q}`),
      emoji: '📖',
      label: 'Daftar harga',
      badge: null,
    },
    {
      href: t(`/bayar${q}`),
      emoji: '💳',
      label: 'Tagihan meja ini',
      badge: billCount > 0 ? rupiah(billTotal) : null,
    },
    {
      href: t(`/promo${q}`),
      emoji: '🔥',
      label: 'Promo hari ini',
      badge: promoCount > 0 ? `${promoCount} menu` : null,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/*
        Popup dulu, hub belakangan. Popup menjawab dua niat yang paling sering
        (pesan / nambah); hub di belakangnya untuk sisanya — lihat menu, cek
        tagihan, lihat promo.
      */}
      <ScanIntentDialog
        tableNo={meja}
        billCount={billCount}
        billTotal={billTotal}
        demo={demo}
      />

      {/* Identitas meja — penegasan bahwa QR-nya terbaca benar */}
      <div className="card-accent animate-fade-up p-6 sm:p-8">
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-brand-600 text-white shadow-pop">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-100">Meja</span>
            <span className="font-display text-3xl font-bold leading-none">{meja}</span>
          </div>

          <div className="min-w-0">
            <p className="eyebrow">QR berhasil dipindai</p>
            <h1 className="mt-2 truncate text-2xl font-extrabold text-slate-900">
              {table.label || `Meja ${meja}`}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{table.area}</p>
            {/*
              Dulu di sini terpampang status ketersediaan meja. Bagi yang sedang
              menduduki meja itu kalimatnya justru berlawanan dengan kenyataan —
              "Tersedia" dibaca oleh orang yang jelas-jelas sudah memakainya, dan
              kapasitas kursi tidak menjawab apa pun yang sedang ia butuhkan.
              Yang benar-benar berguna baginya cuma satu: meja ini sudah punya
              tagihan berjalan atau belum.
            */}
            <span
              className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${
                billCount > 0
                  ? 'border-amber-200 bg-amber-50/70 text-amber-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${billCount > 0 ? 'bg-amber-500' : 'bg-slate-300'}`}
              />
              {billCount > 0
                ? `Tagihan berjalan · ${billCount} pesanan · ${rupiah(billTotal)}`
                : 'Belum ada pesanan di meja ini'}
            </span>
          </div>
        </div>
      </div>

      {/*
        Diberi landmark bernama, bukan sekadar <div>.

        Ini navigasi utama layar hasil scan — pembaca layar bisa melompat
        langsung ke sini alih-alih menyusuri kartu identitas meja lebih dulu.
        Namanya juga memberi test e2e pegangan yang stabil: sebelum ada ini,
        satu-satunya cara menunjuk tautan "Pesan" adalah menebak awalan
        namanya, dan tautan "Pesan Online" di footer ikut tersangkut.
      */}
      <nav aria-label="Pilihan untuk meja ini" className="mt-6">
        <Link
          href={t(`/menu${qQr}`)}
          className="group flex items-center gap-4 rounded-2xl bg-brand-600 p-5 text-white shadow-pop transition hover:-translate-y-0.5 hover:bg-brand-700 sm:p-6"
        >
          <span
            aria-hidden="true"
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/20 text-3xl"
          >
            🛒
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-xl font-extrabold sm:text-2xl">
              {billCount > 0 ? 'Tambah Pesanan' : 'Pesan Sekarang'}
            </span>
            <span className="mt-1 block text-sm leading-snug text-brand-50">
              {billCount > 0
                ? `Masuk ke tagihan Meja ${meja} yang sedang berjalan`
                : `Pesan langsung dari Meja ${meja} — tanpa antre di kasir`}
            </span>
          </span>

          <span
            aria-hidden="true"
            className="shrink-0 text-2xl text-white/70 transition group-hover:translate-x-1"
          >
            →
          </span>
        </Link>

        {/* Sisanya: tautan kecil sebaris, bukan kartu yang menyaingi. */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
          {TAUTAN_KECIL.map((tautan) => (
            <Link
              key={tautan.label}
              href={tautan.href}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 underline-offset-4 transition hover:text-brand-700 hover:underline"
            >
              <span aria-hidden="true">{tautan.emoji}</span>
              {tautan.label}
              {tautan.badge && (
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700">
                  {tautan.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </nav>

      <p className="mt-8 text-center text-sm">
        <Link href={t('/meja')} className="link-muted">
          Duduk di meja lain? Lihat meja yang kosong →
        </Link>
      </p>
    </div>
  );
}
