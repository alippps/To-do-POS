import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

/*
  Data dipisahkan untuk menjaga prinsip Separation of Concerns (SoC).
  Jika ke depannya ada perubahan fitur, Anda cukup mengubah array ini.
*/
const PERKS = [
  'Outlet aktif dalam hitungan menit',
  'Tanpa mesin kasir atau perangkat keras',
  'Data penjualan terpisah dari outlet lain',
];

export default function PlatformCta() {
  return (
    <section className="py-20 sm:py-24">
      <Container>
        {/* 
          CTA Container:
          Menggunakan group-hover pada wadah utama untuk memicu 
          animasi cahaya/glow di latar belakang saat disentuh kursor.
        */}
        <div className="group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 px-6 py-16 text-center shadow-2xl shadow-brand-900/20 sm:px-12 sm:py-20">
          
          {/* Latar Belakang & Dekorasi */}
          <div className="pointer-events-none absolute inset-0">
            {/* Efek Cahaya (Glow) yang bereaksi pada hover */}
            <div className="absolute -left-16 -top-16 h-72 w-72 rounded-full bg-white/10 blur-[80px] transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute -bottom-24 -right-10 h-80 w-80 rounded-full bg-brand-400/20 blur-[80px] transition-transform duration-700 group-hover:scale-110" />
            
            {/* 
              Pattern Radial Halus
              Menambahkan kesan teknis/platform digital pada background
            */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />
          </div>

          {/* Konten Utama */}
          <div className="relative z-10 mx-auto max-w-2xl">
            
            {/* Badge Eksklusivitas (Glassmorphism) */}
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold tracking-wide text-white shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-brand-200" strokeWidth={2.5} />
              Pendaftaran dengan kode undangan
            </span>

            {/* Tipografi */}
            <h2 className="mt-8 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Warungmu berikutnya?
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-brand-100 sm:text-xl">
              Isi nama usaha, pilih alamat outletnya, dan sistemnya langsung berdiri — lengkap
              dengan dashboard, halaman pelanggan, dan generator QR mejanya sendiri.
            </p>

            {/* Tombol CTA */}
            <div className="mt-10 flex justify-center">
              {/* 
                Pastikan prop size="lg" atau size="xl" (jika ada) digunakan 
                agar tombol terlihat sangat jelas (prominent).
              */}
              <Button 
                href="/daftar-outlet" 
                variant="inverse" 
                size="lg" 
                className="group/btn flex items-center gap-2 shadow-lg transition-all hover:shadow-xl hover:shadow-brand-900/30"
              >
                Daftarkan UMKM Anda
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" strokeWidth={2.5} />
              </Button>
            </div>

            {/* Fitur / Benefit Reassurance */}
            <ul className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-brand-100">
              {PERKS.map((p) => (
                <li key={p} className="flex items-center gap-2.5">
                  <CheckCircle2 
                    className="h-5 w-5 text-brand-300" 
                    strokeWidth={2.5} 
                    aria-hidden="true" 
                  />
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