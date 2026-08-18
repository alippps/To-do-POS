import Container from '@/components/ui/Container';
import SectionHeading from '@/components/ui/SectionHeading';
import { Printer, ScanLine, MonitorSmartphone, CheckCircle2 } from 'lucide-react';

/*
  Data dipisahkan dari logika render (Separation of Concerns).
  Penambahan properti 'icon' untuk memperkuat komunikasi visual ke user.
*/
const STEPS = [
  {
    num: '1',
    title: 'Tempel QR di tiap meja',
    text: 'Cetak kartu mejanya dari dashboard — nomor meja besar, QR, dan instruksi singkat. Sekali cetak, dipakai seterusnya.',
    icon: Printer,
  },
  {
    num: '2',
    title: 'Pelanggan pesan dari kursi',
    text: 'Pindai, nomor mejanya terbaca sendiri, pilih menu, pesan. Tanpa aplikasi, tanpa akun, tanpa antre di kasir.',
    icon: ScanLine,
  },
  {
    num: '3',
    title: 'Pesanan masuk ke dashboard',
    text: 'Lengkap dengan nomor mejanya. Kasir tidak pernah salah menempelkan pesanan ke meja yang keliru.',
    icon: MonitorSmartphone,
  },
  {
    num: '4',
    title: 'Bayar sekali di akhir',
    text: 'Nambah pesanan cukup pindai lagi — tambahannya menempel ke tagihan meja yang sama. Kasir menandai lunas, mejanya kosong lagi.',
    icon: CheckCircle2,
  },
];

export default function HowItWorks() {
  return (
    <section id="cara-kerja" className="scroll-mt-20 py-20 sm:py-24 bg-slate-50/50">
      <Container>
        <SectionHeading
          // eyebrow="Cara Kerja"
          title="4 langkah cara kerja sistem QR Meja"
          description="Yang berubah bukan cuma alat catatnya — pintu masuk pesanan pindah dari kasir ke meja pelanggan."
        />

        <div className="relative mt-16">
          {/*
            Garis penghubung background (Hanya muncul di desktop).
            Berfungsi sebagai 'visual cue' bahwa ini adalah sebuah alur proses.
          */}
          <div
            className="absolute top-10 left-0 hidden h-[2px] w-full bg-gradient-to-r from-slate-200 via-brand-200 to-slate-200 lg:block"
            aria-hidden="true"
          />

          <ol className="relative grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {STEPS.map((step, _index) => {
              const Icon = step.icon;

              return (
                <li key={step.num} className="group relative">
                  {/* Container Ikon & Nomor */}
                  <div className="relative z-10 flex flex-col items-center lg:items-start">
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md group-hover:ring-brand-500/30">
                      {/* Gradient Badge Background */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                      {/* Icon */}
                      <Icon className="h-8 w-8 text-slate-700 transition-colors duration-300 group-hover:text-brand-600 relative z-10" strokeWidth={1.5} />

                      {/* Nomor Langkah (Badge Kecil) */}
                      <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white shadow-sm ring-4 ring-white">
                        {step.num}
                      </span>
                    </div>

                    {/* Watermark Angka Besar (Efek Estetik di background teks) */}
                    <span
                      aria-hidden="true"
                      className="absolute -right-4 top-16 text-[8rem] font-black leading-none text-slate-100/60 transition-all duration-500 group-hover:-translate-y-2 group-hover:text-slate-200/50 lg:-right-6"
                    >
                      {step.num}
                    </span>

                    {/* Konten Teks */}
                    <div className="relative z-10 mt-8 text-center lg:text-left">
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-700 transition-colors duration-300">
                        {step.title}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-slate-600">
                        {step.text}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/*
          Bantahan Keberatan (Objection Handling)
          Desain diperhalus menjadi bentuk alert/note yang lebih profesional
          daripada sekadar paragraf teks biasa.
        */}
        {/* <div className="mx-auto mt-20 max-w-2xl rounded-2xl bg-brand-50/50 p-6 text-center ring-1 ring-brand-100/50">
          <p className="text-sm font-medium leading-relaxed text-brand-900">
            <span className="font-bold text-brand-700">Penting:</span> Pelanggan tidak perlu mengunduh aplikasi atau membuat akun apa pun. Mereka cukup menggunakan kamera HP dan browser bawaan.
          </p>
        </div> */}
      </Container>
    </section>
  );
}