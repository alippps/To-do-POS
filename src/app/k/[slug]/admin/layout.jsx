import { redirect } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import { getStaffOfTenant } from '@/lib/supabase/server';
import { tenantPath } from '@/lib/tenant';
import { requireTenant } from '@/lib/tenant.server';

export const metadata = {
  title: 'Admin',
};

/**
 * Lapis kedua setelah middleware.
 *
 * Dua hal diperiksa: pemanggil berperan staf, DAN staf di outlet yang sedang
 * dibuka. Pertanyaan kedua baru ada sejak v4 — sebelumnya "admin" berarti admin
 * di satu-satunya kedai yang ada. Sekarang admin Kopi Pagi yang mengetik
 * /k/roti-88/admin harus ditolak sekeras tamu yang belum masuk.
 *
 * Batas per halaman (produk, meja, akses) tetap dijaga middleware dan penjaga
 * di masing-masing page.jsx.
 */
export default async function AdminLayout({ params, children }) {
  const tenant = await requireTenant(params.slug);
  const { user, profile, reason } = await getStaffOfTenant(tenant.id);

  if (reason === 'anon') {
    redirect(`${tenantPath(tenant.slug, '/login')}?next=${encodeURIComponent(tenantPath(tenant.slug, '/admin'))}`);
  }

  if (reason) redirect(tenantPath(tenant.slug));

  return (
    <AdminShell profile={profile} email={user.email} role={profile.role} tenant={tenant}>
      {children}
    </AdminShell>
  );
}
