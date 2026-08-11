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
  kasir: {
    key: 'kasir',
    label: 'Kasir',
    badge: 'green',
    who: 'Petugas kasir. Hanya membuka Dashboard, Kasir, dan Daftar Transaksi.',
    identity: 'Punya ID akun (UUID) di tabel profiles dengan role = kasir.',
  },
  admin: {
    key: 'admin',
    label: 'Admin',
    badge: 'amber',
    who: 'Pemilik / penanggung jawab. Membuka seluruh area admin.',
    identity: 'Punya ID akun (UUID) di tabel profiles dengan role = admin.',
  },
};

/** Role yang bisa dipilih di halaman /admin/akses, dari paling rendah. */
export const ASSIGNABLE_ROLES = ['user', 'kasir', 'admin'];

/**
 * Halaman admin yang boleh dibuka tiap role — SUMBER KEBENARAN TUNGGAL.
 *
 * Dipakai bersama oleh middleware (menahan permintaan), layout & tiap halaman
 * (memeriksa ulang di server), dan AdminShell (menyembunyikan menu yang tidak
 * boleh dibuka). Menambah halaman admin baru cukup didaftarkan di sini.
 *
 * Kasir sengaja tidak diberi Produk, Denah Meja, dan Hak Akses: tiga halaman
 * itu mengubah harga, denah, dan siapa yang boleh masuk — wewenang pemilik,
 * bukan petugas yang sedang melayani antrean.
 */
export const ADMIN_PAGES = {
  admin: ['/admin', '/admin/kasir', '/admin/produk', '/admin/meja', '/admin/transaksi', '/admin/akses'],
  kasir: ['/admin', '/admin/kasir', '/admin/transaksi'],
  user: [],
};

/**
 * Halaman yang dibuka tiap role staf begitu ia masuk — bukan selalu dashboard.
 *
 * Kasir diarahkan ke layar kasir, bukan ke Dashboard: yang dikerjakannya
 * sepanjang shift adalah memasukkan pesanan, sedangkan dashboard berisi angka
 * ringkasan yang gunanya bagi pemilik. Admin tetap ke dashboard karena
 * pekerjaannya memang bermula dari melihat keadaan hari itu.
 *
 * Tiap tujuan di sini WAJIB ada di ADMIN_PAGES role yang sama (lihat tepat di
 * atas). Kalau tidak, login berakhir di lemparan balik oleh middleware — dan
 * gejalanya terlihat seperti login gagal, bukan seperti salah tujuan.
 */
export const STAFF_HOME = {
  admin: '/admin',
  kasir: '/admin/kasir',
};

/** Tujuan `role` sesudah login, TANPA awalan outlet. */
export function staffHomePath(role) {
  return STAFF_HOME[role] || '/admin';
}

/** Role apa pun yang berhak masuk area /admin sama sekali. */
export const STAFF_ROLES = ['admin', 'kasir'];

/**
 * Buang awalan outlet dari sebuah path: `/k/kopi-pagi/admin/produk` → `/admin/produk`.
 *
 * ADMIN_PAGES di atas sengaja ditulis tanpa slug. Aturan "kasir tidak boleh
 * membuka Daftar Produk" tidak berubah karena outletnya berganti, jadi
 * mencantumkan slug di dalam daftarnya berarti menyalin aturan yang sama
 * sebanyak jumlah penyewa. Yang berpindah cukup path-nya, sekali, di sini.
 */
export function stripTenantPrefix(pathname = '') {
  const cocok = /^\/k\/[^/]+(\/.*)?$/.exec(pathname);
  if (!cocok) return pathname;
  return cocok[1] || '/';
}

/** Slug outlet dari sebuah path, atau '' bila path-nya di luar `/k/`. */
export function tenantSlugFromPath(pathname = '') {
  const cocok = /^\/k\/([^/]+)/.exec(pathname);
  return cocok ? decodeURIComponent(cocok[1]) : '';
}

/**
 * Apakah `role` boleh membuka `pathname`?
 *
 * Pencocokan memakai awalan supaya sub-rute ikut terjaga, tapi hanya pada batas
 * segmen — sehingga `/admin/kasir` tidak pernah lolos gara-gara mirip dengan
 * `/admin/kasirXYZ`.
 */
export function canOpenAdminPath(role, pathname) {
  const izin = ADMIN_PAGES[role];
  if (!izin || izin.length === 0) return false;

  return izin.some((p) => {
    if (pathname === p) return true;

    /*
      '/admin' hanya boleh cocok PERSIS. Kalau ia ikut mencocokkan awalan,
      izin membuka dashboard otomatis membuka seluruh sub-halaman admin —
      kasir jadi bisa masuk /admin/produk. Entri yang lebih dalam tetap
      mencocokkan awalan supaya sub-rutenya (mis. /admin/kasir/apa pun)
      ikut terjaga, dan garis miring menjaganya berhenti di batas segmen.
    */
    if (p === '/admin') return false;
    return pathname.startsWith(`${p}/`);
  });
}

