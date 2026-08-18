import Container from '@/components/ui/Container';
import SectionHeading from '@/components/ui/SectionHeading';
import { platform } from '@/lib/site';
import {
  TrendingUp,
  Coffee,
  Store,
  UtensilsCrossed
} from 'lucide-react';

/*
  Data ditambahkan properti 'icon' spesifik untuk F&B guna memperkuat
  identitas masing-masing studi kasus.
*/
const PROJECTS = [
  {
    name: 'Kopi Pagi Bandung',
    type: 'Coffee Shop · 3 outlet',
    result: 'Antrean turun 42%',
    text: 'Migrasi dari kasir manual ke QR ordering. Pesanan langsung masuk layar barista tanpa perantara.',
    color: 'from-brand-500 to-brand-700',
    icon: Coffee,
    tags: ['QR Order', 'POS', 'Laporan'],
  },
  {
    name: 'Roti Bakar 88',
    type: 'F&B Street Food',
    result: 'Omzet naik 27%',
    text: 'Sistem stok otomatis memastikan menu yang sedang habis tidak lagi tampil di layar pelanggan.',
    color: 'from-slate-700 to-slate-900',
    icon: Store,
    tags: ['Stok', 'Multi Kasir'],
  },
  {
    name: 'Nusantara Catering',
    type: 'Katering Kantor',
    result: '1.200 pesanan / bulan',
    text: 'Dashboard rekap transaksi harian sangat mempermudah proses penagihan (invoice) ke klien korporat.',
    color: 'from-amber-500 to-amber-700',
    icon: UtensilsCrossed,
    tags: ['Rekap', 'Invoice'],
  },
];

export default function Portfolio() {
  return (
    <section id="portfolio" className="py-20 sm:py-24 bg-white relative overflow-hidden">
      {/* Dekorasi Background Halus */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[600px] h-[600px] bg-slate-50 rounded-full blur-3xl -z-10" />

      <Container>
        <SectionHeading
          // eyebrow="Portfolio"
          title="Sudah dipakai bisnis seperti Anda"
          description={`Bukan sekadar teori. Berikut adalah beberapa mitra nyata yang tumbuh bersama ekosistem ${platform.name}.`}
        />

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {PROJECTS.map((p) => {
            const Icon = p.icon;

            return (
              <article
                key={p.name}
                className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-300 hover:shadow-2xl hover:shadow-brand-900/10"
              >
                {/*
                  HEADER KARTU (Colored Gradient)
                  Diberi efek pattern dan zoom saat di-hover untuk kesan dinamis.
                */}
                <div className={`relative h-40 bg-gradient-to-br ${p.color} p-6 overflow-hidden`}>
                  {/* Efek Lingkaran Cahaya (Glow) di Pojok */}
                  <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-white/20 blur-2xl transition-transform duration-700 group-hover:scale-150" />

                  {/* Pattern Titik Halus (Memanfaatkan CSS Radial Gradient Tailwind) */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:12px_12px] opacity-50 transition-opacity duration-500 group-hover:opacity-100" />

                  <div className="relative z-10 flex items-start justify-between">
                    <div>
                      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-white/80">
                        <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
                        {p.type}
                      </p>
                      <h3 className="mt-3 text-2xl font-black text-white tracking-tight">
                        {p.name}
                      </h3>
                    </div>
                  </div>
                </div>

                {/*
                  OVERLAPPING KPI BADGE
                  Ditarik ke atas sebesar margin-top negatif (-mt-5).
                  Fokus utama mata pembaca akan otomatis jatuh ke sini.
                */}
                <div className="relative z-20 -mt-5 px-6">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-sm font-bold text-emerald-600 shadow-sm ring-4 ring-white transition-transform duration-300 group-hover:scale-105 group-hover:bg-emerald-100">
                    <TrendingUp className="h-4 w-4" strokeWidth={3} />
                    {p.result}
                  </span>
                </div>

                {/* BODY KARTU */}
                <div className="flex flex-1 flex-col p-6 pt-4">
                  <p className="flex-1 text-sm leading-relaxed text-slate-600">
                    {p.text}
                  </p>

                  {/* Tags / Fitur yang Dipakai */}
                  <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center rounded-md bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 ring-1 ring-inset ring-slate-200/60 transition-colors group-hover:bg-slate-100 group-hover:text-slate-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}