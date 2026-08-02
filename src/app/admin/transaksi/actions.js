'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

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
  revalidatePath('/admin/transaksi');
  revalidatePath('/admin');
}

/** UPDATE status transaksi (pending → paid → cancelled) */
export async function updateTransactionStatus(id, status) {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, message: authError };

  if (!['pending', 'paid', 'cancelled'].includes(status)) {
    return { ok: false, message: 'Status tidak valid.' };
  }

  const { error } = await supabase.from('transactions').update({ status }).eq('id', id);
  if (error) return { ok: false, message: error.message };

  revalidateAll();
  return { ok: true, message: 'Status transaksi diperbarui.' };
}

/** DELETE transaksi (item ikut terhapus lewat ON DELETE CASCADE) */
export async function deleteTransaction(id) {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, message: authError };

  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) return { ok: false, message: error.message };

  revalidateAll();
  return { ok: true, message: 'Transaksi berhasil dihapus.' };
}

/** READ detail item satu transaksi (dipakai modal detail) */
export async function getTransactionItems(id) {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, message: authError, items: [] };

  const { data, error } = await supabase
    .from('transaction_items')
    .select('id, product_name, price, qty, subtotal')
    .eq('transaction_id', id);

  if (error) return { ok: false, message: error.message, items: [] };
  return { ok: true, items: data || [] };
}
