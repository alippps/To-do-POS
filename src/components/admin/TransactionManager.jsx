'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import SearchInput from '@/components/ui/SearchInput';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import StatCard from './StatCard';
import ConfirmDialog from './ConfirmDialog';
import TransactionDetailModal from './TransactionDetailModal';
import LiveIndicator from './LiveIndicator';
import Toast from './Toast';
import { rupiah, formatDate } from '@/lib/format';
import {
  ORDER_ACTIVE_STATUSES,
  ORDER_STATUS,
  ORDER_STATUS_LIST,
  PAYMENT_LABEL_SHORT,
  nextOrderStatuses,
  orderStatus,
} from '@/lib/tables';
import { useLiveRefresh } from '@/lib/useLiveRefresh';
import { useTenant, useTenantHref } from '@/components/tenant/TenantProvider';
import { updateTransactionStatus, deleteTransaction } from '@/app/k/[slug]/admin/transaksi/actions';

const PER_PAGE = 10;

const PERIODS = [
  { value: 'all', label: 'Semua waktu' },
  { value: 'today', label: 'Hari ini' },
  { value: '7d', label: '7 hari terakhir' },
  { value: '30d', label: '30 hari terakhir' },
];

/**
 * Penyaring khusus "belum selesai" — bukan sekadar salah satu nilai status.
 *
 * Ini pertanyaan yang paling sering dipunyai kasir di jam sibuk, dan sebelum
 * ada tahap dapur ia tidak bisa ditanyakan sama sekali: "mana yang masih jadi
 * pekerjaan?" Menjawabnya lewat dropdown status berarti membukanya tiga kali —
 * Pending, lalu Diproses, lalu Siap — dan tetap tidak pernah melihat
 * ketiganya sekaligus.
 */
const FILTER_AKTIF = 'aktif';

/** Ajakan pada tombol transisi — kata kerja, bukan nama status. */
const AKSI_LABEL = {
  diproses: 'Mulai buat',
  siap: 'Tandai siap',
  paid: 'Tandai lunas',
  cancelled: 'Batalkan',
};

