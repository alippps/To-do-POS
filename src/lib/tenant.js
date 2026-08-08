/**
 * Helper outlet yang MURNI — aman dipakai di server maupun di browser.
 *
 * Pemisahan ini bukan selera. Berkas ini dipakai `Footer`, `Logo`, dan komponen
 * klien lain; kalau ia ikut mengimpor `lib/supabase/server.js` (yang menyentuh
 * `next/headers`), seluruh modul server tertarik masuk ke bundle browser dan
 * build-nya gagal. Fungsi yang benar-benar membaca database ada di
 * `lib/tenant.server.js` dan hanya boleh diimpor dari komponen server.
 */

/**
 * Awalan URL setiap outlet.
 *
 * Ditulis sekali di sini supaya berpindah skema alamat (misalnya kelak ke
 * subdomain) tidak berarti menyisir puluhan berkas — cukup fungsi ini yang
 * berubah bentuk keluarannya. Kembarannya di sisi klien adalah
 * `useTenantHref()` di components/tenant/TenantProvider.jsx.
 */
export function tenantPath(slug, path = '') {
  const bersih = String(path || '');
  const berawalanGaris = bersih.startsWith('/') || bersih === '' ? bersih : `/${bersih}`;

  /*
    Beranda outlet ditulis `/k/slug`, BUKAN `/k/slug/`.

    Keduanya menunjuk halaman yang sama, tapi `next/link` menormalkan garis
    miring di ujung sebelum menaruhnya di atribut `href`. Kalau fungsi ini
    mengeluarkan bentuk yang berbeda dari yang akhirnya terpasang di DOM, setiap
    perbandingan href — test e2e, penanda tautan aktif — meleset tanpa sebab
    yang kelihatan.
  */
  const jalur = berawalanGaris === '/' ? '' : berawalanGaris;
  return `/k/${encodeURIComponent(slug)}${jalur}`;
}

/** URL lengkap sebuah outlet — dipakai isi QR meja, yang harus absolut. */
export function tenantUrl(siteUrl, slug, path = '') {
  return `${siteUrl}${tenantPath(slug, path)}`;
}

/**
 * Slug yang sah: huruf kecil, angka, tanda hubung. Divalidasi sebelum menyentuh
 * database supaya rute sampah (`/k/..%2F..`) berhenti di sini, bukan jadi kueri.
 */
export function slugValid(slug) {
  return typeof slug === 'string' && /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(slug);
}

/** Nomor WhatsApp outlet, dirapikan sebelum masuk ke tautan wa.me. */
export function waNumberOf(tenant) {
  return String(tenant?.wa_number || '').replace(/[^\d]/g, '');
}

export function waLinkOf(tenant, message) {
  const pesan =
    message ||
    `Halo ${tenant?.name || 'Admin'}! Saya ingin bertanya soal pemesanan di outlet Anda.`;
  return `https://wa.me/${waNumberOf(tenant)}?text=${encodeURIComponent(pesan)}`;
}
