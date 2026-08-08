import Link from 'next/link';
import Container from '@/components/ui/Container';
import { platform } from '@/lib/site';
import { tenantPath } from '@/lib/tenant';
import { listTenants } from '@/lib/tenant.server';

/*
  Beranda platform, bukan beranda kedai.

  Sampai v3 alamat `/` adalah landing page satu-satunya kedai. Sejak satu
  pemasangan melayani banyak UMKM, alamat itu tidak lagi punya pemilik tunggal —
  landing page tiap outlet pindah ke `/k/<slug>`, dan yang tersisa di sini
  adalah pintu masuk yang menunjukkan outlet mana saja yang ada.

  Pelanggan hampir tidak pernah melewati halaman ini: QR di meja membawa mereka
  langsung ke outletnya. Yang membukanya adalah orang yang mengetik domainnya
  begitu saja — dan bagi mereka daftar ini lebih berguna daripada 404.
*/
export const revalidate = 60;

export const metadata = {
  title: `${platform.name} — ${platform.tagline}`,
  description: platform.description,
};

export default async function DirektoriPage() {
  const outlets = await listTenants();

  return (
    <div className="min-h-screen bg-slate-50">
      <Container className="py-16 sm:py-24">
        <header className="mx-auto max-w-2xl text-center">
          <span className="eyebrow mx-auto">{platform.name}</span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            {platform.tagline}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-500">{platform.description}</p>
        </header>

        {outlets.length === 0 ? (
          <div className="mx-auto mt-14 max-w-lg rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
            <span className="text-4xl">🏪</span>
            <p className="mt-4 font-semibold text-slate-800">Belum ada outlet terdaftar</p>
            <p className="mt-1 text-sm leading-snug text-slate-500">
              Jalankan <code className="font-semibold">supabase/schema.sql</code> di SQL Editor
              Supabase untuk membuat outlet pertama.
            </p>
          </div>
        ) : (
          <div className="mx-auto mt-14 grid max-w-4xl gap-5 sm:grid-cols-2">
            {outlets.map((o) => (
              <Link
                key={o.id}
                href={tenantPath(o.slug)}
                className="card group flex flex-col p-6 transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-pop"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold text-slate-900">{o.name}</h2>
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
    </div>
  );
}
