'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { Input, Select, Textarea } from '@/components/ui/Field';
import Toast from './Toast';
import { rupiah } from '@/lib/format';
import { promoInfo } from '@/lib/promo';
import { tableStatus } from '@/lib/tables';
import { useTenant, useTenantHref } from '@/components/tenant/TenantProvider';
import { createCashierOrder } from '@/app/k/[slug]/admin/kasir/actions';

/**
 * Layar kasir — pelanggan yang datang langsung memesan di konter.
 *
 * Urutannya sengaja dibalik dari halaman pelanggan: MEJA DULU, baru menu.
 * Alasannya bukan estetika — kasir harus memastikan pelanggan kebagian tempat
 * sebelum menghitung pesanannya, dan meja yang kosong perlu terlihat sekilas
 * tanpa menggulir.
 *
 * Pesanan dibuat berstatus `pending` (lihat alasannya di actions.js), jadi
 * mejanya langsung tertandai terisi dan pelanggan bisa menambah sendiri lewat
 * QR di meja tanpa kembali ke kasir.
 */
export default function CashierClient({ products = [], tables = [], categories = [] }) {
  const router = useRouter();
  const tenant = useTenant();
  const hrefOutlet = useTenantHref();

  const [tableNo, setTableNo] = useState('');
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('Semua');
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [note, setNote] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [lastOrder, setLastOrder] = useState(null);

  const available = tables.filter((t) => t.status === 'available');
  const taken = tables.filter((t) => t.status !== 'available');
  const selectedTable = tables.find((t) => t.table_no === tableNo);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return products.filter((p) => {
      const cocokKategori = category === 'Semua' || p.category === category;
      const cocokKata =
        !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      return cocokKategori && cocokKata;
    });
  }, [products, keyword, category]);

  function add(product) {
    setError('');
    setCart((prev) => {
      const found = prev.find((i) => i.product_id === product.id);
      if (found) {
        if (found.qty >= found.stock) return prev;
        return prev.map((i) => (i.product_id === product.id ? { ...i, qty: i.qty + 1 } : i));
      }
      if (product.stock <= 0) return prev;

      const { isPromo, basePrice, finalPrice } = promoInfo(product);
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          price: finalPrice,
          basePrice,
          isPromo,
          stock: product.stock,
          qty: 1,
        },
      ];
    });
  }

  function remove(item) {
    setCart((prev) =>
      prev.flatMap((i) => {
        if (i.product_id !== item.product_id) return [i];
        return i.qty <= 1 ? [] : [{ ...i, qty: i.qty - 1 }];
      })
    );
  }

  const totalQty = cart.reduce((a, i) => a + i.qty, 0);
  const total = cart.reduce((a, i) => a + i.price * i.qty, 0);
  const qtyOf = (id) => cart.find((i) => i.product_id === id)?.qty || 0;

  async function handleSubmit() {
    if (!tableNo) {
      setError('Pilih meja untuk pelanggan ini dulu.');
      return;
    }
    if (cart.length === 0) {
      setError('Keranjang masih kosong.');
      return;
    }

    setLoading(true);
    setError('');

    const res = await createCashierOrder(tenant.slug, {
      customerName,
      tableNo,
      paymentMethod,
      note,
      items: cart.map((i) => ({ product_id: i.product_id, qty: i.qty })),
    });

    setLoading(false);

    if (!res.ok) {
      setError(res.error || 'Gagal membuat pesanan.');
      return;
    }

    setLastOrder({ invoice: res.transaction?.invoice_no, tableNo, total });
    setCart([]);
    setCustomerName('');
    setNote('');
    setTableNo('');
    setToast({ ok: true, message: `Pesanan ${res.transaction?.invoice_no} masuk.` });
    router.refresh();
  }

  return (
    <>
      {/* Konfirmasi pesanan terakhir — kasir perlu nomornya untuk menagih nanti */}
      {lastOrder && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-emerald-900">
                Pesanan meja {lastOrder.tableNo} berhasil dibuat
              </p>
              <p className="mt-0.5 font-mono text-sm text-emerald-800">{lastOrder.invoice}</p>
              <p className="mt-1 text-xs text-emerald-700">
                Status <span className="font-bold">belum lunas</span> — tandai lunas di Daftar
                Transaksi saat pelanggan pulang. Sampai itu, meja {lastOrder.tableNo} tertandai
                terisi dan pelanggan bisa menambah sendiri lewat QR di mejanya.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link
                href={hrefOutlet(`/struk/${encodeURIComponent(lastOrder.invoice)}`)}
                className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
              >
                Buka struk
              </Link>
              <button
                type="button"
                onClick={() => setLastOrder(null)}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* `min-w-0` — alasannya sama dengan di PosClient: baris chip kategori
          di dalamnya berisi tombol `shrink-0`, dan tanpa ini lebar minimumnya
          menjadi lebar kolom, membuat halaman bisa digeser ke samping. */}
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          {/* LANGKAH 1 — meja */}
          <section className="card mb-6 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2.5 font-bold text-slate-900">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                  1
                </span>
                Pilih meja
              </h2>
              <span className="text-xs font-medium text-slate-400">
                {available.length} dari {tables.length} meja kosong
              </span>
            </div>

            {available.length === 0 ? (
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Semua meja sedang terisi. Kamu masih bisa memilih meja di bawah, tapi pastikan dulu
                pelanggan benar-benar kebagian tempat.
              </p>
            ) : (
              <>
                <p className="mt-3 text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Kosong
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {available.map((t) => (
                    <TableChip
                      key={t.id}
                      table={t}
                      active={tableNo === t.table_no}
                      onClick={() => setTableNo(t.table_no)}
                    />
                  ))}
                </div>
              </>
            )}

            {taken.length > 0 && (
              <>
                <p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Sedang terisi / direservasi
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {taken.map((t) => (
                    <TableChip
                      key={t.id}
                      table={t}
                      active={tableNo === t.table_no}
                      onClick={() => setTableNo(t.table_no)}
                    />
                  ))}
                </div>
              </>
            )}

            {selectedTable && selectedTable.status === 'reserved' && (
              <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                Meja {selectedTable.table_no} berstatus direservasi — sistem akan menolak pesanan
                untuk meja ini. Pilih meja lain atau ubah statusnya dulu di Denah Meja.
              </p>
            )}
          </section>

          {/* LANGKAH 2 — menu */}
          <section className="card p-5">
            <h2 className="flex items-center gap-2.5 font-bold text-slate-900">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                2
              </span>
              Pilih pesanan
            </h2>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <SearchInput
                value={keyword}
                onChange={setKeyword}
                placeholder="Cari menu..."
                className="flex-1"
              />
            </div>

            <div className="scroll-slim -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
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

            {filtered.length === 0 ? (
              <div className="mt-5">
                <EmptyState title="Menu tidak ditemukan" description="Coba kata kunci lain." />
              </div>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((p) => (
                  <MenuTile key={p.id} product={p} qty={qtyOf(p.id)} onAdd={add} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* LANGKAH 3 — ringkasan & buat pesanan */}
        <aside className="card flex h-fit flex-col overflow-hidden p-0 xl:sticky xl:top-6">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="flex items-center gap-2.5 font-bold text-slate-900">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                3
              </span>
              Pesanan
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {tableNo ? `Meja ${tableNo}` : 'Meja belum dipilih'} · {totalQty} item
            </p>
          </div>

          <div className="scroll-slim max-h-[340px] flex-1 overflow-y-auto px-5 py-4">
            {cart.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                Belum ada item. Tekan menu di sebelah untuk menambahkan.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {cart.map((i) => (
                  <li key={i.product_id} className="flex items-center gap-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-800">{i.name}</p>
                      <p className="text-xs">
                        <span className={i.isPromo ? 'font-bold text-rose-600' : 'text-slate-400'}>
                          {rupiah(i.price)}
                        </span>
                        {i.isPromo && (
                          <span className="ml-1.5 text-slate-400 line-through">
                            {rupiah(i.basePrice)}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => remove(i)}
                        aria-label={`Kurangi ${i.name}`}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                      >
                        −
                      </button>
                      <span className="w-6 text-center font-bold text-slate-800">{i.qty}</span>
                      <button
                        type="button"
                        onClick={() => add({ id: i.product_id, stock: i.stock })}
                        disabled={i.qty >= i.stock}
                        aria-label={`Tambah ${i.name}`}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>

                    <span className="w-20 shrink-0 text-right font-bold text-slate-900">
                      {rupiah(i.price * i.qty)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
            <Input
              label="Nama pelanggan"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Kosongkan untuk “Guest”"
              hint="Dipakai barista saat memanggil pesanan."
            />

            <Select
              label="Metode pembayaran"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="cash">Tunai</option>
              <option value="qris">QRIS</option>
              <option value="transfer">Transfer Bank</option>
            </Select>

            <Textarea
              label="Catatan (opsional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: less sugar"
              className="min-h-[64px]"
            />

            {error && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="text-sm font-medium text-slate-500">Total</span>
              <span className="text-xl font-extrabold text-slate-900">{rupiah(total)}</span>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={loading || cart.length === 0 || !tableNo}
            >
              {loading ? 'Memproses...' : 'Buat Pesanan'}
            </Button>

            <p className="text-center text-[11px] leading-snug text-slate-400">
              Pesanan masuk sebagai <span className="font-semibold">belum lunas</span>. Tandai lunas
              di Daftar Transaksi saat pelanggan pulang.
            </p>
          </div>
        </aside>
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}

function TableChip({ table, active, onClick }) {
  const s = tableStatus(table.status);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3.5 py-2 text-left transition ${
        active
          ? 'border-brand-600 bg-brand-600 text-white shadow-pop'
          : `${s.ring} hover:border-brand-300`
      }`}
    >
      <span className="flex items-center gap-2">
        <span className="font-display text-base font-bold">{table.table_no}</span>
        {!active && <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />}
      </span>
      <span className={`block text-[11px] ${active ? 'text-brand-50' : 'text-slate-500'}`}>
        {table.label || table.area} · {table.capacity} kursi
      </span>
    </button>
  );
}

function MenuTile({ product, qty, onAdd }) {
  const habis = product.stock <= 0;
  const { isPromo, basePrice, finalPrice } = promoInfo(product);

  return (
    <button
      type="button"
      onClick={() => onAdd(product)}
      disabled={habis || qty >= product.stock}
      className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition ${
        habis
          ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60'
          : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card disabled:cursor-not-allowed disabled:opacity-50'
      }`}
    >
      <span className="flex w-full items-start justify-between gap-2">
        <span className="min-w-0 truncate text-sm font-bold text-slate-900">{product.name}</span>
        {qty > 0 && (
          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-bold text-white">
            {qty}
          </span>
        )}
      </span>

      <span className="mt-1 flex items-baseline gap-1.5">
        <span className={`text-sm font-extrabold ${isPromo ? 'text-rose-600' : 'text-brand-700'}`}>
          {rupiah(finalPrice)}
        </span>
        {isPromo && (
          <span className="text-[11px] text-slate-400 line-through">{rupiah(basePrice)}</span>
        )}
      </span>

      <span className="mt-2">
        <Badge tone={habis ? 'rose' : product.stock <= 5 ? 'amber' : 'slate'}>
          {habis ? 'Habis' : `Stok ${product.stock}`}
        </Badge>
      </span>
    </button>
  );
}
