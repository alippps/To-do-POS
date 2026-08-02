import { redirect } from 'next/navigation';

/**
 * Halaman menu pindah dari /fitur ke /menu.
 * Redirect ini menjaga QR meja lama (yang masih menunjuk /fitur?meja=..) tetap berfungsi.
 */
export default function FiturPage({ searchParams }) {
  const meja = typeof searchParams?.meja === 'string' ? searchParams.meja : '';
  redirect(meja ? `/menu?meja=${encodeURIComponent(meja)}` : '/menu');
}