export default function TransactionManager({ transactions = [], canDelete = false }) {
  const router = useRouter();
  const tenant = useTenant();
  // Sengaja BUKAN `t`: daftar di bawah sudah memakai `t` sebagai satu baris
  // transaksi di dalam `.map()`, dan nama yang sama akan tertutup di sana.
  const hrefOutlet = useTenantHref();
  const [, startTransition] = useTransition();

  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('Semua');
  const [period, setPeriod] = useState('all');
  const [page, setPage] = useState(1);

  const [detail, setDetail] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  /*
    Daftar ini layar pantau, bukan laporan yang dibuka sekali lalu ditinggal:
    pesanan dari QR meja masuk tanpa ada yang menekan apa pun di sini.

    Ditahan selagi modal terbuka — menarik data baru saat kasir sedang membaca
    detail atau menimbang konfirmasi hapus berarti isi di depannya berganti
    tanpa diminta. Perubahan yang datang selama itu tidak hilang: hook-nya
    menyimpan permintaan tertahan dan menjalankannya begitu modal ditutup.
  */
  const langsung = useLiveRefresh({
    tenantId: tenant.id,
    tables: ['transactions'],
    paused: Boolean(detail || deleting),
  });

  /** SEARCH + FILTER */
  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    const now = Date.now();
    const range = { today: null, '7d': 7, '30d': 30 };

    return transactions.filter((t) => {
      const cocokKata =
        !q ||
        t.invoice_no.toLowerCase().includes(q) ||
        (t.customer_name || '').toLowerCase().includes(q) ||
        (t.table_no || '').toLowerCase().includes(q) ||
        (t.note || '').toLowerCase().includes(q);

      const cocokStatus =
        status === 'Semua' ||
        (status === FILTER_AKTIF
          ? ORDER_ACTIVE_STATUSES.includes(t.status)
          : t.status === status);

      let cocokPeriode = true;
      if (period === 'today') {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        cocokPeriode = new Date(t.created_at) >= start;
      } else if (range[period]) {
        cocokPeriode = now - new Date(t.created_at).getTime() <= range[period] * 86400000;
      }

      return cocokKata && cocokStatus && cocokPeriode;
    });
  }, [transactions, keyword, status, period]);

  const ringkasan = useMemo(() => {
    const lunas = filtered.filter((t) => t.status === 'paid');
    const omzet = lunas.reduce((a, t) => a + Number(t.total || 0), 0);

    /*
      Dihitung dari SELURUH transaksi, bukan dari `filtered`.

      Kartu ini dipakai untuk memutuskan apakah masih ada pekerjaan tersisa —
      dan jawabannya tidak boleh berubah hanya karena kasir sedang mencari
      sebuah invoice. Angka nol yang muncul akibat kata kunci pencarian adalah
      jawaban yang salah untuk pertanyaan "sudah beres semua?".
    */
    const dapur = transactions.filter((t) => ORDER_ACTIVE_STATUSES.includes(t.status));

    return {
      jumlah: filtered.length,
      omzet,
      rata: lunas.length ? omzet / lunas.length : 0,
      belumSelesai: dapur.length,
      siap: dapur.filter((t) => t.status === 'siap').length,
    };
  }, [filtered, transactions]);

  const totalPage = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPage);
  const paged = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  async function handleStatus(trx, nextStatus) {
    const res = await updateTransactionStatus(tenant.slug, trx.id, nextStatus);
    setToast({ ok: res.ok, message: res.message });
    if (res.ok) startTransition(() => router.refresh());
  }

  async function handleDelete() {
    if (!deleting) return;
    setLoading(true);
    const res = await deleteTransaction(tenant.slug, deleting.id);
    setLoading(false);
    setToast({ ok: res.ok, message: res.message });
    if (res.ok) {
      setDeleting(null);
      startTransition(() => router.refresh());
    }
  }

  return (
    <>
      <div className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Transaksi Tampil" value={ringkasan.jumlah} sub="sesuai filter aktif" icon="🧾" tone="slate" />
        <StatCard label="Omzet (Lunas)" value={rupiah(ringkasan.omzet)} sub="dari transaksi lunas" icon="💰" tone="green" />
        <StatCard label="Rata-rata / Transaksi" value={rupiah(ringkasan.rata)} icon="📊" tone="blue" />
        {/*
          Menggantikan "Menunggu Bayar", yang dulu menghitung `pending` saja.

          Begitu ada tahap dapur, angka itu justru MENGECIL tepat ketika
          kedainya makin sibuk: pesanan yang mulai dimasak keluar dari hitungan
          dan kartunya berbunyi menenangkan pada saat yang paling salah.
        */}
        <StatCard
          label="Belum Selesai"
          value={ringkasan.belumSelesai}
          sub={ringkasan.siap > 0 ? `${ringkasan.siap} siap diantar` : 'pending · diproses · siap'}
          icon="👨‍🍳"
          tone="amber"
        />
      </div>

      {/* Toolbar */}
      <div className="card mb-6 space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row">
          <SearchInput
            value={keyword}
            onChange={(v) => {
              setKeyword(v);
              setPage(1);
            }}
            placeholder="Cari invoice, nama pemesan, atau nomor meja..."
            className="flex-1"
          />
          <div className="grid grid-cols-2 gap-3 lg:flex lg:w-auto">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="input-base cursor-pointer lg:w-44"
            >
              <option value="Semua">Semua status</option>
              {/* Ditaruh paling atas setelah "Semua" — ini pilihan yang paling
                  sering dibutuhkan, bukan salah satu nilai status biasa. */}
              <option value={FILTER_AKTIF}>⏳ Belum selesai</option>
              {ORDER_STATUS_LIST.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.short}
                </option>
              ))}
            </select>
            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value);
                setPage(1);
              }}
              className="input-base cursor-pointer lg:w-48"
            >
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            Menampilkan <span className="font-semibold text-slate-800">{filtered.length}</span> dari{' '}
            {transactions.length} transaksi
            {keyword && (
              <>
                {' '}
                untuk “<span className="font-semibold text-slate-800">{keyword}</span>”
              </>
            )}
          </p>

          <LiveIndicator
            syncedAt={langsung.syncedAt}
            live={langsung.live}
            pending={langsung.pending}
            onRefresh={langsung.refresh}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Transaksi tidak ditemukan"
          description="Coba ubah kata kunci, status, atau rentang waktu pencarian."
        />
      ) : (
        <>
          {/* Tabel desktop */}
          <div className="card hidden overflow-hidden p-0 md:block">
            <div className="overflow-x-auto scroll-slim">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/70 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Invoice</th>
                    <th className="px-5 py-3.5 font-semibold">Pemesan</th>
                    <th className="px-5 py-3.5 font-semibold">Waktu</th>
                    <th className="px-5 py-3.5 font-semibold">Bayar</th>
                    <th className="px-5 py-3.5 font-semibold">Total</th>
                    <th className="px-5 py-3.5 font-semibold">Status</th>
                    <th className="px-5 py-3.5 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paged.map((t) => (
                    <tr key={t.id} className="transition hover:bg-slate-50/60">
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => setDetail(t)}
                          className="font-semibold text-brand-700 hover:underline"
                        >
                          {t.invoice_no}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">{t.customer_name}</p>
                        <p className="text-xs text-slate-400">{t.table_no ? `Meja ${t.table_no}` : 'Tanpa meja'}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-500">{formatDate(t.created_at)}</td>
                      <td className="px-5 py-4 text-slate-500">
                        {PAYMENT_LABEL_SHORT[t.payment_method] || t.payment_method}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900">{rupiah(t.total)}</td>
                      {/*
                        Dulu sebuah <select> berisi SELURUH status.

                        Itu bukan cuma longgar, tapi menyesatkan: ia menawarkan
                        lompatan yang tidak sah sebagai pilihan yang setara —
                        pending langsung ke Lunas, atau Lunas dikembalikan jadi
                        Pending — lalu ditolak server action setelah diklik.
                        Menu yang memuat pilihan yang pasti gagal adalah cara
                        paling halus untuk membuat orang tidak percaya lagi
                        pada layarnya.

                        Sekarang badge menyatakan KEADAAN, dan tombol di kolom
                        Aksi menyatakan LANGKAH BERIKUTNYA — hanya yang sah.
                      */}
                      <td className="px-5 py-4">
                        <Badge tone={orderStatus(t.status).tone}>{orderStatus(t.status).short}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap justify-end gap-2">
                          {nextOrderStatuses(t.status).map((next) => (
                            <StatusButton
                              key={next}
                              next={next}
                              onClick={() => handleStatus(t, next)}
                            />
                          ))}
                          <button
                            type="button"
                            onClick={() => setDetail(t)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                          >
                            Detail
                          </button>
                          {/* Membuka halaman struk khusus supaya hanya struknya yang tercetak */}
                          <a
                            href={hrefOutlet(`/struk/${encodeURIComponent(t.invoice_no)}?auto=1`)}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                          >
                            Cetak
                          </a>
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeleting(t)}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Kartu mobile */}
          <div className="space-y-4 md:hidden">
            {paged.map((t) => (
              <div key={t.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900">{t.invoice_no}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {t.customer_name}
                      {t.table_no ? ` · Meja ${t.table_no}` : ''}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">{formatDate(t.created_at)}</p>
                  </div>
                  <Badge tone={orderStatus(t.status).tone}>{orderStatus(t.status).short}</Badge>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-xs text-slate-400">
                    {PAYMENT_LABEL_SHORT[t.payment_method] || t.payment_method}
                  </span>
                  <span className="text-lg font-extrabold text-slate-900">{rupiah(t.total)}</span>
                </div>

                {/*
                  Langkah berikutnya dipisah ke barisnya sendiri, di ATAS
                  Detail/Cetak/Hapus.

                  Di layar HP inilah barista bekerja sambil berdiri, dan yang
                  ia cari cuma satu: tombol yang memajukan pesanan ini. Menaruh
                  "Mulai buat" berdampingan dengan "Hapus" berukuran sama
                  membuat keduanya harus dibaca dulu sebelum salah satunya
                  ditekan.
                */}
                {nextOrderStatuses(t.status).length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {nextOrderStatuses(t.status).map((next) => (
                      <StatusButton
                        key={next}
                        next={next}
                        besar
                        onClick={() => handleStatus(t, next)}
                      />
                    ))}
                  </div>
                )}

                {/*
                  Dua kolom, bukan satu baris berisi empat tombol.

                  Di lebar 360px, empat tombol `flex-1` menyisakan ~76px untuk
                  masing-masing — labelnya membungkus jadi dua baris dan tinggi
                  tombolnya jadi tidak rata. Grid membuat setiap tombol cukup
                  lebar untuk labelnya sendiri.
                */}
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDetail(t)}
                    className="rounded-lg bg-brand-600 py-2.5 text-xs font-semibold text-white"
                  >
                    Detail
                  </button>
                  {/* Lewat `hrefOutlet()`, sama seperti kembarannya di tabel
                      desktop. Ditulis mentah sebagai `/struk/…`, tautannya
                      kehilangan awalan `/k/<slug>` dan mendarat di 404 — dan
                      hanya di HP, jadi luput dari pengujian di layar lebar. */}
                  <a
                    href={hrefOutlet(`/struk/${encodeURIComponent(t.invoice_no)}?auto=1`)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-slate-200 py-2.5 text-center text-xs font-semibold text-slate-600"
                  >
                    Cetak
                  </a>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => setDeleting(t)}
                      className="col-span-2 rounded-lg border border-rose-200 bg-rose-50 py-2.5 text-xs font-semibold text-rose-600"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPage > 1 && (
            <div className="mt-6 flex items-center justify-between gap-4">
              <p className="text-sm text-slate-500">
                Halaman {currentPage} dari {totalPage}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  ← Sebelumnya
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPage, p + 1))}
                  disabled={currentPage === totalPage}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  Berikutnya →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <TransactionDetailModal open={Boolean(detail)} onClose={() => setDetail(null)} transaction={detail} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title={`Hapus ${deleting?.invoice_no}?`}
        description="Transaksi beserta seluruh itemnya akan dihapus permanen. Stok produk tidak dikembalikan otomatis."
        loading={loading}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}

