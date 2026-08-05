import Link from 'next/link';

/**
 * Penunjuk langkah alur pemesanan pelanggan.
 *
 * Halaman /meja, /menu, dan /struk berdiri sendiri-sendiri, sehingga pelanggan
 * yang baru men-scan QR tidak punya gambaran ada berapa langkah lagi sampai
 * pesanannya jadi. Komponen ini dipasang di ketiganya supaya posisi "saya di
 * mana sekarang" selalu terlihat.
 *
 * Langkah yang SUDAH dilewati sengaja dibuat bisa diklik — itu jalan pulang
 * kalau pelanggan salah pilih meja atau ingin menambah menu.
 */
const STEPS = [
  { key: 'meja', title: 'Pilih meja', hint: 'Cek meja yang kosong' },
  { key: 'menu', title: 'Pesan menu', hint: 'Isi keranjang & nama' },
  { key: 'struk', title: 'Bayar di kasir', hint: 'Tunjukkan nomor pesanan' },
];

/**
 * Langkah ketiga berganti wajah mengikuti status pembayaran.
 *
 * Selama belum lunas ia berbunyi "Bayar di kasir" — itu instruksi. Begitu kasir
 * menandai lunas, langkah itu bukan lagi tugas yang menunggu melainkan bukti
 * bahwa prosesnya tuntas, jadi teksnya berganti dan ikut menghijau seperti dua
 * langkah sebelumnya.
 */
const LANGKAH_BAYAR = {
  paid: { title: 'Pembayaran lunas', hint: 'Selesai — terima kasih' },
  cancelled: { title: 'Pesanan dibatalkan', hint: 'Hubungi kasir bila keliru' },
};

export default function FlowSteps({
  current = 'meja',
  tableNo = '',
  paymentStatus = null,
  className = '',
}) {
  const found = STEPS.findIndex((s) => s.key === current);
  const activeIndex = found === -1 ? 0 : found;

  const lunas = paymentStatus === 'paid';
  const batal = paymentStatus === 'cancelled';

  // Nomor meja ikut dibawa saat mundur, supaya pilihan pelanggan tidak hilang.
  const suffix = tableNo ? `?meja=${encodeURIComponent(tableNo)}` : '';
  const hrefOf = (key) => (key === 'meja' ? `/meja${suffix}` : `/menu${suffix}`);

  return (
    <nav aria-label="Langkah pemesanan" className={`no-print ${className}`}>
      <ol className="flex items-stretch gap-2 sm:gap-3">
        {STEPS.map((step, i) => {
          const langkahBayar = step.key === 'struk';
          const teks = (langkahBayar && LANGKAH_BAYAR[paymentStatus]) || step;

          // Lunas membuat langkah terakhir ikut dihitung selesai, bukan aktif.
          const done = i < activeIndex || (lunas && i === activeIndex);
          const gagal = batal && langkahBayar && i === activeIndex;
          const active = i === activeIndex && !done && !gagal;

          const box = gagal
            ? 'border-rose-200 bg-rose-50/70'
            : active
              ? 'border-brand-200 bg-white shadow-card'
              : done
                ? 'border-emerald-200 bg-emerald-50/70 hover:bg-emerald-50'
                : 'border-slate-200 bg-white/50';

          const bullet = gagal
            ? 'bg-rose-500 text-white'
            : active
              ? 'bg-brand-600 text-white'
              : done
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-100 text-slate-400';

          const title = gagal
            ? 'text-rose-800'
            : active
              ? 'text-slate-900'
              : done
                ? 'text-emerald-800'
                : 'text-slate-400';

          const inner = (
            <>
              <span
                aria-hidden="true"
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${bullet}`}
              >
                {gagal ? '!' : done ? '✓' : i + 1}
              </span>
              <span className="min-w-0">
                <span className={`block truncate text-xs font-bold sm:text-sm ${title}`}>
                  {teks.title}
                </span>
                <span className="hidden truncate text-[11px] text-slate-400 sm:block">
                  {teks.hint}
                </span>
              </span>
            </>
          );

          const shell = `flex h-full items-center gap-2.5 rounded-2xl border px-3 py-2.5 transition ${box}`;

          // Hanya dua langkah pertama yang punya halaman untuk dituju kembali;
          // langkah bayar yang sudah lunas bukan tautan ke mana-mana.
          const bolehDiklik = done && !langkahBayar;

          return (
            <li key={step.key} className="min-w-0 flex-1">
              {bolehDiklik ? (
                <Link href={hrefOf(step.key)} className={shell}>
                  {inner}
                </Link>
              ) : (
                <div className={shell} aria-current={active ? 'step' : undefined}>
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
