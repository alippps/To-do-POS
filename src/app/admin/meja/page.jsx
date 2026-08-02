import PageHeader from '@/components/admin/PageHeader';
import TableManager from '@/components/admin/TableManager';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Denah Meja' };

export default async function AdminMejaPage() {
  const supabase = createClient();

  const { data: tables, error } = await supabase
    .from('cafe_tables')
    .select('id, table_no, label, area, capacity, status, is_active, created_at')
    .order('table_no', { ascending: true });

  return (
    <>
      <PageHeader
        title="Denah Meja"
        description="Kelola daftar meja beserta status ketersediaannya. Status otomatis berubah jadi “Terisi” saat ada pesanan pending, dan kembali “Tersedia” begitu pesanannya dilunasi."
      />

      {error && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          Gagal memuat denah meja: {error.message}. Pastikan{' '}
          <code className="font-semibold">supabase/schema.sql</code> versi terbaru sudah dijalankan.
        </div>
      )}

      <TableManager tables={tables || []} />
    </>
  );
}
