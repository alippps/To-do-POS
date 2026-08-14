'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';
import { Input, Select, Textarea, Wajib } from '@/components/ui/Field';
import { rupiah } from '@/lib/format';
import { PAYMENT_METHOD_LIST, tableStatus } from '@/lib/tables';
import { BATAS } from '@/lib/limits';
import { useTenantHref } from '@/components/tenant/TenantProvider';

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
  fieldErrors = {},
  nameRef,
}) {
  const t = useTenantHref();
  const total = items.reduce((acc, i) => acc + i.price * i.qty, 0);
  const totalQty = items.reduce((acc, i) => acc + i.qty, 0);

  const selectedTable = tables.find((tb) => tb.table_no === form.tableNo);

  return (
    <div className="card flex max-h-[92dvh] flex-col overflow-hidden p-0 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)]">
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
        {/*
          Nama pemesan memegang `ref` supaya bisa DIFOKUSKAN, bukan cuma
          diberi warna merah.

          Dulu kolom kosong hanya memicu satu kalimat di footer keranjang.
          Di HP, footer itu menempel di bawah layar sementara kolom namanya
          bisa berada jauh di atas area gulir — pelanggan membaca "lengkapi
          nama pemesan" tanpa tahu kolom itu ada di mana, dan menekan tombolnya
          berulang kali. Sekarang pesannya menempel pada kolomnya sendiri, dan
          PosClient menggulir ke sana begitu pengiriman ditolak.
        */}
        <Input
          ref={nameRef}
          label={<Wajib>Nama pemesan</Wajib>}
          value={form.customerName}
          maxLength={BATAS.namaPemesan}
          onChange={(e) => onFormChange('customerName', e.target.value)}
          placeholder="Nama Anda"
          hint="Dipakai barista untuk memanggil pesanan."
          error={fieldErrors.customerName}
        />

        {/*
          Nomor meja DIBACA, tidak dipilih.

          Nomornya ditentukan QR yang tertempel di meja tempat pelanggan duduk —
          satu barcode untuk satu meja. Dropdown lama membuat nomor itu bisa
          diketik ulang jadi meja mana pun, dan itu justru sumber kesalahan yang
          paling mahal: minuman diantar ke meja yang salah, atau tagihan
          menempel ke meja orang lain. Yang tidak punya nomor meja tidak
          diberi kolom untuk mengarangnya — ia diarahkan memindai atau memilih
          dari denah.
        */}
        {form.tableNo ? (
          <div>
            <span className="label-base">
              <Wajib>Nomor meja</Wajib>
            </span>
            <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
                {form.tableNo}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">Meja {form.tableNo}</p>
                <p className="truncate text-xs text-slate-500">
                  {selectedTable?.label || selectedTable?.area || 'Terbaca dari QR di meja ini'}
                </p>
              </div>
              <span
                aria-hidden="true"
                title="Nomor meja terkunci"
                className="ml-auto shrink-0 text-base text-brand-500"
              >
                🔒
              </span>
            </div>
            <span className="mt-1.5 block text-xs text-slate-400">
              Terkunci mengikuti QR meja ini — tidak bisa diubah dari sini.
            </span>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
            <p className="text-sm font-bold text-amber-900">Meja belum diketahui</p>
            <p className="mt-1 text-xs leading-snug text-amber-800">
              Pindai QR yang tertempel di mejamu, atau pilih meja yang kosong dari denah. Nomor meja
              tidak bisa diketik manual supaya pesanan tidak pernah salah antar.
            </p>
            <Link
              href={t('/meja')}
              className="mt-3 inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
            >
              Lihat meja yang kosong →
            </Link>
          </div>
        )}

        {selectedTable && selectedTable.status !== 'available' && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-800">
            Meja {selectedTable.table_no} sedang{' '}
            {tableStatus(selectedTable.status).label.toLowerCase()} — mungkin pesananmu sendiri yang
            belum dilunasi. Kamu tetap bisa menambah pesanan dari meja ini.
          </p>
        )}

        <Select
          label="Metode pembayaran"
          hint="Belum ada uang keluar sekarang — pilihannya menentukan cara membayar nanti."
          value={form.paymentMethod}
          onChange={(e) => onFormChange('paymentMethod', e.target.value)}
        >
          {PAYMENT_METHOD_LIST.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </Select>

        <p className="rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs leading-snug text-slate-500">
          {PAYMENT_METHOD_LIST.find((m) => m.value === form.paymentMethod)?.hint}
        </p>

        <Textarea
          label="Catatan (opsional)"
          value={form.note}
          maxLength={BATAS.catatan}
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
        {/*
          `aria-live` supaya penolakan terdengar, bukan cuma terlihat. Tombolnya
          tidak dinonaktifkan saat ada kolom kosong — tombol mati tidak bisa
          menjelaskan APA yang kurang. Ditekan, ditolak, lalu diberi tahu
          persis kolom mana: itu yang menuntun, bukan tombol yang diam.
        */}
        <div aria-live="polite">
          {error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
              {error}
            </p>
          )}
        </div>

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