/**
 * Tombol satu langkah maju — atau keluar lewat pembatalan.
 *
 * Warnanya mengikuti tone status TUJUAN, bukan status sekarang: yang sedang
 * dijanjikan tombol ini adalah keadaan sesudah ditekan. Pembatalan sengaja
 * tidak ikut menonjol — ia jalan keluar yang harus tersedia, bukan langkah
 * yang ditawarkan.
 */
function StatusButton({ next, onClick, besar = false }) {
  const status = ORDER_STATUS[next];
  const membatalkan = next === 'cancelled';

  const dasar = besar
    ? 'rounded-lg py-2.5 text-xs font-semibold'
    : 'rounded-lg px-3 py-1.5 text-xs font-semibold';

  const warna = membatalkan
    ? 'border border-slate-200 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600'
    : {
        diproses: 'border border-brand-200 bg-brand-50 text-brand-700 transition hover:bg-brand-100',
        siap: 'border border-violet-200 bg-violet-50 text-violet-700 transition hover:bg-violet-100',
        paid: 'border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100',
      }[next];

  return (
    <button
      type="button"
      onClick={onClick}
      // Label tombol menyebut aksinya; nama statusnya dititipkan ke `title`
      // supaya tetap bisa dicocokkan dengan badge di kolom sebelah.
      title={`Ubah status menjadi “${status.label}”`}
      className={`${dasar} ${warna}`}
    >
      {AKSI_LABEL[next] || status.short}
    </button>
  );
}
