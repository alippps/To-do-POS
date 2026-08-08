'use server';

import { revalidatePath } from 'next/cache';
import { requireStaffAction } from '@/lib/adminGuard';
import { tenantPath } from '@/lib/tenant';

/*
  Kasir ikut boleh mengubah status (menandai lunas / batal) karena itu
  pekerjaan hariannya, tapi menghapus transaksi tetap khusus admin — riwayat
  penjualan yang terhapus tidak bisa dikembalikan. Batas yang sama juga
  ditegakkan policy RLS di database.
*/

function revalidateAll(slug) {
  revalidatePath(tenantPath(slug, '/admin/transaksi'));
  revalidatePath(tenantPath(slug, '/admin'));
}

/** UPDATE status transaksi (pending → paid → cancelled) */
export async function updateTransactionStatus(slug, id, status) {
  const { supabase, tenantId, error: authError } = await requireStaffAction(slug, {
    kasirBoleh: true,
  });
  if (authError) return { ok: false, message: authError };

  if (!['pending', 'paid', 'cancelled'].includes(status)) {
    return { ok: false, message: 'Status tidak valid.' };
  }

  const { error } = await supabase
    .from('transactions')
    .update({ status })
    .eq('id', id)
    .eq('tenant_id', tenantId);
  if (error) return { ok: false, message: error.message };

  revalidateAll(slug);
  return { ok: true, message: 'Status transaksi diperbarui.' };
}

/**
 * DELETE transaksi (item ikut terhapus lewat ON DELETE CASCADE).
 * Khusus admin — kasir tidak boleh menghapus riwayat penjualan.
 */
export async function deleteTransaction(slug, id) {
  const { supabase, tenantId, error: authError } = await requireStaffAction(slug);
  if (authError) return { ok: false, message: authError };

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId);
  if (error) return { ok: false, message: error.message };

  revalidateAll(slug);
  return { ok: true, message: 'Transaksi berhasil dihapus.' };
}

/** READ detail item satu transaksi (dipakai modal detail) */
export async function getTransactionItems(slug, id) {
  const { supabase, tenantId, error: authError } = await requireStaffAction(slug, {
    kasirBoleh: true,
  });
  if (authError) return { ok: false, message: authError, items: [] };

  /*
    Transaksinya diperiksa lebih dulu, baru itemnya diambil.

    `transaction_items` tidak punya kolom tenant sendiri — kepemilikannya
    diturunkan dari transaksi induk. Mengambil item langsung dengan
    `transaction_id` saja berarti mempercayai id yang dikirim klien; RLS
    memang menolak, tapi penyaring ini membuat penolakannya punya pesan.
  */
  const { data: trx } = await supabase
    .from('transactions')
    .select('id')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (!trx) return { ok: false, message: 'Transaksi tidak ditemukan di outlet ini.', items: [] };

  const { data, error } = await supabase
    .from('transaction_items')
    .select('id, product_name, price, qty, subtotal')
    .eq('transaction_id', id);

  if (error) return { ok: false, message: error.message, items: [] };
  return { ok: true, items: data || [] };
}
