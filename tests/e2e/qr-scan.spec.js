import { test, expect } from '@playwright/test';
import { ambilNomorMeja, bukaHasilScan, langkahAlur, url } from './helpers';

/**
 * Alur scan QR meja — bagian yang paling mudah rusak diam-diam.
 *
 * Kerusakan di sini tidak memunculkan error apa pun: halamannya tetap terbuka,
 * tetap rapi, hanya saja pelanggan yang sudah duduk kembali disuruh memilih
 * meja. Jenis cacat seperti itu tidak akan ketahuan dari build yang hijau,
 * jadi harus ada yang menjaganya secara eksplisit.
 */
test.describe('Scan QR meja', () => {
  test('popup niat muncul dan mengenali nomor mejanya', async ({ page }) => {
    const meja = await ambilNomorMeja(page);
    const popup = await bukaHasilScan(page, meja, { tutupPopup: false });

    await expect(popup).toContainText(`Meja ${meja} terbaca`);

    /*
      Judulnya mengikuti keadaan meja: yang masih bersih ditanya "Mau pesan
      apa?", yang sudah punya tagihan berjalan ditanya "Mau nambah pesanan?".
      Test ini read-only dan tidak menentukan keadaan meja, jadi yang dijamin
      adalah salah satu dari keduanya — bukan menebak yang mana.
    */
    await expect(popup.getByRole('heading')).toHaveText(/Mau (pesan apa|nambah pesanan)\?/);

    /*
      Dua-duanya harus tetap tersedia — yang berubah bobotnya.

      Sejak v7 popup ini hanya punya SATU tombol; pilihan keduanya turun jadi
      tautan teks di bawahnya. Keduanya berakhir di halaman menu yang sama, dan
      menyodorkannya sebagai dua kartu setara membuat pelanggan mengira ia
      sedang memilih dua alur berbeda — keputusan tanpa taruhan, diminta pada
      detik pertama sesudah memindai.

      Yang dijaga di sini kedua jalannya tetap ada, bukan bentuknya.
    */
    await expect(popup.getByRole('link', { name: /Langsung Pesan/ })).toBeVisible();
    await expect(popup.getByRole('link', { name: /Tambah Pesanan/ })).toBeVisible();

    // Tepat satu aksi dominan: sisanya tautan, bukan tombol tandingan.
    await expect(popup.locator('a.bg-brand-600')).toHaveCount(1);
  });

  test('layar hub tidak lagi menawarkan status ketersediaan meja', async ({ page }) => {
    const meja = await ambilNomorMeja(page);
    await bukaHasilScan(page, meja);

    await expect(page.getByText('QR berhasil dipindai')).toBeVisible();

    /*
      Regresi yang dijaga: dulu di sini terpampang badge "Tersedia" — dibaca
      oleh orang yang jelas-jelas sedang menduduki meja itu. Yang benar adalah
      keadaan tagihannya.
    */
    const kartu = page.locator('.card-accent');
    await expect(kartu).toContainText(/Belum ada pesanan di meja ini|Tagihan berjalan/);
    await expect(kartu).not.toContainText('Tersedia');
    await expect(kartu).not.toContainText('kapasitas');
  });

  test('hub membawa penanda asal-usul saat menuju halaman menu', async ({ page }) => {
    const meja = await ambilNomorMeja(page);
    await bukaHasilScan(page, meja);

    /*
      Ditunjuk lewat landmark hub-nya, bukan lewat tebakan nama.

      Versi lama mencari tautan bernama awalan "Order" — pegangan yang putus
      begitu tilenya berganti nama, dan yang tetap rapuh terhadap tautan
      serupa di tempat lain ("QR Ordering" & "Pesan Online" sama-sama ada di
      footer). Landmark `nav[aria-label]` menyatakan bagian mana yang dimaksud,
      jadi teksnya bebas berubah tanpa membuat test ini bohong.
    */
    const hub = page.getByRole('navigation', { name: 'Pilihan untuk meja ini' });

    /*
      Hub kini punya SATU aksi utama, bukan empat kartu sejajar.

      Yang memindai QR datang untuk memesan; "daftar harga", "tagihan", dan
      "promo" adalah hal yang mungkin ia inginkan, bukan hal yang ia datangi.
      Empat pilihan setara memaksanya memutuskan sesuatu sebelum boleh mulai —
      tepat di layar pertama sesudah memindai, saat ia paling tidak sabar.
    */
    await hub.getByRole('link', { name: /^(Pesan Sekarang|Tambah Pesanan)/ }).click();

    await expect(page).toHaveURL(/\/menu\?/);
    expect(new URL(page.url()).searchParams.get('src')).toBe('qr');
    expect(new URL(page.url()).searchParams.get('meja')).toBe(meja);
  });

  test('hub menyisakan tautan kecil, bukan kartu yang menyaingi aksi utamanya', async ({ page }) => {
    const meja = await ambilNomorMeja(page);
    await bukaHasilScan(page, meja);

    const hub = page.getByRole('navigation', { name: 'Pilihan untuk meja ini' });

    // Ketiganya tidak dihapus — yang berubah cuma bobotnya.
    for (const nama of ['Daftar harga', 'Tagihan meja ini', 'Promo hari ini']) {
      await expect(hub.getByRole('link', { name: new RegExp(nama, 'i') })).toBeVisible();
    }

    // Dan tidak satu pun dari ketiganya tampil sebagai tombol utama.
    await expect(hub.locator('a.bg-brand-600')).toHaveCount(1);
  });

  test('pemindai QR tidak disuruh memilih meja', async ({ page }) => {
    const meja = await ambilNomorMeja(page);
    await page.goto(url(`/menu?meja=${encodeURIComponent(meja)}&src=qr`));

    const nav = page.locator('nav[aria-label="Langkah pemesanan"]');
    await expect(nav).toBeVisible();

    // Langkah pertama berbunyi nomor mejanya, bukan perintah "Pilih meja".
    await expect(langkahAlur(page, `Meja ${meja}`)).toBeVisible();
    await expect(nav).not.toContainText('Pilih meja');

    /*
      Dan bukan tautan: mejanya ditentukan tempat duduk, jadi tidak ada halaman
      untuk "kembali memilih". Menyisakannya sebagai tautan berarti menawarkan
      pekerjaan yang tidak pernah ada.
    */
    await expect(langkahAlur(page, `Meja ${meja}`).locator('a')).toHaveCount(0);
  });

  test('yang datang dari denah tetap melihat langkah "Pilih meja"', async ({ page }) => {
    const meja = await ambilNomorMeja(page);

    // Dari denah, kartu meja menuju langsung ke /menu tanpa penanda `src`.
    await page.getByRole('link', { name: new RegExp(`^Meja ${meja},`) }).click();
    await expect(page).toHaveURL(/\/menu\?meja=/);
    expect(new URL(page.url()).searchParams.get('src')).toBeNull();

    const nav = page.locator('nav[aria-label="Langkah pemesanan"]');
    await expect(langkahAlur(page, 'Pilih meja')).toBeVisible();

    // Bagi mereka langkah itu memang dijalani, jadi jalan pulangnya tetap ada.
    await expect(langkahAlur(page, 'Pilih meja').locator('a')).toHaveCount(1);
    await expect(nav).not.toContainText('Terbaca dari QR');
  });

  test('QR meja yang tidak terdaftar jatuh ke denah, bukan halaman rusak', async ({ page }) => {
    await page.goto(url('/meja?meja=MEJA-TIDAK-ADA&src=qr'));

    await expect(page.getByText(/tidak terdaftar di denah kami/)).toBeVisible();
    /*
      Dicocokkan pada pangkal judulnya saja, bukan seluruh kalimat.

      Yang dibuktikan baris ini adalah "mendarat di denah meja, bukan halaman
      rusak" — dan itu tetap benar entah judulnya berbunyi "Pilih meja yang
      masih kosong" atau "Pilih Meja Tempat Kamu Duduk". Menuntut kalimat utuh
      membuat test ini gagal setiap kali kalimatnya diperhalus, kegagalan yang
      tidak menunjuk kerusakan apa pun.
    */
    await expect(page.getByRole('heading', { name: /^Pilih Meja/i })).toBeVisible();
  });
});
