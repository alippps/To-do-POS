import PageHeader from '@/components/admin/PageHeader';
import ProductManager from '@/components/admin/ProductManager';
import { createClient } from '@/lib/supabase/server';
import { requirePageAccess } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Daftar Produk' };

export default async function AdminProdukPage() {
  await requirePageAccess('/admin/produk'); // kasir tidak boleh mengubah harga
  const supabase = createClient();

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, category, price, promo_price, stock, description, image_url, is_active, created_at')
    .order('created_at', { ascending: false });

  return (
    <>
      <PageHeader
        title="Daftar Produk"
        description="Kelola menu outlet Anda: tambah, ubah, hapus, dan cari produk. Perubahan langsung tampil di halaman pelanggan."
      />

      {error && (
        <div className="mb-6 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          Gagal memuat produk: {error.message}
        </div>
      )}

      <ProductManager products={products || []} />
    </>
  );
}
