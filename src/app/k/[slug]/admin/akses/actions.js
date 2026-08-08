'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

import { ROLES } from '@/lib/access';
import { tenantPath } from '@/lib/tenant';

/**
 * Ubah role sebuah akun (user / kasir / admin).
 *
 * Pengecekan admin + larangan menurunkan role diri sendiri dilakukan
 * di dalam RPC `admin_set_role` (SECURITY DEFINER), sehingga aturannya
 * tetap berlaku walau dipanggil dari mana pun.
 */
export async function setUserRole(slug, userId, role) {
  const supabase = createClient();

  /*
    Batas outlet dijaga di dalam RPC, bukan di sini.

    `admin_set_role` membaca `current_tenant_id()` dari profil pemanggilnya
    sendiri lalu hanya menyentuh akun ber-tenant sama — jadi slug di URL tidak
    bisa dipakai untuk menaikkan role orang di outlet lain, sekalipun
    parameternya dipalsukan. Slug di sini murni untuk menyegarkan cache
    halaman yang benar.
  */
  const { error } = await supabase.rpc('admin_set_role', {
    p_user_id: userId,
    p_role: role,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath(tenantPath(slug, '/admin/akses'));
  revalidatePath(tenantPath(slug, '/admin'));

  return {
    ok: true,
    message: `Role akun diubah menjadi ${ROLES[role]?.label || role}.`,
  };
}
