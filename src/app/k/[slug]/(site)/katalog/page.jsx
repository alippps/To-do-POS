import Link from 'next/link';
import Container from '@/components/ui/Container';
import Badge from '@/components/ui/Badge';
import { createPublicClient } from '@/lib/supabase/server';
import { rupiah } from '@/lib/format';
import { promoInfo } from '@/lib/promo';
import { tenantPath } from '@/lib/tenant';
import { requireTenant } from '@/lib/tenant.server';

/*
  Katalog boleh sedikit basi — isinya cuma daftar menu dan harga, bukan angka
  yang dipakai bertransaksi. Stok tetap divalidasi ulang saat checkout di /menu.

  Sejak halaman ini membaca `?meja=`, rendernya per permintaan (Next
  menganggap `searchParams` sebagai sumber dinamis) — jadi halamannya sendiri
  tidak lagi ter-prerender seperti dulu. Yang mahal tetap hemat: query Supabase
  lewat `createPublicClient()` tidak membawa cookie, sehingga `revalidate` di
  bawah masih berlaku untuk hasil fetch-nya dan satu bacaan dipakai bersama
  selama 30 detik oleh semua pengunjung.
*/
export const revalidate = 30;

export const metadata = {
  title: 'Katalog Menu',
  description: 'Daftar lengkap menu beserta harganya. Lihat-lihat dulu, pesan kapan pun kamu siap.',
};

/**
 * Katalog — halaman BACA SAJA.
 *
 * Sengaja tidak punya keranjang, tombol tambah, maupun form apa pun: tugasnya
 * hanya memperlihatkan menu dan harga. Pemesanan tetap satu pintu di `/menu`
 * lewat satu CTA di bawah halaman, supaya pengunjung yang cuma mau lihat-lihat
 * tidak merasa didorong bertransaksi.
 */
export default async function KatalogPage({ params, searchParams }) {
  const tenant = await requireTenant(params.slug);
  /*
    Katalog ikut membawa nomor meja.

    Tile "Menu" pada layar hasil scan QR mengarah ke sini, jadi yang membuka
    halaman ini sering kali sedang duduk di sebuah meja. Tanpa membaca `meja`,
    satu-satunya ajakan di bawah halaman melempar mereka kembali ke denah untuk
    "memilih meja" yang sudah mereka duduki — persis pekerjaan mengada-ada yang
    ScanHub dibuat untuk menghapus.
  */
  const meja = typeof searchParams?.meja === 'string' ? searchParams.meja.trim() : '';
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from('products')
    .select('id, name, category, price, promo_price, stock, description, image_url')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  const products = data || [];

  // Kelompokkan per kategori sambil mempertahankan urutan dari database.
  const grouped = products.reduce((acc, p) => {
    (acc[p.category] ||= []).push(p);
    return acc;
  }, {});
  const categories = Object.keys(grouped);

  return (
    <div className="bg-slate-50 py-10 sm:py-14">
      <Container>
        {meja && (
          <Link
            href={tenantPath(tenant.slug, `/meja?meja=${encodeURIComponent(meja)}`)}
            className="link-muted mb-6 inline-block text-sm"
          >
            ← Kembali ke Meja {meja}
          </Link>
        )}

        <header className="mb-10 max-w-2xl">
          <span className="eyebrow">Katalog</span>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Daftar menu lengkap
          </h1>
          <p className="mt-3 text-base text-slate-500">
            Semua menu beserta harganya. Halaman ini untuk lihat-lihat dulu — tidak ada keranjang,
            tidak ada yang perlu diisi.
          </p>
        </header>

        {error && (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            Menu belum bisa dimuat saat ini. Silakan coba beberapa saat lagi.
          </div>
        )}

        {!error && products.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
            <p className="font-semibold text-slate-800">Belum ada menu yang tersedia</p>
            <p className="mt-1 text-sm text-slate-500">Silakan cek kembali sebentar lagi.</p>
          </div>
        )}

        <div className="space-y-12">
          {categories.map((category) => (
            <section key={category}>
              <div className="mb-5 flex items-baseline justify-between gap-4 border-b border-slate-200 pb-3">
                <h2 className="font-display text-xl font-bold text-slate-900">{category}</h2>
                <span className="shrink-0 text-xs font-medium text-slate-400">
                  {grouped[category].length} menu
                </span>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {grouped[category].map((p) => (
                  <CatalogCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Satu-satunya ajakan memesan di halaman ini, sengaja ditaruh di ujung. */}
        {products.length > 0 && (
          <div className="mt-14 rounded-3xl border border-brand-100 bg-white p-8 text-center shadow-card sm:p-10">
            <h2 className="font-display text-2xl font-bold text-slate-900">Sudah menemukan yang pas?</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {meja
                ? `Pesan langsung dari Meja ${meja} — tanpa akun, tanpa antre di kasir.`
                : 'Pilih meja dulu, lalu pesan langsung dari HP. Tanpa akun, tanpa antre.'}
            </p>
            <Link
              href={tenantPath(
                tenant.slug,
                meja ? `/menu?meja=${encodeURIComponent(meja)}&src=qr` : '/meja'
              )}
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-brand-600 px-6 py-3.5 text-base font-semibold text-white shadow-pop transition hover:bg-brand-700"
            >
              {meja ? `Pesan untuk Meja ${meja}` : 'Mulai pesan'}
            </Link>
          </div>
        )}
      </Container>
    </div>
  );
}

function CatalogCard({ product }) {
  const habis = product.stock <= 0;
  const { isPromo, basePrice, finalPrice, discountPercent } = promoInfo(product);

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

        {isPromo && (
          <span className="absolute right-3 top-3 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-extrabold text-white shadow-pop">
            −{discountPercent}%
          </span>
        )}

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
          <span className={`text-lg font-extrabold ${isPromo ? 'text-rose-600' : 'text-brand-700'}`}>
            {rupiah(finalPrice)}
          </span>
          {isPromo && (
            <span className="text-sm font-medium text-slate-400 line-through">
              {rupiah(basePrice)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
