import { defineConfig, devices } from '@playwright/test';

/**
 * Konfigurasi E2E.
 *
 * Test ini SENGAJA READ-ONLY terhadap Supabase: tidak ada checkout, tidak ada
 * pendaftaran akun, tidak ada pesan kontak yang benar-benar terkirim. Yang
 * diuji adalah apa yang dilihat pelanggan dan ke mana ia diarahkan — sehingga
 * suite ini aman dijalankan kapan pun, termasuk beberapa menit sebelum demo,
 * tanpa meninggalkan transaksi palsu di database yang harus dibersihkan.
 *
 * Konsekuensinya harus disadari: yang terbukti di sini adalah alur dan
 * antarmukanya, bukan bahwa `create_order` benar-benar menulis baris yang
 * benar. Pengujian tulis-baca database berada di luar cakupan suite ini.
 */

const PORT = Number(process.env.E2E_PORT || 3000);
const baseURL = process.env.E2E_BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  /*
    Halaman `force-dynamic` menunggu Supabase di setiap permintaan, dan dev
    server Next mengkompilasi rute saat pertama kali dibuka. Dua-duanya membuat
    kunjungan pertama jauh lebih lambat dari yang berikutnya, jadi batas waktu
    dilonggarkan agar kegagalan yang muncul benar-benar kegagalan — bukan
    sekadar kompilasi yang belum selesai.
  */
  timeout: 60_000,
  expect: { timeout: 15_000 },

  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'id-ID',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    /*
      QR meja dipindai dari HP, bukan laptop — kalau layar hub atau stepper
      pecah di lebar ponsel, justru di situlah kerusakannya paling merugikan.
    */
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],

  /*
    `reuseExistingServer` membuat suite menempel ke `npm run dev` yang sudah
    jalan bila ada. Tanpa itu, Playwright menyalakan servernya sendiri dan
    port 3000 bentrok dengan sesi pengembangan yang sedang dipakai.
  */
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
