import { expect } from '@playwright/test';

/**
 * Outlet yang dipakai suite ini.
 *
 * Sejak satu pemasangan melayani banyak UMKM, tidak ada lagi halaman yang
 * berdiri tanpa outlet — `/menu` sendirian bukan alamat yang sah. Slug-nya bisa
 * ditimpa lewat `E2E_TENANT` supaya suite yang sama bisa dijalankan terhadap
 * outlet lain tanpa menyunting satu berkas pun.
 */
export const OUTLET = process.env.E2E_TENANT || 'to-do';

/** Alamat sebuah halaman di dalam outlet uji. */
export function url(path = '') {
  const bersih = path.startsWith('/') || path === '' ? path : `/${path}`;
  // Sama persis dengan `tenantPath()` di aplikasi, termasuk soal garis miring
  // di ujung — kalau berbeda, perbandingan href di test meleset diam-diam.
  return `/k/${OUTLET}${bersih === '/' ? '' : bersih}`;
}

/**
 * Mengambil satu nomor meja yang BENAR-BENAR terdaftar, langsung dari denah.
 *
 * Nomor meja sengaja tidak ditulis tetap ("07") di berkas test: denah meja itu
 * data milik pemilik kedai, bisa diganti kapan saja lewat /admin/meja. Test
 * yang menghafal nomor akan gagal bukan karena aplikasinya rusak, melainkan
 * karena mejanya diganti nama — kegagalan palsu yang lama-lama membuat suite
 * ini tidak dipercaya lagi.
 */
export async function ambilNomorMeja(page) {
  await page.goto(url('/meja'));

  const kartu = page.getByRole('link', { name: /^Meja \S+,/ }).first();
  await expect(
    kartu,
    'Denah meja kosong — jalankan supabase/schema.sql atau tambahkan meja lewat /admin/meja'
  ).toBeVisible();

  const aria = await kartu.getAttribute('aria-label');
  const nomor = aria?.match(/^Meja (\S+),/)?.[1];

  expect(nomor, `Tidak bisa membaca nomor meja dari aria-label: ${aria}`).toBeTruthy();
  return nomor;
}

/**
 * Membuka layar hasil scan QR untuk sebuah meja.
 *
 * `src=qr` adalah penanda asal-usul yang dipasang QR meja — lihat catatan di
 * README bagian "Penanda `src=qr`". Popup niat (`ScanIntentDialog`) selalu
 * muncul lebih dulu di sini, jadi pemanggilnya diberi pilihan: biarkan terbuka
 * untuk mengujinya, atau tutup untuk sampai ke layar hub di belakangnya.
 */
export async function bukaHasilScan(page, nomorMeja, { tutupPopup = true } = {}) {
  await page.goto(url(`/meja?meja=${encodeURIComponent(nomorMeja)}&src=qr`));

  const popup = page.getByRole('dialog');
  await expect(popup).toBeVisible();

  if (tutupPopup) {
    await page.getByRole('button', { name: 'Tutup' }).click();
    await expect(popup).toBeHidden();
  }

  return popup;
}

/** Satu langkah pada penunjuk alur (FlowSteps), dicari lewat judulnya. */
export function langkahAlur(page, judul) {
  return page.locator('nav[aria-label="Langkah pemesanan"] li').filter({ hasText: judul });
}
