'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { slugValid } from '@/lib/tenant';
import { lewatBatas } from '@/lib/antiSpam';
import { BATAS, periksaPanjang } from '@/lib/limits';

/*
  Pesan galat dari database dipulangkan APA ADANYA ke pemakai.

  Biasanya itu kebiasaan buruk — pesan Postgres bocor ke layar orang yang tidak
  bisa berbuat apa-apa dengannya. Di sini kebalikannya: seluruh `raise
  exception` di `create_tenant()` memang ditulis sebagai kalimat untuk dibaca
  pemilik warung ("Kode undangan tidak dikenali.", "Alamat /k/kopi-pagi sudah
  dipakai outlet lain."), sebab pemeriksaannya harus terjadi di database — di
  sanalah satu-satunya tempat yang tidak bisa dilangkahi.

  Yang disaring hanya galat yang JELAS bukan kalimat untuk manusia: kegagalan
  jaringan, constraint yang lolos dari pemeriksaan, dan sejenisnya.
*/
function pesanGagal(error) {
  const mentah = String(error?.message || '').trim();

  const bukanUntukDibaca =
    !mentah ||
    mentah.length > 160 ||
    /duplicate key|violates|syntax error|permission denied|JWT|fetch failed|column .* does not exist/i.test(
      mentah
    );

  return bukanUntukDibaca
    ? 'Outlet gagal dibuat. Coba lagi sebentar lagi, atau hubungi pengelola platform.'
    : mentah;
}

/**
 * Mendaftarkan satu UMKM baru.
 *
 * Validasinya berlapis dua persis seperti formulir lain di proyek ini: di
 * client untuk kenyamanan, di sini untuk keamanan. Bedanya, lapis ketiga
 * (`create_tenant()` di database) bukan kemewahan melainkan keharusan — RPC-nya
 * terbuka untuk anon key, jadi formulir ini bukan satu-satunya jalan menuju ke
 * sana dan tidak boleh jadi satu-satunya yang memeriksa.
 */
export async function daftarOutlet(payload) {
  /*
    Rate limit-nya lebih ketat daripada formulir lain: 3 per menit.

    Yang benar mendaftarkan outlet melakukannya sekali seumur usaha, jadi jatah
    kecil tidak pernah mengganggunya. Yang sedang MENEBAK kode undangan
    melakukannya ribuan kali — dan tanpa penjaga ini, satu-satunya penghalang
    adalah kecepatan jaringannya.
  */
  const batas = lewatBatas('daftar-outlet', { maks: 3 });
  if (batas.lewat) {
    return {
      ok: false,
      errors: {},
      message: `Terlalu banyak percobaan pendaftaran. Coba lagi dalam ${batas.sisaDetik} detik.`,
    };
  }

  const nama = String(payload?.nama || '').trim();
  const slug = String(payload?.slug || '')
    .trim()
    .toLowerCase();
  const kode = String(payload?.kode || '').trim();
  const tagline = String(payload?.tagline || '').trim();
  const alamat = String(payload?.alamat || '').trim();
  const jam = String(payload?.jam || '').trim();
  const wa = String(payload?.wa || '').trim();
  const email = String(payload?.email || '').trim();
  const telepon = String(payload?.telepon || '').trim();

  const errors = periksaPanjang({
    nama: [nama, BATAS.namaUsaha],
    slug: [slug, BATAS.slug],
    kode: [kode, BATAS.kodeUndangan],
    tagline: [tagline, BATAS.tagline],
    alamat: [alamat, BATAS.alamat],
    jam: [jam, BATAS.jam],
    wa: [wa, BATAS.telepon],
    email: [email, BATAS.email],
    telepon: [telepon, BATAS.telepon],
  });

  if (nama.length < 3 && !errors.nama) errors.nama = 'Nama usaha minimal 3 karakter.';

  if (!slug) {
    errors.slug = 'Alamat outlet wajib diisi.';
  } else if (!slugValid(slug)) {
    errors.slug =
      'Hanya huruf kecil, angka, dan tanda hubung. Panjang 3–50 karakter, tidak diawali/diakhiri tanda hubung.';
  }

  if (!kode) errors.kode = 'Kode undangan wajib diisi.';

  // Kolom opsional — tapi begitu diisi harus benar-benar bisa dipakai.
  // Aturannya disamakan dengan formulir kontak. `!errors.email` menjaga galat
  // panjang yang lebih spesifik tidak tertimpa "format tidak valid".
  if (email && !errors.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Format email tidak valid.';
  }

  const waAngka = wa.replace(/[^\d]/g, '');
  if (wa && (waAngka.length < 8 || waAngka.length > 15)) {
    errors.wa = 'Nomor WhatsApp tidak valid. Contoh: 0812-3456-7890.';
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, message: 'Periksa kembali isian Anda.' };
  }

  const supabase = createClient();
  const { data, error } = await supabase.rpc('create_tenant', {
    p_invite_code: kode,
    p_slug: slug,
    p_name: nama,
    p_tagline: tagline || null,
    p_description: null,
    p_address: alamat || null,
    p_phone: telepon || null,
    p_email: email || null,
    p_hours: jam || null,
    p_wa_number: waAngka || null,
  });

  if (error) {
    const pesan = pesanGagal(error);

    /*
      Galat yang menyebut satu kolom dikembalikan ke kolomnya, bukan cuma ke
      spanduk di atas tombol. Dua kegagalan yang paling sering terjadi —
      kode salah dan slug bentrok — keduanya soal satu kolom tertentu, dan
      pesan yang menempel di kolomnya membuat orang tahu apa yang harus
      diubah tanpa membaca ulang seluruh formulir.
    */
    if (/kode undangan/i.test(pesan)) return { ok: false, errors: { kode: pesan }, message: pesan };
    if (/alamat \/k\//i.test(pesan)) return { ok: false, errors: { slug: pesan }, message: pesan };

    return { ok: false, errors: {}, message: pesan };
  }

  /*
    Direktori di `/` disajikan dari cache 60 detik (`export const revalidate`).

    Tanpa baris ini, outlet yang baru saja dibuat bisa tidak muncul di daftar
    selama semenit penuh — dan yang membuatnya akan menyimpulkan pendaftarannya
    gagal, lalu mencoba lagi dengan slug yang sama.
  */
  revalidatePath('/');

  return {
    ok: true,
    errors: {},
    message: `Outlet ${data?.name || nama} berhasil dibuat.`,
    tenant: { slug: data?.slug || slug, name: data?.name || nama },
  };
}
