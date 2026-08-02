import Link from 'next/link';
import PageHeader from '@/components/admin/PageHeader';
import StatCard from '@/components/admin/StatCard';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { createClient } from '@/lib/supabase/server';
import { rupiah, formatDate } from '@/lib/format';
import { tableStatus } from '@/lib/tables';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Dashboard' };

const STATUS_TONE = { paid: 'green', pending: 'amber', cancelled: 'rose' };
const STATUS_LABEL = { paid: 'Lunas', pending: 'Pending', cancelled: 'Batal' };

export default async function DashboardPage() {
  const supabase = createClient();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [productsRes, trxRes, itemsRes, tablesRes] = await Promise.all([
    supabase.from('products').select('id, name, stock, is_active'),
    supabase
      .from('transactions')
      .select('id, invoice_no, customer_name, table_no, total, status, created_at')
      .order('created_at', { ascending: false })
      .limit(200),
    supabase.from('transaction_items').select('product_name, qty, subtotal'),
    supabase.from('cafe_tables').select('id, table_no, label, status, is_active').eq('is_active', true),
  ]);

  const products = productsRes.data || [];
  const transactions = trxRes.data || [];
  const items = itemsRes.data || [];
  const tables = tablesRes.data || [];

  const paid = transactions.filter((t) => t.status === 'paid');
  const pending = transactions.filter((t) => t.status === 'pending');
  const omzetTotal = paid.reduce((a, t) => a + Number(t.total || 0), 0);
  const trxHariIni = paid.filter((t) => new Date(t.created_at) >= startOfDay);
  const omzetHariIni = trxHariIni.reduce((a, t) => a + Number(t.total || 0), 0);
  const stokMenipis = products.filter((p) => p.stock <= 5);

  const mejaTerisi = tables.filter((t) => t.status !== 'available').length;
  const nilaiPending = pending.reduce((a, t) => a + Number(t.total || 0), 0);

  // Produk terlaris berdasarkan total qty terjual
  const terlaris = Object.values(
    items.reduce((acc, i) => {
      const key = i.product_name;
      acc[key] = acc[key] || { name: key, qty: 0, omzet: 0 };
      acc[key].qty += i.qty || 0;
      acc[key].omzet += Number(i.subtotal || 0);
      return acc;
    }, {})
  )
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const maxQty = terlaris[0]?.qty || 1;
  const error = productsRes.error || trxRes.error || itemsRes.error;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Ringkasan performa outlet Anda hari ini. Pesanan dari QR masuk sebagai “Pending” dan menunggu dikonfirmasi kasir."
      />

      {error && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          Gagal memuat sebagian data: {error.message}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Omzet Hari Ini"
          value={rupiah(omzetHariIni)}
          sub={`${trxHariIni.length} transaksi lunas`}
          icon="💰"
          tone="green"
        />
        <StatCard
          label="Perlu Diproses"
          value={pending.length}
          sub={`Senilai ${rupiah(nilaiPending)}`}
          icon="🔔"
          tone="amber"
        />
        <StatCard
          label="Meja Terisi"
          value={`${mejaTerisi}/${tables.length}`}
          sub={`${tables.length - mejaTerisi} meja masih kosong`}
          icon="🪑"
          tone="blue"
        />
        <StatCard
          label="Stok Menipis"
          value={stokMenipis.length}
          sub="Produk dengan stok ≤ 5"
          icon="⚠️"
          tone="slate"
        />
      </div>

      {/* Antrean pesanan yang menunggu konfirmasi kasir */}
      <section className="card-accent mt-6 p-0">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-bold text-slate-900">Pesanan Masuk</h2>
            <p className="text-xs text-slate-500">
              Tandai lunas di Daftar Transaksi — mejanya otomatis kembali tersedia.
            </p>
          </div>
          <Link
            href="/admin/transaksi"
            className="shrink-0 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            Kelola →
          </Link>
        </div>

        {pending.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">
            Tidak ada pesanan yang menunggu. Semua sudah diproses 👍
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {pending.slice(0, 5).map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-sm font-bold text-amber-700">
                    {t.table_no || '—'}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{t.customer_name}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {t.invoice_no} · {formatDate(t.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm font-bold text-slate-900">{rupiah(t.total)}</span>
                  <Link
                    href={`/struk/${encodeURIComponent(t.invoice_no)}?auto=1`}
                    target="_blank"
                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-50"
                  >
                    Cetak
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Transaksi terbaru */}
        <section className="card p-0">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-900">Transaksi Terbaru</h2>
            <Link href="/admin/transaksi" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
              Lihat semua →
            </Link>
          </div>

          {transactions.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="Belum ada transaksi"
                description="Transaksi akan muncul di sini setelah ada pesanan masuk dari halaman Menu pelanggan."
              />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {transactions.slice(0, 6).map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{t.invoice_no}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {t.customer_name}
                      {t.table_no ? ` · Meja ${t.table_no}` : ''} · {formatDate(t.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge tone={STATUS_TONE[t.status]}>{STATUS_LABEL[t.status]}</Badge>
                    <span className="text-sm font-bold text-slate-900">{rupiah(t.total)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          {/* Status meja */}
          <section className="card p-0">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="font-bold text-slate-900">Status Meja</h2>
              <Link href="/admin/meja" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
                Atur →
              </Link>
            </div>
            {tables.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">Belum ada meja terdaftar.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2 p-5 sm:grid-cols-6 lg:grid-cols-4">
                {tables.map((t) => {
                  const s = tableStatus(t.status);
                  return (
                    <span
                      key={t.id}
                      title={`Meja ${t.table_no} — ${s.label}`}
                      className={`flex aspect-square flex-col items-center justify-center rounded-xl border text-xs font-bold ${s.ring} ${s.text}`}
                    >
                      {t.table_no}
                      <span className={`mt-1 h-1.5 w-1.5 rounded-full ${s.dot}`} />
                    </span>
                  );
                })}
              </div>
            )}
          </section>

          {/* Produk terlaris */}
          <section className="card p-0">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-bold text-slate-900">Produk Terlaris</h2>
            </div>
            {terlaris.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">Belum ada data penjualan.</p>
            ) : (
              <ul className="space-y-4 p-5">
                {terlaris.map((p) => (
                  <li key={p.name}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate font-medium text-slate-700">{p.name}</span>
                      <span className="shrink-0 pl-3 text-xs font-semibold text-slate-500">
                        {p.qty} terjual
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-brand-600"
                        style={{ width: `${Math.max(8, (p.qty / maxQty) * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Peringatan stok */}
          <section className="card p-0">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-bold text-slate-900">Perlu Restok</h2>
            </div>
            {stokMenipis.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">Semua stok aman 👍</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {stokMenipis.slice(0, 5).map((p) => (
                  <li key={p.id} className="flex items-center justify-between px-5 py-3.5">
                    <span className="truncate text-sm font-medium text-slate-700">{p.name}</span>
                    <Badge tone={p.stock === 0 ? 'rose' : 'amber'}>Sisa {p.stock}</Badge>
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t border-slate-100 px-5 py-3.5">
              <Link href="/admin/produk" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
                Kelola produk →
              </Link>
            </div>
          </section>
        </div>
      </div>

      {/* Total omzet sepanjang waktu */}
      <p className="mt-6 text-center text-sm text-slate-500">
        Total omzet tercatat sepanjang waktu:{' '}
        <span className="font-bold text-slate-900">{rupiah(omzetTotal)}</span> dari {paid.length}{' '}
        transaksi lunas.
      </p>
    </>
  );
}
