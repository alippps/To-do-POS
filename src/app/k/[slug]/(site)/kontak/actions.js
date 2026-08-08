'use server';

import { createClient } from '@/lib/supabase/server';
import { slugValid } from '@/lib/tenant';
import { getTenant } from '@/lib/tenant.server';

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

  // Aturannya harus sama persis dengan ContactForm — kolom opsional, tapi
  // begitu diisi harus benar-benar bisa dihubungi.
  if (phone && !/^\d{8,15}$/.test(phone.replace(/[\s\-()+]/g, ''))) {
    errors.phone = 'Nomor tidak valid. Contoh: 0812-3456-7890.';
  }

  if (message.length < 10) errors.message = 'Pesan minimal 10 karakter.';

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

  return { ok: true, errors: {}, message: 'Pesan terkirim! Tim kami akan membalas maksimal 1×24 jam.' };
}
