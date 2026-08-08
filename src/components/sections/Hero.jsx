import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import { tenantPath, waLinkOf } from '@/lib/tenant';

/*
  Angka di sini harus sama artinya dengan yang tampil di /about.

  Sebelumnya hero menulis "12.400+ Transaksi diproses" (terbaca sebagai total
  sepanjang waktu) sementara /about menulis "12.4rb Transaksi/bulan" — angka
  yang sama dengan dua satuan waktu berbeda. Satuannya sekarang ditulis
  eksplisit di label supaya tidak bisa lagi dibaca dua cara.
*/
const STATS = [
  { value: '12.400+', label: 'Transaksi / bulan' },
  { value: '4.9/5', label: 'Rating pelanggan' },
  { value: '< 30 dtk', label: 'Rata-rata antrean' },
];

/*
  Outlet diterima sebagai prop, bukan dibaca dari context.

  Section ini komponen SERVER — ia tidak boleh memakai `useTenant()`. Yang
  mengirimnya adalah landing outlet (src/app/k/[slug]/(site)/page.jsx), yang
  memang sudah memegang datanya.
*/
export default function Hero({ tenant }) {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* dekorasi latar */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 -top-40 h-[420px] w-[420px] rounded-full bg-brand-100/60 blur-3xl" />
        <div className="absolute -right-24 top-24 h-[360px] w-[360px] rounded-full bg-brand-50 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0ebe4_1px,transparent_1px),linear-gradient(to_bottom,#f0ebe4_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      </div>

      <Container className="grid items-center gap-14 py-16 lg:grid-cols-2 lg:py-24">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
            </span>
            UMKM Goes Digital — POS + Coffee Shop dalam satu platform
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem]">
            Kelola Kedai Kopi Anda{' '}
            <span className="relative whitespace-nowrap text-brand-600">
              Tanpa Ribet
              <svg
                className="absolute -bottom-2 left-0 w-full text-brand-200"
                viewBox="0 0 200 12"
                fill="none"
                preserveAspectRatio="none"
              >
                <path d="M2 9c40-6 120-9 196-3" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-relaxed text-slate-500">
            <strong className="font-semibold text-slate-700">{tenant.name}</strong> membantu UMKM
            kuliner naik kelas ke digital: pemesanan via QR, kasir digital, manajemen produk, dan
            laporan penjualan real-time — semuanya rapi dalam satu dashboard yang ringan, murah, dan
            mudah dipakai.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button
              as="a"
              href={waLinkOf(tenant)}
              target="_blank"
              rel="noreferrer"
              variant="whatsapp"
              size="lg"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Z" />
              </svg>
              Konsultasi Gratis via WhatsApp
            </Button>
            {/*
              Ajakan memesan sudah dipegang tombol "Pesan Sekarang" di navbar
              yang selalu tampil. Di sini cukup arahkan ke katalog — pengunjung
              yang baru mendarat biasanya mau lihat-lihat dulu, bukan checkout.
            */}
            <Button href={tenantPath(tenant.slug, '/katalog')} variant="secondary" size="lg">
              Lihat Menu Kami
            </Button>
          </div>

          {/*
            Tiga kolom baru dipakai mulai `sm`.

            Di 320px, tiga kolom `gap-6` menyisakan ~80px per kolom sementara
            "12.400+" dan "< 30 dtk" pada ukuran `text-xl` membutuhkan lebih
            dari itu — dengan `whitespace-nowrap` angkanya meluber keluar
            kolom. Dua kolom memberi ruang yang cukup, dan `nowrap` hanya
            dipasang sejak lebar itu benar-benar tersedia.
          */}
          <dl className="mt-12 grid max-w-lg grid-cols-2 gap-6 border-t border-slate-200 pt-8 sm:grid-cols-3">
            {STATS.map((s) => (
              <div key={s.label}>
                <dt className="text-xl font-extrabold text-slate-900 sm:whitespace-nowrap sm:text-3xl">
                  {s.value}
                </dt>
                <dd className="mt-1 text-xs leading-snug text-slate-500 sm:text-sm">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Mockup dashboard */}
        <div className="relative animate-fade-up lg:pl-6">
          <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-to-tr from-brand-600/10 via-brand-200/20 to-transparent blur-2xl" />

          <div className="card overflow-hidden p-0">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="ml-3 truncate text-xs font-medium text-slate-400">
                /k/{tenant.slug}/admin
              </span>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">Pendapatan hari ini</p>
                  <p className="text-2xl font-extrabold text-slate-900">Rp 4.820.000</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600">
                  ↑ 18,2%
                </span>
              </div>

              <div className="flex h-32 items-end gap-2.5">
                {[42, 58, 35, 72, 61, 88, 76].map((h, i) => (
                  <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <div
                      className={`w-full rounded-t-lg ${i === 5 ? 'bg-brand-600' : 'bg-brand-100'}`}
                      style={{ height: `${h}%` }}
                    />
                    <span className="text-[10px] text-slate-400">
                      {['S', 'S', 'R', 'K', 'J', 'S', 'M'][i]}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2.5 rounded-2xl bg-slate-50 p-4">
                {[
                  ['Kopi Susu Gula Aren', '32 cup', 'Rp 800.000'],
                  ['Caffe Latte', '21 cup', 'Rp 630.000'],
                  ['Croissant Butter', '15 pcs', 'Rp 345.000'],
                ].map(([name, qty, total]) => (
                  <div key={name} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{name}</span>
                    <span className="text-xs text-slate-400">{qty}</span>
                    <span className="font-semibold text-slate-900">{total}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute -bottom-6 -left-2 hidden rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-pop sm:flex sm:items-center sm:gap-3 lg:-left-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">✓</span>
            <div>
              <p className="text-xs font-semibold text-slate-900">Pesanan #INV-0421 selesai</p>
              <p className="text-[11px] text-slate-400">Meja 07 · 2 detik lalu</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
