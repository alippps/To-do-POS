/**
 * Penghitung rate limit — inti yang MURNI, tanpa Next.js dan tanpa jaringan.
 *
 * Dipisah dari `lib/antiSpam.js` bukan demi kerapian melainkan demi bisa
 * dibuktikan: begitu penghitungnya menempel pada `headers()`, satu-satunya cara
 * mengujinya adalah menjalankan server lalu mengirim enam permintaan sungguhan —
 * dan di formulir kontak, permintaan yang lolos berarti baris sungguhan di
 * database. Di sini `now` bisa disuntik, jadi perilaku "menolak yang keenam" dan
 * "memaafkan setelah satu menit" dapat diperiksa dalam hitungan milidetik tanpa
 * menyentuh apa pun.
 *
 * BATASNYA: penghitungnya di memori proses. Ia hilang saat server dimulai ulang
 * dan tidak dibagi antar-instance, jadi pemasangan multi-instance punya batas
 * efektif `maks × jumlah instance`. Cukup untuk menahan skrip iseng dan klik
 * ganda; tidak cukup untuk serangan sungguhan, yang menuntut penyimpanan bersama
 * (Redis) atau rate limit di lapis CDN.
 */

/** Jendela bawaan: satu menit. */
export const JENDELA_MS = 60_000;

/** Jatah bawaan per jendela. */
export const MAKS_BAWAAN = 5;

/** kunci → daftar timestamp kiriman yang masih dalam jendela. */
const jejak = new Map();

/*
  Map ini tumbuh satu entri per kunci. Tanpa pembersihan ia jadi kebocoran
  memori yang pelan — dan satu-satunya cara menyadarinya adalah proses yang
  membengkak setelah berminggu-minggu. Disapu berkala, bukan pada setiap
  panggilan, supaya biayanya tidak ditanggung permintaan yang sedang ditunggu.
*/
const JEDA_SAPU_MS = 5 * 60_000;
let sapuTerakhir = 0;

function sapu(now, jendelaMs) {
  if (now - sapuTerakhir < JEDA_SAPU_MS) return;
  sapuTerakhir = now;

  for (const [kunci, daftar] of jejak) {
    const sisa = daftar.filter((t) => now - t < jendelaMs);
    if (sisa.length === 0) jejak.delete(kunci);
    else jejak.set(kunci, sisa);
  }
}

/**
 * Mencatat satu percobaan pada sebuah kunci.
 *
 * @param {string} kunci
 * @param {{maks?: number, jendelaMs?: number, now?: number}} opsi
 *        `now` disuntikkan oleh pengujian; kode sungguhan tidak pernah mengisinya.
 * @returns {{lewat: boolean, sisaDetik: number, terpakai: number}}
 */
export function catat(kunci, { maks = MAKS_BAWAAN, jendelaMs = JENDELA_MS, now = Date.now() } = {}) {
  sapu(now, jendelaMs);

  const daftar = (jejak.get(kunci) || []).filter((t) => now - t < jendelaMs);

  if (daftar.length >= maks) {
    /*
      Percobaan yang DITOLAK sengaja tidak ikut dicatat.

      Kalau ikut, setiap percobaan menggeser jendela ke depan dan pengirim yang
      menekan tombol berulang kali tidak akan pernah lepas — termasuk orang
      sungguhan yang cuma tidak sabar. Yang dibatasi kiriman yang diterima,
      bukan niat mencoba.
    */
    jejak.set(kunci, daftar);
    return {
      lewat: true,
      sisaDetik: Math.max(1, Math.ceil((jendelaMs - (now - daftar[0])) / 1000)),
      terpakai: daftar.length,
    };
  }

  daftar.push(now);
  jejak.set(kunci, daftar);
  return { lewat: false, sisaDetik: 0, terpakai: daftar.length };
}
