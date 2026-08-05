'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductCard from './ProductCard';
import CartPanel from './CartPanel';
import ReceiptModal from './ReceiptModal';
import SearchInput from '@/components/ui/SearchInput';
import EmptyState from '@/components/ui/EmptyState';
import { rupiah } from '@/lib/format';
import { promoInfo } from '@/lib/promo';
import { createOrder } from '@/app/(site)/menu/actions';

const SORTS = [
  { value: 'name-asc', label: 'Nama A–Z' },
  { value: 'price-asc', label: 'Harga termurah' },
  { value: 'price-desc', label: 'Harga termahal' },
];

/**
 * Panduan singkat yang selalu tampil di atas daftar menu.
 * Pelanggan yang baru pertama kali men-scan QR tidak tahu bahwa nama & nomor
 * meja diisi di dalam keranjang — tiga baris ini yang memberitahunya.
 */
const CARA_PESAN = [
  { title: 'Tambah menu', text: 'Tekan “Tambah ke keranjang” pada menu yang kamu mau.' },
  { title: 'Isi nama & meja', text: 'Dua kolom itu ada di keranjang dan wajib diisi.' },
  { title: 'Tekan “Pesan Sekarang”', text: 'Bukti pesanan langsung terbit — bayar di kasir.' },
];

