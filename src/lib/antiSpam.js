import { headers } from 'next/headers';
import { catat } from '@/lib/rateLimit';

/**
 * Penjagaan untuk endpoint yang terbuka TANPA login.
 *
 * Dua jalur tulis publik di sistem ini bisa dipanggil siapa pun: formulir
 * kontak (`contact_messages`, policy insert-nya `with check (true)`) dan
 * checkout (`create_order`, SECURITY DEFINER supaya tamu bisa memesan tanpa
 * akun). Keduanya memang HARUS terbuka — pelanggan yang memindai QR di meja
 * tidak akan membuat akun dulu — dan justru karena itu keduanya perlu
 * penjagaan yang tidak bergantung pada identitas.
 *
 * Berkas ini tipis dengan sengaja: ia hanya menyambungkan alamat IP ke
 * penghitung murni di `lib/rateLimit.js`. Yang punya logika bisa diuji tanpa
 * server; yang butuh server tidak punya logika.
 *
 * ── SOAL ALAMAT IP, dan ini perlu diketahui sebelum dipercaya ──
 *
 * `x-forwarded-for` adalah header biasa, dan header BISA dipalsukan oleh siapa
 * pun yang memanggil langsung. Nilainya baru bisa dipercaya bila ada proxy
 * tepercaya di depan yang MENIMPANYA — Vercel, Cloudflare, dan nginx yang
 * dikonfigurasi benar melakukan itu. Dijalankan telanjang tanpa proxy,
 * penyerang cukup mengganti satu header untuk mendapat jatah baru.
 *
 * Jadi ini lapis pertama yang murah, bukan pengganti WAF.
 */

/*
  Kolom umpan (honeypot) hidup di `lib/honeypot.js`, bukan di sini.

  Formulir di sisi klien perlu tahu nama kolomnya untuk merendernya, dan berkas
  ini menarik `next/headers` — satu impor dari klien akan menyeret modul server
  ke bundle browser dan menghentikan build.
*/

/**
 * Alamat IP pemanggil, sejauh yang bisa diketahui dari header.
 *
 * Yang pertama pada `x-forwarded-for` adalah klien asli; sisanya rantai proxy.
 */
export function alamatKlien() {
  const h = headers();

  const fwd = h.get('x-forwarded-for');
  if (fwd) {
    const pertama = fwd.split(',')[0].trim();
    if (pertama) return pertama;
  }

  return h.get('x-real-ip') || h.get('cf-connecting-ip') || 'tanpa-ip';
}

/**
 * Mencatat satu percobaan dan memberi tahu apakah jatahnya sudah habis.
 *
 * @param {string} aksi  pembeda antar-endpoint — jatah formulir kontak tidak
 *                       ikut terpakai oleh checkout.
 * @param {{maks?: number}} opsi
 * @returns {{lewat: boolean, sisaDetik: number}}
 */
export function lewatBatas(aksi, opsi = {}) {
  return catat(`${aksi}:${alamatKlien()}`, opsi);
}
