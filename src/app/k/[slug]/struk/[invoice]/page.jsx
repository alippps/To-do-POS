import Link from 'next/link';
import FlowSteps from '@/components/pos/FlowSteps';
import ReceiptPaper from '@/components/pos/ReceiptPaper';
import OrderStatusCard from '@/components/pos/OrderStatusCard';
import PrintReceiptBar from '@/components/pos/PrintReceiptBar';
import LiveOrderStatus from '@/components/pos/LiveOrderStatus';
import QrisPayment from '@/components/pos/QrisPayment';
import { createClient, getSessionUser } from '@/lib/supabase/server';
import { STAFF_ROLES } from '@/lib/access';
import { ORDER_ACTIVE_STATUSES } from '@/lib/tables';
import { tenantPath } from '@/lib/tenant';
import { requireTenant } from '@/lib/tenant.server';

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
      'Tunggu sebentar — pesanan sedang mengantre di dapur.',
      'Bayar dengan memindai QRIS di halaman ini, atau tunai di kasir.',
      'Kasir menandai lunas, lalu mencetak struk resmi.',
    ],
  },
  diproses: {
    title: 'Pesananmu sedang dibuat',
    steps: [
      'Barista sudah mulai mengerjakannya.',
      'Kamu bisa membayar sekarang lewat QRIS, atau nanti di kasir.',
      'Halaman ini berganti sendiri begitu pesanannya siap.',
    ],
  },
  siap: {
    title: 'Pesananmu siap diantar',
    steps: [
      'Sebentar lagi diantar ke mejamu.',
      'Selesaikan pembayaran lewat QRIS di halaman ini, atau tunai di kasir.',
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
  const tenant = await requireTenant(params.slug);
  const t = (path) => tenantPath(tenant.slug, path);
  const invoice = decodeURIComponent(params.invoice || '');
  const supabase = createClient();

  const [{ data, error }, { profile }] = await Promise.all([
    supabase.rpc('get_receipt', { p_invoice: invoice }),
    getSessionUser(),
  ]);

  const transaction = data?.transaction || null;
  const items = data?.items || [];

  /*
    Mencetak struk adalah pekerjaan kasir, jadi kasir HARUS termasuk di sini —
    bukan admin saja. Dipakai STAFF_ROLES supaya daftarnya tidak melenceng dari
    definisi staf di tempat lain.
  */
  const bolehCetak = STAFF_ROLES.includes(profile?.role);

  /*
    Peran menentukan siapa yang BOLEH membuka struk kasir. Ia tidak boleh ikut
    menentukan siapa yang SEDANG memintanya — dan sampai v6 ia melakukan
    keduanya.

    Akibatnya terasa persis di orang yang paling sering memakai sistem ini:
    pemilik kedai yang sedang masuk sebagai admin, lalu memesan lewat QR di
    mejanya sendiri untuk mencoba. Tombol "Buka Bukti Pesanan" membawanya ke
    struk thermal 80mm bertuliskan "Mode kasir" — bukan bukti pesanan yang
    dilihat pelanggannya. Kode QRIS-nya hilang (padahal itu yang mau dipindai),
    stepper-nya hilang, dan tombol "Pesan lagi" berganti jadi "Kembali" ke
    dashboard. Satu-satunya orang yang tidak pernah bisa melihat tampilan
    pelanggan adalah yang paling berkepentingan melihatnya.

    Sekarang tampilan kasir harus DIMINTA lewat URL: `?auto=1` dari tombol
    Cetak, atau `?mode=kasir` dari tautan staf. Pelanggan yang mengarang
    `?mode=kasir` tidak mendapat apa-apa — `bolehCetak` tetap penjaganya.
  */
  const modeKasir = bolehCetak && (searchParams?.auto === '1' || searchParams?.mode === 'kasir');

  /*
    Asal-usul QR ikut dibawa ke tautan "Pesan lagi". Halaman ini sudah tahu
    pelanggannya datang lewat pindaian (dipakai `FlowSteps` di bawah), jadi
    membuangnya di tautan pulang membuat stepper kembali menuntut "Pilih meja"
    pada orang yang mejanya tidak pernah ia pilih sendiri.
  */
  const dariScan = searchParams?.src === 'qr';
  const backHref = t(
    transaction?.table_no
      ? `/menu?meja=${encodeURIComponent(transaction.table_no)}${dariScan ? '&src=qr' : ''}`
      : '/menu'
  );

  /*
    Kode QRIS hanya muncul bila pesanan ini memang memilih QRIS.

    Pesanan tunai tidak butuh kode apa pun — memunculkannya "untuk berjaga-jaga"
    justru membuat pelanggan mengira ada langkah tambahan yang harus dikerjakan.
  */
  const pakaiQris = transaction?.payment_method === 'qris';

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
              href={t('/meja')}
              className="inline-flex items-center justify-center rounded-xl border border-brand-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
            >
              Lihat meja
            </Link>
            <Link
              href={t('/menu')}
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
  if (modeKasir) {
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

          {/* Pasangan dari tautan "Buka mode kasir" di tampilan pelanggan.
              Pemilik kedai perlu bisa memeriksa apa yang dilihat tamunya —
              termasuk kode QRIS yang hanya muncul di sana. */}
          <Link
            href={t(`/struk/${encodeURIComponent(transaction.invoice_no)}`)}
            className="mt-3 inline-block text-xs font-semibold text-slate-500 underline-offset-4 transition hover:text-brand-700 hover:underline"
          >
            Lihat sebagai pelanggan
          </Link>
        </div>

        <ReceiptPaper transaction={transaction} items={items} outlet={tenant} />

        {/* `backHref` sengaja RELATIF terhadap outlet — awalan `/k/<slug>`-nya
            dipasang di dalam PrintReceiptBar, bukan di sini. Alasan
            penempatannya ada di komponen itu. */}
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
          fromScan={dariScan}
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

      <OrderStatusCard transaction={transaction} items={items} outlet={tenant} />

      {/*
        Ditaruh tepat di bawah kartu status, bukan di dasar halaman: yang
        ditunggu pelanggan ada di kartu itu, jadi keterangan "ini memperbarui
        sendiri" harus terbaca tanpa menggulir.

        Syaratnya `ORDER_ACTIVE_STATUSES`, bukan `=== 'pending'`. Sejak ada
        tahap dapur, pesanan yang mulai dimasak berhenti berstatus `pending` —
        dan pemeriksaan lama akan mematikan pembaruan otomatis TEPAT pada saat
        pelanggan paling ingin tahu kabarnya. Yang berhenti hanya keadaan
        final: lunas dan batal tidak punya kelanjutan.
      */}
      <div className="mx-auto mt-4 w-full max-w-md">
        <LiveOrderStatus
          active={ORDER_ACTIVE_STATUSES.includes(transaction.status)}
          label={
            transaction.status === 'siap'
              ? 'Pesanan siap — menunggu diantar'
              : transaction.status === 'diproses'
              ? 'Sedang dibuat barista'
              : 'Menunggu antrean dapur'
          }
          doneLabel="Status pesanan ini sudah final."
        />
      </div>

      {pakaiQris && (
        <div className="mx-auto mt-6 w-full max-w-md">
          <QrisPayment
            invoice={transaction.invoice_no}
            total={transaction.total}
            outlet={tenant.name}
            lunas={transaction.status === 'paid'}
          />
        </div>
      )}

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

        {/*
          Jalan keluar untuk staf yang mendarat di sini.

          Sekarang tampilan kasir harus diminta lewat URL, jadi kasir yang
          membuka tautan struk milik pelanggan — disodorkan dari HP tamu,
          misalnya — mendapat tampilan pelanggan. Tanpa tautan ini satu-satunya
          cara pindah adalah mengetik `?mode=kasir` sendiri di address bar.
        */}
        {bolehCetak && (
          <Link
            href={t(`/struk/${encodeURIComponent(transaction.invoice_no)}?mode=kasir`)}
            className="block text-center text-xs font-semibold text-slate-500 underline-offset-4 transition hover:text-brand-700 hover:underline"
          >
            Buka mode kasir · struk 80mm siap cetak
          </Link>
        )}
      </div>
    </main>
  );
}
