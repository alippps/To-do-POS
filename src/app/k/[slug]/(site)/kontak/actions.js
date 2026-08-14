'use server';

import { createClient } from '@/lib/supabase/server';
import { slugValid } from '@/lib/tenant';
import { getTenant } from '@/lib/tenant.server';
import { lewatBatas } from '@/lib/antiSpam';
import { umpanTermakan } from '@/lib/honeypot';
import { BATAS, periksaPanjang } from '@/lib/limits';

/*
  Satu objek, dipakai DUA kali: untuk kiriman yang benar-benar tersimpan, dan
  untuk kiriman yang ditelan perangkap umpan. Ditulis sekali supaya keduanya
  tidak mungkin menyimpang — perbedaan sekecil apa pun di antara keduanya
  adalah petunjuk yang bisa dipakai untuk mendeteksi perangkapnya.
*/
const BERHASIL = {
  ok: true,
  errors: {},
  message: 'Pesan terkirim! Tim kami akan membalas maksimal 1×24 jam.',
};

/**
 * Menyimpan pesan dari form kontak ke tabel `contact_messages`.
 * Validasi dilakukan dua kali: di client (UX) dan di sini (keamanan).
 *
 * Tabel ini policy insert-nya `with check (true)` — memang harus, sebab yang
 * mengisi formulir adalah pelanggan tanpa akun. Tiga penjaga di bawah yang
 * menggantikan penjagaan berbasis identitas yang tidak mungkin ada di sini.
 */
export async function sendMessage(payload) {
  /*
    UMPAN diperiksa PALING AWAL — sebelum validasi, sebelum menyentuh database.

    Balasannya sengaja `ok: true`, sama persis dengan kiriman yang berhasil.
    Menolak dengan pesan galat akan memberi tahu penulis skripnya bahwa ada
    kolom yang harus dikosongkan, dan perangkapnya jadi tidak berguna pada
    percobaan berikutnya.
  */
  if (umpanTermakan(payload)) {
    return BERHASIL;
  }

  /*
    Rate limit dipasang SETELAH umpan, supaya pengirim otomatis yang sudah
    tertangkap tidak ikut menghabiskan jatah — dan SEBELUM validasi, supaya
    kiriman beruntun berhenti tanpa perlu menyentuh database sama sekali.
  */
  const batas = lewatBatas('kontak');
  if (batas.lewat) {
    return {
      ok: false,
      errors: {},
      message: `Terlalu banyak pesan terkirim dari perangkat ini. Coba lagi dalam ${batas.sisaDetik} detik.`,
    };
  }

  const name = String(payload?.name || '').trim();
  const email = String(payload?.email || '').trim();
  const phone = String(payload?.phone || '').trim();
  const message = String(payload?.message || '').trim();

  const errors = periksaPanjang({
    name: [name, BATAS.nama],
    email: [email, BATAS.email],
    phone: [phone, BATAS.telepon],
    message: [message, BATAS.pesan],
  });

  /*
    Galat panjang TIDAK ditimpa oleh galat bentuk.

    Email 300 karakter juga gagal pemeriksaan formatnya, dan tanpa penjaga ini
    pengirimnya membaca "Format email tidak valid" — lalu memperbaiki apa yang
    tidak rusak. Yang lebih spesifik yang menang.
  */
  const isi = (key, pesan) => {
    if (!errors[key]) errors[key] = pesan;
  };

  if (name.length < 3) isi('name', 'Nama minimal 3 karakter.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) isi('email', 'Format email tidak valid.');

  // Aturannya harus sama persis dengan ContactForm — kolom opsional, tapi
  // begitu diisi harus benar-benar bisa dihubungi.
  if (phone && !/^\d{8,15}$/.test(phone.replace(/[\s\-()+]/g, ''))) {
    isi('phone', 'Nomor tidak valid. Contoh: 0812-3456-7890.');
  }

  if (message.length < 10) isi('message', 'Pesan minimal 10 karakter.');

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, message: 'Periksa kembali isian Anda.' };
  }

  /*
    Pesan menempel pada outlet tujuannya.

    Tanpa `tenant_id`, seluruh pesan masuk jatuh ke kolam yang sama dan tidak
    ada admin yang berhak membacanya — policy "pesan: admin boleh baca"
    memeriksa `is_admin_of(tenant_id)`, dan NULL tidak pernah cocok dengan
    siapa pun. Pesannya tersimpan, tapi tak terbaca selamanya.
  */
  const tenantSlug = String(payload?.tenantSlug || '').trim();
  const tenant = slugValid(tenantSlug) ? await getTenant(tenantSlug) : null;

  if (!tenant) {
    return { ok: false, errors: {}, message: 'Outlet tidak dikenali. Muat ulang halaman ini.' };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('contact_messages')
    .insert({ tenant_id: tenant.id, name, email, phone: phone || null, message });

  if (error) {
    return { ok: false, errors: {}, message: `Gagal mengirim pesan: ${error.message}` };
  }

  return BERHASIL;
}
