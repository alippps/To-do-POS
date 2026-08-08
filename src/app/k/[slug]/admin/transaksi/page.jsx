import PageHeader from '@/components/admin/PageHeader';
import TransactionManager from '@/components/admin/TransactionManager';
import { createClient } from '@/lib/supabase/server';
import { requirePageAccess } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Daftar Transaksi' };

export default async function AdminTransaksiPage({ params }) {
  const { profile, tenant } = await requirePageAccess(params.slug, '/admin/transaksi');
  const supabase = createClient();

  // Kasir boleh mengubah status, tapi tidak menghapus riwayat penjualan.
  const bolehHapus = profile?.role === 'admin';

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('id, invoice_no, customer_name, table_no, payment_method, status, note, total, created_at')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })
    .limit(500);

  return (
    <>
      <PageHeader
        title="Daftar Transaksi"
        description="Riwayat seluruh pesanan yang masuk. Cari berdasarkan invoice atau nama pemesan, ubah status pembayaran, dan lihat detail itemnya."
      />

      {error && (
        <div className="mb-6 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          Gagal memuat transaksi: {error.message}
        </div>
      )}

      <TransactionManager transactions={transactions || []} canDelete={bolehHapus} />
    </>
  );
}
