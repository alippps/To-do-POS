import { redirect } from 'next/navigation';
import RegisterForm from '@/components/auth/RegisterForm';
import { getSessionUser } from '@/lib/supabase/server';
import { tenantPath } from '@/lib/tenant';
import { requireTenant } from '@/lib/tenant.server';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Daftar',
  description: 'Buat akun To Do gratis.',
};

/**
 * Pendaftaran staf — sengaja tidak ditautkan dari sisi publik.
 *
 * Sesi yang sudah aktif dialihkan ke `/login`, karena di situlah `SessionPanel`
 * berada: siapa yang masuk, role-nya, dan tombol keluar. Tanpa pengalihan ini,
 * staf yang sudah masuk lalu membuka `/register` disambut form "Buat akun staf"
 * yang tidak bisa ia pakai untuk apa pun — dan tidak ada tombol keluar di
 * sekitarnya karena sisi publik memang tidak menyediakannya.
 */
export default async function RegisterPage({ params }) {
  const tenant = await requireTenant(params.slug);
  const { user } = await getSessionUser();

  if (user) redirect(tenantPath(tenant.slug, '/login'));

  return <RegisterForm />;
}
