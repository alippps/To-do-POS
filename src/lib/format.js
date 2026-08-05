/**
 * Format rupiah — SENGAJA tidak memakai `Intl.NumberFormat` dengan
 * `style: 'currency'`.
 *
 * Penempatan dan spasi setelah "Rp" berbeda antar versi ICU: Node di server
 * menghasilkan "Rp 22.000" (dengan non-breaking space), sedangkan Safari iOS
 * menghasilkan "Rp22.000". Bedanya tak terlihat mata, tapi React membandingkan
 * teks hasil server dengan hasil render ulang di browser — begitu tidak sama
 * persis, muncul "Text content does not match server-rendered HTML" dan
 * komponennya gagal hydrate.
 *
 * Pemisah ribuan dipasang manual supaya hasilnya identik di mana pun kode ini
 * dijalankan.
 */
export function rupiah(value) {
  const n = Math.round(Number(value) || 0);
  const negatif = n < 0;
  const digit = Math.abs(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${negatif ? '-' : ''}Rp ${digit}`;
}

/*
  Zona waktu dikunci ke Asia/Jakarta, tidak mengikuti jam sistem.

  Server produksi (Vercel) berjalan di UTC. Tanpa penguncian ini, waktu pesanan
  yang dirender di server akan tampil 7 jam lebih awal daripada jam dinding
  pelanggan — pesanan pukul 23.00 WIB tertulis 16.00 di struknya.
*/
const ZONA = 'Asia/Jakarta';

export function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: ZONA,
  }).format(new Date(value));
}

export function formatDateShort(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: ZONA,
  }).format(new Date(value));
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}