/** y = boleh, n = tidak boleh, o = boleh sebagian (lihat catatan). */
export const ACCESS_MATRIX = [
  {
    area: 'Halaman publik',
    rows: [
      { name: 'Landing page (/)', path: '/', guest: 'y', user: 'y', kasir: 'y', admin: 'y' },
      { name: 'Ketersediaan meja (/meja)', path: '/meja', guest: 'y', user: 'y', kasir: 'y', admin: 'y' },
      { name: 'Menu & pesan (/menu)', path: '/menu', guest: 'y', user: 'y', kasir: 'y', admin: 'y' },
      { name: 'Struk pesanan (/struk/…)', path: '/struk', guest: 'y', user: 'y', kasir: 'y', admin: 'y' },
      { name: 'About & Kontak', path: '/about', guest: 'y', user: 'y', kasir: 'y', admin: 'y' },
    ],
  },
  {
    area: 'Aksi pelanggan',
    rows: [
      {
        name: 'Membuat pesanan (checkout)',
        guest: 'y',
        user: 'y',
        kasir: 'y',
        admin: 'y',
        note: 'Lewat RPC create_order — tidak butuh login sama sekali.',
      },
      {
        name: 'Melihat struk lewat nomor invoice',
        guest: 'y',
        user: 'y',
        kasir: 'y',
        admin: 'y',
        note: 'Lewat RPC get_receipt, satu invoice per permintaan.',
      },
      { name: 'Mengirim pesan kontak', guest: 'y', user: 'y', kasir: 'y', admin: 'y' },
    ],
  },
  {
    area: 'Area admin',
    rows: [
      { name: 'Dashboard (/admin)', path: '/admin', guest: 'n', user: 'n', kasir: 'y', admin: 'y' },
      { name: 'Kasir (/admin/kasir)', path: '/admin/kasir', guest: 'n', user: 'n', kasir: 'y', admin: 'y' },
      {
        name: 'Daftar transaksi (/admin/transaksi)',
        path: '/admin/transaksi',
        guest: 'n',
        user: 'n',
        kasir: 'y',
        admin: 'y',
      },
      { name: 'CRUD produk (/admin/produk)', path: '/admin/produk', guest: 'n', user: 'n', kasir: 'n', admin: 'y' },
      { name: 'Denah meja (/admin/meja)', path: '/admin/meja', guest: 'n', user: 'n', kasir: 'n', admin: 'y' },
      { name: 'Hak akses (/admin/akses)', path: '/admin/akses', guest: 'n', user: 'n', kasir: 'n', admin: 'y' },
    ],
  },
  {
    area: 'Data (Row Level Security)',
    rows: [
      { name: 'Baca produk & meja', guest: 'y', user: 'y', kasir: 'y', admin: 'y' },
      { name: 'Tulis produk & meja', guest: 'n', user: 'n', kasir: 'n', admin: 'y' },
      {
        name: 'Baca transaksi di tabel',
        guest: 'n',
        user: 'o',
        kasir: 'y',
        admin: 'y',
        note: 'User hanya melihat transaksi miliknya sendiri (user_id = auth.uid()).',
      },
      {
        name: 'Ubah status transaksi',
        guest: 'n',
        user: 'n',
        kasir: 'y',
        admin: 'y',
        note: 'Menandai pesanan lunas / batal — pekerjaan sehari-hari kasir.',
      },
      {
        name: 'Hapus transaksi',
        guest: 'n',
        user: 'n',
        kasir: 'n',
        admin: 'y',
        note: 'Menghapus riwayat penjualan tidak bisa dibatalkan, jadi ditahan di admin.',
      },
      {
        name: 'Baca profil akun',
        guest: 'n',
        user: 'o',
        kasir: 'o',
        admin: 'y',
        note: 'User & kasir hanya bisa membaca profilnya sendiri.',
      },
      { name: 'Ubah role akun', guest: 'n', user: 'n', kasir: 'n', admin: 'y' },
      { name: 'Baca pesan kontak masuk', guest: 'n', user: 'n', kasir: 'n', admin: 'y' },
    ],
  },
];

/** Lapisan pengamanan yang dipakai aplikasi, dari luar ke dalam. */
export const SECURITY_LAYERS = [
  {
    title: 'Middleware',
    file: 'src/middleware.js',
    detail:
      'Menahan permintaan ke /admin bila belum login, dan mencocokkan role dengan daftar halaman yang boleh dibukanya (ADMIN_PAGES).',
  },
  {
    title: 'Layout & halaman admin',
    file: 'src/app/admin/**/page.jsx',
    detail:
      'Lapis kedua: layout memastikan pemanggil berperan staf, tiap halaman terbatas memeriksa ulang role-nya sendiri sebelum dirender.',
  },
  {
    title: 'Server action',
    file: 'src/app/admin/**/actions.js',
    detail:
      'Setiap aksi tulis memanggil penjaga role sebelum menyentuh database — kasir ditolak pada aksi produk, meja, dan hak akses.',
  },
  {
    title: 'Row Level Security',
    file: 'supabase/schema.sql',
    detail:
      'Lapis terakhir di database. Walau seseorang memanggil API Supabase langsung, policy RLS tetap menolaknya.',
  },
];
