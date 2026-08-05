import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/supabase/server';
import { canOpenAdminPath } from '@/lib/access';

/**
 * Penjaga halaman admin yang wewenangnya terbatas.
 *
 * Middleware sudah menahan permintaan lebih dulu, tapi lapis ini tetap ada
 * karena middleware bisa dilewati dalam beberapa kondisi (mis. navigasi
 * client-side yang mengambil RSC payload). Kasir yang memaksa membuka
 * /admin/produk akan dikembalikan ke dashboard, bukan disuguhi datanya.
 */
export async function requirePageAccess(pathname) {
  const { user, profile } = await getSessionUser();

  if (!user) redirect(`/login?next=${encodeURIComponent(pathname)}`);
  if (!canOpenAdminPath(profile?.role, pathname)) redirect('/admin');

  return profile;
}
