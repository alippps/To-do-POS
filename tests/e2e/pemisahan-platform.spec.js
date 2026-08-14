import { test, expect } from '@playwright/test';
import { url, OUTLET } from './helpers';

/**
 * Pemisahan landing SISTEM dari landing KEDAI.
 *
 * Sampai v5 keduanya bertumpuk: setiap outlet menampilkan portfolio, testimoni,
 * daftar layanan, dan FAQ tentang perangkat lunaknya — sehingga pengunjung yang
 * baru memindai QR di mejanya harus melewati materi jualan sebuah software
 * house sebelum sampai ke menu.
 *
 * Pemisahan seperti itu gampang bocor lagi tanpa disadari: satu `import` yang
 * dikembalikan ke halaman outlet sudah cukup. Berkas ini menyatakan batasnya
 * dalam bentuk yang bisa dijalankan — dari kedua sisi, sebab section yang hilang
 * dari platform sama merugikannya dengan section yang merembes ke outlet.
 */

/** Section yang HANYA boleh hidup di landing platform. */
const SECTION_SISTEM = [
  '#fitur',
  '#cara-kerja',
  '#keunggulan',
  '#portfolio',
  '#testimoni',
  '#faq',
  '#kontak',
];

test.describe('Landing platform (/)', () => {
  test('memuat seluruh section sistem', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    for (const id of SECTION_SISTEM) {
      await expect(page.locator(id), `${id} hilang dari landing platform`).toBeAttached();
    }
  });

  test('direktori outlet tampil dan menautkan ke outletnya', async ({ page }) => {
    await page.goto('/');

    const direktori = page.locator('#outlet');
    await expect(direktori).toBeAttached();

    /*
      DUA tautan ke outlet yang sama, dan itu disengaja sejak v7.

      Yang pertama kartu "Lihat contoh kedai" di kepala section; yang kedua
      kartunya di dalam daftar. Daftar kartu yang seragam menuntut pengunjung
      memilih, dan yang baru mendarat belum punya dasar untuk memilih — semua
      namanya asing. Satu pintu yang jelas lebih menolong daripada menawarkan
      semuanya secara adil.
    */
    const tautan = direktori.locator(`a[href="/k/${OUTLET}"]`);
    await expect(tautan).toHaveCount(2);

    await tautan.first().click();
    await expect(page).toHaveURL(url('/'));
  });

  /*
    Direktori naik ke posisi kedua, tepat di bawah hero.

    Sebelumnya ia section ketujuh — sesudah Layanan, Cara Kerja, Keunggulan,
    Portfolio, dan Testimoni. Urutan itu masuk akal untuk pembaca yang membaca
    dari atas ke bawah, dan tidak masuk akal untuk pelanggan yang mengetik
    domainnya begitu saja lalu mencari kedainya: ia harus melewati lima section
    materi jualan software house sebelum menemukan daftar kedai.
  */
  test('direktori berdiri sebelum seluruh materi jualan', async ({ page }) => {
    await page.goto('/');

    const posisi = async (pemilih) =>
      (await page.locator(pemilih).first().boundingBox())?.y ?? Number.POSITIVE_INFINITY;

    const outlet = await posisi('#outlet');
    for (const id of ['#fitur', '#cara-kerja', '#keunggulan', '#portfolio', '#testimoni']) {
      expect(await posisi(id), `${id} berdiri sebelum direktori outlet`).toBeGreaterThan(outlet);
    }
  });

  /*
    Kalimat pengenal produk di hero.

    Judulnya memakai kiasan ("modalnya selembar QR") — bagus untuk diingat,
    buruk untuk MENGENALI. Pengunjung baru mendarat tanpa tahu apakah alamat
    ini milik sebuah kedai atau milik sistemnya, dan kiasan tidak menjawabnya.
  */
  test('hero menyebut produknya dalam satu baris datar', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByText('Sistem kasir & pemesanan QR untuk UMKM kuliner.')
    ).toBeVisible();
  });

  /*
    Kontak platform ≠ kontak outlet, dan keduanya menulis ke tabel yang berbeda.

    Yang bertanya di sini belum punya outlet — pertanyaannya soal sistemnya.
    Kalau formulir ini suatu saat diarahkan ke `contact_messages` seperti
    formulir kontak kedai, pesannya akan mendarat di kotak masuk admin sebuah
    outlet yang dipilih sembarang. Test ini menjaga bagiannya tetap ada dan
    validasinya tetap menahan kiriman kosong — tanpa pernah benar-benar
    mengirim, supaya suite ini tetap tidak meninggalkan baris di database.
  */
  test('bagian kontak menampung pertanyaan soal sistem', async ({ page }) => {
    await page.goto('/#kontak');

    const kontak = page.locator('#kontak');
    await expect(kontak.getByRole('heading', { name: 'Masih ada yang mau ditanyakan?' })).toBeVisible();
    await expect(kontak.getByLabel('Pertanyaanmu *')).toBeVisible();

    await kontak.getByRole('button', { name: 'Kirim Pertanyaan' }).click();

    await expect(kontak.getByText('Nama minimal 3 karakter.')).toBeVisible();
    await expect(kontak.getByText('Format email tidak valid.')).toBeVisible();
    await expect(kontak.getByText('Pertanyaan minimal 10 karakter.')).toBeVisible();
  });

  /*
    Navbar platform tidak boleh memuat satu pun halaman outlet. Keduanya sempat
    dilayani satu komponen, dan gejala pertama kalau itu terulang adalah tautan
    "Pesan" muncul di halaman yang tidak punya outlet untuk dipesani.
  */
  test('navbar platform tidak menawarkan halaman outlet', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('header');

    for (const jejak of ['/menu', '/katalog', '/meja', '/login']) {
      await expect(header.locator(`a[href$="${jejak}"]`)).toHaveCount(0);
    }
  });
});

test.describe('Landing outlet (/k/<slug>)', () => {
  test('tidak lagi memuat materi jualan sistem', async ({ page }) => {
    await page.goto(url('/'));

    for (const id of SECTION_SISTEM) {
      await expect(page.locator(id), `${id} merembes kembali ke halaman outlet`).toHaveCount(0);
    }
  });

  test('yang tersisa adalah isi kedainya sendiri', async ({ page }) => {
    await page.goto(url('/'));

    // Menu favorit dan penjelasan cara memesan tetap di tempatnya.
    await expect(page.locator('#qr')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Lihat semua menu →' })).toBeVisible();
  });

  /*
    Footer outlet menyebut nama kedainya, bukan nama platform. Ini pembeda yang
    paling gampang terlewat saat menyunting: keduanya sama-sama punya footer
    dengan susunan kolom yang mirip.
  */
  test('footer outlet tetap punya pintu staf; footer platform tidak', async ({ page }) => {
    await page.goto(url('/'));
    await expect(page.locator('footer').getByRole('link', { name: 'Masuk Staf' })).toHaveCount(1);

    await page.goto('/');
    await expect(page.locator('footer').getByRole('link', { name: 'Masuk Staf' })).toHaveCount(0);
  });
});
