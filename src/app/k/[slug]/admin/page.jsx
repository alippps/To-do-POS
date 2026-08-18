import Link from 'next/link';
import PageHeader from '@/components/admin/PageHeader';
import StatCard from '@/components/admin/StatCard';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { createClient } from '@/lib/supabase/server';
import { rupiah, formatDate } from '@/lib/format';
import { ORDER_ACTIVE_STATUSES, orderStatus, tableStatus } from '@/lib/tables';
import { requirePageAccess } from '@/lib/adminGuard';
import { tenantPath } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Dashboard' };

/*
  Dashboard membaca transaksi terbaru saja, bukan seluruh riwayat.

  Angka ini dipakai untuk melihat keadaan hari ini — memuat seluruh riwayat
  outlet setiap kali halaman dibuka justru memperlambat layar yang paling
  sering dibuka saat jam sibuk. Konsekuensinya harus jujur di layar: apa pun
  yang dihitung dari daftar ini disebut "N transaksi terakhir", BUKAN
  "sepanjang waktu" — lihat catatan kaki di bawah halaman.
*/
const RIWAYAT_TERBACA = 200;

export default async function DashboardPage({ params }) {
  const { tenant } = await requirePageAccess(params.slug, '/admin');
  // Sengaja BUKAN `t`: daftar di bawah memakai `t` sebagai satu baris
  // transaksi di dalam `.map()`, dan nama yang sama akan tertutup di sana.
  const hrefOutlet = (path) => tenantPath(tenant.slug, path);
  const supabase = createClient();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [productsRes, trxRes, tablesRes] = await Promise.all([
    supabase.from('products').select('id, name, stock, is_active').eq('tenant_id', tenant.id),
    supabase
      .from('transactions')
      .select('id, invoice_no, customer_name, table_no, total, status, created_at')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false })
      .limit(RIWAYAT_TERBACA),
    supabase
      .from('cafe_tables')
      .select('id, table_no, label, status, is_active')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true),
  ]);

  const products = productsRes.data || [];
  const transactions = trxRes.data || [];
  const tables = tablesRes.data || [];

  /*
    Item diambil SETELAH transaksinya, diikat ke id yang sama.

    Dulu barisnya diminta tanpa penyaring apa pun (`select` seluruh tabel), dan
    Supabase diam-diam memotongnya di 1.000 baris — batas bawaan yang tidak
    muncul sebagai error di mana pun. Akibatnya "Produk Terlaris" berhenti
    mewakili apa pun begitu outlet melewati angka itu: yang terhitung adalah
    seribu baris pertama yang kebetulan dikembalikan, bukan penjualan terbaru.

    Sekarang cakupannya sama persis dengan sisa halaman ini — 200 transaksi
    terakhir — jadi angkanya bisa dijelaskan, dan jumlah barisnya (±3 item per
    transaksi) selalu jauh di bawah batas itu. Harganya satu putaran tambahan
    yang tidak bisa diparalelkan, karena id-nya baru diketahui sesudah query
    transaksi selesai.
  */
  const trxIds = transactions.map((t) => t.id);
  const itemsRes = trxIds.length
    ? await supabase
        .from('transaction_items')
        .select('product_name, qty, subtotal')
        .in('transaction_id', trxIds)
    : { data: [], error: null };

  const items = itemsRes.data || [];

  const paid = transactions.filter((t) => t.status === 'paid');
  /*
    "Perlu diproses" = seluruh tahap yang belum selesai, bukan `pending` saja.

    Menghitung `pending` sendirian membuat angka ini MENGECIL justru ketika
    dapur mulai bekerja — pesanan yang sedang dimasak keluar dari hitungan,
    dan dashboard terlihat lengang tepat di jam paling sibuk.
  */
  const pending = transactions.filter((t) => ORDER_ACTIVE_STATUSES.includes(t.status));
  const omzetTotal = paid.reduce((a, t) => a + Number(t.total || 0), 0);
  const trxHariIni = paid.filter((t) => new Date(t.created_at) >= startOfDay);
  const omzetHariIni = trxHariIni.reduce((a, t) => a + Number(t.total || 0), 0);
  /*
    Hanya produk yang benar-benar dijual. Produk yang sengaja dinonaktifkan
    tidak perlu direstok — memunculkannya di sini membuat daftar "Perlu Restok"
    berisi pekerjaan yang tidak ada.
  */
  const stokMenipis = products.filter((p) => p.is_active && p.stock <= 5);

  const mejaTerisi = tables.filter((t) => t.status !== 'available').length;
  const nilaiPending = pending.reduce((a, t) => a + Number(t.total || 0), 0);

  // Produk terlaris berdasarkan total qty terjual dalam rentang di atas.
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
            href={hrefOutlet('/admin/transaksi')}
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
                    href={hrefOutlet(`/struk/${encodeURIComponent(t.invoice_no)}?auto=1`)}
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
            <Link href={hrefOutlet('/admin/transaksi')} className="text-sm font-semibold text-brand-600 hover:text-brand-700">
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
                    <Badge tone={orderStatus(t.status).tone}>{orderStatus(t.status).short}</Badge>
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
              <Link href={hrefOutlet('/admin/meja')} className="text-sm font-semibold text-brand-600 hover:text-brand-700">
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
              <p className="text-xs text-slate-500">Dari {RIWAYAT_TERBACA} transaksi terakhir</p>
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
              <Link href={hrefOutlet('/admin/produk')} className="text-sm font-semibold text-brand-600 hover:text-brand-700">
                Kelola produk →
              </Link>
            </div>
          </section>
        </div>
      </div>

      {/*
        Batas bacaan disebutkan, bukan disembunyikan.

        Kalimat lama berbunyi "sepanjang waktu" padahal angkanya dihitung dari
        200 transaksi terakhir — begitu outlet melewati transaksi ke-201, angka
        itu diam-diam keliru dan tidak ada yang tahu. Menyebut batasnya membuat
        angka ini tetap bisa dipercaya apa adanya.
      */}
      <p className="mt-6 text-center text-sm text-slate-500">
        Omzet dari {RIWAYAT_TERBACA} transaksi terakhir:{' '}
        <span className="font-bold text-slate-900">{rupiah(omzetTotal)}</span> dari {paid.length}{' '}
        transaksi lunas. Rekap seluruh riwayat ada di{' '}
        <Link href={hrefOutlet('/admin/transaksi')} className="font-semibold text-brand-600 hover:text-brand-700">
          Daftar Transaksi
        </Link>
        .
      </p>
    </>
  );
}
