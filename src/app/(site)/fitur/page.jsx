import Container from '@/components/ui/Container';
import PosClient from '@/components/pos/PosClient';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Fitur Utama — Pesan & Beli',
  description: 'Pilih menu favorit Anda, masukkan keranjang, dan pesan langsung dari meja.',
};

export default async function FiturPage({ searchParams }) {
  const supabase = createClient();

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, category, price, stock, description, image_url')
    .eq('is_active', true)
    .order('name', { ascending: true });

  const list = products || [];
  const categories = [...new Set(list.map((p) => p.category))].sort();
  const defaultTable = typeof searchParams?.meja === 'string' ? searchParams.meja : '';

  return (
    <div className="bg-slate-50/50 py-10 sm:py-14">
      <Container>
        <header className="mb-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700">
            Fitur Utama
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Jual Beli · Pesan Menu Anda
          </h1>
          <p className="mt-3 max-w-2xl text-base text-slate-500">
            Cari menu, tambahkan ke keranjang, lalu pesan. Stok terpotong otomatis dan transaksi langsung
            masuk ke dashboard admin.
            {defaultTable && (
              <>
                {' '}
                Anda memesan dari{' '}
                <span className="font-semibold text-brand-700">Meja {defaultTable}</span>.
              </>
            )}
          </p>
        </header>

        {error && (
          <div className="mb-6 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            Gagal memuat produk: {error.message}. Pastikan variabel Supabase di{' '}
            <code className="font-semibold">.env.local</code> sudah benar dan{' '}
            <code className="font-semibold">supabase/schema.sql</code> sudah dijalankan.
          </div>
        )}

        <PosClient products={list} categories={categories} defaultTable={defaultTable} />
      </Container>
    </div>
  );
}
