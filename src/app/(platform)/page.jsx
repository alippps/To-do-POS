import PlatformHero from '@/components/platform/PlatformHero';
import Services from '@/components/platform/Services';
import HowItWorks from '@/components/platform/HowItWorks';
import Advantages from '@/components/platform/Advantages';
import Portfolio from '@/components/platform/Portfolio';
import Testimonials from '@/components/platform/Testimonials';
import OutletDirectory from '@/components/platform/OutletDirectory';
import Faq from '@/components/platform/Faq';
import PlatformContact from '@/components/platform/PlatformContact';
import PlatformCta from '@/components/platform/PlatformCta';
import { platform } from '@/lib/site';
import { outletDemo } from '@/lib/demo';
import { listTenants } from '@/lib/tenant.server';

/*
  Landing SISTEM — dan sejak v6, hanya sistem.

  Sampai v5 alamat ini cuma sebuah direktori: satu daftar kartu outlet, tanpa
  penjelasan apa pun tentang apa yang dijual. Seluruh cerita produknya —
  layanan, keunggulan, portfolio, testimoni, FAQ — justru menumpang di landing
  TIAP OUTLET, sehingga pengunjung Roti Bakar 88 yang cuma ingin melihat menu
  malah membaca portfolio sebuah software house.

  Dua pembaca itu sekarang punya halamannya masing-masing. Yang di sini:
  pemilik usaha yang sedang menimbang. Yang di /k/<slug>: pelanggan yang sedang
  duduk di kedai.

  Direktori outletnya tetap tinggal di sini sebagai satu section — pelanggan
  yang mengetik domainnya begitu saja tetap butuh menemukan kedainya, dan bagi
  calon mitra daftar itu sekaligus jadi bukti bahwa sistemnya benar-benar
  dipakai.
*/
export const revalidate = 60;

export const metadata = {
  title: `${platform.name} — ${platform.tagline}`,
  description: platform.description,
};

export default async function PlatformLandingPage() {
  const outlets = await listTenants();
  const demo = outletDemo(outlets);

  return (
    <>
      <PlatformHero outletCount={outlets.length} demo={demo} />

      {/*
        Direktori naik ke posisi KEDUA, tepat di bawah hero.

        Sebelumnya ia section ketujuh — sesudah Layanan, Cara Kerja,
        Keunggulan, Portfolio, dan Testimoni. Urutan itu masuk akal untuk
        pembaca yang membaca dari atas sampai bawah, dan tidak masuk akal untuk
        siapa pun yang sebenarnya ada di sini: pemilik usaha yang ingin melihat
        BUKTINYA sebelum membaca janji apa pun, dan pelanggan yang mengetik
        domainnya begitu saja lalu mencari kedainya.

        Yang kedua paling merugikan kalau salah urut. Ia tidak datang untuk
        membaca materi jualan software house — ia cuma mau tahu harga kopi, dan
        sebelum ini harus melewati lima section untuk menemukan daftar kedai.
      */}
      <OutletDirectory outlets={outlets} demo={demo} />

      <Services />
      <HowItWorks />
      <Advantages />
      <Portfolio />
      <Testimonials />
      <Faq />
      <PlatformContact />
      <PlatformCta />
    </>
  );
}
