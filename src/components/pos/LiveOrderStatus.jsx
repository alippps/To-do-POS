'use client';

import { useLiveRefresh } from '@/lib/useLiveRefresh';

/**
 * Penjaga status pesanan di layar PELANGGAN.
 *
 * Pelanggan memegang HP-nya sambil menunggu kasir menandai lunas. Sampai
 * sekarang satu-satunya cara ia tahu statusnya berubah adalah menarik layar
 * untuk memuat ulang — dan yang tidak terpikir melakukannya akan menatap
 * "Menunggu pembayaran" pada pesanan yang sebenarnya sudah lunas beberapa
 * menit lalu.
 *
 * ── Kenapa di sini TIDAK ada Supabase Realtime ──
 *
 * Bukan karena terlewat. Tabel `transactions` memang tertutup untuk tamu:
 * policy bacanya menuntut `is_staff_of(tenant_id) or user_id = auth.uid()`,
 * dan itu sebabnya kedua halaman ini mengambil datanya lewat RPC
 * `SECURITY DEFINER` (`get_receipt`, `get_table_bill`) — bukan dari tabelnya
 * langsung.
 *
 * Realtime mengevaluasi RLS untuk siapa pun yang berlangganan. Pelanggan
 * anonim tidak punya izin baca atas `transactions`, jadi langganan
 * `postgres_changes` di sini tidak akan pernah menerima satu event pun.
 * Menyalakannya butuh policy baca yang longgar — dan itu berarti setiap tamu
 * yang membuka halaman ini bisa membaca pesanan seluruh tamu lain di kedai
 * itu, lengkap dengan nama pemesannya. Layar yang lebih cepat satu-dua detik
 * tidak sebanding dengan itu.
 *
 * Jadi polling di sini bukan versi murahan dari Realtime, melainkan satu-satunya
 * bentuk yang benar. `router.refresh()` menempuh jalur yang sama dengan
 * kunjungan biasa: lewat RPC, yang hanya memulangkan satu invoice atau tagihan
 * satu meja.
 *
 * Berhenti sendiri begitu tidak ada lagi yang ditunggu (`active` = false) —
 * struk lunas yang tertinggal terbuka di HP tidak perlu menanyai server
 * seumur hidup baterainya.
 */
export default function LiveOrderStatus({
  active,
  label = 'Menunggu konfirmasi kasir',
  doneLabel = null,
  className = '',
}) {
  const { pending } = useLiveRefresh({
    // Tanpa tabel yang diawasi → polling saja, tanpa langganan Realtime.
    tables: [],
    enabled: active,
  });

  if (!active) {
    return doneLabel ? (
      <p className={`text-center text-xs text-slate-400 ${className}`}>{doneLabel}</p>
    ) : null;
  }

  return (
    <p
      className={`flex items-center justify-center gap-2 text-center text-xs text-slate-500 ${className}`}
      /*
        `polite` — perubahan status bukan peringatan darurat, jadi pembaca
        layar menyelesaikan kalimatnya dulu sebelum menyebutkan ini.
      */
      aria-live="polite"
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span
          className={`absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75 ${
            pending ? '' : 'animate-ping'
          }`}
        />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
      </span>
      <span>
        {label} · <span className="font-medium">halaman ini memperbarui dirinya sendiri</span>
      </span>
    </p>
  );
}
