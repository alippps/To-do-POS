import { Suspense } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import SessionPanel from '@/components/auth/SessionPanel';
import { getSessionUser } from '@/lib/supabase/server';
import { requireTenant } from '@/lib/tenant.server';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Masuk',
  description: 'Masuk ke akun To Do Anda.',
};

/**
 * Pintu masuk staf — sengaja tidak ditautkan dari mana pun di sisi publik.
 *
 * Kalau sesinya sudah aktif, form login diganti panel sesi: di situlah staf
 * melihat sedang masuk sebagai siapa dan bisa keluar. Sisi publik tidak lagi
 * menyediakan keduanya.
 */
export default async function LoginPage({ params }) {
  const tenant = await requireTenant(params.slug);
  const { user, profile } = await getSessionUser();

  if (user) {
    return (
      <SessionPanel
        email={user.email}
        fullName={profile?.full_name || ''}
        role={profile?.role || 'user'}
        // Staf outlet LAIN tidak diberi tombol "Buka Dashboard" di sini:
        // dashboard yang dimaksud bukan milik outlet yang sedang dibuka.
        outletSendiri={profile?.tenant_id === tenant.id}
      />
    );
  }

  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-slate-100" />}>
      <LoginForm />
    </Suspense>
  );
}
