'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminAction } from '@/lib/adminGuard';
import { tenantPath } from '@/lib/tenant';

function sanitize(input) {
  const name = String(input?.name || '').trim();
  const category = String(input?.category || 'Kopi').trim();
  const price = Number(input?.price);
  const stock = Number(input?.stock);

  /*
    Harga promo opsional. Kosong berarti tidak ada promo — disimpan NULL, bukan
    0, karena 0 akan terbaca sebagai "gratis" oleh aturan promo di lib/promo.js
    dan create_order().
  */
  const promoRaw = input?.promo_price;
  const promoKosong = promoRaw === '' || promoRaw === null || promoRaw === undefined;
  const promo_price = promoKosong ? null : Number(promoRaw);

  const errors = {};
  if (name.length < 2) errors.name = 'Nama produk minimal 2 karakter.';
  if (!Number.isFinite(price) || price < 0) errors.price = 'Harga harus angka ≥ 0.';
  if (!Number.isInteger(stock) || stock < 0) errors.stock = 'Stok harus bilangan bulat ≥ 0.';

  if (promo_price !== null) {
    if (!Number.isFinite(promo_price) || promo_price < 0) {
      errors.promo_price = 'Harga promo harus angka ≥ 0.';
    } else if (Number.isFinite(price) && promo_price >= price) {
      // Ditolak, bukan diam-diam diabaikan — admin perlu tahu promonya tidak jadi.
      errors.promo_price = 'Harga promo harus lebih kecil dari harga normal.';
    }
  }

  return {
    errors,
    values: {
      name,
      category,
      price,
      promo_price,
      stock,
      description: String(input?.description || '').trim() || null,
      image_url: String(input?.image_url || '').trim() || null,
      is_active: Boolean(input?.is_active),
    },
  };
}

function revalidateAll(slug) {
  for (const p of ['/admin/produk', '/admin', '/menu', '/katalog', '/promo', '/']) {
    revalidatePath(tenantPath(slug, p));
  }
}

/*
  Setiap operasi menyaring `tenant_id`.

  RLS di database sudah menolak tulisan lintas outlet, jadi ini bukan
  satu-satunya penjaga — tapi tanpa penyaring di sini, admin yang mengirim id
  produk milik outlet lain mendapat "0 baris terpengaruh" yang senyap dan
  terbaca sebagai berhasil. Yang dipulangkan ke layar seharusnya penolakan,
  bukan keheningan.
*/

/** CREATE */
export async function createProduct(slug, input) {
  const { supabase, tenantId, error: authError } = await requireAdminAction(slug);
  if (authError) return { ok: false, message: authError };

  const { errors, values } = sanitize(input);
  if (Object.keys(errors).length) return { ok: false, errors, message: 'Periksa kembali isian Anda.' };

  const { data, error } = await supabase
    .from('products')
    .insert({ ...values, tenant_id: tenantId })
    .select()
    .single();
  if (error) return { ok: false, message: error.message };

  revalidateAll(slug);
  return { ok: true, message: `Produk “${data.name}” berhasil ditambahkan.`, data };
}

/** UPDATE */
export async function updateProduct(slug, id, input) {
  const { supabase, tenantId, error: authError } = await requireAdminAction(slug);
  if (authError) return { ok: false, message: authError };
  if (!id) return { ok: false, message: 'ID produk tidak valid.' };

  const { errors, values } = sanitize(input);
  if (Object.keys(errors).length) return { ok: false, errors, message: 'Periksa kembali isian Anda.' };

  const { data, error } = await supabase
    .from('products')
    .update(values)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single();
  if (error) return { ok: false, message: error.message };

  revalidateAll(slug);
  return { ok: true, message: `Produk “${data.name}” berhasil diperbarui.`, data };
}

/** DELETE */
export async function deleteProduct(slug, id) {
  const { supabase, tenantId, error: authError } = await requireAdminAction(slug);
  if (authError) return { ok: false, message: authError };
  if (!id) return { ok: false, message: 'ID produk tidak valid.' };

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId);
  if (error) return { ok: false, message: error.message };

  revalidateAll(slug);
  return { ok: true, message: 'Produk berhasil dihapus.' };
}

/** Toggle cepat status aktif/nonaktif */
export async function toggleProductActive(slug, id, isActive) {
  const { supabase, tenantId, error: authError } = await requireAdminAction(slug);
  if (authError) return { ok: false, message: authError };

  const { error } = await supabase
    .from('products')
    .update({ is_active: isActive })
    .eq('id', id)
    .eq('tenant_id', tenantId);
  if (error) return { ok: false, message: error.message };

  revalidateAll(slug);
  return { ok: true, message: isActive ? 'Produk diaktifkan.' : 'Produk dinonaktifkan.' };
}
