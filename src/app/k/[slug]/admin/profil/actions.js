'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminAction } from '@/lib/adminGuard';
import { tenantPath } from '@/lib/tenant';

/**
 * Melengkapi tautan sosial yang ditulis sebagai nama akun.
 *
 * Kolom `instagram` dan `tiktok` dipakai langsung sebagai `href` di footer,
 * /about, dan /kontak. Yang mengisinya adalah pemilik warung, dan yang paling
 * wajar ia tulis adalah nama akunnya — "rotibakar88", bukan alamat lengkap.
 * Nilai seperti itu masuk ke `href` sebagai TAUTAN RELATIF: menekannya membawa
 * pelanggan ke `/k/roti-88/rotibakar88`, halaman yang tidak ada.
 *
 * Karena itu keduanya diterima, dan yang bukan URL dilengkapi di sini — sekali,
 * saat disimpan, bukan di setiap tempat yang menampilkannya.
 */
function tautanSosial(nilai, pangkalan) {
  const bersih = String(nilai || '').trim();
  if (!bersih) return null;
  if (/^https?:\/\//i.test(bersih)) return bersih;

  return `${pangkalan}${bersih.replace(/^@+/, '')}`;
}

/** URL biasa (Maps) — hanya dirapikan, tidak ditebak bentuknya. */
function tautanBiasa(nilai) {
  const bersih = String(nilai || '').trim();
  if (!bersih) return null;
  return /^https?:\/\//i.test(bersih) ? bersih : `https://${bersih}`;
}

/**
 * Menyimpan profil outlet.
 *
 * `slug` sengaja TIDAK termasuk yang bisa dikirim ke sini. Ia tercetak permanen
 * di QR tiap meja, dan mengubahnya mematikan seluruh kartu meja yang sudah
 * tercetak. Penjagaan itu tidak berhenti pada absennya kolom dari formulir —
 * ada trigger `tenants_slug_immutable` di database yang menolaknya juga.
 */
export async function simpanProfil(slug, payload) {
  const { supabase, tenantId, error: authError } = await requireAdminAction(slug);
  if (authError) return { ok: false, errors: {}, message: authError };

  const name = String(payload?.name || '').trim();
  const tagline = String(payload?.tagline || '').trim();
  const description = String(payload?.description || '').trim();
  const story = String(payload?.story || '').trim();
  const address = String(payload?.address || '').trim();
  const hours = String(payload?.hours || '').trim();
  const phone = String(payload?.phone || '').trim();
  const email = String(payload?.email || '').trim();
  const wa = String(payload?.wa_number || '').trim();

  const errors = {};
  if (name.length < 3) errors.name = 'Nama usaha minimal 3 karakter.';

  // Aturannya disamakan dengan formulir kontak & pendaftaran outlet.
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Format email tidak valid.';
  }

  const waAngka = wa.replace(/[^\d]/g, '');
  if (wa && (waAngka.length < 8 || waAngka.length > 15)) {
    errors.wa_number = 'Nomor tidak valid. Contoh: 0812-3456-7890.';
  }

  if (description.length > 200) {
    // Batasnya bukan selera: kolom ini jadi meta description, teks kartu
    // direktori, dan paragraf pembuka footer — tiga tempat yang semuanya
    // menyediakan ruang untuk satu kalimat.
    errors.description = 'Deskripsi singkat maksimal 200 karakter — cerita panjangnya di kolom bawah.';
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, message: 'Periksa kembali isian Anda.' };
  }

  const { error } = await supabase
    .from('tenants')
    .update({
      name,
      tagline: tagline || 'Point of Sale',
      description: description || null,
      story: story || null,
      address: address || null,
      hours: hours || null,
      phone: phone || null,
      email: email || null,
      wa_number: waAngka || null,
      instagram: tautanSosial(payload?.instagram, 'https://instagram.com/'),
      tiktok: tautanSosial(payload?.tiktok, 'https://tiktok.com/@'),
      maps: tautanBiasa(payload?.maps),
      updated_at: new Date().toISOString(),
    })
    .eq('id', tenantId);

  if (error) {
    return { ok: false, errors: {}, message: `Gagal menyimpan profil: ${error.message}` };
  }

  /*
    Profil outlet muncul di hampir semua halamannya — navbar, footer, hero,
    about, kontak, dan metadata tiap halaman — jadi yang disegarkan bukan cuma
    halaman admin ini. Direktori platform di `/` ikut, karena nama, alamat, dan
    jam buka outlet tampil di kartunya.
  */
  for (const p of ['/admin/profil', '/admin', '/', '/about', '/kontak', '/katalog', '/menu']) {
    revalidatePath(tenantPath(slug, p));
  }
  revalidatePath('/');

  return { ok: true, errors: {}, message: 'Profil outlet tersimpan.' };
}
