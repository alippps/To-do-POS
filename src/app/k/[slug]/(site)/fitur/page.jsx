import { redirect } from 'next/navigation';
import { tenantPath } from '@/lib/tenant';

/**
 * Halaman menu pindah dari /fitur ke /menu.
 * Redirect ini menjaga QR meja lama (yang masih menunjuk /fitur?meja=..) tetap berfungsi.
 */
export default function FiturPage({ params, searchParams }) {
  const meja = typeof searchParams?.meja === 'string' ? searchParams.meja.trim() : '';

  redirect(
    tenantPath(
      params.slug,
      meja ? `/meja?meja=${encodeURIComponent(meja)}&src=qr` : '/menu'
    )
  );
}
