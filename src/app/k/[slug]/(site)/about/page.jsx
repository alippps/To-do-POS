import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import CtaWhatsapp from '@/components/sections/CtaWhatsapp';
import { storyParagraphs, tenantPath } from '@/lib/tenant';
import { requireTenant } from '@/lib/tenant.server';

/*
  Tentang KEDAI INI — dan sejak v6, hanya kedai ini.

  Halaman yang lama berjudul "Secangkir kopi yang berujung jadi sebuah sistem",
  lalu menceritakan misi menyediakan teknologi kasir untuk UMKM, linimasa
  lahirnya aplikasi, nilai-nilai perusahaan perangkat lunak, dan empat nama
  anggota tim produk. Seluruhnya ditulis tetap di dalam kode, jadi SETIAP outlet
  menampilkan cerita yang sama: warung roti bakar yang mendaftar kemarin ikut
  mengaku punya Engineering Lead dan 38 outlet mitra.

  Sekarang isinya datang dari `tenants` — ditulis pemiliknya sendiri lewat
  /admin/profil. Yang bercerita tentang sistemnya sudah pindah ke `/about`-nya
  platform, yaitu landing di `/`.
*/
export async function generateMetadata({ params }) {
  const tenant = await requireTenant(params.slug);

  return {
    title: `Tentang ${tenant.name}`,
    description:
      tenant.description || `Cerita, jam buka, dan lokasi ${tenant.name}.`,
  };
}

export default async function AboutPage({ params }) {
  const tenant = await requireTenant(params.slug);
  const paragraf = storyParagraphs(tenant);

  const fakta = [
    tenant.hours && { icon: '🕘', label: 'Jam buka', value: tenant.hours },
    tenant.address && { icon: '📍', label: 'Alamat', value: tenant.address, href: tenant.maps },
    tenant.phone && {
      icon: '📞',
      label: 'Telepon',
      value: tenant.phone,
      href: `tel:${tenant.phone.replace(/\s|-/g, '')}`,
    },
    tenant.email && { icon: '✉️', label: 'Email', value: tenant.email, href: `mailto:${tenant.email}` },
  ].filter(Boolean);

  return (
    <>
      <section className="border-b border-slate-100 bg-gradient-to-b from-brand-50/70 to-white py-16 sm:py-20">
        <Container>
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700">
              Tentang Kami
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              {tenant.name}
            </h1>
            <p className="mt-3 text-lg font-medium text-brand-700">{tenant.tagline}</p>
            {tenant.description && (
              <p className="mt-5 text-lg leading-relaxed text-slate-500">{tenant.description}</p>
            )}
            {/*
              Satu ajakan saja, dan bukan ajakan melihat menu.

              "Lihat Menu Kami" pernah berdiri di sini sebagai tombol utama,
              padahal Menu sudah jadi tautan tetap di navbar — dua langkah ke
              tempat yang sama, dalam satu layar. Yang tidak ada di navbar
              justru inilah: mengirim kritik atau saran setelah membaca cerita
              kedainya.
            */}
            <div className="mt-8">
              <Button href={tenantPath(tenant.slug, '/kontak')} variant="secondary">
                Kritik & Saran
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-start">
            <div>
              {paragraf.length > 0 ? (
                <div className="space-y-5">
                  {paragraf.map((p, i) => (
                    <p key={i} className="text-base leading-relaxed text-slate-600">
                      {p}
                    </p>
                  ))}
                </div>
              ) : (
                /*
                  Keadaan yang PASTI terjadi, bukan pengecualian yang jarang:
                  setiap outlet yang mendaftar lewat /daftar-outlet lahir tanpa
                  cerita. Yang muncul karena itu bukan halaman rusak atau ruang
                  kosong, melainkan kalimat yang jujur — dan bagi pemiliknya,
                  petunjuk di mana menuliskannya.
                */
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
                  <span className="text-3xl" aria-hidden="true">
                    ✍️
                  </span>
                  <p className="mt-4 font-semibold text-slate-800">
                    {tenant.name} belum menuliskan ceritanya
                  </p>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                    Informasi praktisnya ada di samping — jam buka, alamat, dan cara menghubungi
                    kami. Untuk pemilik outlet: ceritanya diisi dari{' '}
                    <span className="font-mono text-xs">/admin/profil</span>.
                  </p>
                </div>
              )}
            </div>

            <aside className="space-y-5 lg:sticky lg:top-24">
              <Card className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900">Informasi kedai</h2>
                {fakta.map((f) => (
                  <div key={f.label} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-lg"
                    >
                      {f.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {f.label}
                      </p>
                      {f.href ? (
                        <a
                          href={f.href}
                          target={f.href.startsWith('http') ? '_blank' : undefined}
                          rel="noreferrer"
                          className="text-sm font-medium text-slate-700 transition hover:text-brand-600"
                        >
                          {f.value}
                        </a>
                      ) : (
                        <p className="text-sm font-medium text-slate-700">{f.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </Card>

              <SosialMedia tenant={tenant} />
            </aside>
          </div>
        </Container>
      </section>

      <CtaWhatsapp tenant={tenant} />
    </>
  );
}

/**
 * Kanal sosial outlet. Tidak ditampilkan sama sekali bila belum ada satu pun —
 * kartu berisi judul tanpa isi lebih buruk daripada kartu yang tidak ada.
 */
function SosialMedia({ tenant }) {
  const kanal = [
    tenant.instagram && { label: 'Instagram', href: tenant.instagram, icon: '📷' },
    tenant.tiktok && { label: 'TikTok', href: tenant.tiktok, icon: '🎵' },
    tenant.maps && { label: 'Google Maps', href: tenant.maps, icon: '🗺️' },
  ].filter(Boolean);

  if (kanal.length === 0) return null;

  return (
    <Card className="space-y-3">
      <h2 className="text-lg font-bold text-slate-900">Ikuti kami</h2>
      {kanal.map((k) => (
        <a
          key={k.label}
          href={k.href}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50/50 hover:text-brand-700"
        >
          <span aria-hidden="true">{k.icon}</span>
          {k.label}
          <span aria-hidden="true" className="ml-auto text-slate-300">
            →
          </span>
        </a>
      ))}
    </Card>
  );
}
