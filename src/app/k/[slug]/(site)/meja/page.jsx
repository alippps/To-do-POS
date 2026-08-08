import Container from '@/components/ui/Container';
import FlowSteps from '@/components/pos/FlowSteps';
import ScanHub from '@/components/pos/ScanHub';
import TableAvailability from '@/components/tables/TableAvailability';
import { createClient } from '@/lib/supabase/server';
import { requireTenant } from '@/lib/tenant.server';

export const dynamic = 'force-dynamic';

export function generateMetadata({ searchParams }) {
  const meja = typeof searchParams?.meja === 'string' ? searchParams.meja : '';

  return meja
    ? { title: `Meja ${meja}`, description: 'Menu, order, bayar, dan promo untuk meja ini.' }
    : {
        title: 'Ketersediaan Meja',
        description: 'Lihat meja mana yang masih kosong sebelum memesan. Tanpa perlu login.',
      };
}

/**
 * Halaman tujuan QR meja — punya DUA wajah:
 *
 * 1. `?meja=07` cocok dengan meja terdaftar → layar hub (Menu / Order / Bayar /
 *    Promo). Ini yang dilihat pelanggan sehabis scan QR; ia sudah duduk di meja
 *    itu, jadi tidak perlu disuruh memilih meja lagi.
 * 2. Tanpa parameter (atau nomornya tidak terdaftar) → grid ketersediaan meja
 *    seperti sebelumnya, untuk yang datang dari navbar atau mau pindah meja.
 */
export default async function MejaPage({ params, searchParams }) {
  const tenant = await requireTenant(params.slug);
  const supabase = createClient();
  const scannedTable = typeof searchParams?.meja === 'string' ? searchParams.meja : '';

  const { data: tables, error } = await supabase
    .from('cafe_tables')
    .select('id, table_no, label, area, capacity, status')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('table_no', { ascending: true });

  const scanned = (tables || []).find((t) => t.table_no === scannedTable);

  /* ---------------- Hasil scan QR: layar hub ---------------- */
  if (scanned) {
    // Angka pada kartu Bayar & Promo diambil sekalian, supaya pelanggan tahu
    // ada tagihan/promo tanpa harus membuka halamannya satu per satu.
    const [billRes, promoRes] = await Promise.all([
      supabase.rpc('get_table_bill', {
        p_tenant_slug: tenant.slug,
        p_table_no: scanned.table_no,
      }),
      supabase
        .from('products')
        .select('id, price, promo_price')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .not('promo_price', 'is', null),
    ]);

    const orders = billRes.data?.orders || [];
    const promoCount = (promoRes.data || []).filter(
      (p) => Number(p.promo_price) < Number(p.price)
    ).length;

    return (
      <div className="surface-warm py-10 sm:py-14">
        <Container>
          <ScanHub
            table={scanned}
            billTotal={Number(billRes.data?.total || 0)}
            billCount={orders.length}
            promoCount={promoCount}
          />
        </Container>
      </div>
    );
  }

  /* ------------- Tanpa nomor meja: denah ketersediaan ------------- */
  return (
    <div className="surface-warm py-10 sm:py-14">
      <Container>
        <FlowSteps current="meja" tableNo={scannedTable} className="mb-8" />

        <header className="mb-8 max-w-2xl">
          <span className="eyebrow">Langkah 1 dari 3 · Tanpa login</span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Pilih meja yang masih kosong
          </h1>
          <p className="mt-3 text-base text-slate-500">
            Status di bawah diambil langsung dari sistem kasir dan diperbarui otomatis. Pilih satu
            meja, lalu lanjut memesan menu — tidak perlu membuat akun.
          </p>
        </header>

        {error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            Gagal memuat denah meja: {error.message}. Pastikan{' '}
            <code className="font-semibold">supabase/schema.sql</code> versi terbaru sudah dijalankan
            di SQL Editor Supabase.
          </div>
        ) : (
          <TableAvailability tables={tables || []} scannedTable={scannedTable} />
        )}
      </Container>
    </div>
  );
}
