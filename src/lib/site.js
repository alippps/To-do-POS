/**
 * Identitas PLATFORM — bukan identitas kedai.
 *
 * Sampai v3 berkas ini memegang nama, alamat, jam buka, dan nomor WhatsApp satu
 * kedai. Sejak satu pemasangan melayani banyak UMKM (v4), semua itu pindah ke
 * tabel `tenants` di database dan dibaca lewat `src/lib/tenant.js` — sebab
 * jawabannya berbeda per permintaan, dan berkas yang dibundel saat build tidak
 * bisa berbeda per permintaan.
 *
 * Yang tersisa di sini hanyalah hal yang memang sama untuk semua penyewa.
 */
export const platform = {
  name: 'To Do POS',
  tagline: 'Satu sistem kasir untuk banyak UMKM',
  description:
    'Sistem Point of Sale untuk UMKM kuliner — pesan lewat QR di meja, kasir digital, dan laporan penjualan real-time. Satu pemasangan melayani banyak outlet.',
  /*
    Nilai dari .env.local dirapikan sebelum dipakai.

    Spasi nyasar di ujung baris `.env` tidak terlihat saat menyunting, tapi ikut
    terbawa ke nilai variabelnya. Untuk `siteUrl` akibatnya fatal: alamat itu
    dicetak permanen ke dalam QR meja, dan spasi di tengah URL membuat hasil
    pindaian tidak bisa dibuka. Garis miring di ujung juga dibuang supaya tidak
    pernah terbentuk "//k".
  */
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
    .trim()
    .replace(/\/+$/, ''),
};

/** Kategori produk bawaan — dipakai form admin di semua outlet. */
export const CATEGORIES = ['Kopi', 'Non-Kopi', 'Snack', 'Makanan'];
