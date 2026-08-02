import Container from '@/components/ui/Container';
import SectionHeading from '@/components/ui/SectionHeading';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import CtaWhatsapp from '@/components/sections/CtaWhatsapp';
import { site } from '@/lib/site';
import { initials } from '@/lib/format';

export const metadata = {
  title: 'About',
  description: 'Cerita di balik To Do — coffee shop yang membangun sistem Point of Sale-nya sendiri.',
};

const TIMELINE = [
  { year: '2018', title: 'Gerobak pertama', text: 'Dimulai dari satu gerobak kopi di depan kampus dengan dua menu andalan.' },
  { year: '2020', title: 'Outlet pertama', text: 'Membuka kedai permanen. Rekap penjualan masih manual pakai buku tulis.' },
  { year: '2022', title: 'Sistem To Do lahir', text: 'Kami membangun sendiri aplikasi kasir karena tidak ada yang pas dengan alur kerja kami.' },
  { year: '2024', title: 'Dibuka untuk publik', text: 'Sistem yang sama kini dipakai puluhan outlet mitra di berbagai kota.' },
];

const VALUES = [
  { icon: '🎯', title: 'Sederhana', text: 'Fitur secukupnya, tapi setiap tombol punya alasan kuat untuk ada.' },
  { icon: '🤍', title: 'Jujur', text: 'Harga transparan, tanpa biaya tersembunyi, tanpa kontrak menjebak.' },
  { icon: '🔧', title: 'Terus dirawat', text: 'Update rutin berdasarkan masukan nyata dari kasir dan pemilik outlet.' },
];

const TEAM = [
  { name: 'Andra Wibowo', role: 'Founder & Head Barista' },
  { name: 'Nadia Kusuma', role: 'Product Lead' },
  { name: 'Reza Fadhilah', role: 'Engineering Lead' },
  { name: 'Laras Ayu', role: 'Customer Success' },
];

export default function AboutPage() {
  return (
    <>
      <section className="border-b border-slate-100 bg-gradient-to-b from-brand-50/70 to-white py-16 sm:py-20">
        <Container>
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700">
              Tentang {site.name}
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Secangkir kopi yang berujung jadi sebuah sistem
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-500">
              {site.name} adalah coffee shop sekaligus software house kecil. Kami menyeduh kopi setiap
              hari, dan dari situ kami belajar persis apa yang dibutuhkan sebuah kedai agar operasionalnya
              tenang: sistem yang cepat, data yang rapi, dan laporan yang bisa dipercaya.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/fitur">Lihat Menu Kami</Button>
              <Button href="/kontak" variant="secondary">
                Hubungi Tim
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="card bg-brand-600 text-white">
              <h2 className="text-xl font-bold">Misi kami</h2>
              <p className="mt-3 text-sm leading-relaxed text-brand-50">
                Membuat teknologi kasir yang terjangkau dan masuk akal untuk UMKM kuliner Indonesia —
                tanpa perangkat mahal, tanpa pelatihan berhari-hari.
              </p>
            </div>
            <div className="card lg:col-span-2">
              <h2 className="text-xl font-bold text-slate-900">Visi kami</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Kami membayangkan setiap kedai kopi, warung, dan kios makanan punya akses ke data
                penjualannya sendiri: tahu menu mana yang untung, jam mana yang ramai, dan berapa stok
                yang harus disiapkan besok. Keputusan bisnis seharusnya berbasis angka, bukan tebakan —
                dan angka itu harus mudah didapat oleh siapa pun, bukan cuma perusahaan besar.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {[['38', 'Outlet mitra'], ['12.4rb', 'Transaksi/bulan'], ['4.9', 'Rating rata-rata']].map(
                  ([v, l]) => (
                    <div key={l} className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-2xl font-extrabold text-slate-900">{v}</p>
                      <p className="mt-1 text-xs text-slate-500">{l}</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-slate-50/70 py-20">
        <Container>
          <SectionHeading eyebrow="Perjalanan" title="Dari gerobak sampai sistem" />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TIMELINE.map((t) => (
              <Card key={t.year} hover>
                <span className="inline-flex rounded-lg bg-brand-600 px-3 py-1 text-xs font-bold text-white">
                  {t.year}
                </span>
                <h3 className="mt-4 font-bold text-slate-900">{t.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{t.text}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <SectionHeading eyebrow="Nilai Kami" title="Tiga hal yang kami pegang" />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {VALUES.map((v) => (
              <Card key={v.title} hover className="text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-2xl">
                  {v.icon}
                </span>
                <h3 className="mt-5 text-lg font-bold text-slate-900">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{v.text}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-slate-50/70 py-20">
        <Container>
          <SectionHeading eyebrow="Tim" title="Orang di balik To Do" />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((m) => (
              <Card key={m.name} hover className="text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-lg font-bold text-white">
                  {initials(m.name)}
                </span>
                <h3 className="mt-4 font-bold text-slate-900">{m.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{m.role}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <CtaWhatsapp />
    </>
  );
}
