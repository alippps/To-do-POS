'use client';

import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { rupiah, formatDate } from '@/lib/format';
import { PAYMENT_LABEL } from '@/lib/tables';
import { useTenantHref } from '@/components/tenant/TenantProvider';

export default function ReceiptModal({ open, onClose, transaction, items, fromScan = false }) {
  const t = useTenantHref();

  if (!transaction) return null;

  // Asal-usul meja dibawa sampai ke bukti pesanan: tanpa ini stepper di halaman
  // struk kembali menuntut "Pilih meja" pada orang yang datang lewat QR.
  const strukUrl = t(
    `/struk/${encodeURIComponent(transaction.invoice_no)}${fromScan ? '?src=qr' : ''}`
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pesanan berhasil dibuat 🎉"
      description="Pesananmu sudah masuk ke barista. Tunjukkan struk ini ke kasir saat membayar."
    >
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-5">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-bold text-slate-900">{transaction.invoice_no}</span>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
            Menunggu kasir
          </span>
        </div>

        <dl className="mt-4 space-y-1.5 text-xs text-slate-500">
          <div className="flex justify-between">
            <dt>Pemesan</dt>
            <dd className="font-medium text-slate-700">{transaction.customer_name}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Meja</dt>
            <dd className="font-medium text-slate-700">{transaction.table_no || '-'}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Pembayaran</dt>
            <dd className="font-medium text-slate-700">
              {PAYMENT_LABEL[transaction.payment_method] || transaction.payment_method}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt>Waktu</dt>
            <dd className="font-medium text-slate-700">{formatDate(transaction.created_at)}</dd>
          </div>
        </dl>

        <ul className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm">
          {items.map((i) => (
            <li key={i.product_id} className="flex items-start justify-between gap-3">
              <span className="text-slate-600">
                {i.name} <span className="text-slate-400">× {i.qty}</span>
              </span>
              <span className="font-semibold text-slate-900">{rupiah(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
          <span className="font-semibold text-slate-700">Total</span>
          <span className="text-lg font-extrabold text-brand-700">{rupiah(transaction.total)}</span>
        </div>

        {transaction.note && (
          <div className="mt-4 border-t border-slate-200 pt-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Catatan</p>
            <p className="mt-1 text-xs text-slate-600">{transaction.note}</p>
          </div>
        )}
      </div>

      {/*
        Pelanggan sering berhenti di sini dan bingung: sudah bayar atau belum?
        Tiga baris berikut menjawabnya sebelum sempat ditanyakan.
      */}
      <div className="mt-5 rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-700">
          Selanjutnya
        </p>
        <ol className="mt-2.5 space-y-2 text-xs leading-snug text-slate-600">
          <li className="flex gap-2.5">
            <span className="font-bold text-brand-700">1.</span>
            <span>
              Pesanan sudah <span className="font-semibold text-slate-800">masuk ke kasir</span> dan
              barista mulai meracik — kamu tidak perlu memberitahu siapa pun.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="font-bold text-brand-700">2.</span>
            <span>
              {transaction.payment_method === 'qris' ? (
                <>
                  Buka bukti pesanan untuk memindai{' '}
                  <span className="font-semibold text-slate-800">kode QRIS</span>-nya.
                </>
              ) : (
                <>
                  Bayar di kasir sambil menyebut nomor{' '}
                  <span className="font-semibold text-slate-800">{transaction.invoice_no}</span>.
                </>
              )}
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="font-bold text-brand-700">3.</span>
            <span>Kasir menandai lunas lalu mencetak struk resmimu.</span>
          </li>
        </ol>
      </div>

      {/*
        Tidak ada tombol cetak di sini: mencetak struk adalah wewenang kasir.
        Pelanggan cukup menyimpan bukti pesanan digitalnya.
      */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Button variant="secondary" onClick={onClose}>
          Tutup
        </Button>
        <Button href={strukUrl}>Buka Bukti Pesanan</Button>
      </div>

      <p className="mt-3 text-center text-[11px] leading-snug text-slate-400">
        Bukti pesanan bisa dibuka kapan saja lewat tautan yang sama — simpan atau screenshot.
        Struk resmi dicetak oleh kasir setelah pembayaran diterima.
      </p>
    </Modal>
  );
}
