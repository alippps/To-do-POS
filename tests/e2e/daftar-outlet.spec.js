import { test, expect } from '@playwright/test';

/**
 * Pendaftaran UMKM baru — halaman platform, bukan halaman outlet.
 *
 * Karena itu berkas ini satu-satunya di suite yang tidak memakai `url()` dari
 * helpers: alamatnya memang tidak berada di bawah `/k/<slug>`, sebab yang
 * membukanya belum punya outlet.
 *
 * Sama seperti validasi-form.spec.js, seluruh kiriman di sini PASTI DITOLAK —
 * baik oleh validasi client maupun oleh kode undangan yang salah. Tidak ada
 * outlet sampah yang mengendap di Supabase setiap kali suite dijalankan, dan
 * pendaftaran yang berhasil diuji manual.
 */

test.describe('Halaman pendaftaran outlet', () => {
  test('terbuka dan menjelaskan alamat outletnya', async ({ page }) => {
    await page.goto('/daftar-outlet');

    await expect(page.getByRole('heading', { name: 'Daftarkan UMKM Anda' })).toBeVisible();
    await expect(page.getByLabel('Nama usaha *')).toBeVisible();
    await expect(page.getByLabel('Kode undangan *')).toBeVisible();
  });

  /*
    Landing platform mengajak mendaftar di beberapa tempat sekaligus — navbar,
    hero, dan CTA penutup — jadi pencariannya sengaja tidak menuntut satu-satunya
    tautan. Yang dijaga adalah ajakan itu ADA dan sampai ke halamannya.
  */
  test('landing platform menautkannya', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /Daftarkan UMKM/ }).first().click();
    await expect(page).toHaveURL(/\/daftar-outlet$/);
  });

  /*
    Slug adalah satu-satunya isian yang tidak bisa diperbaiki belakangan — ia
    tercetak permanen di QR tiap meja. Karena itu ia diperlakukan istimewa di
    formulir: terisi sendiri dari nama usaha, dan pratinjaunya ikut berubah
    sambil diketik. Kalau salah satu dari dua perilaku itu diam-diam hilang,
    orang bisa mendaftar tanpa pernah membaca alamat yang akan ia dapat.
  */
  test('slug terisi otomatis dari nama usaha, lengkap dengan pratinjaunya', async ({ page }) => {
    await page.goto('/daftar-outlet');

    await page.getByLabel('Nama usaha *').fill('Kopi Pagi Bandung');

    await expect(page.getByLabel('Alamat outlet *')).toHaveValue('kopi-pagi-bandung');
    await expect(page.getByText('/k/kopi-pagi-bandung')).toBeVisible();
  });

  test('slug yang sudah disunting tidak ditimpa lagi oleh nama usaha', async ({ page }) => {
    await page.goto('/daftar-outlet');

    await page.getByLabel('Nama usaha *').fill('Kopi Pagi');
    await page.getByLabel('Alamat outlet *').fill('kopi-braga');
    await page.getByLabel('Nama usaha *').fill('Kopi Pagi Bandung');

    await expect(page.getByLabel('Alamat outlet *')).toHaveValue('kopi-braga');
  });

  test('menolak formulir kosong dengan pesan per kolom', async ({ page }) => {
    await page.goto('/daftar-outlet');
    await page.getByRole('button', { name: 'Buat Outlet' }).click();

    await expect(page.getByText('Nama usaha minimal 3 karakter.')).toBeVisible();
    await expect(page.getByText('Alamat outlet wajib diisi.')).toBeVisible();
    await expect(page.getByText('Kode undangan wajib diisi.')).toBeVisible();
  });

  /*
    Gerbangnya sendiri. Isian di bawah lolos seluruh validasi client, jadi
    penolakannya datang dari `create_tenant()` di database — persis lapis yang
    harus dibuktikan masih berdiri, sebab RPC itu terbuka untuk anon key dan
    formulir ini bukan satu-satunya jalan menuju ke sana.
  */
  test('kode undangan yang salah ditolak database, dan tidak ada outlet yang terbuat', async ({
    page,
  }) => {
    const slug = `uji-tolak-${Date.now()}`;

    await page.goto('/daftar-outlet');
    await page.getByLabel('Nama usaha *').fill('Warung Uji Penolakan');
    await page.getByLabel('Alamat outlet *').fill(slug);
    await page.getByLabel('Kode undangan *').fill('kode-yang-pasti-salah');
    await page.getByRole('button', { name: 'Buat Outlet' }).click();

    await expect(page.getByText('Kode undangan tidak dikenali.').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /sudah terdaftar/ })).toHaveCount(0);

    // Outletnya benar-benar tidak ada — bukan sekadar pesan galat di layar.
    const res = await page.request.get(`/k/${slug}`);
    expect(res.status()).toBe(404);
  });
});
