'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Menyimpan pertanyaan yang masuk lewat bagian Kontak di landing platform.
 *
 * Tujuannya tabel `platform_messages`, BUKAN `contact_messages`. Setiap baris
 * di tabel yang kedua wajib menempel pada satu outlet, sebab yang berhak
 * membacanya adalah admin outlet tujuan — sedangkan yang bertanya di sini
 * justru orang yang belum punya outlet sama sekali.
 *
 * Divalidasi dua kali seperti formulir lain di proyek ini: di client untuk
 * kenyamanan, di sini untuk keamanan. Aturannya sengaja disamakan persis dengan
 * formulir kontak outlet supaya tidak ada dua definisi "email yang sah".
 */
export async function kirimPesanPlatform(payload) {
  const name = String(payload?.name || '').trim();
  const email = String(payload?.email || '').trim();
  const phone = String(payload?.phone || '').trim();
  const business = String(payload?.business || '').trim();
  const message = String(payload?.message || '').trim();

  const errors = {};
  if (name.length < 3) errors.name = 'Nama minimal 3 karakter.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Format email tidak valid.';

  if (phone && !/^\d{8,15}$/.test(phone.replace(/[\s\-()+]/g, ''))) {
    errors.phone = 'Nomor tidak valid. Contoh: 0812-3456-7890.';
  }

  if (message.length < 10) errors.message = 'Pertanyaan minimal 10 karakter.';

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, message: 'Periksa kembali isian Anda.' };
  }

  const supabase = createClient();
  const { error } = await supabase.from('platform_messages').insert({
    name,
    email,
    phone: phone || null,
    business: business || null,
    message,
  });

  if (error) {
    return { ok: false, errors: {}, message: `Gagal mengirim pertanyaan: ${error.message}` };
  }

  return {
    ok: true,
    errors: {},
    message: 'Pertanyaan terkirim! Kami balas ke emailmu maksimal 1×24 jam.',
  };
}