export default function PosClient({ products = [], categories = [], tables = [], defaultTable = '' }) {
  const router = useRouter();

  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('Semua');
  const [sort, setSort] = useState('name-asc');

  const [cart, setCart] = useState([]);
  const [form, setForm] = useState({
    customerName: '',
    tableNo: defaultTable,
    paymentMethod: 'cash',
    note: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [receiptItems, setReceiptItems] = useState([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Keranjang tampil sebagai bottom sheet di HP — kunci scroll latar saat terbuka.
  useEffect(() => {
    if (!sheetOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [sheetOpen]);

  /** SEARCH + FILTER + SORT (dijalankan di sisi client, instan tanpa reload) */
  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    const list = products.filter((p) => {
      const cocokKategori = category === 'Semua' || p.category === category;
      const cocokKata =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return cocokKategori && cocokKata;
    });

    return [...list].sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price;
      if (sort === 'price-desc') return b.price - a.price;
      return a.name.localeCompare(b.name);
    });
  }, [products, keyword, category, sort]);

  function handleAdd(product) {
    setError('');
    // `product` bisa berasal dari kartu menu (punya .id) atau dari keranjang (punya .product_id)
    const id = product.id || product.product_id;

    setCart((prev) => {
      const found = prev.find((i) => i.product_id === id);
      if (found) {
        if (found.qty >= found.stock) return prev;
        return prev.map((i) => (i.product_id === id ? { ...i, qty: i.qty + 1 } : i));
      }
      const source = products.find((p) => p.id === id);
      if (!source || source.stock <= 0) return prev;

      // Harga promo dipakai sejak di keranjang supaya total yang dilihat
      // pelanggan sama dengan yang dihitung `create_order()` di server.
      const { isPromo, basePrice, finalPrice } = promoInfo(source);

      return [
        ...prev,
        {
          product_id: source.id,
          name: source.name,
          price: finalPrice,
          basePrice,
          isPromo,
          stock: source.stock,
          image_url: source.image_url,
          qty: 1,
        },
      ];
    });
  }

  function handleRemove(item) {
    const id = item.product_id || item.id;
    setCart((prev) =>
      prev.flatMap((i) => {
        if (i.product_id !== id) return [i];
        return i.qty <= 1 ? [] : [{ ...i, qty: i.qty - 1 }];
      })
    );
  }

  /** Buang satu menu sepenuhnya, tanpa perlu menekan "−" berulang kali. */
  function handleRemoveAll(item) {
    const id = item.product_id || item.id;
    setCart((prev) => prev.filter((i) => i.product_id !== id));
  }

  function handleFormChange(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  /**
   * Kolom wajib yang belum diisi. Dipakai dua kali: sebagai pengingat yang
   * tampil terus di keranjang, dan sebagai penjaga sebelum pesanan dikirim —
   * tanpa ini pesanan bisa masuk atas nama "Guest" tanpa meja, dan kasir yang
   * kebingungan mencari pemiliknya.
   */
  const missing = [];
  if (!form.customerName.trim()) missing.push('nama pemesan');
  if (!form.tableNo) missing.push('nomor meja');

  async function handleSubmit() {
    if (missing.length > 0) {
      setError(`Lengkapi dulu ${missing.join(' dan ')} di bawah, baru pesanan bisa dikirim.`);
      return;
    }

    setLoading(true);
    setError('');

    const result = await createOrder({
      customerName: form.customerName.trim(),
      tableNo: form.tableNo,
      paymentMethod: form.paymentMethod,
      note: form.note,
      items: cart.map((i) => ({ product_id: i.product_id, qty: i.qty })),
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.error || 'Gagal membuat pesanan. Coba lagi.');
      return;
    }

    setReceipt(result.transaction);
    setReceiptItems(cart);
    setCart([]);
    setForm((prev) => ({ ...prev, note: '' }));
    setSheetOpen(false);
    router.refresh();
  }

  const qtyOf = (id) => cart.find((i) => i.product_id === id)?.qty || 0;
  const totalQty = cart.reduce((a, i) => a + i.qty, 0);
  const totalPrice = cart.reduce((a, i) => a + i.price * i.qty, 0);

  const cartPanel = (
    <CartPanel
      items={cart}
      form={form}
      tables={tables}
      onFormChange={handleFormChange}
      onAdd={handleAdd}
      onRemove={handleRemove}
      onRemoveAll={handleRemoveAll}
      onClear={() => setCart([])}
      onSubmit={handleSubmit}
      onCloseSheet={() => setSheetOpen(false)}
      loading={loading}
      error={error}
      missing={missing}
    />
  );

  return (
    <>
      {/*
        `min-w-0` pada kolom kiri bukan hiasan.

        Item grid/flex punya `min-width: auto`, artinya ia menolak menyusut di
        bawah lebar minimum isinya. Baris chip kategori di dalamnya adalah flex
        yang isinya `shrink-0`, jadi lebar minimumnya = total semua chip. Tanpa
        `min-w-0`, angka itulah yang jadi lebar kolom — dan seluruh halaman ikut
        melebar sampai bisa digeser ke samping di HP.
      */}
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          {/* Panduan 3 langkah — supaya pelanggan tidak menebak-nebak urutannya */}
          <div className="card mb-6 p-4 sm:p-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-600">
              Cara memesan
            </p>

            <ol className="mt-3 grid gap-3 sm:grid-cols-3">
              {CARA_PESAN.map((s, i) => (
                <li key={s.title} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700"
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{s.title}</p>
                    <p className="mt-0.5 text-xs leading-snug text-slate-500">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>

            {/* Di HP keranjang tersembunyi sampai ada isinya — perlu disebut. */}
            <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400 lg:hidden">
              Di HP, keranjang muncul sebagai tombol di bagian bawah layar setelah kamu menambah
              menu pertama.
            </p>
          </div>

          {/* Toolbar: search + filter kategori + sort */}
          <div className="card mb-6 flex flex-col gap-4 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row">
              <SearchInput
                value={keyword}
                onChange={setKeyword}
                placeholder="Cari menu, kategori, atau deskripsi..."
                className="flex-1"
              />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Urutkan menu"
                className="input-base cursor-pointer sm:w-52"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="scroll-slim -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {['Semua', ...categories].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    category === c
                      ? 'bg-brand-600 text-white shadow-pop'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <p className="mb-4 text-sm text-slate-500">
            Menampilkan <span className="font-semibold text-slate-800">{filtered.length}</span> menu
            {keyword && (
              <>
                {' '}
                untuk “<span className="font-semibold text-slate-800">{keyword}</span>”
              </>
            )}
          </p>

          {filtered.length === 0 ? (
            <EmptyState
              title="Menu tidak ditemukan"
              description="Coba kata kunci lain atau pilih kategori yang berbeda."
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  qty={qtyOf(p.id)}
                  onAdd={handleAdd}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          )}
        </div>

        {/* Keranjang menempel di samping — hanya layar besar */}
        <div className="hidden lg:block">{cartPanel}</div>
      </div>

      {/* ---------- Keranjang versi HP: bilah melayang + bottom sheet ---------- */}
      {totalQty > 0 && !sheetOpen && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex w-full items-center justify-between gap-3 rounded-xl bg-brand-600 px-4 py-3.5 text-white shadow-pop transition active:scale-[.99]"
          >
            <span className="flex items-center gap-2.5">
              <span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-white/20 px-1.5 text-sm font-bold">
                {totalQty}
              </span>
              <span className="text-sm font-semibold">Lihat keranjang</span>
            </span>
            <span className="text-base font-extrabold">{rupiah(totalPrice)}</span>
          </button>
        </div>
      )}

      {sheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setSheetOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[92vh] animate-fade-up overflow-hidden rounded-t-3xl bg-white shadow-lift">
            {cartPanel}
          </div>
        </div>
      )}

      <ReceiptModal
        open={Boolean(receipt)}
        onClose={() => setReceipt(null)}
        transaction={receipt}
        items={receiptItems}
      />
    </>
  );
}
