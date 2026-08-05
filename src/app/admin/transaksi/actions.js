'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/**
 * Penjaga role untuk aksi transaksi.
 *
 * `roles` menentukan siapa yang boleh: kasir ikut boleh mengubah status
 * (menandai lunas / batal) karena itu pekerjaan hariannya, tapi menghapus
 * transaksi tetap khusus admin — riwayat penjualan yang terhapus tidak bisa
 * dikembalikan. Batas yang sama juga ditegakkan policy RLS di database.
 */
async function requireRole(roles) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, error: 'Anda harus login terlebih dahulu.' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

  if (!roles.includes(profile?.role)) {
    return {
      supabase,
      error: roles.includes('kasir')
        ? 'Akses ditolak: khusus admin & kasir.'
        : 'Akses ditolak: khusus admin.',
    };
  }

  return { supabase, error: null };
}

function revalidateAll() {
  revalidatePath('/admin/transaksi');
  revalidatePath('/admin');
}

/** UPDATE status transaksi (pending → paid → cancelled) */
export async function updateTransactionStatus(id, status) {
  const { supabase, error: authError } = await requireRole(['admin', 'kasir']);
  if (authError) return { ok: false, message: authError };

  if (!['pending', 'paid', 'cancelled'].includes(status)) {
    return { ok: false, message: 'Status tidak valid.' };
  }

  const { error } = await supabase.from('transactions').update({ status }).eq('id', id);
  if (error) return { ok: false, message: error.message };

  revalidateAll();
  return { ok: true, message: 'Status transaksi diperbarui.' };
}

/**
 * DELETE transaksi (item ikut terhapus lewat ON DELETE CASCADE).
 * Khusus admin — kasir tidak boleh menghapus riwayat penjualan.
 */
export async function deleteTransaction(id) {
  const { supabase, error: authError } = await requireRole(['admin']);
  if (authError) return { ok: false, message: authError };

  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) return { ok: false, message: error.message };

  revalidateAll();
  return { ok: true, message: 'Transaksi berhasil dihapus.' };
}

/** READ detail item satu transaksi (dipakai modal detail) */
export async function getTransactionItems(id) {
  const { supabase, error: authError } = await requireRole(['admin', 'kasir']);
  if (authError) return { ok: false, message: authError, items: [] };

  const { data, error } = await supabase
    .from('transaction_items')
    .select('id, product_name, price, qty, subtotal')
    .eq('transaction_id', id);

  if (error) return { ok: false, message: error.message, items: [] };
  return { ok: true, items: data || [] };
}
