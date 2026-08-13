import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';

const PERKS = [
  'Outlet aktif dalam hitungan menit',
  'Tanpa mesin kasir atau perangkat tambahan',
  'Data penjualanmu terpisah dari outlet lain',
];

export default function PlatformCta() {
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 px-6 py-14 text-center sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-brand-400/30 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur">
              Pendaftaran dengan kode undangan
            </span>

            <h2 className="mt-6 text-3xl font-extrabold leading-tight text-white sm:text-4xl">
              Warungmu berikutnya?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-brand-100">
              Isi nama usaha, pilih alamat outletnya, dan sistemnya langsung berdiri — lengkap
              dengan dashboard, halaman pelanggan, dan generator QR mejanya sendiri.
            </p>

            <div className="mt-9">
              <Button href="/daftar-outlet" variant="inverse" size="lg">
                Daftarkan UMKM Anda →
              </Button>
            </div>

            <ul className="mt-9 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-brand-100">
              {PERKS.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <span aria-hidden="true" className="text-white">
                    ✓
                  </span>
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
