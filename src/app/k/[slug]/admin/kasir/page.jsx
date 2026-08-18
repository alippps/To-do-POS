import PageHeader from '@/components/admin/PageHeader';
import CashierClient from '@/components/admin/CashierClient';
import { createClient } from '@/lib/supabase/server';
import { requirePageAccess } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Kasir' };

/**
 * Layar kasir — untuk pelanggan yang datang langsung dan memesan di konter.
 *
 * Melengkapi (bukan menggantikan) pemesanan mandiri lewat QR meja: setelah
 * kasir membuat pesanan dan pelanggan duduk, QR di mejanya tetap berfungsi
 * untuk menambah pesanan tanpa perlu antre lagi.
 */
export default async function AdminKasirPage({ params }) {
  const { tenant } = await requirePageAccess(params.slug, '/admin/kasir');
  const supabase = createClient();

  const [productsRes, tablesRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, category, price, promo_price, stock')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .order('name', { ascending: true }),
    supabase
      .from('cafe_tables')
      .select('id, table_no, label, area, capacity, status')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .order('table_no', { ascending: true }),
  ]);

  const products = productsRes.data || [];
  const categories = [...new Set(products.map((p) => p.category))].sort();

  return (
    <>
      <PageHeader
      title="Pesan Di Kasir"
      description="Jalur cadangan untuk pelanggan yang memesan langsung ke kasir — takeaway, atau yang tidak memindai QR. Pesanan lewat QR sudah membawa nomor mejanya sendiri dan tidak perlu diinput di sini."
      />

      {(productsRes.error || tablesRes.error) && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          Gagal memuat data: {(productsRes.error || tablesRes.error).message}. Pastikan{' '}
          <code className="font-semibold">supabase/schema.sql</code> versi terbaru sudah dijalankan.
        </div>
      )}

      <CashierClient
        products={products}
        tables={tablesRes.data || []}
        categories={categories}
      />
    </>
  );
}
