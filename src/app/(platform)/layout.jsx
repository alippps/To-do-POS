import PlatformNavbar from '@/components/platform/PlatformNavbar';
import PlatformFooter from '@/components/platform/PlatformFooter';
import { listTenants } from '@/lib/tenant.server';

/*
  Kerangka halaman PLATFORM: landing sistem (`/`) dan pendaftaran outlet
  (`/daftar-outlet`).

  Kelompok rute `(platform)` tidak muncul di URL — ia hanya memberi kedua
  halaman itu navbar dan footernya sendiri. Pemisahannya dari `k/[slug]`
  bukan soal kerapian berkas melainkan soal siapa yang dibicarakan: halaman di
  sini menjelaskan SISTEMNYA kepada calon pemilik usaha, sedangkan halaman di
  dalam outlet melayani pelanggan yang sedang duduk di kedai. Sampai v5 keduanya
  bertumpuk di satu landing — pengunjung Roti Bakar 88 disuguhi portfolio,
  testimoni, dan FAQ tentang perangkat lunaknya, padahal ia cuma mau lihat menu.
*/
export default async function PlatformLayout({ children }) {
  const outlets = await listTenants();

  return (
    <>
      <PlatformNavbar />
      <main className="min-h-screen">{children}</main>
      <PlatformFooter outlets={outlets} />
    </>
  );
}
