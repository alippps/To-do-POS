import Link from 'next/link';
import Logo from '@/components/layout/Logo';
import { tenantPath } from '@/lib/tenant';
import { requireTenant } from '@/lib/tenant.server';

const POINTS = [
  'Kasir digital & pemesanan QR dalam satu sistem',
  'CRUD produk lengkap dengan pencarian instan',
  'Laporan penjualan real-time untuk pemilik outlet',
  'Kelola denah meja & hak akses staf dari satu tempat',
];

/*
  Halaman ini melayani SATU orang: staf yang hendak masuk.

  Dulu di bawah formulirnya ada kartu "Cuma mau pesan kopi? — pelanggan tidak
  perlu akun" beserta tombol "Pesan tanpa login". Kartu itu masuk akal waktu
  `/login` masih bisa dicapai tanpa sengaja; sekarang tidak ada satu pun tautan
  ke sini dari sisi publik kecuali "Masuk Staf" di baris paling bawah footer.
  Yang sampai ke halaman ini sudah tahu ia mencari pintu staf — menawarinya
  memesan kopi cuma menambah satu ajakan yang tidak pernah ditekan siapa pun,
  dan menghitung role pembukanya hanya untuk menyembunyikan kartu itu jadi
  pekerjaan tanpa tujuan.
*/
export default async function AuthLayout({ params, children }) {
  const tenant = await requireTenant(params.slug);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panel kiri — hanya tampil di layar besar */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-brand-400/30 blur-3xl" />
        </div>

        <div className="relative">
          <Logo dark />
        </div>

        <div className="relative">
          <h2 className="text-3xl font-extrabold leading-tight text-white">
            Kelola {tenant.name} dari satu dashboard.
          </h2>
          <ul className="mt-8 space-y-4">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-brand-50">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-brand-100">
          © {new Date().getFullYear()} {tenant.name}. {tenant.tagline}.
        </p>
      </div>

      {/* Panel kanan — form */}
      <div className="flex flex-col justify-center bg-white px-5 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Logo />
          </div>
          {children}

          <p className="mt-8 text-center text-sm">
            <Link href={tenantPath(tenant.slug)} className="link-muted">
              ← Kembali ke beranda {tenant.name}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
