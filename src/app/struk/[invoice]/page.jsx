import Link from 'next/link';
import ReceiptPaper from '@/components/pos/ReceiptPaper';
import OrderStatusCard from '@/components/pos/OrderStatusCard';
import PrintReceiptBar from '@/components/pos/PrintReceiptBar';
import { createClient, getSessionUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }) {
  return {
    title: `Pesanan ${decodeURIComponent(params.invoice)}`,
    robots: { index: false, follow: false },
  };
}

/**
 * Halaman pesanan berdiri sendiri — TANPA navbar & footer.
 *
 * Tampilannya bercabang sesuai peran:
 *
 * - KASIR/ADMIN  → struk thermal 80mm (`ReceiptPaper`) + tombol cetak.
 *   Mencetak struk adalah wewenang kasir, bukan pelanggan.
 * - PELANGGAN    → bukti pesanan digital (`OrderStatusCard`) tanpa tombol cetak
 *   dan tanpa kelas `.receipt-paper`, jadi tidak menghasilkan struk thermal.
 *
 * Datanya diambil lewat RPC `get_receipt` (SECURITY DEFINER) supaya pelanggan
 * tetap bisa membuka pesanannya tanpa login.
 */
export default async function StrukPage({ params, searchParams }) {
  const invoice = decodeURIComponent(params.invoice || '');
  const supabase = createClient();

  const [{ data, error }, { profile }] = await Promise.all([
    supabase.rpc('get_receipt', { p_invoice: invoice }),
    getSessionUser(),
  ]);

  const transaction = data?.transaction || null;
  const items = data?.items || [];

  // Hanya admin/kasir yang boleh mencetak struk.
  const bolehCetak = profile?.role === 'admin';

  const backHref = transaction?.table_no
    ? `/menu?meja=${encodeURIComponent(transaction.table_no)}`
    : '/menu';

  if (!transaction) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="card w-full max-w-md p-8 text-center">
          <span className="text-4xl">🧾</span>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Pesanan tidak ditemukan</h1>
          <p className="mt-2 text-sm text-slate-500">
            Nomor <span className="font-semibold text-slate-700">{invoice}</span> tidak terdaftar di
            sistem kami.
            {error && ` (${error.message})`}
          </p>
          <Link
            href="/menu"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Kembali ke menu
          </Link>
        </div>
      </main>
    );
  }

  /* ---------------- Tampilan KASIR: struk yang bisa dicetak ---------------- */
  if (bolehCetak) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-10 print:min-h-0 print:bg-white print:p-0">
        {/*
          Ukuran kertas thermal hanya berlaku di halaman ini — aturan @page
          bersifat global, jadi sengaja tidak ditaruh di globals.css.
        */}
        <style>{'@media print { @page { size: 80mm auto; margin: 4mm; } }'}</style>

        <div className="no-print mx-auto mb-6 w-full max-w-[340px] text-center">
          <p className="eyebrow mx-auto">Mode kasir</p>
          <h1 className="mt-3 text-xl font-bold text-slate-900">
            {transaction.status === 'paid' ? 'Struk pembayaran' : 'Tiket pesanan'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {transaction.status === 'paid'
              ? 'Pesanan sudah lunas. Struk siap diserahkan ke pelanggan.'
              : 'Pesanan belum lunas — cetakan ini berlaku sebagai tiket dapur, bukan bukti bayar.'}
          </p>
        </div>

        <ReceiptPaper transaction={transaction} items={items} />

        <PrintReceiptBar auto={searchParams?.auto === '1'} backHref="/admin/transaksi" />
      </main>
    );
  }

  /* ------------- Tampilan PELANGGAN: bukti pesanan, tanpa cetak ------------- */
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto mb-6 w-full max-w-md text-center">
        <p className="eyebrow mx-auto">Bukti pesanan</p>
        <h1 className="mt-3 text-xl font-bold text-slate-900">Pesanan kamu tersimpan</h1>
        <p className="mt-1 text-sm text-slate-500">
          Simpan halaman ini atau screenshot, lalu tunjukkan ke kasir.
        </p>
      </div>

      <OrderStatusCard transaction={transaction} items={items} />

      <div className="mx-auto mt-6 w-full max-w-md space-y-3">
        <Link
          href={backHref}
          className="flex w-full items-center justify-center rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Pesan lagi
        </Link>
        <p className="text-center text-[11px] leading-snug text-slate-400">
          Struk resmi dicetak oleh kasir setelah pembayaran diterima.
        </p>
      </div>
    </main>
  );
}
