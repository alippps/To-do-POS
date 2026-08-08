import { TenantProvider } from '@/components/tenant/TenantProvider';
import { requireTenant } from '@/lib/tenant.server';

/**
 * Pangkal setiap outlet.
 *
 * Satu-satunya tugasnya: memastikan slug di URL benar-benar menunjuk outlet
 * yang ada, lalu menyediakan identitasnya untuk seluruh pohon di bawahnya —
 * termasuk komponen sisi klien lewat `TenantProvider`.
 *
 * Outlet yang tidak ada berhenti di sini sebagai 404, jadi tidak ada satu pun
 * halaman di bawahnya yang perlu menangani kasus "slug ngawur" sendiri-sendiri.
 */
export async function generateMetadata({ params }) {
  const tenant = await requireTenant(params.slug);

  return {
    title: {
      default: `${tenant.name} — ${tenant.tagline}`,
      template: `%s | ${tenant.name}`,
    },
    description: tenant.description || tenant.tagline,
    openGraph: {
      title: `${tenant.name} — ${tenant.tagline}`,
      description: tenant.description || tenant.tagline,
      type: 'website',
      locale: 'id_ID',
    },
  };
}

export default async function TenantLayout({ params, children }) {
  const tenant = await requireTenant(params.slug);

  return <TenantProvider tenant={tenant}>{children}</TenantProvider>;
}
