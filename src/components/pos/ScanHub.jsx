'use client';

import Link from 'next/link';
import ScanIntentDialog from './ScanIntentDialog';
import { rupiah } from '@/lib/format';
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
export default function ScanHub({ table, billTotal = 0, billCount = 0, promoCount = 0 }) {
  const t = useTenantHref();
  const meja = table.table_no;
  const q = `?meja=${encodeURIComponent(meja)}`;

  /*
    Halaman menu perlu tahu mejanya datang dari QR, bukan dari denah — di sana
    stepper berhenti menyuruh "pilih meja". Ditandai di sini, bukan dibaca dari
    URL masuk, supaya QR lama yang terlanjur tercetak (tanpa `src`) tetap ikut
    benar: sampai di layar ini artinya memang habis memindai.
  */
  const qQr = `${q}&src=qr`;

  const TILES = [
    {
      // Nomor meja ikut dibawa: katalog memakainya untuk menawarkan "Pesan
      // untuk Meja 07" di ujung halaman, alih-alih memulangkan pelanggan ke
      // denah untuk memilih meja yang sedang ia duduki.
      href: t(`/katalog${q}`),
      emoji: '📖',
      title: 'Lihat Menu',
      desc: 'Semua menu & harga — baca saja',
      tone: 'border-slate-200 bg-white hover:border-brand-200',
    },
    {
      href: t(`/menu${qQr}`),
      emoji: '🛒',
      title: 'Pesan',
      /*
        Pelanggan yang sudah memesan di kasir lalu duduk akan melihat kalimat
        yang berbeda: tugas QR baginya bukan "mulai memesan" tapi "nambah",
        dan tambahannya menempel ke tagihan meja yang sama.
      */
      desc:
        billCount > 0
          ? 'Tambah pesanan — masuk ke tagihan meja ini'
          : 'Pesan langsung dari meja ini',
      tone: 'border-brand-300 bg-brand-600 text-white hover:bg-brand-700',
      primary: true,
    },
    {
      href: t(`/bayar${q}`),
      emoji: '💳',
      title: 'Bayar',
      desc:
        billCount > 0
          ? `${billCount} pesanan · ${rupiah(billTotal)}`
          : 'Cek tagihan meja ini',
      badge: billCount > 0 ? rupiah(billTotal) : null,
      tone: 'border-slate-200 bg-white hover:border-brand-200',
    },
    {
      href: t(`/promo${q}`),
      emoji: '🔥',
      title: 'Promo Hari Ini',
      desc: promoCount > 0 ? `${promoCount} menu sedang diskon` : 'Cek penawaran hari ini',
      badge: promoCount > 0 ? `${promoCount} menu` : null,
      tone: 'border-amber-200 bg-amber-50 hover:border-amber-300',
    },
  ];

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/*
        Popup dulu, hub belakangan. Popup menjawab dua niat yang paling sering
        (pesan / nambah); hub di belakangnya untuk sisanya — lihat menu, cek
        tagihan, lihat promo.
      */}
      <ScanIntentDialog tableNo={meja} billCount={billCount} billTotal={billTotal} />

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

      <p className="mt-8 text-center text-sm text-slate-500">
        Mau mulai dari mana? Semua bisa dilakukan tanpa membuat akun.
      </p>

      {/*
        Diberi landmark bernama, bukan sekadar <div>.

        Empat kartu ini adalah navigasi utama layar hasil scan — pembaca layar
        bisa melompat langsung ke sini alih-alih menyusuri kartu identitas meja
        lebih dulu. Namanya juga memberi test e2e pegangan yang stabil: sebelum
        ada ini, satu-satunya cara menunjuk kartu "Pesan" adalah menebak awalan
        namanya, dan tautan "Pesan Online" di footer ikut tersangkut.
      */}
      <nav aria-label="Pilihan untuk meja ini" className="mt-4 grid gap-4 sm:grid-cols-2">
        {TILES.map((t) => (
          <Link
            key={t.title}
            href={t.href}
            className={`group flex items-start gap-4 rounded-2xl border p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-pop ${t.tone}`}
          >
            <span
              aria-hidden="true"
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${
                t.primary ? 'bg-white/20' : 'bg-slate-50'
              }`}
            >
              {t.emoji}
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span
                  className={`text-lg font-bold ${t.primary ? 'text-white' : 'text-slate-900'}`}
                >
                  {t.title}
                </span>
                <span
                  aria-hidden="true"
                  className={`shrink-0 text-lg transition group-hover:translate-x-0.5 ${
                    t.primary ? 'text-white/70' : 'text-slate-300'
                  }`}
                >
                  →
                </span>
              </span>
              <span
                className={`mt-1 block text-sm leading-snug ${
                  t.primary ? 'text-brand-50' : 'text-slate-500'
                }`}
              >
                {t.desc}
              </span>
            </span>
          </Link>
        ))}
      </nav>

      <p className="mt-8 text-center text-sm">
        <Link href={t('/meja')} className="link-muted">
          Duduk di meja lain? Lihat meja yang kosong →
        </Link>
      </p>
    </div>
  );
}
