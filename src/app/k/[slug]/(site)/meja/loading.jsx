import Container from '@/components/ui/Container';

/** Kerangka /meja — penunjuk langkah, ringkasan status, lalu grid kartu meja. */
export default function MejaLoading() {
  return (
    <div className="surface-warm py-10 sm:py-14">
      <Container>
        <div className="mb-8 flex gap-2 sm:gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-14 flex-1 rounded-2xl" />
          ))}
        </div>

        <div className="skeleton h-7 w-56" />
        <div className="skeleton mt-4 h-10 w-96 max-w-full" />
        <div className="skeleton mt-3 h-5 w-full max-w-2xl" />

        <div className="skeleton mt-8 h-24 w-full rounded-2xl" />

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-32 w-full rounded-2xl" />
          ))}
        </div>
      </Container>
    </div>
  );
}
