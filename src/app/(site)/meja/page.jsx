import Container from '@/components/ui/Container';
import TableAvailability from '@/components/tables/TableAvailability';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Ketersediaan Meja',
  description: 'Lihat meja mana yang masih kosong sebelum memesan. Tanpa perlu login.',
};

/**
 * Halaman tujuan QR meja. Pelanggan yang men-scan QR langsung melihat
 * denah meja beserta status ketersediaannya — tanpa login, tanpa install apa pun.
 */
export default async function MejaPage({ searchParams }) {
  const supabase = createClient();

  const { data: tables, error } = await supabase
    .from('cafe_tables')
    .select('id, table_no, label, area, capacity, status')
    .eq('is_active', true)
    .order('table_no', { ascending: true });

  const scannedTable = typeof searchParams?.meja === 'string' ? searchParams.meja : '';

  return (
    <div className="surface-warm py-10 sm:py-14">
      <Container>
        <header className="mb-8 max-w-2xl">
          <span className="eyebrow">Tanpa login</span>
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
