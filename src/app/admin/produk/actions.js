'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

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

function sanitize(input) {
  const name = String(input?.name || '').trim();
  const category = String(input?.category || 'Kopi').trim();
  const price = Number(input?.price);
  const stock = Number(input?.stock);

  const errors = {};
  if (name.length < 2) errors.name = 'Nama produk minimal 2 karakter.';
  if (!Number.isFinite(price) || price < 0) errors.price = 'Harga harus angka ≥ 0.';
  if (!Number.isInteger(stock) || stock < 0) errors.stock = 'Stok harus bilangan bulat ≥ 0.';

  return {
    errors,
    values: {
      name,
      category,
      price,
      stock,
      description: String(input?.description || '').trim() || null,
      image_url: String(input?.image_url || '').trim() || null,
      is_active: Boolean(input?.is_active),
    },
  };
}

function revalidateAll() {
  revalidatePath('/admin/produk');
  revalidatePath('/admin');
  revalidatePath('/menu');
  revalidatePath('/');
}

/** CREATE */
export async function createProduct(input) {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, message: authError };

  const { errors, values } = sanitize(input);
  if (Object.keys(errors).length) return { ok: false, errors, message: 'Periksa kembali isian Anda.' };

  const { data, error } = await supabase.from('products').insert(values).select().single();
  if (error) return { ok: false, message: error.message };

  revalidateAll();
  return { ok: true, message: `Produk “${data.name}” berhasil ditambahkan.`, data };
}

/** UPDATE */
export async function updateProduct(id, input) {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, message: authError };
  if (!id) return { ok: false, message: 'ID produk tidak valid.' };

  const { errors, values } = sanitize(input);
  if (Object.keys(errors).length) return { ok: false, errors, message: 'Periksa kembali isian Anda.' };

  const { data, error } = await supabase.from('products').update(values).eq('id', id).select().single();
  if (error) return { ok: false, message: error.message };

  revalidateAll();
  return { ok: true, message: `Produk “${data.name}” berhasil diperbarui.`, data };
}

/** DELETE */
export async function deleteProduct(id) {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, message: authError };
  if (!id) return { ok: false, message: 'ID produk tidak valid.' };

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return { ok: false, message: error.message };

  revalidateAll();
  return { ok: true, message: 'Produk berhasil dihapus.' };
}

/** Toggle cepat status aktif/nonaktif */
export async function toggleProductActive(id, isActive) {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, message: authError };

  const { error } = await supabase.from('products').update({ is_active: isActive }).eq('id', id);
  if (error) return { ok: false, message: error.message };

  revalidateAll();
  return { ok: true, message: isActive ? 'Produk diaktifkan.' : 'Produk dinonaktifkan.' };
}
