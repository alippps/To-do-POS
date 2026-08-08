import Container from '@/components/ui/Container';

/** Kerangka /menu — meniru susunan penunjuk langkah, panduan, dan grid menu. */
export default function MenuLoading() {
  return (
    <div className="bg-slate-50 pb-28 pt-8 sm:pt-12 lg:pb-14">
      <Container>
        <div className="mb-8 flex gap-2 sm:gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-14 flex-1 rounded-2xl" />
          ))}
        </div>

        <div className="skeleton h-7 w-52" />
        <div className="skeleton mt-4 h-10 w-72 max-w-full" />
        <div className="skeleton mt-3 h-5 w-full max-w-2xl" />

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="skeleton mt-8 h-28 w-full rounded-2xl" />
            <div className="skeleton mt-6 h-24 w-full rounded-2xl" />

            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-80 w-full rounded-2xl" />
              ))}
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="skeleton mt-8 h-[520px] w-full rounded-2xl" />
          </div>
        </div>
      </Container>
    </div>
  );
}
