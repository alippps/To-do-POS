import { rupiah, formatDate } from '@/lib/format';
import { PAYMENT_LABEL, ORDER_STATUS } from '@/lib/tables';

const STATUS_STYLE = {
  pending: {
    ring: 'border-amber-200 bg-amber-50',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
    headline: 'Pesanan diterima, menunggu antrean dapur',
    detail: 'Barista akan segera mulai membuatnya.',
  },
  diproses: {
    ring: 'border-brand-200 bg-brand-50',
    text: 'text-brand-800',
    dot: 'bg-brand-500',
    headline: 'Pesananmu sedang dibuat',
    detail: 'Barista sudah mulai mengerjakannya — tidak perlu ke kasir dulu.',
  },
  siap: {
    ring: 'border-violet-200 bg-violet-50',
    text: 'text-violet-800',
    dot: 'bg-violet-500',
    headline: 'Pesananmu siap',
    detail: 'Sebentar lagi diantar ke mejamu. Pembayaran diselesaikan di kasir.',
  },
  paid: {
    ring: 'border-emerald-200 bg-emerald-50',
    text: 'text-emerald-800',
    dot: 'bg-emerald-500',
    headline: 'Pembayaran lunas',
    detail: 'Terima kasih! Struk resmi bisa diminta ke kasir.',
  },
  cancelled: {
    ring: 'border-rose-200 bg-rose-50',
    text: 'text-rose-800',
    dot: 'bg-rose-500',
    headline: 'Pesanan dibatalkan',
    detail: 'Hubungi kasir kami bila ini tidak seharusnya terjadi.',
  },
};

/**
 * Bukti pesanan untuk PELANGGAN.
 *
 * Sengaja dibuat berbeda dari `ReceiptPaper`: ini bukan struk pembayaran dan
 * tidak memakai kelas `receipt-paper`, sehingga tidak ikut tercetak sebagai
 * struk thermal. Pencetakan struk resmi adalah wewenang kasir.
 */
export default function OrderStatusCard({ transaction, items = [], outlet }) {
  if (!transaction) return null;

  const style = STATUS_STYLE[transaction.status] || STATUS_STYLE.pending;
  const status = ORDER_STATUS[transaction.status] || ORDER_STATUS.pending;

  return (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
      {/* Status pesanan */}
      <div className={`border-b px-6 py-5 ${style.ring}`}>
        <span
          className={`inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${style.text}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
          {status.label}
        </span>
        <p className={`mt-2.5 text-base font-bold ${style.text}`}>{style.headline}</p>
        <p className="mt-1 text-sm text-slate-600">{style.detail}</p>
      </div>

      {/* Nomor pesanan besar-besar supaya mudah ditunjukkan ke kasir */}
      <div className="border-b border-slate-100 px-6 py-5 text-center">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
          Nomor Pesanan
        </p>
        <p className="mt-1.5 break-all font-mono text-lg font-bold text-slate-900">
          {transaction.invoice_no}
        </p>
      </div>

      <div className="px-6 py-5">
        <dl className="space-y-2 text-sm">
          <Row label="Pemesan" value={transaction.customer_name} />
          <Row label="Meja" value={transaction.table_no || '-'} />
          <Row
            label="Metode bayar"
            value={PAYMENT_LABEL[transaction.payment_method] || transaction.payment_method}
          />
          <Row label="Waktu pesan" value={formatDate(transaction.created_at)} />
        </dl>

        <ul className="mt-5 space-y-3 border-t border-slate-100 pt-5">
          {items.map((item, idx) => {
            const name = item.product_name || item.name;
            const qty = Number(item.qty || 0);
            const price = Number(item.price || 0);
            const subtotal = Number(item.subtotal ?? price * qty);

            return (
              <li key={`${name}-${idx}`} className="flex items-start justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="font-medium text-slate-800">{name}</span>
                  <span className="block text-xs text-slate-400">
                    {qty} × {rupiah(price)}
                  </span>
                </span>
                <span className="shrink-0 font-semibold text-slate-900">{rupiah(subtotal)}</span>
              </li>
            );
          })}
        </ul>

        <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-5">
          <span className="font-semibold text-slate-700">Total</span>
          <span className="text-xl font-extrabold text-brand-700">{rupiah(transaction.total)}</span>
        </div>

        {transaction.note && (
          <div className="mt-4 rounded-xl bg-slate-50 p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Catatan</p>
            <p className="mt-1 text-sm text-slate-600">{transaction.note}</p>
          </div>
        )}
      </div>

      <p className="border-t border-slate-100 bg-slate-50/70 px-6 py-4 text-center text-xs text-slate-500">
        Terima kasih sudah ngopi di {outlet.name} ☕
      </p>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{value}</dd>
    </div>
  );
}
