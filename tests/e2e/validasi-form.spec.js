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

test.describe('Form kontak', () => {
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
