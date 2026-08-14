/**
 * Batas panjang setiap teks yang boleh masuk database.
 *
 * PostgreSQL `text` tidak punya batas panjang — kolomnya menerima satu megabyte
 * dengan senang hati. Selama ini satu-satunya penjaga adalah panjang MINIMAL
 * ("nama minimal 3 karakter"), jadi sebuah pesan kontak berisi sepuluh ribu
 * karakter akan tersimpan utuh, merusak tata letak halaman admin yang
 * membacanya, dan menghabiskan kuota database yang dibayar pemilik outlet.
 *
 * Angkanya dipilih dari bentuk isian yang wajar, bukan dari batas teknis: nama
 * orang tidak sampai 80 karakter, dan keluhan pelanggan yang tulus tidak
 * menembus 2.000.
 *
 * Berkas ini MURNI — tanpa `next/headers`, tanpa Supabase — supaya formulir di
 * sisi klien bisa ikut memakainya untuk atribut `maxLength`. Dengan begitu
 * batasnya satu, bukan satu di layar dan satu lagi di server yang diam-diam
 * berbeda.
 */
export const BATAS = {
  nama: 80,
  email: 160,
  telepon: 25,
  bisnis: 120,
  pesan: 2000,

  // Checkout
  namaPemesan: 60,
  nomorMeja: 12,
  catatan: 300,

  // Pendaftaran outlet
  namaUsaha: 80,
  slug: 50,
  tagline: 120,
  alamat: 200,
  jam: 120,
  kodeUndangan: 60,
};

/**
 * Memeriksa sekumpulan kolom sekaligus.
 *
 * @param {Record<string, [string, number]>} kolom  { nama: [nilai, batas] }
 * @returns {Record<string, string>} pesan galat per kolom, kosong bila aman
 */
export function periksaPanjang(kolom) {
  const errors = {};

  for (const [key, [nilai, maks]] of Object.entries(kolom)) {
    if (typeof nilai === 'string' && nilai.length > maks) {
      errors[key] = `Maksimal ${maks} karakter (sekarang ${nilai.length}).`;
    }
  }

  return errors;
}
