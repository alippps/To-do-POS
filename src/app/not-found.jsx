import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      <p className="text-7xl font-black text-brand-600">404</p>
      <h1 className="mt-4 text-2xl font-extrabold text-slate-900 sm:text-3xl">Halaman tidak ditemukan</h1>
      <p className="mt-3 max-w-md text-slate-500">
        Sepertinya halaman yang Anda cari sudah dipindahkan atau tidak pernah ada. Mari kembali ke beranda.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-pop transition hover:bg-brand-700"
        >
          Kembali ke Beranda
        </Link>
        {/*
          Dulu "Lihat Menu" → `/katalog`. Menu adalah milik sebuah outlet, dan
          halaman ini justru satu-satunya tempat yang tidak tahu outlet mana —
          ia melayani seluruh alamat yang tidak cocok, termasuk yang di luar
          `/k/<slug>`. Tautannya menuju alamat yang tidak ada: halaman 404 yang
          menawarkan 404 berikutnya. Direktori outlet yang bisa menjawabnya.
        */}
        <Link
          href="/#outlet"
          className="rounded-xl border border-brand-200 px-6 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
        >
          Lihat Daftar Outlet
        </Link>
      </div>
    </div>
  );
}
