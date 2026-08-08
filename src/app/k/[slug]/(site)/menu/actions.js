'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { PAYMENT_METHOD_VALUES } from '@/lib/tables';
import { slugValid, tenantPath } from '@/lib/tenant';

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

  /*
    Nama pemesan & nomor meja divalidasi DI SINI, bukan cuma di keranjang.

    Penjaga di PosClient hanya menahan tombolnya; server action bisa dipanggil
    langsung tanpa melewati layar itu sama sekali. Dulu keduanya punya nilai
    cadangan diam-diam (`|| 'Guest'`, `|| null`), jadi pesanan tanpa identitas
    tetap masuk ke antrean — dan kasir yang menanggungnya: ada minuman jadi,
    tidak ada nama untuk dipanggil dan tidak ada meja untuk diantar.
  */
  const tenantSlug = String(payload?.tenantSlug || '').trim();
  const customerName = String(payload?.customerName || '').trim();
  const tableNo = String(payload?.tableNo || '').trim();
  const paymentMethod = String(payload?.paymentMethod || 'qris').trim();

  /*
    Outlet ikut divalidasi di sini. Server action adalah endpoint HTTP biasa:
    ia bisa dipanggil dengan slug apa pun, termasuk yang tidak berbentuk slug
    sama sekali. `create_order` di database sudah menolak outlet tak dikenal,
    tapi menyaringnya lebih dulu di sini membuat pesan galatnya bisa dibaca
    manusia alih-alih pesan exception PostgreSQL.
  */
  if (!slugValid(tenantSlug)) {
    return { ok: false, error: 'Outlet tidak dikenali. Muat ulang halaman lalu coba lagi.' };
  }

  if (customerName.length < 2) {
    return { ok: false, error: 'Nama pemesan wajib diisi, minimal 2 karakter.' };
  }

  if (!tableNo) {
    return { ok: false, error: 'Nomor meja belum terbaca. Pindai ulang QR di mejamu.' };
  }

  if (!PAYMENT_METHOD_VALUES.includes(paymentMethod)) {
    return { ok: false, error: 'Metode pembayaran tidak dikenali.' };
  }

  const { data, error } = await supabase.rpc('create_order', {
    p_tenant_slug: tenantSlug,
    p_customer_name: customerName,
    p_table_no: tableNo,
    p_payment_method: paymentMethod,
    p_note: payload?.note ? String(payload.note).trim() || null : null,
    p_items: items,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  // Yang disegarkan cuma halaman OUTLET INI — pesanan di Kopi Pagi tidak ada
  // urusannya dengan cache halaman Roti Bakar 88.
  for (const p of ['/menu', '/meja', '/admin', '/admin/transaksi', '/admin/produk', '/admin/meja']) {
    revalidatePath(tenantPath(tenantSlug, p));
  }

  return { ok: true, transaction: data };
}
