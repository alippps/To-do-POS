import Hero from '@/components/sections/Hero';
import About from '@/components/sections/About';
import Services from '@/components/sections/Services';
import Advantages from '@/components/sections/Advantages';
import BestSeller from '@/components/sections/BestSeller';
import Portfolio from '@/components/sections/Portfolio';
import Testimonials from '@/components/sections/Testimonials';
import Faq from '@/components/sections/Faq';
import QrOrder from '@/components/sections/QrOrder';
import CtaWhatsapp from '@/components/sections/CtaWhatsapp';
import { createPublicClient } from '@/lib/supabase/server';
import { requireTenant } from '@/lib/tenant.server';

/*
  Landing page tidak menampilkan data yang berubah tiap detik: satu-satunya
  data dinamis di sini adalah 4 menu favorit. Dipasangkan dengan
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
      <Hero tenant={tenant} />
      <About tenant={tenant} />
      <Services />
      <Advantages />
      <BestSeller tenant={tenant} products={productsRes.data || []} />
      <Portfolio />
      <Testimonials />
      <QrOrder tenant={tenant} />
      <Faq />
      <CtaWhatsapp tenant={tenant} />
    </>
  );
}
