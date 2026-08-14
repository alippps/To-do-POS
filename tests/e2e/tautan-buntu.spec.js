import { test, expect } from '@playwright/test';
import { url } from './helpers';

/**
 * Penjaga tautan yang menuju alamat tidak ada.
 *
 * Sejak seluruh halaman outlet pindah ke bawah `/k/<slug>`, sebuah tautan
 * internal bisa rusak tanpa satu pun error muncul: `/admin/transaksi` dan
 * `/katalog` masih terlihat masuk akal di kode, hanya saja tidak ada lagi
 * alamatnya. Kegagalannya baru terasa setelah diklik, dan yang mengkliknya
 * biasanya kasir di jam sibuk atau juri yang sedang menilai.
 *
 * Suite ini read-only seperti sisanya — tidak ada pesanan yang dibuat dan tidak
 * ada akun yang dibuat.
 *
 * Yang TIDAK tercakup di sini dan masih perlu diperiksa manual: tautan yang
 * hanya muncul setelah login (tombol "Kembali" pada struk mode kasir, tombol
 * Cetak di kartu transaksi versi HP). Keduanya menuntut sesi staf sungguhan,
 * dan suite ini sengaja tidak pernah masuk.
 */

test.describe('Halaman 404', () => {
  test('tampil untuk alamat yang tidak ada', async ({ page }) => {
    const res = await page.goto(url('/halaman-yang-tidak-pernah-ada'));

    expect(res?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Halaman tidak ditemukan' })).toBeVisible();
  });

  /*
    Halaman 404 yang menawarkan 404 berikutnya adalah jalan buntu yang
    menyamar jadi jalan keluar. Setiap tombolnya diikuti sampai tujuannya dan
    dituntut membalas 200 — bukan sekadar dicek ada.
  */
  test('setiap tombolnya benar-benar mendarat di halaman yang ada', async ({ page }) => {
    await page.goto(url('/halaman-yang-tidak-pernah-ada'));

    const tautan = page.locator('a[href]');
    const jumlah = await tautan.count();
    expect(jumlah, 'Halaman 404 kehilangan seluruh jalan keluarnya').toBeGreaterThan(0);

    for (let i = 0; i < jumlah; i += 1) {
      const href = await tautan.nth(i).getAttribute('href');
      // Anchor (`/#outlet`) ikut diperiksa halamannya, tanpa bagian pecahan.
      const tujuan = href.split('#')[0] || '/';

      const res = await page.request.get(tujuan);
      expect(res.status(), `Tautan "${href}" di halaman 404 menuju alamat yang juga tidak ada`).toBe(
        200
      );
    }
  });
});

test.describe('Struk pesanan', () => {
  /*
    Nomor yang tidak terdaftar tidak boleh berakhir sebagai halaman rusak —
    yang membukanya sedang memegang pesanan dan butuh diberi tahu ke mana harus
    melangkah, bukan disodori stack trace.
  */
  test('invoice yang tidak terdaftar dijawab halaman penjelasan, bukan error', async ({ page }) => {
    await page.goto(url('/struk/INV-TIDAK-ADA-0000'));

    await expect(page.getByRole('heading', { name: 'Pesanan tidak ditemukan' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Lihat meja' })).toHaveAttribute(
      'href',
      url('/meja')
    );
    await expect(page.getByRole('link', { name: 'Pesan lagi' })).toHaveAttribute(
      'href',
      url('/menu')
    );
  });

  /*
    Tampilan kasir dijaga PERAN, bukan sekadar disembunyikan dari URL. Sejak
    `?mode=kasir` yang memilih tampilannya, penjaga itu perlu dinyatakan ulang
    di sini: pengunjung tanpa sesi staf yang mengarang parameter itu tidak boleh
    mendapat apa pun — termasuk pada invoice yang memang tidak ada, di mana
    keduanya sama-sama berhenti di halaman penjelasan.
  */
  test('?mode=kasir tidak membuka apa pun bagi yang belum masuk', async ({ page }) => {
    await page.goto(url('/struk/INV-TIDAK-ADA-0000?mode=kasir'));

    await expect(page.getByRole('heading', { name: 'Pesanan tidak ditemukan' })).toBeVisible();
    await expect(page.getByText('Mode kasir')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Cetak Struk/ })).toHaveCount(0);
  });
});
