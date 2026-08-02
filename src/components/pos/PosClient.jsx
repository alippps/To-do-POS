'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductCard from './ProductCard';
import CartPanel from './CartPanel';
import ReceiptModal from './ReceiptModal';
import SearchInput from '@/components/ui/SearchInput';
import EmptyState from '@/components/ui/EmptyState';
import { createOrder } from '@/app/(site)/fitur/actions';

const SORTS = [
  { value: 'name-asc', label: 'Nama A–Z' },
  { value: 'price-asc', label: 'Harga termurah' },
  { value: 'price-desc', label: 'Harga termahal' },
];

export default function PosClient({ products = [], categories = [], defaultTable = '' }) {
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

  /** SEARCH + FILTER + SORT (dijalankan di sisi client, instan tanpa reload) */
  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    let list = products.filter((p) => {
      const cocokKategori = category === 'Semua' || p.category === category;
      const cocokKata =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return cocokKategori && cocokKata;
    });

    list = [...list].sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price;
      if (sort === 'price-desc') return b.price - a.price;
      return a.name.localeCompare(b.name);
    });

    return list;
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
      return [
        ...prev,
        {
          product_id: source.id,
          name: source.name,
          price: Number(source.price),
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

  function handleFormChange(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    setLoading(true);
    setError('');

    const result = await createOrder({
      customerName: form.customerName,
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
    router.refresh();
  }

  const qtyOf = (id) => cart.find((i) => i.product_id === id)?.qty || 0;

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
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

        <CartPanel
          items={cart}
          form={form}
          onFormChange={handleFormChange}
          onAdd={handleAdd}
          onRemove={handleRemove}
          onClear={() => setCart([])}
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
        />
      </div>

      <ReceiptModal
        open={Boolean(receipt)}
        onClose={() => setReceipt(null)}
        transaction={receipt}
        items={receiptItems}
      />
    </>
  );
}
