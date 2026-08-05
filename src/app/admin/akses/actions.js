'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

import { ROLES } from '@/lib/access';

/**
 * Ubah role sebuah akun (user / kasir / admin).
 *
 * Pengecekan admin + larangan menurunkan role diri sendiri dilakukan
 * di dalam RPC `admin_set_role` (SECURITY DEFINER), sehingga aturannya
 * tetap berlaku walau dipanggil dari mana pun.
 */
export async function setUserRole(userId, role) {
  const supabase = createClient();

  const { error } = await supabase.rpc('admin_set_role', {
    p_user_id: userId,
    p_role: role,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath('/admin/akses');
  revalidatePath('/admin');

  return {
    ok: true,
    message: `Role akun diubah menjadi ${ROLES[role]?.label || role}.`,
  };
}
