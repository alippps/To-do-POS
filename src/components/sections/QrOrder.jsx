import QRCode from 'qrcode';
import Container from '@/components/ui/Container';
import SectionHeading from '@/components/ui/SectionHeading';
import { platform } from '@/lib/site';
import { tenantUrl } from '@/lib/tenant';

/**
 * Section QR di landing page — PENJELASAN saja.
 *
 * Alat generatornya (pilih meja → unduh PNG) sudah pindah ke
 * `/admin/meja` (src/components/admin/TableQrPanel.jsx). Yang tersisa di sini
 * hanya cerita cara kerjanya plus satu QR contoh, karena pengunjung publik
 * tidak punya urusan mencetak QR meja milik kedai.
 *
 * Dirender di server: isinya tetap, jadi tidak perlu mengirim library QR ke
 * browser pengunjung.
 */
/*
  Empat langkah ini menceritakan alur DUDUK DULU, bukan re-order.

  Pelanggan mencari tempat, duduk, lalu memesan dari mejanya sendiri — kasir
  bukan lagi pintu masuk, melainkan tempat membayar di akhir. Pemesanan tambahan
  memakai pintu yang sama persis dan karena itu tidak diceritakan terpisah:
  cukup pindai lagi, dan `ScanIntentDialog` yang menyesuaikan tawarannya
  berdasarkan ada-tidaknya tagihan berjalan di meja itu.
*/
const STEPS = [
  {
    title: 'Duduk, lalu scan QR di meja',
    text: 'Arahkan kamera HP. Tanpa install aplikasi, tanpa buat akun, tanpa antre di kasir.',
  },
  {
    title: 'Nomor meja terbaca sendiri',
    text: 'Sistem langsung tahu ini Meja 07 — pelanggan tidak perlu mengetik atau menyebutkannya.',
  },
  {
    title: 'Pilih menu, langsung pesan',
    text: 'Daftar menu selalu terbaru — item yang habis otomatis tidak bisa dipesan.',
  },
  {
    // Judul dan isinya sempat menceritakan dua langkah berbeda: judulnya soal
    // pesanan yang masuk ke kasir, teksnya soal cara menambah pesanan.
    title: 'Pesanan masuk ke kasir',
    text: 'Langsung terbaca di dashboard beserta nomor mejanya. Mau nambah? Pindai lagi — tambahannya menempel ke tagihan meja itu, dibayar sekali di akhir.',
  },
];

export default async function QrOrder({ tenant }) {
  // QR contoh mengarah ke halaman ketersediaan meja OUTLET INI, tanpa nomor
  // meja tertentu. Slug-nya wajib ikut: tanpa itu, QR contoh di landing Kopi
  // Pagi akan membuka denah meja milik entah siapa.
  const sampleUrl = tenantUrl(platform.siteUrl, tenant.slug, '/meja');

  const dataUrl = await QRCode.toDataURL(sampleUrl, {
    width: 520,
    margin: 1,
    color: { dark: '#341810', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  }).catch(() => '');

  return (
    <section id="qr" className="surface-warm py-20 sm:py-24">
      <Container>
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
          <div className="grid lg:grid-cols-2">
            <div className="p-8 sm:p-12">
              <SectionHeading
                align="left"
                eyebrow="QR Ordering"
                title="Duduk, pindai, pesan — tanpa antre di kasir"
                description="QR di tiap meja adalah jalur pemesanan mandiri. Pelanggan yang baru duduk cukup memindai, memilih menu, lalu pesanannya otomatis masuk ke dashboard kasir — meja mana yang memesan sudah ikut terbaca. Mau menambah nanti? Pintunya sama, dan tambahannya menyatu ke tagihan meja itu."
              />

              <ol className="mt-8 space-y-5">
                {STEPS.map((s, i) => (
                  <li key={s.title} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">{s.title}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{s.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex flex-col items-center justify-center gap-6 border-t border-slate-100 bg-gradient-to-br from-brand-50 to-white p-8 sm:p-12 lg:border-l lg:border-t-0">
              <div className="w-full max-w-xs rounded-3xl border border-brand-100 bg-white p-6 text-center shadow-pop">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-600">
                  Contoh QR
                </p>

                <div className="mt-4 flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-white">
                  {dataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={dataUrl}
                      alt="Contoh QR menuju halaman ketersediaan meja"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="skeleton h-full w-full rounded-2xl" />
                  )}
                </div>

                <p className="mt-4 text-sm font-semibold text-slate-900">
                  Coba pindai dengan kamera HP
                </p>
                <p className="mt-1 text-xs leading-snug text-slate-500">
                  QR ini membuka halaman ketersediaan meja. Di kedai, tiap meja punya QR sendiri
                  yang langsung menandai nomor mejanya.
                </p>
              </div>

              {/* Rantai perjalanan satu pesanan, dari pindaian sampai kasir. */}
              <ol className="flex w-full max-w-xs flex-wrap items-center justify-center gap-x-1.5 gap-y-2 text-[11px] font-semibold">
                {[
                  'Scan QR',
                  'Meja 07',
                  'Pilih menu',
                  'Tagihan Meja 07',
                  'Kasir',
                ].map((langkah, i, arr) => (
                  <li key={langkah} className="flex items-center gap-1.5">
                    <span className="rounded-lg bg-white px-2.5 py-1 text-slate-700 ring-1 ring-brand-100">
                      {langkah}
                    </span>
                    {i < arr.length - 1 && (
                      <span aria-hidden="true" className="text-brand-300">
                        →
                      </span>
                    )}
                  </li>
                ))}
              </ol>

              <p className="max-w-xs text-center text-[11px] leading-snug text-slate-400">
                QR per meja dibuat dan dicetak oleh pemilik kedai dari panel pengelolaan meja.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
