'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { TABLE_AREAS } from '@/lib/tables';

const STATUSES = ['available', 'occupied', 'reserved'];

/** Pastikan pemanggil adalah admin sebelum menjalankan operasi tulis. */
async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, error: 'Anda harus login terlebih dahulu.' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { supabase, error: 'Akses ditolak: khusus admin.' };

  return { supabase, error: null };
}

function revalidateAll() {
  revalidatePath('/admin/meja');
  revalidatePath('/meja');
  revalidatePath('/menu');
  revalidatePath('/');
}

function sanitize(input) {
  const table_no = String(input?.table_no || '').trim();
  const capacity = Number(input?.capacity);
  const area = String(input?.area || '').trim();

  const errors = {};
  if (!table_no) errors.table_no = 'Nomor meja wajib diisi.';
  if (table_no.length > 8) errors.table_no = 'Nomor meja maksimal 8 karakter.';
  if (!Number.isInteger(capacity) || capacity < 1) errors.capacity = 'Kapasitas harus bilangan bulat ≥ 1.';

  // Area dikunci ke daftar resmi. Tanpa ini, nilai bebas apa pun bisa masuk
  // lewat pemanggilan langsung dan memunculkan kembali area lama seperti
  // 'Workspace' atau 'VIP' yang sudah tidak dipakai.
  if (area && !TABLE_AREAS.includes(area)) {
    errors.area = `Area harus salah satu dari: ${TABLE_AREAS.join(', ')}.`;
  }

  return {
    errors,
    values: {
      table_no,
      label: String(input?.label || '').trim() || null,
      area: TABLE_AREAS.includes(area) ? area : TABLE_AREAS[0],
      capacity,
      is_active: Boolean(input?.is_active),
    },
  };
}

/** CREATE meja */
export async function createTable(input) {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, message: authError };

  const { errors, values } = sanitize(input);
  if (Object.keys(errors).length) return { ok: false, errors, message: 'Periksa kembali isian Anda.' };

  const { data, error } = await supabase.from('cafe_tables').insert(values).select().single();
  if (error) {
    const message = error.code === '23505' ? `Meja ${values.table_no} sudah terdaftar.` : error.message;
    return { ok: false, message };
  }

  revalidateAll();
  return { ok: true, message: `Meja ${data.table_no} berhasil ditambahkan.`, data };
}

/** UPDATE meja */
export async function updateTable(id, input) {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, message: authError };
  if (!id) return { ok: false, message: 'ID meja tidak valid.' };

  const { errors, values } = sanitize(input);
  if (Object.keys(errors).length) return { ok: false, errors, message: 'Periksa kembali isian Anda.' };

  const { data, error } = await supabase
    .from('cafe_tables')
    .update(values)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    const message = error.code === '23505' ? `Meja ${values.table_no} sudah terdaftar.` : error.message;
    return { ok: false, message };
  }

  revalidateAll();
  return { ok: true, message: `Meja ${data.table_no} berhasil diperbarui.`, data };
}

/** DELETE meja */
export async function deleteTable(id) {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, message: authError };
  if (!id) return { ok: false, message: 'ID meja tidak valid.' };

  const { error } = await supabase.from('cafe_tables').delete().eq('id', id);
  if (error) return { ok: false, message: error.message };

  revalidateAll();
  return { ok: true, message: 'Meja berhasil dihapus.' };
}

/**
 * Ubah status meja secara manual (mis. menandai reservasi atau
 * membebaskan meja setelah tamu pulang).
 *
 * Catatan: status juga disinkronkan otomatis oleh trigger di database —
 * meja jadi "occupied" saat ada pesanan pending, dan bebas lagi begitu
 * pesanannya dilunasi atau dibatalkan.
 */
export async function setTableStatus(id, status) {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, message: authError };

  if (!STATUSES.includes(status)) return { ok: false, message: 'Status meja tidak valid.' };

  const { error } = await supabase.from('cafe_tables').update({ status }).eq('id', id);
  if (error) return { ok: false, message: error.message };

  revalidateAll();
  return { ok: true, message: 'Status meja diperbarui.' };
}
