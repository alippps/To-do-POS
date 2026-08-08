import Container from '@/components/ui/Container';

/**
 * Kerangka bawaan untuk seluruh halaman publik.
 *
 * Selain memberi umpan balik seketika saat halaman diklik, keberadaan
 * `loading.jsx` inilah yang membuat Next boleh mem-prefetch rute dinamis:
 * tanpa batas Suspense, `<Link>` tidak punya apa pun untuk diambil di muka,
 * jadi browser diam di halaman lama sampai server selesai.
 */
export default function SiteLoading() {
  return (
    <div className="py-10 sm:py-14">
      <Container>
        <div className="skeleton h-6 w-40" />
        <div className="skeleton mt-5 h-10 w-3/4 max-w-xl" />
        <div className="skeleton mt-4 h-5 w-full max-w-2xl" />
        <div className="skeleton mt-2 h-5 w-2/3 max-w-lg" />

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-56 w-full rounded-2xl" />
          ))}
        </div>
      </Container>
    </div>
  );
}
