'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { rupiah, formatDate } from '@/lib/format';
import { PAYMENT_LABEL_SHORT, orderStatus } from '@/lib/tables';
import { useTenant } from '@/components/tenant/TenantProvider';
import { getTransactionItems } from '@/app/k/[slug]/admin/transaksi/actions';

export default function TransactionDetailModal({ open, onClose, transaction }) {
  const tenant = useTenant();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !transaction?.id) return;

    let cancelled = false;
    setLoading(true);

    getTransactionItems(tenant.slug, transaction.id).then((res) => {
      if (cancelled) return;
      setItems(res.items || []);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [open, transaction?.id, tenant.slug]);

  if (!transaction) return null;

  return (
    <Modal open={open} onClose={onClose} size="lg" title={`Detail ${transaction.invoice_no}`}>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ['Pemesan', transaction.customer_name],
          ['Nomor meja', transaction.table_no || '-'],
          [
            'Pembayaran',
            PAYMENT_LABEL_SHORT[transaction.payment_method] || transaction.payment_method,
          ],
          ['Waktu', formatDate(transaction.created_at)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className="text-sm text-slate-500">Status:</span>
        <Badge tone={orderStatus(transaction.status).tone}>
          {orderStatus(transaction.status).short}
        </Badge>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Produk</th>
              <th className="px-4 py-3 font-semibold">Harga</th>
              <th className="px-4 py-3 font-semibold">Qty</th>
              <th className="px-4 py-3 text-right font-semibold">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-400">
                  Memuat item...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-400">
                  Tidak ada item pada transaksi ini.
                </td>
              </tr>
            ) : (
              items.map((i) => (
                <tr key={i.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">{i.product_name}</td>
                  <td className="px-4 py-3 text-slate-500">{rupiah(i.price)}</td>
                  <td className="px-4 py-3 text-slate-500">×{i.qty}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">{rupiah(i.subtotal)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {transaction.note && (
        <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <span className="font-semibold text-slate-800">Catatan:</span> {transaction.note}
        </p>
      )}

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5">
        <span className="font-semibold text-slate-700">Total</span>
        <span className="text-xl font-extrabold text-brand-700">{rupiah(transaction.total)}</span>
      </div>
    </Modal>
  );
}
