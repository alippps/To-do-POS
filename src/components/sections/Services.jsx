import Container from '@/components/ui/Container';
import SectionHeading from '@/components/ui/SectionHeading';
import Card from '@/components/ui/Card';

const SERVICES = [
  {
    icon: '🧾',
    title: 'Kasir Digital (POS)',
    text: 'Proses pesanan dalam hitungan detik: pilih produk, hitung otomatis, cetak struk, stok langsung terpotong.',
    points: ['Multi metode bayar', 'Struk digital', 'Stok real-time'],
  },
  {
    icon: '📦',
    title: 'Manajemen Produk',
    text: 'CRUD lengkap untuk menu: tambah, ubah, hapus, dan cari produk dengan filter kategori dan status.',
    points: ['Kategori & harga', 'Kontrol stok', 'Pencarian instan'],
  },
  {
    icon: '📊',
    title: 'Laporan Penjualan',
    text: 'Pantau omzet harian, produk terlaris, dan riwayat transaksi lengkap dari dashboard admin.',
    points: ['Omzet harian', 'Produk terlaris', 'Riwayat transaksi'],
  },
  {
    icon: '📱',
    title: 'Pemesanan via QR',
    text: 'Pelanggan scan QR di meja, pilih menu sendiri, pesanan langsung masuk ke sistem. Antrean berkurang drastis.',
    points: ['Tanpa aplikasi', 'Nomor meja otomatis', 'Menu selalu update'],
  },
  {
    icon: '🔐',
    title: 'Multi User & Role',
    text: 'Akun pelanggan dan admin terpisah dengan autentikasi Supabase serta proteksi Row Level Security.',
    points: ['Login & register', 'Role admin/user', 'Session aman'],
  },
  {
    icon: '☕',
    title: 'Katering & Event',
    text: 'Layanan coffee bar untuk kantor, seminar, dan acara pernikahan lengkap dengan barista kami.',
    points: ['Coffee bar on-site', 'Custom menu', 'Barista profesional'],
  },
];

export default function Services() {
  return (
    <section id="layanan" className="bg-slate-50/70 py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Layanan Utama"
          title="Semua yang dibutuhkan UMKM kuliner"
          description="Dari secangkir kopi di meja pelanggan sampai laporan penjualan di layar pemilik — satu sistem, semua beres. Tanpa biaya lisensi mahal dan tanpa perlu tim IT."
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <Card key={s.title} hover className="flex flex-col">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-2xl">
                {s.icon}
              </span>
              <h3 className="mt-5 text-lg font-bold text-slate-900">{s.title}</h3>
              <p className="mt-2.5 flex-1 text-sm leading-relaxed text-slate-500">{s.text}</p>
              <ul className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                {s.points.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm text-slate-600">
                    <svg className="h-4 w-4 shrink-0 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {p}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
