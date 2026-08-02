'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/**
 * Checkout pesanan — membuat transaksi + item + memotong stok lewat RPC `create_order`.
 *
 * RPC-nya SECURITY DEFINER, jadi PELANGGAN TIDAK PERLU LOGIN untuk memesan.
 * Pesanan tamu masuk dengan status `pending` dan menandai mejanya "terisi";
 * kasir yang nanti menandainya lunas dari /admin/transaksi.
 */
export async function createOrder(payload) {
  const supabase = createClient();

  const items = (payload?.items || [])
    .filter((i) => i?.product_id && Number(i.qty) > 0)
    .map((i) => ({ product_id: i.product_id, qty: Number(i.qty) }));

  if (items.length === 0) {
    return { ok: false, error: 'Keranjang masih kosong.' };
  }

  const { data, error } = await supabase.rpc('create_order', {
    p_customer_name: payload.customerName || 'Guest',
    p_table_no: payload.tableNo || null,
    p_payment_method: payload.paymentMethod || 'cash',
    p_note: payload.note || null,
    p_items: items,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath('/menu');
  revalidatePath('/meja');
  revalidatePath('/admin');
  revalidatePath('/admin/transaksi');
  revalidatePath('/admin/produk');
  revalidatePath('/admin/meja');

  return { ok: true, transaction: data };
}
