import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WhatsappFloat from '@/components/layout/WhatsappFloat';
import { getSessionUser } from '@/lib/supabase/server';

export default async function SiteLayout({ children }) {
  const { user, profile } = await getSessionUser();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={user ? { id: user.id, email: user.email } : null} profile={profile} />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsappFloat />
    </div>
  );
}
