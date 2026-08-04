import Link from 'next/link';
import Container from '@/components/ui/Container';
import FlowSteps from '@/components/pos/FlowSteps';
import PosClient from '@/components/pos/PosClient';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Menu & Pesan',
  description: 'Pilih menu favorit Anda dan pesan langsung dari meja — tanpa perlu membuat akun.',
};

/**
 * Halaman menu untuk PELANGGAN. Sepenuhnya bisa diakses tanpa login:
 * lihat menu → masukkan keranjang → pesan → struk keluar.
 */
export default async function MenuPage({ searchParams }) {
  const supabase = createClient();

  const [productsRes, tablesRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, category, price, promo_price, stock, description, image_url')
      .eq('is_active', true)
      .order('name', { ascending: true }),
    supabase
      .from('cafe_tables')
      .select('id, table_no, label, area, capacity, status')
      .eq('is_active', true)
      .order('table_no', { ascending: true }),
  ]);

  const list = productsRes.data || [];
  const tables = tablesRes.data || [];
  const categories = [...new Set(list.map((p) => p.category))].sort();
  const defaultTable = typeof searchParams?.meja === 'string' ? searchParams.meja : '';

  const activeTable = tables.find((t) => t.table_no === defaultTable);

  return (
    <div className="bg-slate-50 pb-28 pt-8 sm:pt-12 lg:pb-14">
      <Container>
        <FlowSteps current="menu" tableNo={defaultTable} className="mb-8" />

        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="eyebrow">Langkah 2 dari 3 · Fitur Utama</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Tanpa login
            </span>
          </div>

          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Mau ngopi apa hari ini?
          </h1>

          <p className="mt-3 max-w-2xl text-base text-slate-500">
            Pilih menu, masukkan ke keranjang, lalu pesan. Kamu tidak perlu membuat akun — cukup isi
            nama dan nomor meja, struk langsung terbit.
          </p>

          {/* Konteks meja hasil scan QR */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {defaultTable ? (
              <span className="inline-flex items-center gap-2.5 rounded-2xl border border-brand-200 bg-white px-4 py-2.5 text-sm shadow-card">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
                  {defaultTable}
                </span>
                <span className="text-slate-600">
                  Memesan dari <span className="font-bold text-slate-900">Meja {defaultTable}</span>
                  {activeTable?.label ? ` · ${activeTable.label}` : ''}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 shadow-card">
                <span aria-hidden="true" className="text-base leading-none">📍</span>
                <span>
                  <span className="font-bold">Kamu belum memilih meja.</span> Bisa dipilih nanti di
                  keranjang, atau lihat dulu meja yang kosong di sebelah.
                </span>
              </span>
            )}

            <Link
              href="/meja"
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 shadow-card transition hover:border-brand-200 hover:bg-brand-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
              {defaultTable ? 'Ganti meja' : 'Lihat meja tersedia'}
            </Link>
          </div>
        </header>

        {productsRes.error && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            Gagal memuat produk: {productsRes.error.message}. Pastikan variabel Supabase di{' '}
            <code className="font-semibold">.env.local</code> sudah benar dan{' '}
            <code className="font-semibold">supabase/schema.sql</code> sudah dijalankan.
          </div>
        )}

        <PosClient
          products={list}
          categories={categories}
          tables={tables}
          defaultTable={defaultTable}
        />
      </Container>
    </div>
  );
}
