'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { TABLE_STATUS_LIST, tableStatus } from '@/lib/tables';

const AUTO_REFRESH_MS = 15000;

/**
 * Grid ketersediaan meja — inilah halaman pertama yang dilihat pelanggan
 * setelah men-scan QR. Tanpa login: cukup lihat meja mana yang kosong,
 * lalu lanjut ke daftar menu.
 */
export default function TableAvailability({ tables = [], scannedTable = '' }) {
  const router = useRouter();
  const [filter, setFilter] = useState('Semua');
  const [refreshedAt, setRefreshedAt] = useState(null);

  // Status meja berubah tiap ada pesanan masuk / dilunasi kasir,
  // jadi data disegarkan berkala tanpa perlu pelanggan menekan apa pun.
  useEffect(() => {
    const id = setInterval(() => {
      router.refresh();
      setRefreshedAt(new Date());
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [router]);

  const areas = useMemo(() => [...new Set(tables.map((t) => t.area))].sort(), [tables]);

  const visible = useMemo(
    () => (filter === 'Semua' ? tables : tables.filter((t) => t.area === filter)),
    [tables, filter]
  );

  const scanned = tables.find((t) => t.table_no === scannedTable);
  const availableCount = tables.filter((t) => t.status === 'available').length;

  return (
    <div className="space-y-8">
      {/* Kartu meja yang barusan di-scan */}
      {scanned && <ScannedTableCard table={scanned} />}

      {scannedTable && !scanned && (
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
          <p className="font-semibold text-slate-800">Belum ada meja terdaftar</p>
          <p className="mt-1 text-sm text-slate-500">
            Admin dapat menambahkan denah meja lewat menu <span className="font-semibold">Denah Meja</span>.
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
            {visible.map((t) => (
              <TableCard key={t.id} table={t} highlight={t.table_no === scannedTable} />
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

function ScannedTableCard({ table }) {
  const s = tableStatus(table.status);
  const free = table.status === 'available';

  return (
    <div className="card-accent animate-fade-up p-6 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-brand-600 text-white shadow-pop">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-100">Meja</span>
            <span className="font-display text-3xl font-bold leading-none">{table.table_no}</span>
          </div>

          <div>
            <p className="eyebrow">QR berhasil dipindai</p>
            <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
              {table.label || `Meja ${table.table_no}`}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {table.area} · kapasitas {table.capacity} orang
            </p>
            <span
              className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${s.ring} ${s.text}`}
            >
              <span className={`h-2 w-2 rounded-full ${s.dot}`} />
              {s.label} — {s.description}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:w-52">
          <Button href={`/menu?meja=${encodeURIComponent(table.table_no)}`} size="lg">
            {free ? 'Pesan dari meja ini' : 'Tetap pesan di sini'}
          </Button>
          {!free && (
            <p className="text-center text-[11px] leading-snug text-slate-400">
              Meja ini sedang terisi. Kamu tetap bisa memesan, atau pilih meja lain di bawah.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function TableCard({ table, highlight }) {
  const s = tableStatus(table.status);
  const free = table.status === 'available';

  return (
    <Link
      href={`/menu?meja=${encodeURIComponent(table.table_no)}`}
      aria-label={`Meja ${table.table_no}, ${s.label}`}
      className={`group relative flex flex-col gap-3 rounded-2xl border p-4 transition ${s.ring} ${
        highlight ? 'ring-2 ring-brand-500 ring-offset-2' : ''
      } ${free ? 'hover:-translate-y-1 hover:shadow-card' : 'opacity-80 hover:opacity-100'}`}
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
