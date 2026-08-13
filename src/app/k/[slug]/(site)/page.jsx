import OutletHero from '@/components/sections/OutletHero';
import OutletStory from '@/components/sections/OutletStory';
import BestSeller from '@/components/sections/BestSeller';
import QrOrder from '@/components/sections/QrOrder';
import CtaWhatsapp from '@/components/sections/CtaWhatsapp';
import { createPublicClient } from '@/lib/supabase/server';
import { requireTenant } from '@/lib/tenant.server';

/*
  Beranda KEDAI.

  Sampai v5 halaman ini memuat sembilan section, dan lima di antaranya bercerita
  tentang perangkat lunaknya: layanan POS, keunggulan teknis, portfolio mitra,
  testimoni pemilik outlet lain, dan FAQ soal keamanan data. Pengunjung Roti
  Bakar 88 yang cuma ingin tahu harga roti bakar harus melewati semuanya.

  Kelimanya pindah ke landing platform di `/`. Yang tersisa di sini hanya yang
  memang milik kedai ini: siapa dia, ceritanya, menunya, cara memesan, dan cara
  menghubunginya.

  Satu-satunya data dinamis tetap 4 menu favorit. Dipasangkan dengan
  `createPublicClient()` (tanpa cookie), kueri produknya ter-cache dan
  disegarkan tiap 30 detik.

  Section yang butuh identitas outlet menerimanya sebagai PROP, bukan lewat
  context: semuanya komponen server, dan `useTenant()` hanya hidup di klien.
*/
export const revalidate = 30;

export default async function HomePage({ params }) {
  const tenant = await requireTenant(params.slug);
  const supabase = createPublicClient();

  const productsRes = await supabase
    .from('products')
    .select('id, name, category, price, promo_price, stock, description, image_url')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(4);

  return (
    <>
      <OutletHero tenant={tenant} />
      <BestSeller tenant={tenant} products={productsRes.data || []} />
      {/* Mengembalikan null sendiri bila outletnya belum menulis cerita. */}
      <OutletStory tenant={tenant} ringkas />
      <QrOrder tenant={tenant} />
      <CtaWhatsapp tenant={tenant} />
    </>
  );
}
