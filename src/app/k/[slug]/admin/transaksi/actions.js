'use server';

import { revalidatePath } from 'next/cache';
import { requireStaffAction } from '@/lib/adminGuard';
import { tenantPath } from '@/lib/tenant';
import { ORDER_STATUS, ORDER_STATUS_VALUES, canTransitionOrder } from '@/lib/tables';

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

/**
 * UPDATE status transaksi — pending → diproses → siap → paid,
 * dengan `cancelled` sebagai jalan keluar dari tahap mana pun sebelum lunas.
 *
 * Tombol di layar memang sudah hanya menampilkan tahap yang sah, tapi itu
 * bukan penjagaan: server action adalah endpoint HTTP yang bisa dipanggil
 * langsung dengan status apa pun. Tanpa pemeriksaan di sini, sebuah pesanan
 * bisa melompat dari `pending` langsung ke `paid` — melewati dapur, dan
 * membuat catatan tahapan yang baru saja ditambahkan tidak bisa dipercaya.
 */
export async function updateTransactionStatus(slug, id, status) {
  const { supabase, tenantId, error: authError } = await requireStaffAction(slug, {
    kasirBoleh: true,
  });
  if (authError) return { ok: false, message: authError };

  if (!ORDER_STATUS_VALUES.includes(status)) {
    return { ok: false, message: 'Status tidak valid.' };
  }

  /*
    Status sekarang dibaca dulu — transisi tidak bisa dinilai tanpa tahu
    berangkat dari mana. Sekalian jadi penyaring tenant: transaksi milik
    outlet lain tidak akan ketemu di sini.
  */
  const { data: trx, error: bacaError } = await supabase
    .from('transactions')
    .select('status')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (bacaError) return { ok: false, message: bacaError.message };
  if (!trx) return { ok: false, message: 'Transaksi tidak ditemukan di outlet ini.' };

  if (trx.status === status) {
    return { ok: true, message: `Status sudah ${ORDER_STATUS[status].short}.` };
  }

  if (!canTransitionOrder(trx.status, status)) {
    const dari = ORDER_STATUS[trx.status]?.short || trx.status;
    const ke = ORDER_STATUS[status]?.short || status;
    return { ok: false, message: `Pesanan ${dari} tidak bisa langsung jadi ${ke}.` };
  }

  /*
    `.eq('status', trx.status)` bukan pengulangan yang sia-sia.

    Sejak layar transaksi menyegarkan dirinya sendiri, dua kasir bisa menatap
    daftar yang sama dan menekan tombol pada pesanan yang sama dalam hitungan
    detik. Tanpa syarat ini, keduanya sama-sama berhasil dan yang terakhir
    menang — satu pesanan melompati tahap tanpa ada yang tahu. Dengan syarat
    ini, yang kalah cepat tidak mengubah apa pun dan diberi tahu.
  */
  const { data: diubah, error } = await supabase
    .from('transactions')
    .update({ status })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .eq('status', trx.status)
    .select('id');

  if (error) {
    /*
      Kegagalan yang paling mungkin terjadi sekali seumur pemasangan, dan
      pesan aslinya paling tidak menolong: kode ini sudah menawarkan tahap
      dapur sementara check constraint di database masih yang lama, jadi
      Postgres menolak dengan "violates check constraint
      transactions_status_check" — kalimat yang tidak memberi tahu siapa pun
      apa yang harus dikerjakan.
    */
    if (error.code === '23514' || /transactions_status_check/.test(error.message || '')) {
      return {
        ok: false,
        message:
          'Database belum mengenal tahap "diproses" dan "siap". Jalankan supabase/migration-status-fulfillment.sql di SQL Editor Supabase.',
      };
    }
    return { ok: false, message: error.message };
  }

  if (!diubah || diubah.length === 0) {
    return {
      ok: false,
      message: 'Status pesanan ini baru saja diubah orang lain. Layar akan disegarkan.',
    };
  }

  revalidateAll(slug);
  return { ok: true, message: `Pesanan ditandai ${ORDER_STATUS[status].short}.` };
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
