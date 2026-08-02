'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import SearchInput from '@/components/ui/SearchInput';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import StatCard from './StatCard';
import ConfirmDialog from './ConfirmDialog';
import TransactionDetailModal from './TransactionDetailModal';
import Toast from './Toast';
import { rupiah, formatDate } from '@/lib/format';
import { updateTransactionStatus, deleteTransaction } from '@/app/admin/transaksi/actions';

const PER_PAGE = 10;

const STATUS_TONE = { paid: 'green', pending: 'amber', cancelled: 'rose' };
const STATUS_LABEL = { paid: 'Lunas', pending: 'Pending', cancelled: 'Batal' };
const PAYMENT_LABEL = { cash: 'Tunai', qris: 'QRIS', transfer: 'Transfer' };

const PERIODS = [
  { value: 'all', label: 'Semua waktu' },
  { value: 'today', label: 'Hari ini' },
  { value: '7d', label: '7 hari terakhir' },
  { value: '30d', label: '30 hari terakhir' },
];

export default function TransactionManager({ transactions = [] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('Semua');
  const [period, setPeriod] = useState('all');
  const [page, setPage] = useState(1);

  const [detail, setDetail] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

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

      const cocokStatus = status === 'Semua' || t.status === status;

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
    return {
      jumlah: filtered.length,
      omzet,
      rata: lunas.length ? omzet / lunas.length : 0,
      pending: filtered.filter((t) => t.status === 'pending').length,
    };
  }, [filtered]);

  const totalPage = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPage);
  const paged = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  async function handleStatus(trx, nextStatus) {
    const res = await updateTransactionStatus(trx.id, nextStatus);
    setToast({ ok: res.ok, message: res.message });
    if (res.ok) startTransition(() => router.refresh());
  }

  async function handleDelete() {
    if (!deleting) return;
    setLoading(true);
    const res = await deleteTransaction(deleting.id);
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
        <StatCard label="Menunggu Bayar" value={ringkasan.pending} sub="berstatus pending" icon="⏳" tone="amber" />
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
              className="input-base cursor-pointer lg:w-40"
            >
              <option value="Semua">Semua status</option>
              <option value="paid">Lunas</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Batal</option>
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
                        {PAYMENT_LABEL[t.payment_method] || t.payment_method}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900">{rupiah(t.total)}</td>
                      <td className="px-5 py-4">
                        <select
                          value={t.status}
                          onChange={(e) => handleStatus(t, e.target.value)}
                          className={`cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none ${
                            t.status === 'paid'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : t.status === 'pending'
                              ? 'border-amber-200 bg-amber-50 text-amber-700'
                              : 'border-rose-200 bg-rose-50 text-rose-700'
                          }`}
                        >
                          <option value="paid">Lunas</option>
                          <option value="pending">Pending</option>
                          <option value="cancelled">Batal</option>
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setDetail(t)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                          >
                            Detail
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleting(t)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                          >
                            Hapus
                          </button>
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
                  <Badge tone={STATUS_TONE[t.status]}>{STATUS_LABEL[t.status]}</Badge>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-xs text-slate-400">
                    {PAYMENT_LABEL[t.payment_method] || t.payment_method}
                  </span>
                  <span className="text-lg font-extrabold text-slate-900">{rupiah(t.total)}</span>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDetail(t)}
                    className="flex-1 rounded-lg bg-brand-600 py-2 text-xs font-semibold text-white"
                  >
                    Detail
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatus(t, t.status === 'paid' ? 'pending' : 'paid')}
                    className="flex-1 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600"
                  >
                    {t.status === 'paid' ? 'Set Pending' : 'Set Lunas'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(t)}
                    className="flex-1 rounded-lg border border-rose-200 bg-rose-50 py-2 text-xs font-semibold text-rose-600"
                  >
                    Hapus
                  </button>
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
