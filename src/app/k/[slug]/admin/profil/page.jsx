import PageHeader from '@/components/admin/PageHeader';
import ProfileManager from '@/components/admin/ProfileManager';
import { requirePageAccess } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Profil Outlet' };

/*
  Halaman yang membuat /about dan /kontak jadi milik outletnya sendiri.

  Sampai v5 kedua halaman itu menampilkan teks yang ditulis tetap di dalam kode,
  jadi semua outlet menceritakan hal yang persis sama. Memindahkan ceritanya ke
  database saja tidak cukup — tanpa layar ini, outlet yang mendaftar lewat
  /daftar-outlet tidak punya cara mengisinya selain meminta tolong orang yang
  memegang akses SQL Editor.

  Khusus admin: kasir tidak diberi halaman ini, sama seperti Produk dan Denah
  Meja. Yang diubah di sini adalah wajah kedai di mata pelanggan — wewenang
  pemilik, bukan petugas yang sedang melayani antrean.
*/
export default async function AdminProfilPage({ params }) {
  const { tenant } = await requirePageAccess(params.slug, '/admin/profil');

  return (
    <>
      <PageHeader
        title="Profil Outlet"
        description="Identitas, cerita, jam buka, kontak, dan sosial media kedai Anda. Semuanya tampil di halaman pelanggan."
      />

      <ProfileManager tenant={tenant} />
    </>
  );
}
