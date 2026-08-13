import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ContactForm from '@/components/sections/ContactForm';
import { waLinkOf } from '@/lib/tenant';
import { requireTenant } from '@/lib/tenant.server';

/*
  Kontak KEDAI — kritik, saran, dan pertanyaan pelanggan.

  Yang lama menyapa dengan "Mari ngobrol soal kedai Anda" dan menawarkan
  "konsultasi pertama gratis, tanpa kewajiban apa pun", lalu ditutup FAQ tentang
  keamanan data dan Row Level Security. Itu halaman kontak sebuah vendor,
  dipasang di kedai — dan pelanggan yang mau melaporkan pesanannya keliru
  membaca tawaran konsultasi bisnis.

  FAQ sistemnya pindah ke landing platform. Yang menggantikannya di sini adalah
  hal yang memang dicari pelanggan sebuah warung: ke mana mengeluh, ke mana
  bertanya, dan di mana akun sosial medianya.
*/
export async function generateMetadata({ params }) {
  const tenant = await requireTenant(params.slug);

  return {
    title: `Kontak ${tenant.name}`,
    description: `Kirim kritik, saran, atau pertanyaan untuk ${tenant.name}.`,
  };
}

/** Kanal kontak dibangun dari data outlet — yang kosong tidak ditampilkan. */
function channelsOf(tenant) {
  return [
    tenant.phone && {
      icon: '📞',
      label: 'Telepon',
      value: tenant.phone,
      href: `tel:${tenant.phone.replace(/\s|-/g, '')}`,
    },
    tenant.email && {
      icon: '✉️',
      label: 'Email',
      value: tenant.email,
      href: `mailto:${tenant.email}`,
    },
    tenant.address && { icon: '📍', label: 'Alamat', value: tenant.address, href: tenant.maps },
    tenant.hours && { icon: '🕘', label: 'Jam Buka', value: tenant.hours },
  ].filter(Boolean);
}

/** Akun sosial outlet. Nama kanalnya ditulis, bukan cuma ikonnya. */
function socialsOf(tenant) {
  return [
    tenant.instagram && { label: 'Instagram', href: tenant.instagram, icon: '📷' },
    tenant.tiktok && { label: 'TikTok', href: tenant.tiktok, icon: '🎵' },
    tenant.maps && { label: 'Google Maps', href: tenant.maps, icon: '🗺️' },
  ].filter(Boolean);
}

export default async function KontakPage({ params }) {
  const tenant = await requireTenant(params.slug);
  const CHANNELS = channelsOf(tenant);
  const SOCIALS = socialsOf(tenant);

  return (
    <>
      <section className="border-b border-slate-100 bg-gradient-to-b from-brand-50/70 to-white py-16">
        <Container>
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700">
              Kontak
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Kritik & saran untuk {tenant.name}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-slate-500">
              Ada yang kurang pas dengan pesananmu, ada menu yang ingin kamu usulkan, atau sekadar
              mau bilang terima kasih? Tulis di sini — semuanya kami baca.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            <ContactForm />

            <div className="space-y-5">
              {tenant.wa_number && (
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                  <h2 className="text-lg font-bold">Butuh jawaban cepat?</h2>
                  <p className="mt-2 text-sm text-emerald-50">
                    Untuk hal yang mendesak — pesanan yang sedang berjalan, meja untuk rombongan —
                    WhatsApp lebih cepat daripada formulir.
                  </p>
                  <Button
                    as="a"
                    href={waLinkOf(tenant)}
                    target="_blank"
                    rel="noreferrer"
                    variant="inverse"
                    className="mt-5 w-full"
                  >
                    Chat via WhatsApp
                  </Button>
                </Card>
              )}

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

              {SOCIALS.length > 0 && (
                <Card className="space-y-3">
                  <h2 className="text-lg font-bold text-slate-900">Sosial media kami</h2>
                  <p className="text-sm leading-snug text-slate-500">
                    Menu baru, promo, dan jam buka yang berubah biasanya kami umumkan lebih dulu di
                    sini.
                  </p>
                  <div className="space-y-2 pt-1">
                    {SOCIALS.map((s) => (
                      <a
                        key={s.label}
                        href={s.href}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50/50 hover:text-brand-700"
                      >
                        <span aria-hidden="true">{s.icon}</span>
                        {s.label}
                        <span aria-hidden="true" className="ml-auto text-slate-300">
                          →
                        </span>
                      </a>
                    ))}
                  </div>
                </Card>
              )}

              {/*
                Tanpa kartu "Lihat Katalog Menu" di penutup.

                Menu sudah jadi tautan tetap di navbar, tampil di setiap halaman
                termasuk yang ini. Kartu yang mengulanginya cuma memanjangkan
                kolom kanan dan mendorong sosial media — satu-satunya hal di
                halaman ini yang tidak ada di tempat lain — turun ke luar layar.
              */}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
