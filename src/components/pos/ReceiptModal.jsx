'use client';

import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { rupiah, formatDate } from '@/lib/format';

const PAYMENT_LABEL = { cash: 'Tunai', qris: 'QRIS', transfer: 'Transfer Bank' };

export default function ReceiptModal({ open, onClose, transaction, items }) {
  if (!transaction) return null;

  return (
    <Modal open={open} onClose={onClose} title="Pesanan berhasil dibuat 🎉" description="Tunjukkan struk ini ke kasir kami.">
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-slate-900">{transaction.invoice_no}</span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
            {transaction.status === 'paid' ? 'Lunas' : transaction.status}
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
          <p className="mt-3 rounded-xl bg-white p-3 text-xs text-slate-500">Catatan: {transaction.note}</p>
        )}
      </div>

      <div className="mt-5 flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={() => window.print()}>
          Cetak Struk
        </Button>
        <Button className="flex-1" onClick={onClose}>
          Selesai
        </Button>
      </div>
    </Modal>
  );
}
