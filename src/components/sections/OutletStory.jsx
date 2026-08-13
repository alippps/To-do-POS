import Container from '@/components/ui/Container';
import SectionHeading from '@/components/ui/SectionHeading';
import Button from '@/components/ui/Button';
import { storyParagraphs, tenantPath } from '@/lib/tenant';

/*
  Pengganti `sections/About.jsx` yang lama.

  Yang lama menceritakan tiga hal — kedai kopi, software house, dan pendampingan
  setup — dengan angka "7+ tahun menyeduh & membangun software" tercetak di
  kartunya. Cerita itu milik satu usaha tertentu, tapi komponennya dipakai
  SETIAP outlet: warung roti bakar yang mendaftar kemarin ikut mengaku
  membangun perangkat lunak selama tujuh tahun.

  Sekarang isinya datang dari `tenants.story`, ditulis pemiliknya sendiri di
  /admin/profil. Yang belum menulisnya tidak ditampilkan section kosong —
  halaman induknya yang memutuskan (lihat `punyaCerita`).
*/
export default function OutletStory({ tenant, ringkas = false }) {
  const paragraf = storyParagraphs(tenant);
  if (paragraf.length === 0) return null;

  /*
    Di beranda hanya dua paragraf pertama yang tampil.

    Cerita panjang di tengah beranda mendorong menu — alasan utama orang
    membuka halaman ini — turun sampai di luar layar. Selebihnya disediakan di
    /about, yang memang dibuka orang yang sudah tertarik.
  */
  const tampil = ringkas ? paragraf.slice(0, 2) : paragraf;

  return (
    <section id="tentang" className="scroll-mt-20 py-20 sm:py-24">
      <Container>
        <div className="mx-auto max-w-3xl">
          <SectionHeading
            align="left"
            eyebrow="Tentang Kami"
            title={`Cerita ${tenant.name}`}
            className="max-w-2xl"
          />

          <div className="mt-8 space-y-5">
            {tampil.map((p, i) => (
              <p key={i} className="text-base leading-relaxed text-slate-600">
                {p}
              </p>
            ))}
          </div>

          {ringkas && paragraf.length > tampil.length && (
            <div className="mt-8">
              <Button href={tenantPath(tenant.slug, '/about')} variant="secondary">
                Selengkapnya tentang kami →
              </Button>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

/** Apakah outlet ini sudah menuliskan ceritanya? Dipakai halaman induk. */
export function punyaCerita(tenant) {
  return storyParagraphs(tenant).length > 0;
}
