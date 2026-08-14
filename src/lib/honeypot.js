/**
 * Kolom umpan (honeypot) untuk formulir publik.
 *
 * Dipisah dari `lib/antiSpam.js` karena berkas itu menarik `next/headers` —
 * satu impor dari sisi klien akan menyeret modul server ke bundle browser dan
 * build-nya berhenti. Alasannya sama persis dengan pemisahan `tenant.js` /
 * `tenant.server.js`.
 *
 * Isinya harus dipakai bersama: formulir yang merender kolomnya dan server
 * action yang memeriksanya wajib menyebut nama yang sama, dan satu-satunya
 * cara menjaminnya adalah menulis namanya sekali.
 */

/**
 * Sengaja bernama `website`: pengisi formulir otomatis mencari nama kolom yang
 * lazim lalu mengisinya, sementara manusia tidak pernah melihat kolomnya.
 *
 * JANGAN diganti jadi nama yang jelas-jelas jebakan (`honeypot`, `jangan-isi`)
 * — skrip yang sedikit lebih pintar melewatinya, dan perangkapnya jadi kolom
 * hiasan.
 */
export const UMPAN = 'website';

/**
 * Apakah umpannya termakan?
 *
 * Yang terisi ditolak DIAM-DIAM oleh pemanggilnya — dengan balasan yang sama
 * persis dengan kiriman berhasil. Pesan galat yang jujur akan memberi tahu
 * penulis skripnya bahwa ada kolom yang harus dikosongkan, dan perangkapnya
 * tidak berguna lagi pada percobaan kedua.
 */
export function umpanTermakan(payload) {
  return String(payload?.[UMPAN] || '').trim().length > 0;
}
