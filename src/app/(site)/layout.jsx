import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WhatsappFloat from '@/components/layout/WhatsappFloat';

/**
 * Layout sisi publik.
 *
 * Sengaja TIDAK memanggil `getSessionUser()`: tidak ada satu pun elemen di
 * sisi publik yang berubah karena status login, jadi membaca sesi di sini
 * hanya menambah query per request tanpa guna — sekaligus menutup peluang
 * identitas staf bocor ke antarmuka pelanggan.
 */
export default function SiteLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsappFloat />
    </div>
  );
}
