import QRCode from 'qrcode';
import Container from '@/components/ui/Container';
import SectionHeading from '@/components/ui/SectionHeading';
import { site } from '@/lib/site';

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
const STEPS = [
  {
    title: 'Scan QR di meja',
    text: 'Arahkan kamera HP ke QR. Tanpa install aplikasi, tanpa buat akun.',
  },
  {
    title: 'Lihat meja yang tersedia',
    text: 'Layar langsung menampilkan denah meja beserta status kosong / terisi.',
  },
  {
    title: 'Pilih menu favorit',
    text: 'Daftar menu selalu terbaru — item yang habis otomatis tidak bisa dipesan.',
  },
  {
    title: 'Bukti pesanan langsung terbit',
    text: 'Barista menerima pesanan seketika; struk resminya dicetak kasir saat pembayaran.',
  },
];

export default async function QrOrder() {
  // QR contoh mengarah ke halaman ketersediaan meja tanpa nomor meja tertentu.
  const sampleUrl = `${site.siteUrl}/meja`;

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
                title="Scan, lihat meja kosong, pesan"
                description="Cetak QR untuk setiap meja, tempel, selesai. Pelanggan memesan sendiri tanpa login sementara kasir fokus meracik."
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
