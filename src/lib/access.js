/**
 * Sumber kebenaran tunggal untuk "siapa boleh mengakses apa".
 *
 * Dipakai halaman /admin/akses agar aturan yang tertulis di UI selalu
 * sama dengan yang benar-benar dijalankan oleh middleware + RLS Supabase.
 */

export const ROLES = {
  guest: {
    key: 'guest',
    label: 'Tamu',
    badge: 'slate',
    who: 'Siapa pun yang membuka website tanpa login (termasuk hasil scan QR).',
    identity: 'Tidak punya ID akun — auth.uid() bernilai NULL.',
  },
  user: {
    key: 'user',
    label: 'User',
    badge: 'blue',
    who: 'Akun yang mendaftar lewat /register. Semua akun baru otomatis berperan user.',
    identity: 'Punya ID akun (UUID) di tabel profiles dengan role = user.',
  },
  admin: {
    key: 'admin',
    label: 'Admin',
    badge: 'amber',
    who: 'Staf kedai. Role dinaikkan manual dari halaman ini atau lewat SQL Editor.',
    identity: 'Punya ID akun (UUID) di tabel profiles dengan role = admin.',
  },
};

/** y = boleh, n = tidak boleh, o = boleh sebagian (lihat catatan). */
export const ACCESS_MATRIX = [
  {
    area: 'Halaman publik',
    rows: [
      { name: 'Landing page (/)', path: '/', guest: 'y', user: 'y', admin: 'y' },
      { name: 'Ketersediaan meja (/meja)', path: '/meja', guest: 'y', user: 'y', admin: 'y' },
      { name: 'Menu & pesan (/menu)', path: '/menu', guest: 'y', user: 'y', admin: 'y' },
      { name: 'Struk pesanan (/struk/…)', path: '/struk', guest: 'y', user: 'y', admin: 'y' },
      { name: 'About & Kontak', path: '/about', guest: 'y', user: 'y', admin: 'y' },
    ],
  },
  {
    area: 'Aksi pelanggan',
    rows: [
      {
        name: 'Membuat pesanan (checkout)',
        guest: 'y',
        user: 'y',
        admin: 'y',
        note: 'Lewat RPC create_order — tidak butuh login sama sekali.',
      },
      {
        name: 'Melihat struk lewat nomor invoice',
        guest: 'y',
        user: 'y',
        admin: 'y',
        note: 'Lewat RPC get_receipt, satu invoice per permintaan.',
      },
      { name: 'Mengirim pesan kontak', guest: 'y', user: 'y', admin: 'y' },
    ],
  },
  {
    area: 'Area admin',
    rows: [
      { name: 'Dashboard (/admin)', path: '/admin', guest: 'n', user: 'n', admin: 'y' },
      { name: 'CRUD produk (/admin/produk)', path: '/admin/produk', guest: 'n', user: 'n', admin: 'y' },
      { name: 'Denah meja (/admin/meja)', path: '/admin/meja', guest: 'n', user: 'n', admin: 'y' },
      {
        name: 'Daftar transaksi (/admin/transaksi)',
        path: '/admin/transaksi',
        guest: 'n',
        user: 'n',
        admin: 'y',
      },
      { name: 'Hak akses (/admin/akses)', path: '/admin/akses', guest: 'n', user: 'n', admin: 'y' },
    ],
  },
  {
    area: 'Data (Row Level Security)',
    rows: [
      { name: 'Baca produk & meja', guest: 'y', user: 'y', admin: 'y' },
      { name: 'Tulis produk & meja', guest: 'n', user: 'n', admin: 'y' },
      {
        name: 'Baca transaksi di tabel',
        guest: 'n',
        user: 'o',
        admin: 'y',
        note: 'User hanya melihat transaksi miliknya sendiri (user_id = auth.uid()).',
      },
      { name: 'Ubah / hapus transaksi', guest: 'n', user: 'n', admin: 'y' },
      {
        name: 'Baca profil akun',
        guest: 'n',
        user: 'o',
        admin: 'y',
        note: 'User hanya bisa membaca profilnya sendiri.',
      },
      { name: 'Ubah role akun', guest: 'n', user: 'n', admin: 'y' },
      { name: 'Baca pesan kontak masuk', guest: 'n', user: 'n', admin: 'y' },
    ],
  },
];

/** Lapisan pengamanan yang dipakai aplikasi, dari luar ke dalam. */
export const SECURITY_LAYERS = [
  {
    title: 'Middleware',
    file: 'src/middleware.js',
    detail:
      'Menahan permintaan ke /admin bila belum login atau role-nya bukan admin, lalu mengalihkan ke /login atau /.',
  },
  {
    title: 'Layout admin',
    file: 'src/app/admin/layout.jsx',
    detail: 'Lapis kedua: memeriksa ulang user + role sebelum halaman admin dirender.',
  },
  {
    title: 'Server action',
    file: 'src/app/admin/**/actions.js',
    detail: 'Setiap aksi tulis memanggil requireAdmin() sebelum menyentuh database.',
  },
  {
    title: 'Row Level Security',
    file: 'supabase/schema.sql',
    detail:
      'Lapis terakhir di database. Walau seseorang memanggil API Supabase langsung, policy RLS tetap menolaknya.',
  },
];
