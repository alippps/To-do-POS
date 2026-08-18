import Container from '@/components/ui/Container';
import SectionHeading from '@/components/ui/SectionHeading';
import { platform } from '@/lib/site';
import {
  Zap,
  ShieldCheck,
  Smartphone,
  MonitorOff,
  Rocket,
  Headset,
  Quote
} from 'lucide-react';

/*
  Data structure menggunakan Lucide Icons alih-alih Emoji untuk konsistensi.
  Copywriting disesuaikan agar berfokus pada 'Business Value' yang dipedulikan
  oleh pemilik usaha (bukan jargon teknis developer).
*/
const ITEMS = [
  {
    title: 'Cepat & Ringan',
    text: 'Halaman terbuka seketika, bahkan di sinyal seadanya. Kasir tidak menunggu, antrean tidak menumpuk.',
    icon: Zap,
  },
  {
    title: 'Data Bisnis Aman',
    text: 'Sistem keamanan terenkripsi memastikan data omzet dan transaksi hanya bisa diakses oleh Anda sebagai pemilik.',
    icon: ShieldCheck,
  },
  {
    title: 'Mobile First',
    text: 'Tampilan rapi di HP kasir maupun tablet. Pelanggan pun nyaman memesan dari layar kecil.',
    icon: Smartphone,
  },
  {
    title: 'Tanpa Mesin Mahal',
    text: 'Cukup gunakan HP atau tablet yang sudah ada. Tidak perlu beli perangkat keras kasir jutaan rupiah untuk mulai.',
    icon: MonitorOff,
  },
  {
    title: 'Setup 1 Hari',
    text: 'Impor menu, atur akun, tempel QR di meja. Besok pagi outlet Anda sudah siap beroperasi.',
    icon: Rocket,
  },
  {
    title: 'Support Responsif',
    text: 'Tim kami standby via WhatsApp setiap hari kerja. Kendala operasional kasir tidak boleh dibiarkan menunggu lama.',
    icon: Headset,
  },
];

export default function Advantages() {
  return (
    <section id="keunggulan" className="scroll-mt-20 bg-slate-50/50 py-20 sm:py-24 relative overflow-hidden">
      {/*
        Elemen dekoratif background (opsional)
        Memberikan bias cahaya halus di sudut layar.
      */}
      <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-50/50 rounded-full blur-3xl opacity-50 pointer-events-none" />

      <Container className="relative z-10">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.35fr] lg:gap-16 items-start">

          {/* KOLOM KIRI: Sticky Header & Manifesto */}
          <div className="lg:sticky lg:top-32 lg:flex lg:flex-col lg:gap-8">
            <SectionHeading
              align="left"
              // eyebrow="Keunggulan"
              title="Kenapa memilih sistem ini?"
              description="Bukan sekadar aplikasi kasir. Kami merancang ini karena kami juga menjalankan operasional kedai kopi setiap hari."
            />

            {/* Quote Box / Manifesto */}
            <div className="relative mt-8 lg:mt-0 rounded-2xl border border-brand-100 bg-gradient-to-br from-white to-brand-50/80 p-8 shadow-sm">
              <Quote className="absolute right-6 top-6 h-12 w-12 text-brand-100/50 rotate-180" aria-hidden="true" />
              <div className="relative z-10">
                <p className="text-base font-medium italic leading-relaxed text-slate-700">
                  “Sistem yang bagus adalah sistem yang tidak terasa kehadirannya — kasir tinggal fokus
                  melayani, laporan beres dengan sendirinya.”
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-[2px] w-8 bg-brand-500 rounded-full" />
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-700">
                    Tim Produk {platform.name}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: Grid Keunggulan */}
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
            {ITEMS.map((item, i) => {
              const Icon = item.icon;
              const numberRef = String(i + 1).padStart(2, '0');

              return (
                <div
                  key={item.title}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl hover:shadow-brand-900/5"
                >
                  {/*
                    Efek Watermark Angka yang Diperbarui:
                    - text-slate-50: Warna awal abu-abu sangat muda.
                    - group-hover:text-brand-100: Warna saat di-hover menjadi warna brand yang lebih terlihat.
                    - group-hover:scale-110 group-hover:-rotate-3: Menambah efek pop-up yang dinamis.
                  */}
                  <span
                    aria-hidden="true"
                    className="absolute right-2 top-2 text-6xl font-black text-slate-50 transition-all duration-500 group-hover:-translate-x-2 group-hover:scale-110 group-hover:-rotate-3 group-hover:text-brand-600"
                  >
                    {numberRef}
                  </span>

                  {/* Icon Container dengan interaksi */}
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-600 transition-all duration-300 group-hover:bg-brand-600 group-hover:text-white group-hover:scale-110 shadow-sm">
                    <Icon className="h-6 w-6" strokeWidth={1.5} />
                  </div>

                  {/* Konten Text */}
                  <div className="relative mt-6">
                    <h3 className="text-lg font-bold text-slate-900 transition-colors duration-300 group-hover:text-brand-700">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {item.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </Container>
    </section>
  );
}