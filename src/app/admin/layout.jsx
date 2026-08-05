import { redirect } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import { getSessionUser } from '@/lib/supabase/server';
import { STAFF_ROLES } from '@/lib/access';

export const metadata = {
  title: 'Admin',
};

/**
 * Lapis kedua setelah middleware.
 *
 * Di sini hanya diperiksa "apakah pemanggil berperan staf" — layout tidak tahu
 * halaman mana yang sedang dibuka. Batas per halaman dijaga middleware dan
 * penjaga di masing-masing page.jsx yang terbatas (produk, meja, akses).
 */
export default async function AdminLayout({ children }) {
  const { user, profile } = await getSessionUser();

  if (!user) redirect('/login?next=/admin');
  if (!STAFF_ROLES.includes(profile?.role)) redirect('/');

  return (
    <AdminShell profile={profile} email={user.email} role={profile.role}>
      {children}
    </AdminShell>
  );
}
