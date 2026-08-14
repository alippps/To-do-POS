/**
 * Status meja dipakai bersama oleh halaman pelanggan (/meja)
 * dan halaman admin (/admin/meja) agar labelnya selalu konsisten.
 */
export const TABLE_STATUS = {
  available: {
    value: 'available',
    label: 'Tersedia',
    short: 'Kosong',
    tone: 'green',
    dot: 'bg-emerald-500',
    ring: 'border-emerald-200 bg-emerald-50/70',
    text: 'text-emerald-700',
    description: 'Meja kosong dan siap dipakai.',
  },
  occupied: {
    value: 'occupied',
    label: 'Terisi',
    short: 'Terisi',
    tone: 'rose',
    dot: 'bg-rose-500',
    ring: 'border-rose-200 bg-rose-50/70',
    text: 'text-rose-700',
    description: 'Sedang ada pesanan aktif di meja ini.',
  },
  reserved: {
    value: 'reserved',
    label: 'Direservasi',
    short: 'Booked',
    tone: 'amber',
    dot: 'bg-amber-500',
    ring: 'border-amber-200 bg-amber-50/70',
    text: 'text-amber-700',
    description: 'Meja sudah dipesan lebih dulu.',
  },
};

export const TABLE_STATUS_LIST = Object.values(TABLE_STATUS);

/**
 * Area meja — sengaja hanya dua.
 *
 * Sebelumnya ada 'Workspace' dan 'VIP' juga, tapi keduanya bukan area: ruang
 * kerja dan meeting room sama-sama berada di dalam ruangan. Sifat ruangannya
 * sekarang ditulis di `label` meja (mis. "Workspace / Meeting Room"), sehingga
 * area tetap menjawab satu pertanyaan saja — pelanggan duduk di dalam atau di
 * luar.
 *
 * Dipakai bersama oleh form admin dan validasi server action.
 */
export const TABLE_AREAS = ['Indoor', 'Outdoor'];

export function tableStatus(value) {
  return TABLE_STATUS[value] || TABLE_STATUS.available;
}

/**
 * Metode pembayaran — SATU sumber untuk struk, halaman bayar, dan panel admin.
 *
 * Dua bentuk, bukan dua daftar: `label` untuk pelanggan (menjelaskan di mana
 * uangnya dibayar), `short` untuk tabel admin yang kolomnya sempit. Sebelumnya
 * ketiga tempat itu menulis daftarnya sendiri-sendiri, sehingga satu transaksi
 * yang sama terbaca "Tunai di kasir" di struk, "Tunai" di tabel, dan
 * "Transfer Bank" vs "Transfer" tergantung layar mana yang dibuka.
 *
 * TINGGAL DUA. Transfer bank dihapus dari pilihan: ia satu-satunya metode yang
 * tidak bisa diselesaikan di tempat — pelanggan pergi ke aplikasi banknya,
 * kasir menunggu bukti transfer yang tidak pernah masuk ke sistem, dan status
 * pesanan menggantung tanpa ada yang tahu sudah dibayar atau belum. QRIS
 * menyelesaikan pembayaran non-tunai di layar yang sama, dan tunai
 * diselesaikan di kasir dengan menunjukkan nomor pesanan.
 */
export const PAYMENT_METHOD = {
  qris: {
    value: 'qris',
    label: 'QRIS',
    short: 'QRIS',
    hint: 'Pindai kode QRIS yang muncul di bukti pesanan.',
  },
  cash: {
    value: 'cash',
    label: 'Bayar di kasir',
    short: 'Kasir',
    hint: 'Tunjukkan nomor pesanan di kasir, bayar tunai di sana.',
  },
};

/**
 * Metode yang tidak lagi ditawarkan, tapi masih ada di arsip.
 *
 * Transaksi lama yang terlanjur tercatat 'transfer' adalah riwayat penjualan
 * sungguhan. Menghapus labelnya berarti tabel admin menampilkan kata mentah
 * "transfer" pada baris-baris itu; menulis ulang nilainya berarti memalsukan
 * catatan keuangan. Jadi labelnya tetap ada, pilihannya yang hilang.
 */
export const PAYMENT_METHOD_ARCHIVED = {
  transfer: { value: 'transfer', label: 'Transfer Bank', short: 'Transfer' },
};

const SEMUA_METODE = { ...PAYMENT_METHOD, ...PAYMENT_METHOD_ARCHIVED };

export const PAYMENT_LABEL = Object.fromEntries(
  Object.entries(SEMUA_METODE).map(([key, m]) => [key, m.label])
);

export const PAYMENT_LABEL_SHORT = Object.fromEntries(
  Object.entries(SEMUA_METODE).map(([key, m]) => [key, m.short])
);

