import Link from 'next/link';
import Container from '@/components/ui/Container';
import Badge from '@/components/ui/Badge';
import LiveOrderStatus from '@/components/pos/LiveOrderStatus';
import { createClient } from '@/lib/supabase/server';
import { rupiah, formatDate } from '@/lib/format';
import { PAYMENT_LABEL, orderStatus } from '@/lib/tables';
import { tenantPath } from '@/lib/tenant';
import { requireTenant } from '@/lib/tenant.server';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Bayar',
  description: 'Cek tagihan berjalan meja Anda sebelum membayar di kasir.',
};

const CARA_BAYAR = [
  'Pesanan QRIS: buka bukti pesanannya, lalu pindai kode yang muncul di sana.',
  'Pesanan tunai: datangi kasir sambil menyebut nomor meja kamu.',
  'Tunjukkan halaman ini — kasir mencocokkan dengan pesanan yang masuk.',
  'Kasir menandai lunas lalu mencetak struk resminya.',
];

/**
 * Tagihan berjalan sebuah meja.
 *
 * Datanya lewat RPC `get_table_bill` (SECURITY DEFINER) karena tabel
 * `transactions` tertutup untuk tamu. Yang dikembalikannya hanya pesanan yang
 * BELUM SELESAI — `pending`, `diproses`, dan `siap` (ORDER_ACTIVE_STATUSES) —
 * jadi tamu berikutnya di meja yang sama tidak melihat riwayat tamu sebelumnya,
 * sementara pesanan yang sedang dimasak tetap terhitung sebagai tagihan.
 */
