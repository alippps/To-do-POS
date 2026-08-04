import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/** Supabase client untuk Server Component / Server Action / Route Handler. */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Dipanggil dari Server Component — diabaikan karena
            // refresh session sudah ditangani oleh middleware.
          }
        },
      },
    }
  );
}

/**
 * Client untuk data PUBLIK yang tidak bergantung pada siapa yang membuka —
 * daftar produk di landing page dan katalog.
 *
 * Bedanya dengan `createClient()`: yang ini tidak menyentuh cookie sama
 * sekali. Itu bukan detail sepele — `cookies()` adalah dynamic API, dan sekali
 * dipanggil, Next mencoret halamannya dari render statis sehingga `revalidate`
 * jadi tidak berguna. Tanpa cookie, halamannya boleh di-cache dan disajikan
 * nyaris seketika.
 *
 * Aman karena tabel `products` memang punya policy "publik boleh baca" dan
 * kunci yang dipakai tetap anon key yang sama.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

/** Ambil user + profil (berisi role) sekaligus. */
export async function getSessionUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, phone, role')
    .eq('id', user.id)
    .single();

  return { user, profile };
}
