import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import { tenantPath, waLinkOf } from '@/lib/tenant';

const PERKS = ['Tanpa biaya konsultasi', 'Demo sistem langsung', 'Dibalas < 15 menit di jam kerja'];

export default function CtaWhatsapp({ tenant }) {
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 px-6 py-14 text-center sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-brand-400/30 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-2xl">
            {/*
              Klaim yang tidak bergantung kalender.

              "Slot konsultasi minggu ini masih tersedia" ditulis permanen di
              kode — urgensi yang tidak pernah berubah bukan urgensi, dan
              pengunjung yang kembali sebulan lagi melihat kalimat yang sama
              persis. Diganti janji yang memang selalu benar.
            */}
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur">
              Konsultasi tanpa biaya & tanpa kontrak
            </span>

            <h2 className="mt-6 text-3xl font-extrabold leading-tight text-white sm:text-4xl">
              Siap merapikan operasional kedai Anda?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-brand-100">
              Ceritakan kondisi usaha Anda sekarang. Tim {tenant.name} akan bantu petakan kebutuhan
              sistem POS-nya — gratis, tanpa kewajiban berlangganan.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                as="a"
                href={waLinkOf(tenant)}
                target="_blank"
                rel="noreferrer"
                variant="whatsapp"
                size="lg"
                className="w-full sm:w-auto"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Z" />
                </svg>
                Konsultasi Gratis via WhatsApp
              </Button>
              <Button
                href={tenantPath(tenant.slug, '/kontak')}
                variant="glass"
                size="lg"
                className="w-full sm:w-auto"
              >
                Kirim Pesan
              </Button>
            </div>

            <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-brand-100">
              {PERKS.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
