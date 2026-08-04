'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import SearchInput from '@/components/ui/SearchInput';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import ProductFormModal from './ProductFormModal';
import ConfirmDialog from './ConfirmDialog';
import Toast from './Toast';
import { rupiah, formatDateShort } from '@/lib/format';
import { promoInfo } from '@/lib/promo';
import { CATEGORIES } from '@/lib/site';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductActive,
} from '@/app/admin/produk/actions';

const PER_PAGE = 8;

const SORTS = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'name-asc', label: 'Nama A–Z' },
  { value: 'price-desc', label: 'Harga tertinggi' },
  { value: 'price-asc', label: 'Harga terendah' },
  { value: 'stock-asc', label: 'Stok paling sedikit' },
];

export default function ProductManager({ products = [] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('Semua');
  const [status, setStatus] = useState('Semua');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  /** SEARCH + FILTER + SORT */
  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    let list = products.filter((p) => {
      const cocokKata =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q);
      const cocokKategori = category === 'Semua' || p.category === category;
      const cocokStatus =
        status === 'Semua' ||
        (status === 'Aktif' && p.is_active) ||
        (status === 'Nonaktif' && !p.is_active) ||
        (status === 'Stok Menipis' && p.stock <= 5);
      return cocokKata && cocokKategori && cocokStatus;
    });

    list = [...list].sort((a, b) => {
      if (sort === 'name-asc') return a.name.localeCompare(b.name);
      if (sort === 'price-desc') return b.price - a.price;
      if (sort === 'price-asc') return a.price - b.price;
      if (sort === 'stock-asc') return a.stock - b.stock;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    return list;
  }, [products, keyword, category, status, sort]);

  const totalPage = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPage);
  const paged = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  function resetPage(fn) {
    return (value) => {
      fn(value);
      setPage(1);
    };
  }

  async function handleSubmit(values) {
    setLoading(true);
    const res = editing ? await updateProduct(editing.id, values) : await createProduct(values);
    setLoading(false);

    setToast({ ok: res.ok, message: res.message });
    if (res.ok) {
      setFormOpen(false);
      setEditing(null);
      startTransition(() => router.refresh());
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setLoading(true);
    const res = await deleteProduct(deleting.id);
    setLoading(false);

    setToast({ ok: res.ok, message: res.message });
    if (res.ok) {
      setDeleting(null);
      startTransition(() => router.refresh());
    }
  }

  async function handleToggle(product) {
    const res = await toggleProductActive(product.id, !product.is_active);
    setToast({ ok: res.ok, message: res.message });
    if (res.ok) startTransition(() => router.refresh());
  }

  return (
    <>
      {/* Toolbar: Search + Filter */}
      <div className="card mb-6 space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row">
          <SearchInput
            value={keyword}
            onChange={resetPage(setKeyword)}
            placeholder="Cari nama produk, kategori, atau deskripsi..."
            className="flex-1"
          />
          <div className="grid grid-cols-2 gap-3 lg:flex lg:w-auto">
            <select
              value={category}
              onChange={(e) => resetPage(setCategory)(e.target.value)}
              className="input-base cursor-pointer lg:w-40"
            >
              {['Semua', ...CATEGORIES].map((c) => (
                <option key={c} value={c}>
                  {c === 'Semua' ? 'Semua kategori' : c}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => resetPage(setStatus)(e.target.value)}
              className="input-base cursor-pointer lg:w-44"
            >
              {['Semua', 'Aktif', 'Nonaktif', 'Stok Menipis'].map((s) => (
                <option key={s} value={s}>
                  {s === 'Semua' ? 'Semua status' : s}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="input-base col-span-2 cursor-pointer lg:col-auto lg:w-48"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Menampilkan <span className="font-semibold text-slate-800">{filtered.length}</span> dari{' '}
            {products.length} produk
            {keyword && (
              <>
                {' '}
                untuk “<span className="font-semibold text-slate-800">{keyword}</span>”
              </>
            )}
          </p>
          <Button
            className="hidden md:inline-flex"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            + Tambah Produk
          </Button>
        </div>
      </div>

      {/* Tabel (desktop) */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Produk tidak ditemukan"
          description="Ubah kata kunci pencarian atau tambahkan produk baru."
          action={
            <Button
              className="mt-2"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              + Tambah Produk
            </Button>
          }
        />
      ) : (
        <>
          <div className="card hidden overflow-hidden p-0 md:block">
            <div className="overflow-x-auto scroll-slim">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/70 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Produk</th>
                    <th className="px-5 py-3.5 font-semibold">Kategori</th>
                    <th className="px-5 py-3.5 font-semibold">Harga</th>
                    <th className="px-5 py-3.5 font-semibold">Stok</th>
                    <th className="px-5 py-3.5 font-semibold">Status</th>
                    <th className="px-5 py-3.5 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paged.map((p) => (
                    <tr key={p.id} className="transition hover:bg-slate-50/60">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                            {p.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                            ) : (
                              <span className="flex h-full items-center justify-center">☕</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">{p.name}</p>
                            <p className="truncate text-xs text-slate-400">
                              Dibuat {formatDateShort(p.created_at)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone="slate">{p.category}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        {promoInfo(p).isPromo ? (
                          <span className="flex flex-col leading-tight">
                            <span className="font-semibold text-rose-600">
                              {rupiah(promoInfo(p).finalPrice)}
                            </span>
                            <span className="text-xs text-slate-400 line-through">
                              {rupiah(p.price)}
                            </span>
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-900">{rupiah(p.price)}</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={p.stock === 0 ? 'rose' : p.stock <= 5 ? 'amber' : 'green'}>
                          {p.stock}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => handleToggle(p)}
                          className="focus:outline-none"
                          title="Klik untuk mengubah status"
                        >
                          <Badge tone={p.is_active ? 'blue' : 'slate'}>
                            {p.is_active ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(p);
                              setFormOpen(true);
                            }}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                          >
                            Ubah
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleting(p)}
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

          {/* Kartu (mobile) */}
          <div className="space-y-4 md:hidden">
            {paged.map((p) => (
              <div key={p.id} className="card p-4">
                <div className="flex gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full items-center justify-center text-2xl">☕</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-900">{p.name}</p>
                    <p className="mt-0.5 flex items-baseline gap-1.5 text-sm">
                      <span
                        className={`font-semibold ${
                          promoInfo(p).isPromo ? 'text-rose-600' : 'text-brand-700'
                        }`}
                      >
                        {rupiah(promoInfo(p).finalPrice)}
                      </span>
                      {promoInfo(p).isPromo && (
                        <span className="text-xs text-slate-400 line-through">{rupiah(p.price)}</span>
                      )}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge tone="slate">{p.category}</Badge>
                      {promoInfo(p).isPromo && (
                        <Badge tone="rose">Promo −{promoInfo(p).discountPercent}%</Badge>
                      )}
                      <Badge tone={p.stock === 0 ? 'rose' : p.stock <= 5 ? 'amber' : 'green'}>
                        Stok {p.stock}
                      </Badge>
                      <Badge tone={p.is_active ? 'blue' : 'slate'}>{p.is_active ? 'Aktif' : 'Nonaktif'}</Badge>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => handleToggle(p)}
                    className="flex-1 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600"
                  >
                    {p.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(p);
                      setFormOpen(true);
                    }}
                    className="flex-1 rounded-lg bg-brand-600 py-2 text-xs font-semibold text-white"
                  >
                    Ubah
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(p)}
                    className="flex-1 rounded-lg border border-rose-200 bg-rose-50 py-2 text-xs font-semibold text-rose-600"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
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

      {/* Tombol tambah mengambang di mobile */}
      <button
        type="button"
        onClick={() => {
          setEditing(null);
          setFormOpen(true);
        }}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl text-white shadow-pop transition hover:bg-brand-700 md:hidden"
        aria-label="Tambah produk"
      >
        +
      </button>

      <ProductFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        product={editing}
        loading={loading || isPending}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title={`Hapus “${deleting?.name}”?`}
        description="Produk akan dihapus permanen dari menu. Riwayat transaksi lama tetap tersimpan."
        loading={loading}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
