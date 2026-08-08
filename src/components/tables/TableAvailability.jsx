'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TABLE_STATUS_LIST, tableStatus } from '@/lib/tables';
import { useTenantHref } from '@/components/tenant/TenantProvider';

const AUTO_REFRESH_MS = 15000;

/**
 * Grid ketersediaan meja — untuk pelanggan yang BELUM punya meja.
 *
 * Dulu komponen ini juga jadi layar pertama sesudah scan QR, lengkap dengan
 * kartu "QR berhasil dipindai" di atasnya. Sekarang tidak lagi: hasil scan
 * ditangani `ScanHub`, dan `(site)/meja/page.jsx` sudah lebih dulu pulang
 * membawa layar itu bila nomor mejanya cocok. Yang sampai ke sini hanyalah
 * pengunjung tanpa nomor meja — dari navbar, atau hendak pindah meja — dan
 * pemindai QR meja yang nomornya tidak terdaftar di denah.
 *
 * Karena itu `scannedTable` di sini selalu berarti nomor yang TIDAK dikenal.
 */
export default function TableAvailability({ tables = [], scannedTable = '' }) {
  const router = useRouter();
  const t = useTenantHref();
  const [filter, setFilter] = useState('Semua');
  const [refreshedAt, setRefreshedAt] = useState(null);

  /*
    TANPA `src=qr`, sengaja.

    Nomor mejanya memang sama-sama terkunci di keranjang lewat jalur mana pun,
    tapi stepper menceritakan hal berbeda: yang memilih dari denah ini benar-
    benar menjalani langkah "Pilih meja", jadi langkah itu ditandai selesai dan
    tetap bisa diklik untuk mengubah pilihannya. Yang memindai QR tidak pernah
    memilih apa pun — lihat catatan `langkahMejaQr` di FlowSteps.
  */
  const hrefMeja = (nomor) => t(`/menu?meja=${encodeURIComponent(nomor)}`);

  /*
    Status meja berubah tiap ada pesanan masuk / dilunasi kasir, jadi data
    disegarkan berkala tanpa perlu pelanggan menekan apa pun.

    Tapi hanya selama halamannya benar-benar dilihat. `router.refresh()` di
    halaman `force-dynamic` berarti satu putaran render server penuh; dulu itu
    berjalan tiap 15 detik selamanya — termasuk saat pelanggan sudah pindah
    tab, mengunci HP-nya, atau meninggalkan halaman ini terbuka sepanjang sore.
    Yang membayarnya baterai pelanggan dan kuota server, untuk angka yang tidak
    ada yang lihat. Begitu tabnya dibuka lagi, sekali penyegaran langsung
    dijalankan supaya yang tampil tidak basi.
  */
  useEffect(() => {
    let id = null;

    const mulai = () => {
      if (id) return;
      id = setInterval(() => {
        router.refresh();
        setRefreshedAt(new Date());
      }, AUTO_REFRESH_MS);
    };

    const berhenti = () => {
      if (!id) return;
      clearInterval(id);
      id = null;
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        router.refresh();
        setRefreshedAt(new Date());
        mulai();
      } else {
        berhenti();
      }
    };

    if (document.visibilityState === 'visible') mulai();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      berhenti();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [router]);

  const areas = useMemo(() => [...new Set(tables.map((t) => t.area))].sort(), [tables]);

  const visible = useMemo(
    () => (filter === 'Semua' ? tables : tables.filter((t) => t.area === filter)),
    [tables, filter]
  );

  const availableCount = tables.filter((t) => t.status === 'available').length;

  return (
    <div className="space-y-8">
      {scannedTable && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          Meja <span className="font-bold">{scannedTable}</span> tidak terdaftar di denah kami.
          Silakan pilih meja yang tersedia di bawah ini.
        </div>
      )}

      {/* Ringkasan + legenda */}
      <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <span className="absolute inline-flex h-3 w-3 animate-pulse-ring rounded-full bg-emerald-400" />
            <span className="relative text-lg font-extrabold">{availableCount}</span>
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">
              {availableCount} dari {tables.length} meja tersedia
            </p>
            <p className="text-xs text-slate-500">
              Diperbarui otomatis tiap 15 detik
              {refreshedAt && ` · terakhir ${refreshedAt.toLocaleTimeString('id-ID')}`}
            </p>
          </div>
        </div>

        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {TABLE_STATUS_LIST.map((s) => (
            <li key={s.value} className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
              {s.label}
            </li>
          ))}
        </ul>
      </div>

      {/* Filter area */}
      {areas.length > 1 && (
        <div className="scroll-slim -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {['Semua', ...areas].map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setFilter(a)}
              className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                filter === a
                  ? 'bg-brand-600 text-white shadow-pop'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      )}

      {/* Denah meja */}
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
          {/*
            Kalimat lama menginstruksikan admin ("tambahkan lewat menu Denah
            Meja") di halaman yang dibaca pelanggan — bocornya sisi staf ke
            antarmuka publik, persis yang dilarang catatan isolasi di
            src/components/layout/Navbar.jsx.
          */}
          <p className="font-semibold text-slate-800">Denah meja belum tersedia</p>
          <p className="mt-1 text-sm text-slate-500">
            Silakan tanyakan tempat duduk ke barista kami — pesanan tetap bisa dibuat seperti biasa.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/*
            Kartu meja di bawah adalah tautan, tapi tampilannya tidak seperti
            tombol — tanpa kalimat ini pelanggan sering diam menunggu, tidak
            sadar kartunya bisa ditekan.
          */}
          <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/70 px-4 py-3">
            <span aria-hidden="true" className="text-base leading-none">👆</span>
            <p className="text-sm leading-snug text-brand-900">
              <span className="font-bold">Ketuk salah satu kartu meja</span> di bawah untuk lanjut ke
              daftar menu. Meja bertanda titik hijau berarti masih kosong.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((meja) => (
              <TableCard key={meja.id} table={meja} hrefFor={hrefMeja} />
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-slate-400">
        Tidak menemukan meja kosong? Sampaikan ke barista kami — mereka akan membantu mencarikan tempat.
      </p>
    </div>
  );
}

function TableCard({ table, hrefFor }) {
  const s = tableStatus(table.status);
  const free = table.status === 'available';

  return (
    <Link
      href={hrefFor(table.table_no)}
      aria-label={`Meja ${table.table_no}, ${s.label}`}
      className={`group relative flex flex-col gap-3 rounded-2xl border p-4 transition ${s.ring} ${
        free ? 'hover:-translate-y-1 hover:shadow-card' : 'opacity-80 hover:opacity-100'
      }`}
    >
      <div className="flex items-start justify-between">
        <span className="font-display text-2xl font-bold text-slate-900">{table.table_no}</span>
        <span className={`mt-1 flex h-2.5 w-2.5 rounded-full ${s.dot}`} aria-hidden="true" />
      </div>

      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-slate-700">{table.label || table.area}</p>
        <p className="mt-0.5 text-[11px] text-slate-500">{table.capacity} kursi · {table.area}</p>
      </div>

      <span className={`text-[11px] font-bold uppercase tracking-wide ${s.text}`}>{s.short}</span>
    </Link>
  );
}