/** Metode yang boleh dipilih untuk pesanan BARU — dipakai validasi server action. */
export const PAYMENT_METHOD_VALUES = Object.keys(PAYMENT_METHOD);

/** Daftar untuk dropdown pelanggan & kasir, berurutan seperti tampil di layar. */
export const PAYMENT_METHOD_LIST = Object.values(PAYMENT_METHOD);

/**
 * Status pesanan — dipakai struk pelanggan DAN badge admin.
 *
 * `label` bercerita ke pelanggan, `short` muat di badge tabel admin. Nilai
 * `tone` menyatukan warnanya supaya badge di dashboard, tabel, dan modal detail
 * tidak lagi punya peta warna masing-masing.
 *
 * ── Kenapa ada tahap dapur ──
 *
 * Sampai v6 daftarnya cuma pending → paid → cancelled, dan itu berarti seluruh
 * pekerjaan dapur tidak terekam sama sekali. Begitu pesanan masuk, tidak ada
 * cara tahu apakah ia masih antre, sedang dimasak, atau sudah siap diantar —
 * satu-satunya yang tercatat adalah "belum dibayar". Barista dan kasir
 * menutupi lubang itu dengan ingatan dan teriakan.
 *
 * `diproses` dan `siap` menyisipkan dua tahap itu SEBELUM pembayaran, bukan
 * sesudahnya: pelanggan membayar di akhir, jadi pesanan yang sedang dimasak
 * tetap berstatus belum lunas.
 */
export const ORDER_STATUS = {
  pending: { value: 'pending', label: 'Menunggu diproses', short: 'Pending', tone: 'amber' },
  diproses: { value: 'diproses', label: 'Sedang dibuat', short: 'Diproses', tone: 'blue' },
  siap: { value: 'siap', label: 'Siap diantar', short: 'Siap', tone: 'violet' },
  paid: { value: 'paid', label: 'Lunas', short: 'Lunas', tone: 'green' },
  cancelled: { value: 'cancelled', label: 'Dibatalkan', short: 'Batal', tone: 'rose' },
};

export const ORDER_STATUS_LIST = Object.values(ORDER_STATUS);

/** Nilai sah untuk kolom `transactions.status` — cermin check constraint di database. */
export const ORDER_STATUS_VALUES = Object.keys(ORDER_STATUS);

/**
 * Pesanan yang BELUM SELESAI — dan karena itu mejanya masih terisi.
 *
 * Satu daftar ini menjawab tiga pertanyaan yang dulu dijawab sendiri-sendiri
 * dengan `status = 'pending'`: meja mana yang terisi, tagihan mana yang masih
 * berjalan, dan pesanan mana yang masih jadi pekerjaan.
 *
 * Kembarannya di database ada di `refresh_table_status()` dan
 * `get_table_bill()`. Kalau daftar ini berubah, keduanya WAJIB ikut — meja
 * yang terlihat kosong padahal makanannya sedang dimasak adalah kegagalan yang
 * baru ketahuan saat dua tamu diarahkan ke meja yang sama.
 */
export const ORDER_ACTIVE_STATUSES = ['pending', 'diproses', 'siap'];

/**
 * Perpindahan status yang sah, dari tiap tahap.
 *
 * Alurnya maju satu arah — pending → diproses → siap → paid — dengan
 * `cancelled` sebagai jalan keluar dari tahap mana pun yang belum lunas.
 *
 * `paid` dan `cancelled` sengaja TIDAK punya lanjutan. Konsekuensinya harus
 * disadari: pesanan yang terlanjur ditandai lunas tidak bisa dikembalikan dari
 * layar kasir, dan pembetulannya harus lewat SQL Editor. Itu batas yang
 * dipilih, bukan yang terlupa — status lunas menutup sebuah transaksi
 * keuangan, dan tombol yang bisa membatalkannya diam-diam lebih berbahaya
 * daripada kesalahan yang sesekali harus dibetulkan manual.
 */
export const ORDER_TRANSITIONS = {
  pending: ['diproses', 'cancelled'],
  diproses: ['siap', 'cancelled'],
  siap: ['paid', 'cancelled'],
  paid: [],
  cancelled: [],
};

/** Tahap-tahap lanjutan yang sah dari sebuah status. */
export function nextOrderStatuses(current) {
  return ORDER_TRANSITIONS[current] || [];
}

/** Penjaga tunggal, dipakai tombol di layar DAN server action. */
export function canTransitionOrder(from, to) {
  return nextOrderStatuses(from).includes(to);
}

export function orderStatus(value) {
  return ORDER_STATUS[value] || ORDER_STATUS.pending;
}
