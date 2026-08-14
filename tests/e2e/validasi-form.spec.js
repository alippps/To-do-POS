import { test, expect } from '@playwright/test';
import { url } from './helpers';

/**
 * Validasi sisi klien pada form kontak & pendaftaran.
 *
 * Seluruh berkas ini hanya mengirim isian yang PASTI DITOLAK. Itu bukan
 * kelalaian cakupan melainkan syarat agar suite tetap read-only: validasi
 * berjalan sebelum server action maupun `signUp` dipanggil, sehingga tidak ada
 * pesan kontak palsu atau akun sampah yang mengendap di Supabase setiap kali
 * test dijalankan. Kiriman yang berhasil diuji manual, bukan di sini.
 */

/*
  Perangkap umpan hanya berguna selama ia tidak pernah tersentuh manusia.

  Yang diuji di sini justru sisi itu — bukan bahwa bot tertangkap (itu menuntut
  kiriman yang benar-benar tersimpan), melainkan bahwa kolomnya tidak terlihat,
  tidak bisa dicapai lewat Tab, dan tidak dibacakan pembaca layar. Kalau salah
  satunya rusak, pengunjung sungguhan bisa mengisinya tanpa sadar dan pesannya
  ditelan diam-diam TANPA pesan galat — kegagalan yang mustahil dilaporkan
  karena layarnya berkata "terkirim".
*/
test.describe('Perangkap umpan (honeypot)', () => {
  for (const [nama, path] of [
    ['Form kontak outlet', '/kontak'],
    ['Form kontak platform', null],
  ]) {
    test(`${nama}: kolom umpan ada tapi tidak bisa disentuh manusia`, async ({ page }) => {
      await page.goto(path ? url(path) : '/');

      const umpan = page.locator('input[name="website"]');
      await expect(umpan, 'Kolom umpan hilang — perangkapnya tidak terpasang').toHaveCount(1);

      /*
        Diperiksa lewat KOORDINAT, bukan `toBeHidden()`.

        Playwright menilai visibilitas dari kotak elemen itu sendiri dan tidak
        ikut memperhitungkan `overflow-hidden` milik induknya — jadi kolom ini
        dianggapnya "visible" walau tak ada satu piksel pun yang tergambar.
        Yang benar-benar menentukan di sini adalah letaknya: seluruh kotaknya
        berada di kiri layar, jauh di luar jangkauan mata dan jari.
      */
      const kotak = await umpan.boundingBox();
      expect(
        kotak === null || kotak.x + kotak.width <= 0,
        `Kolom umpan terlihat di layar (x=${kotak?.x}, w=${kotak?.width})`
      ).toBe(true);

      await expect(umpan).toHaveAttribute('tabindex', '-1');
      await expect(umpan).toHaveAttribute('autocomplete', 'off');

      // Disembunyikan dari pohon aksesibilitas lewat pembungkusnya.
      const pembungkus = page.locator('div[aria-hidden="true"]').filter({ has: umpan });
      await expect(pembungkus).toHaveCount(1);
    });
  }
});

test.describe('Form kontak', () => {
  /*
    Batas panjang dijaga di dua tempat: `maxLength` di layar dan
    `periksaPanjang()` di server action. Yang diuji di sini yang pertama —
    yang kedua butuh kiriman sungguhan.
  */
  test('setiap kolom punya batas panjang', async ({ page }) => {
    await page.goto(url('/kontak'));

    for (const [label, batas] of [
      ['Nama lengkap *', '80'],
      ['Nomor WhatsApp', '25'],
      ['Email *', '160'],
      ['Pesan *', '2000'],
    ]) {
      await expect(page.getByLabel(label)).toHaveAttribute('maxlength', batas);
    }
  });

  test('menolak isian kosong dengan pesan per kolom', async ({ page }) => {
    await page.goto(url('/kontak'));
    await page.getByRole('button', { name: 'Kirim Pesan' }).click();

    await expect(page.getByText('Nama minimal 3 karakter.')).toBeVisible();
    await expect(page.getByText('Format email tidak valid.')).toBeVisible();
    await expect(page.getByText('Pesan minimal 10 karakter.')).toBeVisible();
  });

  test('menolak format email yang keliru', async ({ page }) => {
    await page.goto(url('/kontak'));

    await page.getByLabel('Nama lengkap *').fill('Budi Santoso');
    await page.getByLabel('Email *').fill('bukan-email');
    await page.getByLabel('Pesan *').fill('Saya ingin bertanya soal sistem kasirnya.');
    await page.getByRole('button', { name: 'Kirim Pesan' }).click();

    await expect(page.getByText('Format email tidak valid.')).toBeVisible();
    await expect(page.getByText('Nama minimal 3 karakter.')).toHaveCount(0);
    await expect(page.getByText('Pesan minimal 10 karakter.')).toHaveCount(0);
  });

  test('pesan galat hilang begitu kolomnya diperbaiki', async ({ page }) => {
    await page.goto(url('/kontak'));
    await page.getByRole('button', { name: 'Kirim Pesan' }).click();
    await expect(page.getByText('Nama minimal 3 karakter.')).toBeVisible();

    await page.getByLabel('Nama lengkap *').fill('Budi Santoso');
    await expect(page.getByText('Nama minimal 3 karakter.')).toHaveCount(0);
  });
});

test.describe('Form pendaftaran', () => {
  /*
    Kata sandi di bawah sengaja dibuat gagal validasi di salah satu kolom.
    Isian yang lolos semuanya akan benar-benar membuat akun di Supabase.
  */
  test('menolak konfirmasi kata sandi yang tidak cocok', async ({ page }) => {
    await page.goto(url('/register'));

    await page.getByLabel('Nama lengkap *').fill('Budi Santoso');
    await page.getByLabel('Email *').fill('budi@example.com');
    await page.getByLabel('Kata sandi *', { exact: true }).fill('rahasia123');
    await page.getByLabel('Ulangi kata sandi *').fill('rahasia456');
    await page.getByRole('button', { name: /Daftar/ }).click();

    await expect(page.getByText('Konfirmasi kata sandi tidak cocok.')).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
  });

  test('menolak kata sandi yang terlalu pendek', async ({ page }) => {
    await page.goto(url('/register'));

    await page.getByLabel('Nama lengkap *').fill('Budi Santoso');
    await page.getByLabel('Email *').fill('budi@example.com');
    await page.getByLabel('Kata sandi *', { exact: true }).fill('123');
    await page.getByLabel('Ulangi kata sandi *').fill('123');
    await page.getByRole('button', { name: /Daftar/ }).click();

    await expect(page.getByText('Kata sandi minimal 6 karakter.')).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
  });

  test('menolak nama dan email yang tidak sah', async ({ page }) => {
    await page.goto(url('/register'));

    await page.getByLabel('Nama lengkap *').fill('Bu');
    await page.getByLabel('Email *').fill('budi@');
    await page.getByLabel('Kata sandi *', { exact: true }).fill('123');
    await page.getByRole('button', { name: /Daftar/ }).click();

    await expect(page.getByText('Nama minimal 3 karakter.')).toBeVisible();
    await expect(page.getByText('Format email tidak valid.')).toBeVisible();
  });
});
