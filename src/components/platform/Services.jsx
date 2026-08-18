import Container from '@/components/ui/Container';
import SectionHeading from '@/components/ui/SectionHeading';
import {
  Receipt,
  PackageSearch,
  LineChart,
  QrCode,
  Users,
  Store,
  CheckCircle2
} from 'lucide-react';

/*
  1. Ikon diganti menggunakan Lucide untuk konsistensi UI.
  2. Jargon teknis ('CRUD', 'Row Level Security', 'Level Database')
     dihapus dan diganti dengan bahasa manfaat bisnis (Business Value).
*/
const SERVICES = [
  {
    icon: Receipt,
    title: 'Kasir Digital (POS)',
    text: 'Proses pesanan dalam hitungan detik: pilih produk, hitung otomatis, cetak struk, dan stok langsung terpotong.',
    points: ['Multi metode bayar', 'Struk digital', 'Stok real-time'],
  },
  {
    icon: PackageSearch,
    title: 'Manajemen Menu',
    text: 'Kelola daftar menu dengan mudah: tambah produk baru, ubah harga, atau sembunyikan menu yang sedang habis seketika.',
    points: ['Kategori & harga', 'Kontrol stok', 'Pencarian instan'],
  },
  {
    icon: LineChart,
    title: 'Laporan Penjualan',
    text: 'Pantau omzet harian, produk terlaris, dan riwayat transaksi lengkap langsung dari dashboard pemilik.',
    points: ['Omzet harian', 'Produk terlaris', 'Riwayat transaksi'],
  },
  {
    icon: QrCode,
    title: 'Pemesanan via QR',
    text: 'Pelanggan scan QR di meja, pilih menu sendiri, pesanan langsung masuk ke sistem. Antrean di kasir berkurang drastis.',
    points: ['Tanpa instal aplikasi', 'Nomor meja otomatis', 'Menu selalu update'],
  },
  {
    icon: Users,
    title: 'Multi User & Role',
    /*
      Pelanggan tidak butuh akun (frictionless).
      Sedangkan untuk internal, kita ganti "RLS" dengan "proteksi keamanan ketat".
    */
    text: 'Pelanggan memesan tanpa akun sama sekali. Akun hanya untuk tim Anda, dengan hak akses berjenjang dan proteksi keamanan ketat.',
    points: ['Role Admin & Kasir', 'Pelanggan tanpa login', 'Akses data aman'],
  },
  {
    icon: Store,
    title: 'Sistem Multi-Outlet',
    /*
      Penghapusan istilah "terpisah sampai level database".
      Fokus pada kemudahan mengelola banyak cabang dari satu tempat.
    */
    text: 'Satu platform melayani banyak cabang sekaligus. Tiap outlet punya alamat, menu, denah meja, dan laporan keuangannya masing-masing.',
    points: ['Link khusus /k/<slug>', 'Menu & meja terpisah', 'Laporan tiap cabang'],
  },
];

export default function Services() {
  return (
    <section id="fitur" className="scroll-mt-20 bg-white py-20 sm:py-24 relative overflow-hidden">
      {/*
        Garis batas pemisah halus dengan section sebelumnya
        jika memiliki background yang mirip.
      */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      <Container className="relative z-10">
        <SectionHeading
          // eyebrow="Layanan Utama"
          title="Semua yang dibutuhkan UMKM kuliner"
          description="Dari secangkir kopi di meja pelanggan sampai laporan penjualan di layar pemilik — satu sistem, semua beres. Tanpa biaya lisensi mahal dan tanpa perlu tim IT."
        />

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => {
            const Icon = s.icon;

            return (
              <div
                key={s.title}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl hover:shadow-brand-900/5"
              >
                {/* Efek Gradient Background saat di-hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-50/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="relative z-10 flex flex-col h-full">
                  {/* Container Ikon */}
                  <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-50 text-slate-600 transition-all duration-300 group-hover:bg-brand-600 group-hover:text-white group-hover:shadow-md group-hover:scale-105">
                    <Icon className="h-7 w-7" strokeWidth={1.5} />
                  </span>

                  {/* Judul & Deskripsi */}
                  <h3 className="mt-6 text-lg font-bold text-slate-900 transition-colors group-hover:text-brand-800">
                    {s.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
                    {s.text}
                  </p>

                  {/* Daftar Fitur Utama (Points) */}
                  <ul className="mt-6 space-y-3 border-t border-slate-100 pt-5 transition-colors group-hover:border-brand-100">
                    {s.points.map((p) => (
                      <li key={p} className="flex items-start gap-3 text-sm font-medium text-slate-700">
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-500 transition-transform duration-300 group-hover:scale-110" />
                        <span className="mt-0.5">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}