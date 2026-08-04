/**
 * Kerangka untuk seluruh halaman admin.
 *
 * Tiap halaman admin `force-dynamic` dan menembak Supabase, jadi tanpa batas
 * Suspense perpindahan antar-menu terasa menggantung di halaman lama.
 */
export default function AdminLoading() {
  return (
    <div>
      <div className="skeleton h-8 w-56" />
      <div className="skeleton mt-3 h-5 w-full max-w-xl" />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-28 w-full rounded-2xl" />
        ))}
      </div>

      <div className="skeleton mt-6 h-16 w-full rounded-2xl" />
      <div className="skeleton mt-6 h-96 w-full rounded-2xl" />
    </div>
  );
}
