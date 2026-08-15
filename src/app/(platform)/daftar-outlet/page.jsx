import Container from '@/components/ui/Container';
import TenantSignupForm from '@/components/platform/TenantSignupForm';
import { 
  QrCode, 
  Receipt, 
  MonitorSmartphone, 
  LineChart, 
  Users, 
  ShieldCheck, 
  KeyRound 
} from 'lucide-react';

/*
  Halaman PLATFORM, bukan halaman outlet.
  Berada di luar `/k/[slug]` karena pengunjung di sini belum memiliki 
  outlet dan sedang dalam proses pembuatan.
*/
export const metadata = {
  title: 'Daftarkan UMKM Anda | To Do POS',
  description:
    'Buat outlet baru di To Do POS — pesan lewat QR di meja, kasir digital, dan laporan penjualan, tanpa biaya perangkat tambahan.',
};

export default function DaftarOutletPage() {
  return (
    <div className="bg-slate-50 min-h-screen pb-20 relative overflow-hidden">
      {/* Dekorasi Background Halus */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-slate-100 to-transparent pointer-events-none" />
      <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-brand-100/40 blur-3xl pointer-events-none" />

      <Container className="py-14 sm:py-20 relative z-10">
        
        {/* HEADER / HERO SECTION */}
        <header className="mx-auto max-w-2xl text-center animate-fade-up">
          <span className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-700">
            Pendaftaran Outlet
          </span>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Daftarkan UMKM Anda
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            Isi formulir ini dan outletmu langsung hidup: tautannya sendiri, menunya sendiri,
            dan denah mejanya sendiri. Tidak ada biaya pemasangan, tidak perlu beli mesin kasir.
          </p>
        </header>

        <div className="mx-auto mt-14 grid max-w-[1100px] gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
          
          {/* KOLOM KIRI: Form Pendaftaran (Client Component) */}
          <div className="animate-fade-up" style={{ animationDelay: '100ms' }}>
            <TenantSignupForm />
          </div>

          {/* KOLOM KANAN: Sidebar Edukasi & Social Proof */}
          <aside className="space-y-5 lg:sticky lg:top-28 animate-fade-up" style={{ animationDelay: '200ms' }}>
            
            {/* Kartu 1: Fitur Ringkas */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Yang Anda dapatkan
              </p>
              <ul className="mt-5 space-y-4 text-sm font-medium leading-snug text-slate-600">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <QrCode className="h-3.5 w-3.5" />
                  </span>
                  <span className="pt-0.5">QR per meja — pelanggan pesan mandiri tanpa aplikasi</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <Receipt className="h-3.5 w-3.5" />
                  </span>
                  <span className="pt-0.5">Satu tagihan per meja, bayar praktis di akhir</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <MonitorSmartphone className="h-3.5 w-3.5" />
                  </span>
                  <span className="pt-0.5">Kasir digital khusus staf untuk mencatat order manual</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <LineChart className="h-3.5 w-3.5" />
                  </span>
                  <span className="pt-0.5">Dashboard real-time omzet dan peringatan stok</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <Users className="h-3.5 w-3.5" />
                  </span>
                  <span className="pt-0.5">Hak akses berjenjang untuk Pemilik dan Kasir</span>
                </li>
              </ul>
            </div>

            {/* 
              Kartu 2: Keamanan (Jargon Translated)
              Menggunakan bahasa keamanan bisnis (Business Value), 
              bukan bahasa backend database.
            */}
            <div className="group rounded-3xl border border-emerald-100 bg-gradient-to-b from-emerald-50/50 to-white p-6 shadow-sm transition-colors hover:border-emerald-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-800">
                  Data Anda Terlindungi
                </p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Menu, data transaksi, dan total omzet Anda dienkripsi secara ketat. 
                Sistem kami memastikan <strong className="font-semibold text-slate-900">tidak ada admin dari kedai kompetitor lain</strong> yang bisa mengakses atau mengintip data dapur bisnis Anda.
              </p>
            </div>

            {/* Kartu 3: Info Kode Undangan */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50/50 p-6">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-slate-400" />
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  Belum punya kode?
                </p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Hubungi pengelola platform melalui kontak WhatsApp kami. Sistem undangan ini diterapkan secara ketat agar server tetap cepat dan direktori bebas dari pendaftaran fiktif.
              </p>
            </div>
          </aside>

        </div>
      </Container>
    </div>
  );
}