import { redirect } from 'next/navigation';
import { tenantPath } from '@/lib/tenant';

/**
 * Halaman menu pindah dari /fitur ke /menu.
 * Redirect ini menjaga QR meja lama (yang masih menunjuk /fitur?meja=..) tetap berfungsi.
 */
export default function FiturPage({ params, searchParams }) {
  const meja = typeof searchParams?.meja === 'string' ? searchParams.meja : '';
  redirect(
    tenantPath(params.slug, meja ? `/menu?meja=${encodeURIComponent(meja)}` : '/menu')
  );
}
