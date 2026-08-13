import Container from '@/components/ui/Container';
import SectionHeading from '@/components/ui/SectionHeading';
import { initials } from '@/lib/format';

const TESTIMONIALS = [
  {
    name: 'Rani Puspita',
    role: 'Owner, Kopi Pagi Bandung',
    text: 'Dulu rekap penjualan bisa makan waktu 2 jam tiap malam. Sekarang tinggal buka dashboard, semua angka sudah rapi.',
    rating: 5,
  },
  {
    name: 'Dimas Prayoga',
    role: 'Store Manager, Roti Bakar 88',
    text: 'Kasir baru cuma butuh 15 menit belajar. Tampilannya jelas dan tombolnya besar-besar, cocok buat jam sibuk.',
    rating: 5,
  },
  {
    name: 'Siti Aminah',
    role: 'Pelanggan setia',
    text: 'Scan QR di meja, pilih menu, bayar. Nggak perlu antre lagi cuma buat pesan segelas latte.',
    rating: 5,
  },
  {
    name: 'Bayu Ardiansyah',
    role: 'Founder, Nusantara Catering',
    text: 'Fitur pencarian transaksinya penyelamat waktu tutup buku. Cari invoice tinggal ketik nama klien.',
    rating: 5,
  },
];

function Stars({ count }) {
  return (
    <div className="flex gap-0.5 text-amber-400">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="m12 2 2.9 6.26 6.85.72-5.1 4.6 1.44 6.72L12 16.9l-6.09 3.4 1.44-6.72-5.1-4.6 6.85-.72L12 2Z" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section id="testimoni" className="bg-slate-50/70 py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Testimoni"
          title="Kata mereka yang sudah pakai"
          description="Ratusan cangkir kopi dan ribuan transaksi setiap bulan — ini pengalaman mereka."
        />

        {/*
          Dua kolom, bukan empat. Kutipan sepanjang 2–3 baris butuh lebar baca
          yang layak; dipaksa empat kolom teksnya jadi kolom sempit yang capek
          dibaca. Padding kartu juga wajib ditulis di sini — kelas `.card`
          hanya mengatur radius, border, dan bayangan.
        */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="card relative flex h-full flex-col p-6 transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-pop sm:p-8"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-6 top-4 font-display text-6xl leading-none text-brand-100 select-none"
              >
                &rdquo;
              </span>

              <Stars count={t.rating} />

              <blockquote className="relative mt-5 flex-1 text-base leading-relaxed text-slate-700">
                {t.text}
              </blockquote>

              <figcaption className="mt-7 flex items-center gap-3.5 border-t border-slate-100 pt-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white shadow-pop">
                  {initials(t.name)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-slate-900">{t.name}</span>
                  <span className="block truncate text-xs text-slate-500">{t.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
