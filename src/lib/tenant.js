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

/**
 * Mengubah nama usaha jadi calon slug: "Kopi Pagi Bandung!" → "kopi-pagi-bandung".
 *
 * Dipakai formulir /daftar-outlet untuk mengisi kolom alamat sambil pemiliknya
 * mengetik namanya. Bukan demi kecepatan mengetik: slug ini ikut TERCETAK
 * PERMANEN di QR tiap meja, jadi salah ketik di sini baru ketahuan setelah
 * kartu mejanya jadi. Menyodorkan bentuk yang sudah pasti sah membuat kolom itu
 * jarang perlu disentuh sama sekali.
 *
 * Hasilnya belum tentu lolos `slugValid()` — nama sepatah huruf atau nama yang
 * seluruhnya non-latin bisa menghasilkan slug terlalu pendek. Yang memanggilnya
 * tetap wajib memeriksa; fungsi ini menyiapkan tebakan, bukan jaminan.
 */
export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    // Buang tanda diakritik yang baru saja dipisahkan NFD ("Café" → "Cafe"),
    // supaya huruf beraksen tidak hilang seluruhnya jadi tanda hubung.
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
    // Pemotongan di atas bisa menyisakan tanda hubung di ujung — dan slug
    // berakhiran '-' ditolak constraint di database.
    .replace(/-+$/g, '');
}

/**
 * Cerita outlet, dipecah jadi paragraf.
 *
 * Kolom `tenants.story` diisi pemilik outlet lewat /admin/profil, jadi bentuk
 * pemisah paragrafnya tidak bisa dipastikan: ada yang menekan Enter sekali, ada
 * yang dua kali, dan textarea di Windows mengirim `\r\n`. Ketiganya
 * diperlakukan sama supaya yang mengetik tidak perlu tahu aturan mana yang
 * berlaku.
 *
 * Mengembalikan array kosong bila belum ada ceritanya — outlet yang baru
 * mendaftar memang belum sempat menulisnya, dan halaman /about menyiapkan
 * tampilan untuk keadaan itu.
 */
export function storyParagraphs(tenant) {
  return String(tenant?.story || '')
    .split(/\r?\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
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
