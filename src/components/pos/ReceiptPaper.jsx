import { rupiah, formatDate } from '@/lib/format';
import { PAYMENT_LABEL, ORDER_STATUS } from '@/lib/tables';
import { platform } from '@/lib/site';

/**
 * Kertas struk 80mm — DIPAKAI OLEH KASIR/ADMIN saja.
 *
 * Kelas `receipt-paper` dipakai aturan @media print di globals.css supaya
 * yang keluar dari printer HANYA blok ini — bukan seluruh halaman web.
 * Karena itu semua elemen di luar struk harus diberi kelas `no-print`.
 *
 * Pelanggan memakai `OrderStatusCard` yang tidak berformat struk.
 */
export default function ReceiptPaper({ transaction, items = [], outlet }) {
  if (!transaction) return null;

  const status = ORDER_STATUS[transaction.status] || ORDER_STATUS.pending;
  const totalQty = items.reduce((a, i) => a + Number(i.qty || 0), 0);
  const lunas = transaction.status === 'paid';

  return (
    <div className="receipt-paper mx-auto w-full max-w-[340px] rounded-2xl border border-slate-200 bg-white p-6 font-mono text-[13px] leading-relaxed text-slate-800 shadow-card">
      {/* Kepala struk */}
      <div className="text-center">
        <p className="font-sans text-lg font-extrabold uppercase tracking-[0.2em] text-slate-900">
          {outlet.name}
        </p>
        <p className="mt-1 text-[11px] text-slate-500">{outlet.tagline}</p>
        <p className="mt-2 text-[11px] leading-snug text-slate-500">{outlet.address}</p>
        <p className="text-[11px] text-slate-500">{outlet.phone}</p>

        {/*
          Jenis cetakan dibedakan supaya tidak ada pesanan belum bayar yang
          beredar sebagai "bukti pembayaran".
        */}
        <p className="mt-3 border-y border-dashed border-slate-300 py-1.5 font-sans text-[11px] font-bold uppercase tracking-widest text-slate-900">
          {lunas ? 'Struk Pembayaran' : 'Tiket Pesanan — Belum Lunas'}
        </p>
      </div>

      <Divider />

      {/* Identitas pesanan */}
      <dl className="space-y-1 text-[12px]">
        <Row label="No. Invoice" value={transaction.invoice_no} strong />
        <Row label="Tanggal" value={formatDate(transaction.created_at)} />
        <Row label="Pemesan" value={transaction.customer_name} />
        <Row label="Meja" value={transaction.table_no || '-'} />
        <Row
          label="Bayar"
          value={PAYMENT_LABEL[transaction.payment_method] || transaction.payment_method}
        />
        <Row label="Status" value={status.label} strong />
      </dl>

      <Divider />

      {/* Rincian item */}
      <ul className="space-y-2.5">
        {items.map((item, idx) => {
          const name = item.product_name || item.name;
          const qty = Number(item.qty || 0);
          const price = Number(item.price || 0);
          const subtotal = Number(item.subtotal ?? price * qty);

          return (
            <li key={`${name}-${idx}`}>
              <p className="font-semibold text-slate-900">{name}</p>
              <div className="flex justify-between text-[12px] text-slate-600">
                <span>
                  {qty} × {rupiah(price)}
                </span>
                <span className="font-semibold text-slate-900">{rupiah(subtotal)}</span>
              </div>
            </li>
          );
        })}
      </ul>

      <Divider />

      <div className="space-y-1 text-[12px]">
        <Row label={`Total item (${totalQty})`} value={rupiah(transaction.total)} />
        <div className="flex items-center justify-between pt-1 text-base">
          <span className="font-sans font-bold text-slate-900">TOTAL</span>
          <span className="font-sans font-extrabold text-slate-900">{rupiah(transaction.total)}</span>
        </div>
      </div>

      {transaction.note && (
        <>
          <Divider />
          <p className="text-[11px] leading-snug text-slate-600">
            <span className="font-semibold text-slate-900">Catatan:</span> {transaction.note}
          </p>
        </>
      )}

      <Divider />

      <div className="space-y-1 text-center text-[11px] text-slate-500">
        {!lunas && (
          <p className="font-semibold text-slate-900">
            BELUM LUNAS — bukan bukti pembayaran.
          </p>
        )}
        <p>Terima kasih sudah ngopi di {outlet.name} ☕</p>
        <p>{outlet.hours}</p>
        <p className="pt-2 text-[10px] tracking-wide">
          {platform.siteUrl.replace(/^https?:\/\//, '')}
          /k/{outlet.slug}/struk/{transaction.invoice_no}
        </p>
      </div>
    </div>
  );
}

function Divider() {
  return <div className="my-4 border-t border-dashed border-slate-300" />;
}

function Row({ label, value, strong = false }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className={`text-right ${strong ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
        {value}
      </dd>
    </div>
  );
}
