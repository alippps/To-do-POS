'use client';

import { useEffect, useState } from 'react';

/**
 * Penanda bahwa layar ini memperbarui dirinya sendiri.
 *
 * Bukan hiasan. Begitu sebuah layar berhenti butuh F5, kasir kehilangan cara
 * untuk tahu apakah yang dilihatnya masih benar — "tidak ada pesanan baru" dan
 * "layarnya membeku" terlihat persis sama. Umur data yang berjalan naik
 * membedakan keduanya: angka yang terus bertambah tanpa pernah kembali ke nol
 * berarti pembaruannya yang mati, bukan kedainya yang sepi.
 */
function usia(ms) {
  const detik = Math.max(0, Math.round(ms / 1000));
  if (detik < 5) return 'baru saja';
  if (detik < 60) return `${detik} dtk lalu`;

  const menit = Math.round(detik / 60);
  if (menit < 60) return `${menit} mnt lalu`;

  return `${Math.round(menit / 60)} jam lalu`;
}

export default function LiveIndicator({ syncedAt, live, pending, onRefresh, className = '' }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className={`flex items-center gap-2.5 text-xs ${className}`}>
      <span className="flex items-center gap-1.5 font-semibold text-slate-500">
        <span className="relative flex h-2 w-2">
          {live && !pending && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${
              pending ? 'bg-brand-500' : live ? 'bg-emerald-500' : 'bg-amber-400'
            }`}
          />
        </span>
        {pending ? 'Menyegarkan…' : live ? 'Live' : 'Cek berkala'}
      </span>

      <span className="text-slate-300">·</span>

      <span className="text-slate-400">
        {syncedAt === null ? 'memuat' : usia(now - syncedAt)}
      </span>

      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-lg border border-slate-200 px-2.5 py-1 font-semibold text-slate-500 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
        >
          Segarkan
        </button>
      )}
    </div>
  );
}
