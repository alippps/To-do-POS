import Container from '@/components/ui/Container';
import SectionHeading from '@/components/ui/SectionHeading';
import { initials } from '@/lib/format';
import { Star, Quote } from 'lucide-react';

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
    text: 'Kasir baru cuma butuh 15 menit belajar. Tampilannya jelas dan tombolnya besar-besar, sangat cocok buat jam sibuk.',
    rating: 5,
  },
  {
    name: 'Siti Aminah',
    role: 'Pelanggan setia',
    text: 'Scan QR di meja, pilih menu, bayar. Nggak perlu repot antre lagi cuma buat pesan segelas latte favorit.',
    rating: 5,
  },
  {
    name: 'Bayu Ardiansyah',
    role: 'Founder, Nusantara Catering',
    text: 'Fitur pencarian transaksinya benar-benar penyelamat waktu tutup buku. Cari invoice klien tinggal ketik nama.',
    rating: 5,
  },
];

/*
  Komponen Stars dipisahkan dan diekstrak menggunakan Lucide React.
  Penggunaan fill-current memastikan warna bintang terisi penuh sesuai
  dengan class warna teks pada container.
*/
function Stars({ count }) {
  return (
    <div className="flex gap-1 text-amber-400" aria-label={`Rating ${count} dari 5 bintang`}>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-current" strokeWidth={1} />
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section id="testimoni" className="bg-slate-50/50 py-20 sm:py-24 relative overflow-hidden">
      {/* Dekorasi Background Halus */}
      <div className="absolute left-0 bottom-0 translate-y-1/3 -translate-x-1/3 w-[800px] h-[800px] bg-brand-50/60 rounded-full blur-3xl -z-10" />

      <Container className="relative z-10">
        <SectionHeading
          // eyebrow="Testimoni"
          title="Kata mereka yang sudah pakai"
          description="Ratusan cangkir kopi dan ribuan transaksi setiap bulan — ini adalah pengalaman nyata dari mitra dan pelanggan kami."
        />

        {/*
          Dua kolom dipertahankan untuk menjaga keterbacaan (readability).
          Padding dan interaksi disuntikkan langsung via Tailwind.
        */}
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:gap-8">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl hover:shadow-brand-900/5 sm:p-8"
            >
              {/*
                Icon Quote Transparan di Background
                Diganti menggunakan Lucide Icon agar presisi dan elegan.
              */}
              <Quote
                className="absolute right-6 top-6 h-16 w-16 rotate-12 text-brand-50 transition-transform duration-500 group-hover:rotate-0 group-hover:scale-110 group-hover:text-brand-100/70"
                strokeWidth={1}
                aria-hidden="true"
              />

              <div className="relative z-10 flex-1 flex flex-col">
                <Stars count={t.rating} />

                <blockquote className="mt-6 flex-1">
                  <p className="text-base italic leading-relaxed text-slate-700 transition-colors duration-300 group-hover:text-slate-900">
                    {t.text}
                  </p>
                </blockquote>

                <figcaption className="mt-8 flex items-center gap-4 border-t border-slate-100 pt-6">
                  {/* Avatar Inisial */}
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-sm font-bold text-white shadow-sm ring-2 ring-white transition-transform duration-300 group-hover:scale-110">
                    {initials(t.name)}
                  </span>

                  {/* Info Reviewer */}
                  <div className="min-w-0">
                    <span className="block truncate text-sm font-bold text-slate-900">
                      {t.name}
                    </span>
                    <span className="block truncate text-xs font-medium text-slate-500">
                      {t.role}
                    </span>
                  </div>
                </figcaption>
              </div>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}