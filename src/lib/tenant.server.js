import { cache } from 'react';
import { notFound } from 'next/navigation';
import { createPublicClient } from '@/lib/supabase/server';
import { slugValid } from '@/lib/tenant';

/**
 * Pembacaan outlet dari database — KHUSUS komponen & aksi server.
 *
 * Dipisah dari `lib/tenant.js` karena berkas ini menarik `lib/supabase/server`,
 * yang menyentuh `next/headers`. Komponen klien seperti Footer dan Logo juga
 * butuh helper outlet (tautan, nomor WhatsApp) — kalau semuanya satu berkas,
 * satu impor dari sisi klien menyeret modul server ke bundle browser dan
 * build-nya berhenti.
 *
 * Identitas usaha kini DATA, bukan konfigurasi build: sampai v3 nama, alamat,
 * jam buka, dan nomor WhatsApp ditulis di `src/lib/site.js` — satu berkas untuk
 * satu kedai. Begitu satu pemasangan melayani banyak UMKM, berkas yang dibundel
 * saat build tidak bisa lagi menjawab "kedai yang mana".
 */

/*
  `cache()` membuat satu render hanya sekali menanyakan outletnya ke database.

  Dalam satu halaman, tenant dibaca oleh layout (navbar & footer), oleh
  `generateMetadata`, dan lagi oleh page-nya sendiri. Tanpa pembungkus ini,
  satu kunjungan berarti tiga kueri identik yang saling menunggu.
*/
export const getTenant = cache(async (slug) => {
  if (!slugValid(slug)) return null;

  const supabase = createPublicClient();
  const { data } = await supabase
    .from('tenants')
    .select(
      'id, slug, name, tagline, description, story, address, phone, email, hours, wa_number, instagram, tiktok, maps'
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  return data || null;
});

/**
 * Versi yang memulangkan 404 alih-alih `null`.
 *
 * Dipakai setiap halaman di bawah `/k/[slug]`: outlet yang tidak ada bukan
 * kondisi yang perlu ditangani tiap halaman satu per satu — ia halaman yang
 * memang tidak ada.
 */
export async function requireTenant(slug) {
  const tenant = await getTenant(slug);
  if (!tenant) notFound();
  return tenant;
}

/** Daftar outlet aktif — sumber halaman direktori di `/`. */
export async function listTenants() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('tenants')
    .select('id, slug, name, tagline, address, hours')
    .eq('is_active', true)
    .order('name', { ascending: true });

  return data || [];
}
