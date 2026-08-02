import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ContactForm from '@/components/sections/ContactForm';
import Faq from '@/components/sections/Faq';
import { site, waLink } from '@/lib/site';

export const metadata = {
  title: 'Kontak',
  description: 'Hubungi tim To Do untuk konsultasi gratis sistem Point of Sale.',
};

const CHANNELS = [
  { icon: '📞', label: 'Telepon', value: site.phone, href: `tel:${site.phone.replace(/\s|-/g, '')}` },
  { icon: '✉️', label: 'Email', value: site.email, href: `mailto:${site.email}` },
  { icon: '📍', label: 'Alamat', value: site.address, href: site.social.maps },
  { icon: '🕘', label: 'Jam Buka', value: site.hours },
];

export default function KontakPage() {
  return (
    <>
      <section className="border-b border-slate-100 bg-gradient-to-b from-brand-50/70 to-white py-16">
        <Container>
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700">
              Kontak
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Mari ngobrol soal kedai Anda
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-slate-500">
              Isi formulir di bawah atau langsung sapa kami di WhatsApp. Konsultasi pertama gratis, tanpa
              kewajiban apa pun.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            <ContactForm />

            <div className="space-y-5">
              <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                <h2 className="text-lg font-bold">Lebih suka chat?</h2>
                <p className="mt-2 text-sm text-emerald-50">
                  Tim kami membalas rata-rata dalam 15 menit pada jam kerja.
                </p>
                <Button
                  as="a"
                  href={waLink()}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 w-full bg-white text-emerald-700 shadow-none hover:bg-emerald-50"
                >
                  Konsultasi Gratis via WhatsApp
                </Button>
              </Card>

              <Card className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900">Informasi kontak</h2>
                {CHANNELS.map((c) => (
                  <div key={c.label} className="flex gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-lg">
                      {c.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {c.label}
                      </p>
                      {c.href ? (
                        <a
                          href={c.href}
                          target={c.href.startsWith('http') ? '_blank' : undefined}
                          rel="noreferrer"
                          className="text-sm font-medium text-slate-700 transition hover:text-brand-600"
                        >
                          {c.value}
                        </a>
                      ) : (
                        <p className="text-sm font-medium text-slate-700">{c.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </Card>

              <Card className="bg-slate-900 text-white">
                <h2 className="text-lg font-bold">Ingin coba dulu?</h2>
                <p className="mt-2 text-sm text-slate-300">
                  Buka halaman Fitur Utama dan rasakan sendiri alur pemesanannya — data yang Anda buat
                  langsung tersimpan di sistem.
                </p>
                <Button href="/fitur" className="mt-5 w-full">
                  Coba Sistem Sekarang
                </Button>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      <Faq />
    </>
  );
}
