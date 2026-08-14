/**
 * Jalur SIMULASI — untuk yang menilai sistem ini dari laptop.
 *
 * Prinsip produknya: nomor meja SELALU datang dari QR yang ditempel di meja,
 * tidak pernah dipilih apalagi diketik pelanggan. Itu bukan batasan teknis
 * melainkan justru yang dijual — nomor meja yang bisa diketik adalah sumber
 * kesalahan paling mahal di kedai (minuman diantar ke meja yang salah, tagihan
 * menempel ke orang lain).
 *
 * Tapi juri lomba membuka sistem ini dari browser, bukan dari kursi di kedai.
 * Tanpa jalan masuk, satu-satunya cara mencobanya adalah mengetik URL dengan
 * `?meja=` sendiri — persis perbuatan yang prinsipnya melarang.
 *
 * Jalan keluarnya bukan mengendurkan prinsipnya, melainkan MENYEBUT DIRINYA
 * APA ADANYA. Tombolnya berlabel "Simulasi Scan QR", mejanya tetap:
 *
 *   1. TETAP, bukan acak — meja yang berganti tiap muat membuat orang mengira
 *      sistemnya memilihkan meja, padahal QR-lah yang menentukan.
 *   2. TIDAK DIPILIH pengunjung — tidak ada dropdown, tidak ada kolom isian.
 *      Menyediakannya berarti memperagakan kebalikan dari yang diperagakan.
 *   3. Halaman tujuannya memasang BANNER yang mengaku sedang mensimulasikan.
 *
 * Penanda `demo=1` hanya menyalakan label dan banner. Ia TIDAK menyentuh
 * penguncian nomor meja: `meja` tetap dibaca dari URL dan tetap terkunci di
 * keranjang, persis sama dengan pindaian sungguhan.
 */

/** Nama parameter penanda, dipakai bersama semua halaman di jalur ini. */
export const PARAM_DEMO = 'demo';

/**
 * Meja yang diperagakan, bila outletnya memilikinya.
 *
 * Angka 07 dipilih karena ia ada di outlet contoh `to-do` dan sudah lebih dulu
 * dipakai sebagai contoh di seluruh README dan mockup dashboard — jadi yang
 * membaca dokumennya lalu mencobanya melihat nomor yang sama.
 */
export const MEJA_DEMO = '07';

/** Outlet yang ditawarkan sebagai contoh dari landing platform. */
export const OUTLET_DEMO = 'to-do';

/**
 * Memilih outlet contoh dari daftar yang ada.
 *
 * `to-do` didahulukan karena ia outlet contoh yang disemai `schema.sql` dan
 * paling lengkap isinya. Kalau ia tidak ada — pemasangan yang seluruh outlet
 * contohnya sudah dihapus — yang pertama dipakai, supaya kartunya tidak pernah
 * menunjuk alamat yang kosong.
 */
export function outletDemo(outlets = []) {
  return outlets.find((o) => o.slug === OUTLET_DEMO) || outlets[0] || null;
}

/**
 * Nomor meja untuk tombol simulasi sebuah outlet.
 *
 * Dibaca dari denah meja OUTLET ITU, bukan ditulis tetap `'07'` di komponen.
 * Roti Bakar 88 hanya bernomor 01–06; tombol yang tetap menjanjikan Meja 07 di
 * sana akan mendarat di layar "meja tidak terdaftar" — peragaan yang gagal
 * tepat di depan orang yang sedang menilai.
 *
 * Tetap TETAP dalam pengertian yang penting: untuk satu outlet, hasilnya selalu
 * nomor yang sama, dan tidak ada pengunjung yang memilihnya.
 */
export function mejaDemo(tables = []) {
  const aktif = tables.filter((t) => t.is_active !== false);
  const pilihan = aktif.find((t) => t.table_no === MEJA_DEMO) || aktif[0];
  return pilihan?.table_no || null;
}

/** Apakah halaman ini dibuka lewat jalur simulasi? */
export function modeDemo(searchParams) {
  return searchParams?.[PARAM_DEMO] === '1';
}
