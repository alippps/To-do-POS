import { redirect } from 'next/navigation';
import { createClient, getSessionUser } from '@/lib/supabase/server';
import { canOpenAdminPath } from '@/lib/access';
import { slugValid, tenantPath } from '@/lib/tenant';
import { getTenant } from '@/lib/tenant.server';

/**
 * Penjaga HALAMAN admin yang wewenangnya terbatas.
 *
 * Middleware sudah menahan permintaan lebih dulu, tapi lapis ini tetap ada
 * karena middleware bisa dilewati dalam beberapa kondisi (mis. navigasi
 * client-side yang mengambil RSC payload). Kasir yang memaksa membuka
 * /admin/produk akan dikembalikan ke dashboard, bukan disuguhi datanya.
 *
 * @param {string} slug     slug outlet dari `params.slug`
 * @param {string} pathname path TANPA awalan outlet, mis. '/admin/produk'
 */
export async function requirePageAccess(slug, pathname) {
  const tenant = await getTenant(slug);
  if (!tenant) redirect('/');

  const { user, profile } = await getSessionUser();
  const tujuan = tenantPath(slug, pathname);

  if (!user) redirect(`${tenantPath(slug, '/login')}?next=${encodeURIComponent(tujuan)}`);

  // Dua syarat, bukan satu: perannya mengizinkan halaman ini, DAN ia memang
  // staf outlet ini. Lihat catatan panjang di src/lib/supabase/middleware.js.
  if (!canOpenAdminPath(profile?.role, pathname) || profile?.tenant_id !== tenant.id) {
    redirect(tenantPath(slug, '/admin'));
  }

  return { profile, tenant };
}

/**
 * Penjaga SERVER ACTION.
 *
 * Dulu tiap berkas action menuliskan penjaganya sendiri — lima salinan dari
 * fungsi yang sama, dan tiap salinan harus diingat saat aturannya berubah.
 * Sejak v4 aturannya bertambah satu (outlet mana), dan menyalin perubahan itu
 * lima kali adalah cara paling pasti untuk melewatkan salah satunya.
 *
 * Mengembalikan `tenantId` supaya pemanggilnya bisa menyaring kueri tulisnya.
 * RLS tetap menjaga di lapis terakhir, tapi menyaring di sini membuat aksi
 * yang salah sasaran gagal dengan pesan yang bisa dibaca — bukan "0 rows
 * updated" yang senyap.
 *
 * @param {string} tenantSlug
 * @param {{ kasirBoleh?: boolean }} opsi
 */
export async function requireStaffAction(tenantSlug, { kasirBoleh = false } = {}) {
  const supabase = createClient();

  if (!slugValid(tenantSlug)) {
    return { supabase, tenantId: null, error: 'Outlet tidak dikenali.' };
  }

  const tenant = await getTenant(tenantSlug);
  if (!tenant) return { supabase, tenantId: null, error: 'Outlet tidak dikenali.' };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, tenantId: null, error: 'Anda harus login terlebih dahulu.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single();

  const peranBoleh = kasirBoleh
    ? ['admin', 'kasir'].includes(profile?.role)
    : profile?.role === 'admin';

  if (!peranBoleh) {
    return {
      supabase,
      tenantId: null,
      error: kasirBoleh ? 'Akses ditolak: khusus admin & kasir.' : 'Akses ditolak: khusus admin.',
    };
  }

  if (profile?.tenant_id !== tenant.id) {
    return { supabase, tenantId: null, error: 'Akses ditolak: outlet ini bukan milik akun Anda.' };
  }

  return { supabase, tenantId: tenant.id, error: null };
}

/** Pintasan untuk aksi yang hanya boleh dijalankan admin. */
export function requireAdminAction(tenantSlug) {
  return requireStaffAction(tenantSlug, { kasirBoleh: false });
}
