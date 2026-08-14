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
    Isolasi yang disengaja, bukan kelalaian — dan sejak ada tautan "Masuk Staf"
    di footer, isolasinya punya batas yang tepat, bukan sekadar "tidak ada di
    mana-mana":

      - NAVBAR tetap nol tautan staf. Di sanalah pelanggan membaca apa yang
        harus ia lakukan, dan tombol Login di sebelah "Pesan Sekarang" membuat
        ia mengira harus punya akun dulu.
      - FOOTER memuat TEPAT SATU tautan, yaitu ke `/login`. Bukan nol, supaya
        kasir tidak perlu menghafal URL; bukan lebih dari satu, supaya
        pendaftaran dan dashboard tidak ikut merembes ke sisi pelanggan.

    Ditulis sebagai test agar batas itu tidak bergeser diam-diam ke salah satu
    arah — baik tautannya hilang lagi maupun berkembang jadi kolom "Staf".
  */
  test('pintu staf: nol di navbar, tepat satu di footer', async ({ page }) => {
    await page.goto(url('/'));

    for (const p of ['/login', '/register', '/admin']) {
      await expect(page.locator(`header a[href="${url(p)}"]`)).toHaveCount(0);
    }

    await expect(page.locator(`footer a[href="${url('/login')}"]`)).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Masuk Staf' })).toBeVisible();

    for (const p of ['/register', '/admin']) {
      await expect(page.locator(`footer a[href="${url(p)}"]`)).toHaveCount(0);
    }

    /*
      `toBeVisible()` saja tidak cukup untuk tautan ini.

      Tombol WhatsApp mengambang (`fixed bottom-* right-*`) menempati sudut
      kanan-bawah layar, dan justru menutupi footer ketika halaman digulung
      sampai habis — persis keadaan saat orang mencari pintu masuk staf.
      Playwright menganggap elemen yang tertimpa tetap "visible", jadi versi
      pertama tautan ini lolos test padahal di layar tidak bisa ditekan.
      Yang ditanyakan di bawah adalah pertanyaan yang sebenarnya: kalau
      seseorang menekan titik tengah tautan itu, dia yang kena atau bukan.
    */
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const bisaDitekan = await page.evaluate(() => {
      const a = [...document.querySelectorAll('footer a')].find(
        (x) => x.textContent.trim() === 'Masuk Staf'
      );
      const r = a.getBoundingClientRect();
      const atas = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return a === atas || a.contains(atas);
    });
    expect(bisaDitekan, '"Masuk Staf" tertimpa elemen lain saat digulung ke dasar').toBe(true);

    await page.getByRole('link', { name: 'Masuk Staf' }).click();
    await expect(page).toHaveURL(url('/login'));
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
    for (const href of ['/', '/katalog', '/menu', '/about', '/kontak']) {
      await expect(header.locator(`a[href="${url(href)}"]:visible`).first()).toBeVisible();
    }
  });

  /*
    Denah meja SENGAJA tidak ada di navbar — memilih meja adalah satu langkah
    di tengah memesan, bukan halaman tujuan.

    Sejak v7 tombol "Pesan Sekarang" di hero outlet ikut dicabut, dan itu
    perubahan yang lebih dalam daripada penataan: tombol itu mengarah ke denah
    meja, dan pelanggan sungguhan TIDAK PERNAH memilih meja dari browser — ia
    sudah duduk di salah satunya, dan QR di mejanya yang menentukan nomornya.
    Sebuah tombol besar bertuliskan "Pesan Sekarang" di beranda mengajarkan
    kebalikan dari cara sistem ini bekerja.

    Yang dijaga di sini: ajakan itu benar-benar hilang dari kedua tempat, dan
    penggantinya menyebut cara yang sesungguhnya.
  */
  test('beranda outlet tidak lagi menawarkan "Pesan Sekarang"', async ({ page }) => {
    await page.goto(url('/'));
    const header = page.locator('header');

    const hamburger = header.getByRole('button', { name: 'Buka menu' });
    if (await hamburger.isVisible()) await hamburger.click();

    await expect(header.getByRole('link', { name: 'Meja', exact: true })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Pesan Sekarang' })).toHaveCount(0);

    // Penggantinya keterangan, bukan tombol.
    await expect(page.getByText('Scan QR di meja Anda untuk memesan')).toBeVisible();
  });

  /*
    Jalur simulasi untuk yang menilai sistem ini dari laptop.

    Tiga hal yang membuatnya tetap jujur, dan ketiganya mudah rusak tanpa ada
    yang menyadarinya: labelnya menyebut dirinya simulasi, mejanya TETAP (bukan
    dipilih pengunjung, bukan acak), dan halaman tujuannya mengaku sedang
    memperagakan.
  */
  test('simulasi scan QR menyebut dirinya simulasi dan mejanya tetap', async ({ page }) => {
    await page.goto(url('/'));

    const tombol = page.getByRole('link', { name: /^Simulasi Scan QR — Meja \S+$/ });
    await expect(tombol).toBeVisible();

    /*
      Nomor mejanya diambil dari NAMA AKSESIBEL, bukan `textContent()`.

      Keduanya berbeda di sini dan bedanya menyesatkan: lambang 🔳 di dalam
      tombol ber-`aria-hidden`, jadi ia ikut di `textContent()` tapi tidak ikut
      di nama yang dibacakan pembaca layar. Mencocokkan yang pertama terhadap
      `getByRole` selalu meleset.
    */
    const meja = (await tombol.getAttribute('href')).match(/meja=([^&]+)/)[1];

    // Nomor mejanya sama pada muat berikutnya — ditentukan, bukan diacak.
    await page.reload();
    await expect(
      page.getByRole('link', { name: `Simulasi Scan QR — Meja ${meja}` })
    ).toBeVisible();

    await tombol.click();

    // Mendarat di layar hasil pindai meja itu, membawa penanda demo.
    await expect(page).toHaveURL(new RegExp(`/meja\\?meja=${meja}`));
    expect(new URL(page.url()).searchParams.get('demo')).toBe('1');

    // Lanjut ke halaman pesan — bannernya harus mengaku.
    await page.getByRole('dialog').getByRole('link').first().click();
    await expect(page).toHaveURL(/\/menu\?/);
    expect(new URL(page.url()).searchParams.get('meja')).toBe(meja);

    await expect(page.getByText('Mode Demo')).toBeVisible();
    await expect(
      page.getByText(/nomor meja terbaca dari QR di meja dan tidak bisa diubah/i)
    ).toBeVisible();
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

  /*
    Judulnya sekarang nama outletnya sendiri, bukan kalimat tetap di dalam kode.

    Sampai v5 setiap outlet menampilkan judul yang sama — "Secangkir kopi yang
    berujung jadi sebuah sistem" — beserta linimasa lahirnya aplikasi dan nama
    tim produknya. Test ini ikut menjaga pemisahan itu: yang dijamin bukan
    sekadar halamannya terbuka, melainkan bahwa isinya milik outlet ini.
  */
  test('About bercerita tentang outletnya, bukan tentang sistemnya', async ({ page }) => {
    await page.goto(url('/about'));

    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).not.toContainText(/secangkir kopi|software house/i);

    // Informasi praktis kedai selalu ada, bahkan untuk outlet yang belum
    // menuliskan ceritanya.
    await expect(page.getByRole('heading', { name: 'Informasi kedai' })).toBeVisible();
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
