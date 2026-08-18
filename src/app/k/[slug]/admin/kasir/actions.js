'use server';

import { revalidatePath } from 'next/cache';
import { requireStaffAction } from '@/lib/adminGuard';
import { BATAS } from '@/lib/limits';
import { PAYMENT_METHOD_VALUES } from '@/lib/tables';
import { tenantPath } from '@/lib/tenant';

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
export async function createCashierOrder(slug, payload) {
  const { supabase, error: authError } = await requireStaffAction(slug, { kasirBoleh: true });
  if (authError) return { ok: false, error: authError };

  const items = (payload?.items || [])
    .filter((i) => i?.product_id && Number(i.qty) > 0)
    .map((i) => ({ product_id: i.product_id, qty: Number(i.qty) }));

  if (items.length === 0) return { ok: false, error: 'Keranjang masih kosong.' };

  const tableNo = String(payload?.tableNo || '').trim();
  if (!tableNo) return { ok: false, error: 'Pilih meja untuk pelanggan ini dulu.' };

  /*
    Nama boleh kosong DI SINI saja — kasir berdiri di depan pelanggannya, jadi
    "Guest" masih bisa dipanggil. Pemesanan lewat QR tidak punya kemewahan itu
    dan mewajibkan namanya (lihat (site)/menu/actions.js).
  */
  const customerName = String(payload?.customerName || '').trim();
  const note = String(payload?.note || '').trim();

  const paymentMethod = String(payload?.paymentMethod || 'cash').trim();
  if (!PAYMENT_METHOD_VALUES.includes(paymentMethod)) {
    return { ok: false, error: 'Metode pembayaran tidak dikenali.' };
  }

  /*
    Batas ATAS ketiga teksnya — sama persis dengan jalur pelanggan.

    Sampai sekarang aksi ini tidak memeriksa panjang sama sekali, jadi seluruh
    penjagaan `BATAS` bisa dilewati hanya dengan memesan dari layar kasir alih-
    alih dari QR meja. Kolomnya sama, struk thermalnya sama, dan layar transaksi
    yang terdorong keluar layar oleh catatan sepuluh ribu karakter juga sama —
    jadi batasnya tidak boleh berbeda hanya karena pintu masuknya berbeda.
  */
  if (customerName.length > BATAS.namaPemesan) {
    return { ok: false, error: `Nama pelanggan maksimal ${BATAS.namaPemesan} karakter.` };
  }

  if (tableNo.length > BATAS.nomorMeja) {
    return { ok: false, error: 'Nomor meja tidak dikenali. Pilih ulang dari denah di atas.' };
  }

  if (note.length > BATAS.catatan) {
    return { ok: false, error: `Catatan maksimal ${BATAS.catatan} karakter.` };
  }

  const { data, error } = await supabase.rpc('create_order', {
    p_tenant_slug: slug,
    p_customer_name: customerName || 'Guest',
    p_table_no: tableNo,
    p_payment_method: paymentMethod,
    p_note: note || null,
    p_items: items,
  });

  if (error) return { ok: false, error: error.message };

  for (const p of [
    '/admin/kasir',
    '/admin/transaksi',
    '/admin/meja',
    '/admin/produk',
    '/admin',
    '/menu',
    '/meja',
  ]) {
    revalidatePath(tenantPath(slug, p));
  }

  return { ok: true, transaction: data };
}
