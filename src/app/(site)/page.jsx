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

/*
  Landing page tidak lagi menampilkan data yang berubah tiap detik: sejak
  generator QR pindah ke admin, satu-satunya data dinamis di sini adalah 4 menu
  favorit. Dipasangkan dengan `createPublicClient()` (tanpa cookie), halaman ini
  benar-benar ter-cache dan disegarkan tiap 30 detik — bukan lagi query Supabase
  di setiap kunjungan seperti waktu masih `force-dynamic`.
*/
export const revalidate = 30;

export default async function HomePage() {
  const supabase = createPublicClient();

  const productsRes = await supabase
    .from('products')
    .select('id, name, category, price, promo_price, stock, description, image_url')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(4);

  return (
    <>
      <Hero />
      <About />
      <Services />
      <Advantages />
      <BestSeller products={productsRes.data || []} />
      <Portfolio />
      <Testimonials />
      <QrOrder />
      <Faq />
      <CtaWhatsapp />
    </>
  );
}
