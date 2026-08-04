import Container from '@/components/ui/Container';
import SectionHeading from '@/components/ui/SectionHeading';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { rupiah } from '@/lib/format';
import { promoInfo } from '@/lib/promo';

export default function BestSeller({ products = [] }) {
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            align="left"
            eyebrow="Menu Favorit"
            title="Yang paling sering dipesan"
            description="Data menu di bawah diambil langsung dari database Supabase — sama persis dengan yang dikelola admin."
            className="max-w-xl"
          />
          {/* Ke katalog (baca saja), bukan ke halaman pemesanan. */}
          <Button href="/katalog" variant="secondary" className="shrink-0">
            Lihat semua menu →
          </Button>
        </div>

        {products.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center text-sm text-slate-500">
            Menu favorit belum tersedia saat ini. Silakan cek kembali sebentar lagi, atau lihat
            daftar menu lengkapnya.
          </div>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => {
              const { isPromo, basePrice, finalPrice, discountPercent } = promoInfo(p);

              return (
                <article key={p.id} className="card group overflow-hidden p-0 transition duration-300 hover:-translate-y-1 hover:shadow-pop">
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl">☕</div>
                    )}
                    <span className="absolute left-3 top-3">
                      <Badge tone="blue">{p.category}</Badge>
                    </span>
                    {isPromo && (
                      <span className="absolute right-3 top-3 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-extrabold text-white shadow-pop">
                        −{discountPercent}%
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-slate-900">{p.name}</h3>
                    <p className="mt-1.5 line-clamp-2 text-sm text-slate-500">{p.description || 'Menu pilihan barista kami.'}</p>
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <span className="flex items-baseline gap-2">
                        <span className={`text-lg font-extrabold ${isPromo ? 'text-rose-600' : 'text-brand-700'}`}>
                          {rupiah(finalPrice)}
                        </span>
                        {isPromo && (
                          <span className="text-xs font-medium text-slate-400 line-through">{rupiah(basePrice)}</span>
                        )}
                      </span>
                      <span className="shrink-0 text-xs text-slate-400">Stok {p.stock}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Container>
    </section>
  );
}
