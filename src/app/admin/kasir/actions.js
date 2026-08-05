'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/** Layar kasir dipakai admin DAN kasir — keduanya boleh membuat pesanan. */
async function requireStaff() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, error: 'Anda harus login terlebih dahulu.' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!['admin', 'kasir'].includes(profile?.role)) {
    return { supabase, error: 'Akses ditolak: khusus admin & kasir.' };
  }

  return { supabase, error: null };
}

/**
 * Kasir membuat pesanan untuk pelanggan yang datang langsung (walk-in).
 *
 * Memakai RPC `create_order` yang sama persis dengan pemesanan lewat QR — jadi
 * harga (termasuk harga promo), pemotongan stok, dan penomoran invoice tunduk
 * pada satu aturan saja. Bedanya cuma `auth.uid()` terisi, sehingga kolom
 * `channel` tercatat 'app' (kasir) alih-alih 'qr' (pelanggan sendiri).
 *
 * Status pesanan tetap `pending`, tidak langsung lunas. Itu keputusan sadar:
 * status meja diturunkan dari ada-tidaknya pesanan pending, jadi pesanan yang
 * langsung dilunasi akan membuat mejanya kembali "Tersedia" padahal pelanggan
 * baru saja duduk di situ. Kasir menandai lunas sekali di akhir, setelah semua
 * tambahan lewat QR meja ikut masuk.
 */
export async function createCashierOrder(payload) {
  const { supabase, error: authError } = await requireStaff();
  if (authError) return { ok: false, error: authError };

  const items = (payload?.items || [])
    .filter((i) => i?.product_id && Number(i.qty) > 0)
    .map((i) => ({ product_id: i.product_id, qty: Number(i.qty) }));

  if (items.length === 0) return { ok: false, error: 'Keranjang masih kosong.' };

  const tableNo = String(payload?.tableNo || '').trim();
  if (!tableNo) return { ok: false, error: 'Pilih meja untuk pelanggan ini dulu.' };

  const { data, error } = await supabase.rpc('create_order', {
    p_customer_name: String(payload?.customerName || '').trim() || 'Guest',
    p_table_no: tableNo,
    p_payment_method: payload?.paymentMethod || 'cash',
    p_note: String(payload?.note || '').trim() || null,
    p_items: items,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/kasir');
  revalidatePath('/admin/transaksi');
  revalidatePath('/admin/meja');
  revalidatePath('/admin/produk');
  revalidatePath('/admin');
  revalidatePath('/menu');
  revalidatePath('/meja');

  return { ok: true, transaction: data };
}
