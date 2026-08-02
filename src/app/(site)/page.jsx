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
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = createClient();

  const [productsRes, tablesRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, category, price, stock, description, image_url')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(4),
    supabase
      .from('cafe_tables')
      .select('id, table_no, label, area, capacity, status')
      .eq('is_active', true)
      .order('table_no', { ascending: true }),
  ]);

  return (
    <>
      <Hero />
      <About />
      <Services />
      <Advantages />
      <BestSeller products={productsRes.data || []} />
      <Portfolio />
      <Testimonials />
      <QrOrder tables={tablesRes.data || []} />
      <Faq />
      <CtaWhatsapp />
    </>
  );
}
