'use client';

import Button from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { rupiah } from '@/lib/format';
import { tableStatus } from '@/lib/tables';

/** Penanda kolom wajib — dipakai di label supaya terlihat sebelum diisi. */
function Wajib({ children }) {
  return (
    <>
      {children} <span className="font-bold text-rose-500">*</span>
    </>
  );
}

export default function CartPanel({
  items,
  form,
  tables = [],
  onFormChange,
  onAdd,
  onRemove,
  onRemoveAll,
  onClear,
  onSubmit,
  onCloseSheet,
  loading,
  error,
  missing = [],
}) {
  const total = items.reduce((acc, i) => acc + i.price * i.qty, 0);
  const totalQty = items.reduce((acc, i) => acc + i.qty, 0);

  // Nomor meja hasil scan QR bisa saja belum terdaftar di denah —
  // tetap tampilkan sebagai opsi supaya pilihannya tidak hilang diam-diam.
  const knownTable = tables.some((t) => t.table_no === form.tableNo);
  const selectedTable = tables.find((t) => t.table_no === form.tableNo);

  return (
    <div className="card flex max-h-[92vh] flex-col overflow-hidden p-0 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)]">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="font-bold text-slate-900">Keranjang</h2>
          <p className="text-xs text-slate-400">{totalQty} item dipilih</p>
        </div>

        <div className="flex items-center gap-3">
          {items.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="text-xs font-semibold text-rose-600 transition hover:text-rose-700"
            >
              Kosongkan
            </button>
          )}
          {onCloseSheet && (
            <button
              type="button"
              onClick={onCloseSheet}
              aria-label="Tutup keranjang"
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/*
        Daftar item DAN form dijadikan satu area gulir.

        Sebelumnya keduanya jadi dua kotak gulir bersebelahan, dan di bottom
        sheet HP form-nya yang tinggi menghimpit daftar item sampai tersisa
        satu baris — tombol kurangi/hapus jadi nyaris tak terjangkau. Total dan
        tombol pesan dipindah ke footer yang menempel, supaya menggulir daftar
        item tidak pernah menyembunyikan tombolnya.
      */}
      <div className="scroll-slim flex-1 overflow-y-auto">
        <div className="px-5 py-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <span className="text-3xl">🛒</span>
            <p className="text-sm font-medium text-slate-700">Keranjang masih kosong</p>
            <p className="text-xs text-slate-400">Pilih menu untuk mulai memesan.</p>
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
                  <p className="flex items-baseline gap-1.5 text-xs">
                    <span className={item.isPromo ? 'font-bold text-rose-600' : 'text-slate-400'}>
                      {rupiah(item.price)}
                    </span>
                    {item.isPromo && (
                      <span className="text-slate-400 line-through">{rupiah(item.basePrice)}</span>
                    )}
                  </p>
                  <div className="mt-2.5 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onRemove(item)}
                      aria-label={`Kurangi ${item.name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-lg text-slate-600 transition hover:bg-slate-50"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-slate-800">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => onAdd(item)}
                      disabled={item.qty >= item.stock}
                      aria-label={`Tambah ${item.name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-lg text-white transition hover:bg-brand-700 disabled:opacity-40"
                    >
                      +
                    </button>

                    {/*
                      Membatalkan satu menu lewat "−" berarti menekan berulang
                      sampai habis. Tombol ini membuangnya sekaligus.
                    */}
                    <button
                      type="button"
                      onClick={() => onRemoveAll?.(item)}
                      aria-label={`Hapus ${item.name} dari keranjang`}
                      className="ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-rose-500 transition hover:bg-rose-50 hover:text-rose-600"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 7h16M10 11v6M14 11v6" strokeLinecap="round" />
                        <path d="M6 7l1 13h10l1-13M9 7V4h6v3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
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
        <Input
          label={<Wajib>Nama pemesan</Wajib>}
          value={form.customerName}
          onChange={(e) => onFormChange('customerName', e.target.value)}
          placeholder="Nama Anda"
          hint="Dipakai barista untuk memanggil pesanan."
        />

        <Select
          label={<Wajib>Nomor meja</Wajib>}
          hint="Supaya pesanan diantar ke tempat yang benar."
          value={form.tableNo}
          onChange={(e) => onFormChange('tableNo', e.target.value)}
        >
          <option value="">— Pilih meja —</option>
          {tables.map((t) => {
            const s = tableStatus(t.status);
            return (
              <option key={t.id} value={t.table_no}>
                Meja {t.table_no} · {t.label || t.area} ({s.label})
              </option>
            );
          })}
          {form.tableNo && !knownTable && <option value={form.tableNo}>Meja {form.tableNo}</option>}
        </Select>

        {selectedTable && selectedTable.status !== 'available' && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-800">
            Meja {selectedTable.table_no} sedang{' '}
            {tableStatus(selectedTable.status).label.toLowerCase()}. Kamu masih bisa memesan, atau
            ganti ke meja lain.
          </p>
        )}

        <Select
          label="Metode pembayaran"
          hint="Belum ada uang keluar sekarang — semuanya dibayar di kasir."
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

        </div>
      </div>

      {/*
        Footer menempel — total & tombol pesan selalu terlihat walau daftarnya
        panjang. Pengingat dan pesan error ikut di sini, bukan di area gulir:
        kalau tombolnya ditekan sementara pesannya berada jauh di atas layar,
        pelanggan cuma melihat tombol yang seolah tidak bereaksi.
      */}
      <div className="space-y-3 border-t border-slate-200 bg-white px-5 py-4">
        {items.length > 0 && missing.length > 0 && !error && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-800">
            Tinggal satu langkah — isi <span className="font-bold">{missing.join(' dan ')}</span>,
            lalu tekan Pesan Sekarang.
          </p>
        )}

        {error && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500">Total</span>
          <span className="text-xl font-extrabold text-slate-900">{rupiah(total)}</span>
        </div>

        <Button className="w-full" size="lg" onClick={onSubmit} disabled={items.length === 0 || loading}>
          {loading ? 'Memproses...' : 'Pesan Sekarang'}
        </Button>

        {items.length === 0 ? (
          <p className="text-center text-[11px] leading-snug text-slate-400">
            Tombol aktif setelah ada minimal satu menu di keranjang.
          </p>
        ) : (
          <p className="text-center text-[11px] leading-snug text-slate-400">
            Tanpa akun, tanpa login. Pesanan langsung diteruskan ke barista.
          </p>
        )}
      </div>
    </div>
  );
}
