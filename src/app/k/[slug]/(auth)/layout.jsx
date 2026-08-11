import Link from 'next/link';
import Logo from '@/components/layout/Logo';
import { STAFF_ROLES } from '@/lib/access';
import { getSessionUser } from '@/lib/supabase/server';
import { tenantPath } from '@/lib/tenant';
import { requireTenant } from '@/lib/tenant.server';

const POINTS = [
  'Kasir digital & pemesanan QR dalam satu sistem',
  'CRUD produk lengkap dengan pencarian instan',
  'Laporan penjualan real-time untuk pemilik outlet',
  'Kelola denah meja & hak akses staf dari satu tempat',
];

export default async function AuthLayout({ params, children }) {
  const tenant = await requireTenant(params.slug);

  /*
    Ajakan "pesan tanpa akun" di bawah ditujukan kepada satu orang saja:
    pelanggan yang tersesat ke form login dan mengira harus mendaftar dulu
    sebelum bisa memesan kopi. Admin dan kasir yang sesinya sedang aktif jelas
    bukan orang itu — mereka membuka halaman ini untuk masuk ke dashboard atau
    untuk keluar dari sesi, dan `SessionPanel` sudah menyediakan keduanya
    lengkap dengan tautannya sendiri ke halaman pemesanan pelanggan.

    Yang dipakai cuma role, bukan "staf di outlet ini". Admin outlet lain tetap
    seorang admin; menawarinya "cuma mau pesan kopi?" sama salah sasarannya.

    `getSessionUser()` di-memo per permintaan, jadi pertanyaan yang sama dari
    halaman di dalam layout ini tidak menambah satu pun perjalanan ke Supabase.
  */
  const { profile } = await getSessionUser();
  const pembukanyaStaf = STAFF_ROLES.includes(profile?.role);

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

          {/*
            Penegasan penting: login ini untuk STAF/ADMIN.
            Pelanggan yang cuma mau memesan sama sekali tidak butuh akun.
          */}
          {!pembukanyaStaf && (
            <div className="mt-8 rounded-2xl border border-brand-100 bg-brand-50/60 p-4 text-center">
              <p className="text-sm font-semibold text-slate-800">Cuma mau pesan kopi?</p>
              <p className="mt-1 text-xs text-slate-500">
                Pelanggan <span className="font-semibold">tidak perlu akun</span>. Langsung pilih
                meja dan pesan dari halaman menu.
              </p>
              <Link
                href={tenantPath(tenant.slug, '/meja')}
                className="mt-3 inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Pesan tanpa login →
              </Link>
            </div>
          )}

          <p className="mt-6 text-center text-sm">
            <Link href={tenantPath(tenant.slug)} className="link-muted">
              ← Kembali ke beranda {tenant.name}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
