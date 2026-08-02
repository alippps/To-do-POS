'use client';

import Button from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { rupiah } from '@/lib/format';

export default function CartPanel({
  items,
  form,
  onFormChange,
  onAdd,
  onRemove,
  onClear,
  onSubmit,
  loading,
  error,
}) {
  const total = items.reduce((acc, i) => acc + i.price * i.qty, 0);
  const totalQty = items.reduce((acc, i) => acc + i.qty, 0);

  return (
    <div className="card flex max-h-[calc(100vh-7rem)] flex-col overflow-hidden p-0 lg:sticky lg:top-24">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="font-bold text-slate-900">Keranjang</h2>
          <p className="text-xs text-slate-400">{totalQty} item dipilih</p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-semibold text-rose-600 transition hover:text-rose-700"
          >
            Kosongkan
          </button>
        )}
      </div>

      <div className="scroll-slim flex-1 overflow-y-auto px-5 py-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <span className="text-3xl">🛒</span>
            <p className="text-sm font-medium text-slate-700">Keranjang masih kosong</p>
            <p className="text-xs text-slate-400">Pilih menu di sebelah kiri untuk mulai memesan.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.product_id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center">☕</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-400">{rupiah(item.price)}</p>
                  <div className="mt-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onRemove(item)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                    >
                      −
                    </button>
                    <span className="w-7 text-center text-sm font-bold text-slate-800">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => onAdd(item)}
                      disabled={item.qty >= item.stock}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>

                <p className="shrink-0 text-sm font-bold text-slate-900">{rupiah(item.price * item.qty)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Nama pemesan"
            value={form.customerName}
            onChange={(e) => onFormChange('customerName', e.target.value)}
            placeholder="Nama Anda"
          />
          <Input
            label="No. meja"
            value={form.tableNo}
            onChange={(e) => onFormChange('tableNo', e.target.value)}
            placeholder="01"
          />
        </div>

        <Select
          label="Metode pembayaran"
          value={form.paymentMethod}
          onChange={(e) => onFormChange('paymentMethod', e.target.value)}
        >
          <option value="cash">Tunai (bayar di kasir)</option>
          <option value="qris">QRIS</option>
          <option value="transfer">Transfer Bank</option>
        </Select>

        <Textarea
          label="Catatan (opsional)"
          value={form.note}
          onChange={(e) => onFormChange('note', e.target.value)}
          placeholder="Contoh: less sugar, tanpa es"
          className="min-h-[72px]"
        />

        {error && (
          <p className="rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between border-t border-slate-200 pt-3">
          <span className="text-sm font-medium text-slate-500">Total</span>
          <span className="text-xl font-extrabold text-slate-900">{rupiah(total)}</span>
        </div>

        <Button className="w-full" size="lg" onClick={onSubmit} disabled={items.length === 0 || loading}>
          {loading ? 'Memproses...' : 'Pesan Sekarang'}
        </Button>
      </div>
    </div>
  );
}