export default async function BayarPage({ params, searchParams }) {
  const tenant = await requireTenant(params.slug);
  const t = (path) => tenantPath(tenant.slug, path);

  const meja = typeof searchParams?.meja === 'string' ? searchParams.meja.trim() : '';
  const backHref = t(meja ? `/meja?meja=${encodeURIComponent(meja)}` : '/meja');

  if (!meja) {
    return (
      <Shell backHref={t('/meja')}>
        <div className="card p-8 text-center">
          <span className="text-4xl">💳</span>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Nomor meja belum diketahui</h1>
          <p className="mt-2 text-sm text-slate-500">
            Halaman ini menampilkan tagihan per meja. Pindai QR di mejamu, atau pilih mejanya dari
            denah.
          </p>
          <Link
            href={t('/meja')}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Pilih meja
          </Link>
        </div>
      </Shell>
    );
  }

  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_table_bill', {
    p_tenant_slug: tenant.slug,
    p_table_no: meja,
  });

  const orders = data?.orders || [];
  const total = Number(data?.total || 0);

  return (
    <Shell backHref={backHref}>
      <header className="mb-6 text-center">
        <span className="eyebrow mx-auto">Meja {meja}</span>
        <h1 className="mt-3 text-2xl font-extrabold text-slate-900">Tagihan berjalan</h1>
        <p className="mt-1 text-sm text-slate-500">
          Pembayaran diselesaikan di kasir — halaman ini untuk mencocokkan dulu.
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          Tagihan belum bisa dimuat. Kalau ini terus terjadi, tunjukkan layar ini ke kasir kami.
        </div>
      )}

      {/*
        Tiga keadaan, bukan dua.

        Bentuk lama `!error && orders.length === 0 ? kosong : daftar` menjatuhkan
        kegagalan memuat ke cabang "daftar" dengan `orders` yang masih kosong —
        pelanggan membaca banner error DAN kartu tagihan berbunyi "Total 0
        pesanan · Rp 0" di bawahnya. Data yang gagal dimuat bukan berarti
        tagihannya nol, jadi keadaan itu sekarang tidak menampilkan angka
        apa pun.
      */}
      {error ? null : orders.length === 0 ? (
        <div className="card p-8 text-center">
          <span className="text-4xl">🫗</span>
          <h2 className="mt-4 font-bold text-slate-900">Belum ada tagihan di meja ini</h2>
          <p className="mt-2 text-sm text-slate-500">
            Semua pesanan meja {meja} sudah lunas, atau memang belum ada yang dipesan.
          </p>
          <Link
            href={t(`/menu?meja=${encodeURIComponent(meja)}&src=qr`)}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Mulai pesan
          </Link>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden p-0">
            <ul className="divide-y divide-slate-100">
              {orders.map((o) => (
                <li key={o.invoice_no} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-bold text-slate-900">{o.invoice_no}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {o.customer_name} · {formatDate(o.created_at)}
                      </p>
                    </div>
                    {/*
                      Dulu tertulis tetap "Belum dibayar".

                      Sekarang `get_table_bill` juga memulangkan pesanan yang
                      sedang dimasak dan yang sudah siap, jadi satu label untuk
                      tiga keadaan menyembunyikan justru yang paling ingin
                      diketahui pelanggan: kopinya sudah dibuat atau belum.
                      Semuanya memang sama-sama belum dibayar — itu sudah
                      dinyatakan total tagihan di bawah.
                    */}
                    <Badge tone={orderStatus(o.status).tone}>{orderStatus(o.status).label}</Badge>
                  </div>

                  <ul className="mt-4 space-y-2">
                    {(o.items || []).map((item, i) => (
                      <li key={`${o.invoice_no}-${i}`} className="flex justify-between gap-3 text-sm">
                        <span className="min-w-0 text-slate-600">
                          {item.product_name}{' '}
                          <span className="text-slate-400">× {item.qty}</span>
                        </span>
                        <span className="shrink-0 font-semibold text-slate-900">
                          {rupiah(item.subtotal)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                    <span className="text-slate-500">
                      {PAYMENT_LABEL[o.payment_method] || o.payment_method}
                    </span>
                    <span className="font-bold text-slate-900">{rupiah(o.total)}</span>
                  </div>

                  {/*
                    Ajakannya berbeda untuk pesanan QRIS: yang menunggu di
                    balik tautan itu bukan sekadar bukti, tapi kode yang harus
                    dipindai supaya pesanannya terbayar.
                  */}
                  <Link
                    href={t(`/struk/${encodeURIComponent(o.invoice_no)}`)}
                    className="mt-3 inline-block text-xs font-semibold text-brand-600 transition hover:text-brand-700"
                  >
                    {o.payment_method === 'qris'
                      ? 'Buka kode QRIS untuk membayar →'
                      : 'Buka bukti pesanan ini →'}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between border-t-2 border-slate-200 bg-slate-50 px-5 py-4">
              <span className="font-semibold text-slate-700">
                Total {orders.length} pesanan
              </span>
              <span className="text-2xl font-extrabold text-brand-700">{rupiah(total)}</span>
            </div>
          </div>

          {/*
            Halaman inilah yang paling sering ditinggal terbuka: pelanggan
            membukanya untuk dicocokkan kasir, lalu meletakkan HP-nya di meja.
            Begitu kasir menandai lunas, `get_table_bill` berhenti memulangkan
            pesanan itu dan tagihannya menyusut sendiri sampai halaman berganti
            jadi "Belum ada tagihan di meja ini".
          */}
          <LiveOrderStatus
            active={orders.length > 0}
            label="Menunggu kasir memproses pembayaran"
            className="mt-5"
          />

          <div className="card mt-6 p-6">
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-600">
              Cara membayar
            </p>
            <ol className="mt-3 space-y-2.5">
              {CARA_BAYAR.map((text, i) => (
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

          {/*
            `mode=tambah` bukan hiasan: tanpa itu pelanggan mendarat di layar
            "Mau ngopi apa hari ini?" tanpa tagihan berjalan yang barusan ia
            lihat — seolah tambahannya jadi tagihan baru. `src=qr` menjaga
            stepper tidak kembali menuntut "Pilih meja" pada orang yang mejanya
            sudah jelas.
          */}
          <Link
            href={t(`/menu?meja=${encodeURIComponent(meja)}&src=qr&mode=tambah`)}
            className="mt-6 flex w-full items-center justify-center rounded-xl border border-brand-200 bg-white px-5 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            Tambah pesanan lagi
          </Link>
        </>
      )}
    </Shell>
  );
}

function Shell({ backHref, children }) {
  return (
    <div className="surface-warm py-10 sm:py-14">
      <Container>
        <div className="mx-auto w-full max-w-lg">
          <Link href={backHref} className="link-muted mb-6 inline-block text-sm">
            ← Kembali
          </Link>
          {children}
        </div>
      </Container>
    </div>
  );
}
