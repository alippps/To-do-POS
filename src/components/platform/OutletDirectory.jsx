import Link from 'next/link';
import Container from '@/components/ui/Container';
import SectionHeading from '@/components/ui/SectionHeading';
import { tenantPath } from '@/lib/tenant';

/**
 * Direktori outlet yang memakai sistem ini.
 *
 * Dua pembaca sekaligus, dan keduanya terlayani oleh daftar yang sama:
 * pelanggan yang mengetik domainnya begitu saja dan sedang mencari kedainya,
 * serta calon mitra yang ingin melihat bukti bahwa sistem ini benar-benar
 * dipakai. Karena itu kartunya menampilkan alamat dan jam buka — informasi
 * untuk yang pertama — sekaligus slug-nya, yang menunjukkan kepada yang kedua
 * bahwa tiap outlet memang berdiri di alamatnya sendiri.
 */
export default function OutletDirectory({ outlets = [] }) {
  /*
    Grid-nya tiga kolom sejak `lg`, bukan dua.

    Direktori ini tumbuh seiring outlet yang mendaftar, dan dengan dua kolom
    setiap jumlah ganjil menyisakan satu kartu yatim menggantung di baris
    terakhir — persis yang terjadi begitu outlet ketiga masuk. Tiga kolom
    membuat baris ganjil jauh lebih jarang, dan kartunya tetap cukup lebar
    untuk memuat alamat.
  */
  return (
    <section id="outlet" className="scroll-mt-20 py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Direktori Outlet"
          title="UMKM yang sudah jalan di sistem ini"
          description="Bukan tangkapan layar. Buka salah satunya — menu, denah meja, dan alur pemesanannya nyata, persis seperti yang dilihat pelanggan mereka."
        />

        {outlets.length === 0 ? (
          <div className="mx-auto mt-14 max-w-lg rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
            <span className="text-4xl">🏪</span>
            <p className="mt-4 font-semibold text-slate-800">Belum ada outlet terdaftar</p>
            <p className="mt-1 text-sm leading-snug text-slate-500">
              Daftarkan yang pertama lewat tombol di bawah, atau jalankan{' '}
              <code className="font-semibold">supabase/schema.sql</code> di SQL Editor Supabase
              untuk memuat dua outlet contoh.
            </p>
          </div>
        ) : (
          <div className="mx-auto mt-14 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {outlets.map((o) => (
              <Link
                key={o.id}
                href={tenantPath(o.slug)}
                className="card group flex flex-col p-6 transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-pop"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-bold text-slate-900">{o.name}</h3>
                    <p className="mt-0.5 truncate text-sm text-slate-500">{o.tagline}</p>
                  </div>
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-lg text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500"
                  >
                    →
                  </span>
                </div>

                <dl className="mt-5 space-y-1.5 border-t border-slate-100 pt-4 text-xs text-slate-500">
                  {o.address && (
                    <div className="flex gap-2">
                      <dt aria-hidden="true">📍</dt>
                      <dd className="min-w-0">{o.address}</dd>
                    </div>
                  )}
                  {o.hours && (
                    <div className="flex gap-2">
                      <dt aria-hidden="true">🕘</dt>
                      <dd className="min-w-0">{o.hours}</dd>
                    </div>
                  )}
                </dl>

                <p className="mt-4 font-mono text-[11px] text-slate-400">/k/{o.slug}</p>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
