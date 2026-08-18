import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import { tenantPath } from '@/lib/tenant';
import {
  TrendingUp,
  CheckCircle2,
  Activity,
  Store,
  Timer,
  ArrowRight,
} from 'lucide-react';

/*
  Data STATS diperbarui dengan penambahan Icon untuk memperkuat
  komunikasi visual (Visual Anchor) bagi pengunjung yang melakukan 'scanning'.
*/
const STATS = [
  { value: '12.400+', label: 'Transaksi / bulan', icon: Activity },
  { value: '38', label: 'Outlet mitra', icon: Store },
  { value: '< 30 dtk', label: 'Rata-rata antrean', icon: Timer },
];

export default function PlatformHero({ outletCount = 0, demo = null }) {
  return (
    <section className="relative overflow-hidden bg-white">
      {/*
        Dekorasi Latar Belakang (Grid & Glow)
        Diperhalus agar tidak mendistraksi konten utama.
      */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 -top-40 h-[500px] w-[500px] rounded-full bg-brand-100/40 blur-[100px]" />
        <div className="absolute right-0 top-1/4 h-[400px] w-[400px] rounded-full bg-brand-50/60 blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-60" />
      </div>

      <Container className="grid items-center gap-16 py-20 lg:grid-cols-2 lg:gap-8 lg:py-28">

        {/* KOLOM KIRI: Copywriting & CTA */}
        <div className="animate-fade-up flex flex-col items-start">

          {/* Badge Promo / Status */}
          {/* <span className="group inline-flex items-center gap-2.5 rounded-full border border-brand-200/60 bg-brand-50/50 px-4 py-1.5 text-xs font-semibold text-brand-700 shadow-sm backdrop-blur-sm transition-all hover:bg-brand-50">
            <span className="relative flex h-2.5 w-2.5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-600" />
            </span>
            <span className="flex items-center gap-1.5">
              UMKM Goes Digital <Sparkles className="h-3 w-3 text-brand-500" />
            </span>
          </span> */}

          {/* Headline Utama */}
          <h1 className="mt-8 pb-4 text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.5rem]">
            Kasir digital untuk UMKM kuliner, modalnya{' '}
            <span className="relative inline-block whitespace-nowrap text-brand-600">
              selembar QR
              <svg
                className="absolute -bottom-2 left-0 h-[10px] w-full text-brand-300/70"
                viewBox="0 0 200 12"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d="M2 9c40-6 120-9 196-3" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="mt-6 text-xl font-semibold leading-snug text-slate-800 sm:text-2xl">
            Sistem kasir &amp; pemesanan QR untuk UMKM.
          </p>

          <p className="mt-4 max-w-lg text-lg leading-relaxed text-slate-600">
            Pelanggan memindai QR di meja, memesan sendiri, dan bayar di akhir.
            Anda pantau omzet dan stok dari mana saja — tanpa mesin kasir mahal,
            tanpa aplikasi tambahan.
          </p>

          {/* Call to Actions (CTA) */}
          <div className="mt-10 flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center">
            <Button href="/daftar-outlet" size="lg" className="group flex items-center justify-center gap-2">
              Daftarkan UMKM Anda
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>

            {demo ? (
              <Button href={tenantPath(demo.slug)} variant="secondary" size="lg">
                Lihat contoh kedai
              </Button>
            ) : (
              <Button href="#outlet" variant="secondary" size="lg">
                {outletCount > 0
                  ? `Lihat ${outletCount} outlet mitra`
                  : 'Lihat outlet mitra'}
              </Button>
            )}
          </div>

          {/* Statistik (Social Proof) */}
          <dl className="mt-14 grid w-full max-w-xl grid-cols-2 gap-8 border-t border-slate-200/80 pt-8 sm:grid-cols-3">
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex flex-col gap-1">
                  <dt className="flex items-center gap-2 text-2xl font-black text-slate-900 sm:text-3xl">
                    {s.value}
                  </dt>
                  <dd className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                    <Icon className="h-4 w-4 text-brand-500 opacity-70" strokeWidth={2.5} />
                    {s.label}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>

        {/* KOLOM KANAN: Mockup Dashboard Dinamis */}
        <div className="relative animate-fade-up lg:pl-10 mt-10 lg:mt-0">
          {/* Efek Glow di belakang mockup */}
          <div className="absolute -inset-4 -z-10 rounded-[3rem] bg-gradient-to-tr from-brand-600/20 via-brand-300/20 to-transparent blur-3xl opacity-70" />

          {/* Browser Window / Dashboard Wrapper */}
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/60 shadow-2xl shadow-slate-900/10 backdrop-blur-xl transition-transform duration-500 hover:-translate-y-2">

            {/* Browser Header */}
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/90 px-6 py-4">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-rose-400 shadow-sm" />
                <span className="h-3 w-3 rounded-full bg-amber-400 shadow-sm" />
                <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-sm" />
              </div>
              <div className="ml-4 flex h-6 flex-1 items-center rounded-md bg-white px-3 text-[11px] font-medium text-slate-400 shadow-sm ring-1 ring-slate-100">
                /k/warung-anda/admin
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="space-y-6 p-6 sm:p-8">

              {/* Top Stats Widget */}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Pendapatan hari ini</p>
                  <p className="mt-1 text-3xl font-black tracking-tight text-slate-900">Rp 4.820.000</p>
                </div>
                <span className="mb-1 flex items-center gap-1 rounded-full bg-emerald-100/80 px-3 py-1.5 text-xs font-bold text-emerald-700">
                  <TrendingUp className="h-3.5 w-3.5" strokeWidth={3} />
                  18,2%
                </span>
              </div>

              {/* Chart Widget */}
              <div className="flex h-36 items-end gap-3">
                {[42, 58, 35, 72, 61, 88, 76].map((h, i) => {
                  const isToday = i === 5;
                  return (
                    <div key={i} className="group flex h-full flex-1 flex-col items-center justify-end gap-2 relative">
                      {/* Tooltip sederhana saat hover di bar chart */}
                      <span className="absolute -top-8 hidden rounded bg-slate-800 px-2 py-1 text-[10px] font-bold text-white group-hover:block">
                        {h}%
                      </span>
                      <div
                        className={`w-full rounded-t-lg transition-all duration-300 group-hover:opacity-80 ${isToday ? 'bg-gradient-to-t from-brand-500 to-brand-400 shadow-sm' : 'bg-slate-200/70'}`}
                        style={{ height: `${h}%` }}
                      />
                      <span className={`text-xs font-bold ${isToday ? 'text-brand-600' : 'text-slate-400'}`}>
                        {['S', 'S', 'R', 'K', 'J', 'S', 'M'][i]}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Top Selling Items List */}
              <div className="space-y-3 rounded-2xl border border-slate-100 bg-white/80 p-5 shadow-sm">
                {[
                  ['Kopi Susu Gula Aren', '32 cup', 'Rp 800.000'],
                  ['Roti Bakar Cokelat', '24 porsi', 'Rp 528.000'],
                  ['Indomie Rebus Telur', '19 porsi', 'Rp 342.000'],
                ].map(([name, qty, total]) => (
                  <div key={name} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-bold text-slate-700">{name}</p>
                      <p className="mt-0.5 text-xs font-medium text-slate-400">{qty} terjual</p>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{total}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating Toast Notification (Micro-interaction UI) */}
          <div className="absolute -bottom-8 -left-4 z-20 hidden animate-fade-up rounded-2xl border border-slate-100 bg-white p-4 shadow-xl shadow-slate-200/50 sm:flex sm:items-center sm:gap-4 lg:-left-12 lg:-bottom-10" style={{ animationDelay: '500ms' }}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="pr-2">
              <p className="text-sm font-bold text-slate-900">Pesanan #INV-0421 Selesai</p>
              <div className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-500">
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">Meja 07</span>
                <span>•</span>
                <span>Baru saja</span>
              </div>
            </div>
          </div>

        </div>
      </Container>
    </section>
  );
}