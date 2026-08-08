import { test, expect } from '@playwright/test';
import { url } from './helpers';

/**
 * Penjaga daftar halaman wajib.
 *
 * Ketentuan lomba menuntut halaman-halaman tertentu ada dan bisa dibuka. Suite
 * ini menyatakan ulang tuntutan itu dalam bentuk yang bisa dijalankan, supaya
 * halaman yang tanpa sengaja hilang atau rusak ketahuan saat itu juga — bukan
 * saat juri yang membukanya.
 */

test.describe('Login & Register', () => {
  test('halaman login terbuka lewat URL langsung', async ({ page }) => {
    await page.goto(url('/login'));
    await expect(page.getByRole('heading', { name: 'Selamat datang kembali' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Kata sandi')).toBeVisible();
  });

  test('halaman register terbuka lewat URL langsung', async ({ page }) => {
    await page.goto(url('/register'));
    await expect(page.getByRole('heading', { name: 'Buat akun staf' })).toBeVisible();
  });

  test('keduanya saling menautkan', async ({ page }) => {
    await page.goto(url('/login'));
    await page.getByRole('link', { name: 'Daftar gratis' }).click();
    await expect(page).toHaveURL(/\/register$/);

    await page.getByRole('link', { name: /Masuk/ }).first().click();
    await expect(page).toHaveURL(/\/login$/);
  });

  /*
    Isolasi yang disengaja, bukan kelalaian: `/login` dan `/register` tidak
    ditautkan dari sisi publik supaya identitas staf tidak bocor ke antarmuka
    pelanggan. Ditulis sebagai test agar keputusan itu tidak diam-diam
    dibatalkan oleh perubahan navbar/footer di kemudian hari.
  */
  test('tidak ditautkan dari sisi publik', async ({ page }) => {
    await page.goto(url('/'));
    for (const p of ['/login', '/register', '/admin']) {
      await expect(page.locator(`header a[href="${url(p)}"]`)).toHaveCount(0);
      await expect(page.locator(`footer a[href="${url(p)}"]`)).toHaveCount(0);
    }
  });
});

test.describe('Sisi pelanggan', () => {
  test('Home tampil beserta menu favorit', async ({ page }) => {
    await page.goto(url('/'));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('#qr')).toBeVisible();
  });

  test('navbar memuat seluruh halaman wajib', async ({ page }) => {
    await page.goto(url('/'));
    const header = page.locator('header');

    /*
      Di lebar ponsel tautannya bersembunyi di balik hamburger. Membuka panel
      itu lebih dahulu bukan sekadar akal-akalan agar test hijau: pelanggan
      memang harus menekannya, dan kalau tombol itu rusak, seluruh navigasi
      ikut hilang di perangkat yang justru paling banyak dipakai memindai QR.
    */
    const hamburger = header.getByRole('button', { name: 'Buka menu' });
    if (await hamburger.isVisible()) await hamburger.click();

    /*
      Navbar desktop dan panel ponsel dua-duanya ada di DOM; yang satu selalu
      tersembunyi. `:visible` menanyakan hal yang sebenarnya ingin dijamin —
      "ada tautan yang bisa dilihat dan ditekan pelanggan" — tanpa test perlu
      tahu versi mana yang sedang dipakai pada lebar layar ini.
    */
    for (const href of ['/', '/menu', '/meja', '/about', '/kontak']) {
      await expect(header.locator(`a[href="${url(href)}"]:visible`).first()).toBeVisible();
    }
  });

  /*
    Ketentuan lomba menyebut halaman ini "Fitur Utama"; pelanggan melihatnya
    sebagai "Pesan". Test menjaga halamannya, bukan istilah dokumennya — lihat
    catatan penamaan di src/components/layout/Navbar.jsx.
  */
  test('Fitur Utama (jual beli) menampilkan produk dan keranjang', async ({ page }) => {
    await page.goto(url('/menu'));
    await expect(page.getByRole('heading', { name: /Mau ngopi apa hari ini/ })).toBeVisible();
    await expect(page.getByText('Langkah 2 dari 3 · Pesan')).toBeVisible();
  });

  test('About tampil', async ({ page }) => {
    await page.goto(url('/about'));
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/secangkir kopi/i);
  });

  test('Kontak tampil beserta formulirnya', async ({ page }) => {
    await page.goto(url('/kontak'));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByLabel('Nama lengkap *')).toBeVisible();
    await expect(page.getByLabel('Email *')).toBeVisible();
    await expect(page.getByLabel('Pesan *')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Kirim Pesan' })).toBeVisible();
  });

  test('Katalog bersifat baca-saja — tanpa keranjang', async ({ page }) => {
    await page.goto(url('/katalog'));
    await expect(page.getByRole('heading', { name: /Daftar menu lengkap/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Tambah|Keranjang/ })).toHaveCount(0);
  });
});

/*
  Halaman admin tidak bisa dibuka test ini tanpa sesi, dan menyediakan kredensial
  di berkas test berarti menaruh kunci outlet ke dalam repositori. Yang diuji di
  sini justru penjaganya: ketiga halaman wajib admin memang ada sebagai rute, dan
  tertutup bagi yang belum masuk.
*/
test.describe('Sisi admin — penjagaan rute', () => {
  for (const [nama, path] of [
    ['Dashboard', '/admin'],
    ['Daftar Produk', '/admin/produk'],
    ['Daftar Transaksi', '/admin/transaksi'],
  ]) {
    test(`${nama} (${path}) tertutup untuk yang belum masuk`, async ({ page }) => {
      await page.goto(url(path));

      await expect(page).toHaveURL(/\/login\?/);
      // `next` membawa alamat LENGKAP beserta outletnya — dashboard yang
      // dituju setelah masuk harus dashboard outlet yang tadi diminta.
      expect(new URL(page.url()).searchParams.get('next')).toBe(url(path));
      await expect(page.getByRole('heading', { name: 'Selamat datang kembali' })).toBeVisible();
    });
  }
});
