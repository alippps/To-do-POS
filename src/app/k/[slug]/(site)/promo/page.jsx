import Link from 'next/link';
import Container from '@/components/ui/Container';
import Badge from '@/components/ui/Badge';
import { createPublicClient } from '@/lib/supabase/server';
import { rupiah } from '@/lib/format';
import { activePromos, promoInfo } from '@/lib/promo';
import { tenantPath } from '@/lib/tenant';
import { requireTenant } from '@/lib/tenant.server';

export const revalidate = 30;

export const metadata = {
  title: 'Promo Hari Ini',
  description: 'Menu yang sedang diskon hari ini. Harga promo langsung berlaku saat kamu memesan.',
};

/**
 * Promo Hari Ini — salah satu dari empat pilihan pada layar hasil scan QR.
 *
 * Sumber datanya kolom `promo_price` di tabel `products`, diatur admin lewat
 * /admin/produk. Tidak ada tabel promo terpisah: dengan begitu promo tidak
 * mungkin melenceng dari menu yang benar-benar dijual, dan `create_order()`
 * memakai aturan harga yang sama persis saat menghitung total.
 */
export default async function PromoPage({ params, searchParams }) {
  const tenant = await requireTenant(params.slug);
  const t = (path) => tenantPath(tenant.slug, path);

  const meja = typeof searchParams?.meja === 'string' ? searchParams.meja.trim() : '';
  const q = meja ? `?meja=${encodeURIComponent(meja)}` : '';
  const backHref = t(meja ? `/meja?meja=${encodeURIComponent(meja)}` : '/katalog');

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select('id, name, category, price, promo_price, stock, description, image_url')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .not('promo_price', 'is', null)
    .order('name', { ascending: true });

  // Filter terakhir di sini karena promo_price yang lebih besar dari price
  // bukan promo — aturannya ada di lib/promo.js supaya seragam di semua halaman.
  const promos = activePromos(data || []);

  return (
    <div className="bg-slate-50 py-10 sm:py-14">
      <Container>
        <Link href={backHref} className="link-muted mb-6 inline-block text-sm">
          ← Kembali
        </Link>

        <header className="mb-10 max-w-2xl">
          <span className="eyebrow">🔥 Promo Hari Ini</span>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Lagi ada potongan harga
          </h1>
          <p className="mt-3 text-base text-slate-500">
            Harga promo langsung berlaku saat kamu memesan — tidak perlu kode apa pun.
            {meja && (
              <>
                {' '}
                Pesananmu akan tercatat untuk <span className="font-semibold text-slate-700">Meja {meja}</span>.
              </>
            )}
          </p>
        </header>

        {error && (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            Promo belum bisa dimuat saat ini. Silakan coba beberapa saat lagi.
          </div>
        )}

        {/*
          Gagal memuat ≠ tidak ada promo. Bentuk lama menjatuhkan kasus error ke
          cabang "ada promo" dengan daftar kosong, sehingga di bawah banner
          kegagalan masih terpampang ajakan "Mau ambil promonya?" tanpa satu pun
          promo di atasnya.
        */}
        {error ? null : promos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
            <span className="text-4xl">☕</span>
            <p className="mt-4 font-semibold text-slate-800">Belum ada promo hari ini</p>
            <p className="mt-1 text-sm text-slate-500">
              Menu reguler tetap tersedia dengan harga normal.
            </p>
            <Link
              href={t(`/menu${q}`)}
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Lihat menu
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {promos.map((p) => (
                <PromoCard key={p.id} product={p} />
              ))}
            </div>

            <div className="mt-12 rounded-3xl border border-brand-100 bg-white p-8 text-center shadow-card">
              <h2 className="font-display text-2xl font-bold text-slate-900">Mau ambil promonya?</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Harga promo otomatis terpakai di keranjang. Tidak perlu menyebut apa pun ke kasir.
              </p>
              <Link
                href={t(`/menu${q}`)}
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-brand-600 px-6 py-3.5 text-base font-semibold text-white shadow-pop transition hover:bg-brand-700"
              >
                Pesan sekarang
              </Link>
            </div>
          </>
        )}
      </Container>
    </div>
  );
}

function PromoCard({ product }) {
  const { basePrice, finalPrice, discountPercent } = promoInfo(product);
  const habis = product.stock <= 0;

  return (
    <article className={`card flex flex-col overflow-hidden p-0 ${habis ? 'opacity-60' : ''}`}>
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">☕</div>
        )}

        <span className="absolute left-3 top-3">
          <Badge tone="blue">{product.category}</Badge>
        </span>

        <span className="absolute right-3 top-3 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-extrabold text-white shadow-pop">
          −{discountPercent}%
        </span>

        {habis && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-bold uppercase tracking-wider text-slate-500">
            Stok habis
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-bold text-slate-900">{product.name}</h3>
        <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-500">
          {product.description || 'Menu pilihan barista kami.'}
        </p>

        <div className="mt-4 flex items-baseline gap-2.5 border-t border-slate-100 pt-4">
          <span className="text-lg font-extrabold text-rose-600">{rupiah(finalPrice)}</span>
          <span className="text-sm font-medium text-slate-400 line-through">
            {rupiah(basePrice)}
          </span>
        </div>
      </div>
    </article>
  );
}
