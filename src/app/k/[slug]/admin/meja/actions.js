'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminAction } from '@/lib/adminGuard';
import { TABLE_AREAS } from '@/lib/tables';
import { tenantPath } from '@/lib/tenant';

const STATUSES = ['available', 'occupied', 'reserved'];

function revalidateAll(slug) {
  for (const p of ['/admin/meja', '/meja', '/menu', '/']) {
    revalidatePath(tenantPath(slug, p));
  }
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
export async function createTable(slug, input) {
  const { supabase, tenantId, error: authError } = await requireAdminAction(slug);
  if (authError) return { ok: false, message: authError };

  const { errors, values } = sanitize(input);
  if (Object.keys(errors).length) return { ok: false, errors, message: 'Periksa kembali isian Anda.' };

  const { data, error } = await supabase
    .from('cafe_tables')
    .insert({ ...values, tenant_id: tenantId })
    .select()
    .single();
  if (error) {
    /*
      23505 sekarang berarti "nomor itu sudah dipakai DI OUTLET INI".
      Sejak v4 keunikan nomor meja berlaku per outlet, jadi Meja 01 di Kopi
      Pagi tidak lagi menghalangi Meja 01 di Roti Bakar 88.
    */
    const message =
      error.code === '23505' ? `Meja ${values.table_no} sudah ada di outlet ini.` : error.message;
    return { ok: false, message };
  }

  revalidateAll(slug);
  return { ok: true, message: `Meja ${data.table_no} berhasil ditambahkan.`, data };
}

/** UPDATE meja */
export async function updateTable(slug, id, input) {
  const { supabase, tenantId, error: authError } = await requireAdminAction(slug);
  if (authError) return { ok: false, message: authError };
  if (!id) return { ok: false, message: 'ID meja tidak valid.' };

  const { errors, values } = sanitize(input);
  if (Object.keys(errors).length) return { ok: false, errors, message: 'Periksa kembali isian Anda.' };

  const { data, error } = await supabase
    .from('cafe_tables')
    .update(values)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) {
    const message =
      error.code === '23505' ? `Meja ${values.table_no} sudah ada di outlet ini.` : error.message;
    return { ok: false, message };
  }

  revalidateAll(slug);
  return { ok: true, message: `Meja ${data.table_no} berhasil diperbarui.`, data };
}

/** DELETE meja */
export async function deleteTable(slug, id) {
  const { supabase, tenantId, error: authError } = await requireAdminAction(slug);
  if (authError) return { ok: false, message: authError };
  if (!id) return { ok: false, message: 'ID meja tidak valid.' };

  const { error } = await supabase
    .from('cafe_tables')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId);
  if (error) return { ok: false, message: error.message };

  revalidateAll(slug);
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
export async function setTableStatus(slug, id, status) {
  const { supabase, tenantId, error: authError } = await requireAdminAction(slug);
  if (authError) return { ok: false, message: authError };

  if (!STATUSES.includes(status)) return { ok: false, message: 'Status meja tidak valid.' };

  const { error } = await supabase
    .from('cafe_tables')
    .update({ status })
    .eq('id', id)
    .eq('tenant_id', tenantId);
  if (error) return { ok: false, message: error.message };

  revalidateAll(slug);
  return { ok: true, message: 'Status meja diperbarui.' };
}
