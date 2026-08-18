import Link from 'next/link';
import Container from '@/components/ui/Container';
import SectionHeading from '@/components/ui/SectionHeading';
import { tenantPath } from '@/lib/tenant';
import {
  Store,
  MapPin,
  Clock,
  ArrowRight,
  ExternalLink,
  Sparkles,
  TerminalSquare
} from 'lucide-react';

/**
 * Direktori outlet yang memakai sistem ini.
 * Melayani 2 persona: Pelanggan (mencari kedai) & Calon Mitra (melihat social proof).
 */
export default function OutletDirectory({ outlets = [], demo = null }) {
  return (
    <section id="outlet" className="scroll-mt-20 bg-slate-50/50 py-20 sm:py-24 relative">
      <Container>
        <SectionHeading
          // eyebrow="Direktori Outlet"
          title="UMKM yang sudah jalan di sistem ini"
          description="Bukan sekadar tangkapan layar. Buka salah satunya — menu, denah meja, dan alur pemesanannya nyata, persis seperti yang dilihat pelanggan mereka."
        />

        {/*
          KARTU DEMO (Spotlight)
          Didesain lebih menonjol dengan gradien dan padding ekstra
          untuk mengundang klik dari pengunjung yang ragu.
        */}
        {demo && (
          <Link
            href={tenantPath(demo.slug)}
            className="group mx-auto mt-14 flex max-w-3xl flex-col gap-6 rounded-[2rem] border border-brand-200/60 bg-gradient-to-br from-brand-50/80 to-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl hover:shadow-brand-900/5 sm:flex-row sm:items-center sm:p-8 relative overflow-hidden"
          >
            {/* Efek kilauan halus di background (opsional) */}
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-100/50 blur-3xl transition-transform duration-500 group-hover:scale-150" />

            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-md transition-transform duration-300 group-hover:scale-105 group-hover:shadow-brand-600/20">
              <Store className="h-8 w-8" strokeWidth={1.5} />
            </div>

            <div className="relative min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-brand-500" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-brand-700">
                  Coba tanpa mendaftar
                </span>
              </div>

              <div className="mt-2 flex items-center gap-2 text-xl font-extrabold text-slate-900 sm:text-2xl transition-colors group-hover:text-brand-700">
                Lihat contoh kedai
                <ArrowRight className="h-5 w-5 text-brand-500 transition-transform duration-300 group-hover:translate-x-1.5" strokeWidth={2.5} />
              </div>

              <p className="mt-2 block text-sm leading-relaxed text-slate-600">
                Buka <span className="font-semibold text-slate-900">{demo.name}</span> — menu,
                denah meja, dan alur pemesanannya berjalan sungguhan. Tersedia tombol
                simulasi scan QR untuk dicoba langsung dari laptop Anda.
              </p>
            </div>
          </Link>
        )}

        {/*
          KONDISI KOSONG (Empty State)
          Desain diperhalus menyerupai UI dashboard profesional.
        */}
        {outlets.length === 0 ? (
          <div className="mx-auto mt-14 flex max-w-lg flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-200 bg-white/50 px-6 py-16 text-center shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
              <Store className="h-8 w-8" strokeWidth={1.5} />
            </div>
            <p className="font-bold text-slate-800 text-lg">Belum ada outlet terdaftar</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 max-w-sm">
              Daftarkan yang pertama lewat tombol di bawah, atau jalankan <br />
              <code className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
                <TerminalSquare className="h-3.5 w-3.5" />
                supabase/schema.sql
              </code><br />
              di SQL Editor Supabase untuk memuat data contoh.
            </p>
          </div>
        ) : (
          /*
            GRID DIREKTORI
            Menggunakan 3 kolom sejak 'lg'. Kartu didesain mandiri dengan
            utility classes murni (tanpa kelas .card external).
          */
          <div className="mx-auto mt-14 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {outlets.map((o) => (
              <Link
                key={o.id}
                href={tenantPath(o.slug)}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl hover:shadow-brand-900/5"
              >
                {/* Header Kartu: Nama, Tagline, Icon Panah */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-bold text-slate-900 transition-colors group-hover:text-brand-700">
                      {o.name}
                    </h3>
                    <p className="mt-1 truncate text-sm font-medium text-slate-500">
                      {o.tagline}
                    </p>
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all duration-300 group-hover:bg-brand-50 group-hover:text-brand-600">
                    <ArrowRight className="h-4 w-4 -rotate-45 transition-transform duration-300 group-hover:rotate-0" strokeWidth={2.5} />
                  </div>
                </div>

                {/* Metadata: Alamat & Jam Buka */}
                <dl className="mt-5 flex-1 space-y-2.5 border-t border-slate-100 pt-5 text-sm text-slate-600">
                  {o.address && (
                    <div className="flex items-start gap-2.5">
                      <MapPin className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" strokeWidth={2} />
                      <dd className="min-w-0 flex-1 leading-snug">{o.address}</dd>
                    </div>
                  )}
                  {o.hours && (
                    <div className="flex items-center gap-2.5">
                      <Clock className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={2} />
                      <dd className="min-w-0 flex-1 truncate">{o.hours}</dd>
                    </div>
                  )}
                </dl>

                {/*
                  Slug Badge
                  Menunjukkan kepada calon mitra bahwa tiap outlet
                  dapat URL/domain khususnya sendiri.
                */}
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100/80 px-2.5 py-1.5 font-mono text-[11px] font-semibold text-slate-500 transition-colors group-hover:bg-brand-50 group-hover:text-brand-600">
                    /k/{o.slug}
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-300 transition-colors group-hover:text-brand-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}