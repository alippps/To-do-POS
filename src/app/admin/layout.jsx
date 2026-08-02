import { redirect } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import { getSessionUser } from '@/lib/supabase/server';

export const metadata = {
  title: 'Admin',
};

export default async function AdminLayout({ children }) {
  const { user, profile } = await getSessionUser();

  // Lapis kedua setelah middleware — memastikan hanya admin yang lolos.
  if (!user) redirect('/login?next=/admin');
  if (profile?.role !== 'admin') redirect('/');

  return (
    <AdminShell profile={profile} email={user.email}>
      {children}
    </AdminShell>
  );
}
