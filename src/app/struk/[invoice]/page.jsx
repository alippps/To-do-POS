import Link from 'next/link';
import FlowSteps from '@/components/pos/FlowSteps';
import ReceiptPaper from '@/components/pos/ReceiptPaper';
import OrderStatusCard from '@/components/pos/OrderStatusCard';
import PrintReceiptBar from '@/components/pos/PrintReceiptBar';
import { createClient, getSessionUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Apa yang harus dilakukan pelanggan setelah membuka halaman ini.
 * Isinya berbeda per status supaya tidak ada yang menunggu tanpa tahu
 * sedang menunggu apa.
 */
const LANGKAH_BERIKUT = {
  pending: {
    title: 'Yang perlu kamu lakukan',
    steps: [
      'Tunjukkan nomor pesanan di atas ke kasir.',
      'Bayar sesuai metode yang tadi kamu pilih.',
      'Kasir menandai lunas, lalu mencetak struk resmi.',
    ],
  },
  paid: {
    title: 'Pesanan ini sudah lunas',
    steps: [
      'Tidak ada lagi yang perlu dibayar.',
      'Tunggu barista memanggil namamu.',
      'Minta struk cetak ke kasir bila kamu membutuhkannya.',
    ],
  },
  cancelled: {
    title: 'Pesanan ini dibatalkan',
    steps: [
      'Tidak ada tagihan yang berjalan atas nomor ini.',
      'Hubungi kasir bila pembatalan ini keliru.',
      'Kamu bisa memesan ulang lewat tombol di bawah.',
    ],
  },
};

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

  const langkah = LANGKAH_BERIKUT[transaction?.status] || LANGKAH_BERIKUT.pending;

  if (!transaction) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="card w-full max-w-md p-8 text-center">
          <span className="text-4xl">🧾</span>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Pesanan tidak ditemukan</h1>
          <p className="mt-2 text-sm text-slate-500">
            Nomor <span className="font-semibold text-slate-700">{invoice}</span> tidak terdaftar di
            sistem kami.
          </p>

          {/* Buntu tanpa penjelasan bikin panik — sebutkan sebabnya & jalan keluarnya. */}
          <ul className="mt-5 space-y-2 rounded-2xl bg-slate-50 p-4 text-left text-xs leading-snug text-slate-500">
            <li>• Cek ulang nomor pesanannya, mungkin ada huruf yang tertukar.</li>
            <li>• Buka lagi tautan yang muncul tepat setelah kamu memesan.</li>
            <li>• Pesanan yang sudah dihapus kasir juga tidak bisa dibuka lagi.</li>
            <li>• Masih bingung? Tunjukkan layar ini ke kasir kami.</li>
          </ul>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href="/meja"
              className="inline-flex items-center justify-center rounded-xl border border-brand-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
            >
              Lihat meja
            </Link>
            <Link
              href="/menu"
              className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Pesan lagi
            </Link>
          </div>

          {error && (
            <p className="mt-4 text-[11px] leading-snug text-slate-400">Detail teknis: {error.message}</p>
          )}
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
      <div className="mx-auto mb-6 w-full max-w-md">
        <FlowSteps
          current="struk"
          tableNo={transaction.table_no || ''}
          paymentStatus={transaction.status}
        />
      </div>

      <div className="mx-auto mb-6 w-full max-w-md text-center">
        <p className="eyebrow mx-auto">
          {transaction.status === 'paid' ? 'Selesai · Bukti pesanan' : 'Langkah 3 dari 3 · Bukti pesanan'}
        </p>
        <h1 className="mt-3 text-xl font-bold text-slate-900">
          {transaction.status === 'paid' ? 'Pesanan kamu sudah lunas' : 'Pesanan kamu tersimpan'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {transaction.status === 'paid'
            ? 'Tidak ada yang perlu dibayar lagi. Simpan halaman ini sebagai bukti.'
            : 'Simpan halaman ini atau screenshot, lalu tunjukkan ke kasir.'}
        </p>
      </div>

      <OrderStatusCard transaction={transaction} items={items} />

      <div className="mx-auto mt-6 w-full max-w-md space-y-3">
        {/* Petunjuk langkah berikutnya — beda isi untuk tiap status pesanan. */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand-600">
            {langkah.title}
          </p>
          <ol className="mt-3 space-y-2.5">
            {langkah.steps.map((text, i) => (
              <li key={text} className="flex gap-3 text-sm leading-snug text-slate-600">
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700"
                >
                  {i + 1}
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
        </div>

        <Link
          href={backHref}
          className="flex w-full items-center justify-center rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Pesan lagi
        </Link>
        <p className="text-center text-[11px] leading-snug text-slate-400">
          Halaman ini tetap bisa dibuka lewat tautan yang sama. Struk resmi dicetak oleh kasir
          setelah pembayaran diterima.
        </p>
      </div>
    </main>
  );
}
