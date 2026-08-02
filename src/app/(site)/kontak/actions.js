'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Menyimpan pesan dari form kontak ke tabel `contact_messages`.
 * Validasi dilakukan dua kali: di client (UX) dan di sini (keamanan).
 */
export async function sendMessage(payload) {
  const name = String(payload?.name || '').trim();
  const email = String(payload?.email || '').trim();
  const phone = String(payload?.phone || '').trim();
  const message = String(payload?.message || '').trim();

  const errors = {};
  if (name.length < 3) errors.name = 'Nama minimal 3 karakter.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Format email tidak valid.';
  if (message.length < 10) errors.message = 'Pesan minimal 10 karakter.';

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, message: 'Periksa kembali isian Anda.' };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('contact_messages')
    .insert({ name, email, phone: phone || null, message });

  if (error) {
    return { ok: false, errors: {}, message: `Gagal mengirim pesan: ${error.message}` };
  }

  return { ok: true, errors: {}, message: 'Pesan terkirim! Tim kami akan membalas maksimal 1×24 jam.' };
}
