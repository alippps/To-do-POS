import Container from '@/components/ui/Container';
import SectionHeading from '@/components/ui/SectionHeading';
import Button from '@/components/ui/Button';

const HIGHLIGHTS = [
  {
    icon: '☕',
    title: 'Kedai Kopi',
    text: 'Biji kopi single origin dari Gayo, Toraja, dan Kintamani yang diseduh barista bersertifikat.',
  },
  {
    icon: '💻',
    title: 'Software House',
    text: 'Tim internal kami membangun sendiri sistem POS ini — dan kini tersedia untuk bisnis Anda.',
  },
  {
    icon: '🤝',
    title: 'Partner Tumbuh',
    text: 'Pendampingan setup, pelatihan kasir, sampai laporan bulanan penjualan Anda.',
  },
];

export default function About() {
  return (
    <section id="tentang" className="py-20 sm:py-24">
      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div className="relative order-2 lg:order-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="h-44 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white shadow-pop">
                  <p className="text-4xl font-extrabold">7+</p>
                  <p className="mt-2 text-sm text-brand-100">tahun menyeduh & membangun software</p>
                </div>
                <div className="card flex h-32 flex-col justify-center p-5">
                  <p className="text-3xl font-extrabold text-slate-900">38</p>
                  <p className="mt-1 text-sm text-slate-500">outlet memakai sistem To Do</p>
                </div>
              </div>
              <div className="space-y-4 pt-10">
                <div className="card flex h-32 flex-col justify-center p-5">
                  <p className="text-3xl font-extrabold text-slate-900">99,9%</p>
                  <p className="mt-1 text-sm text-slate-500">uptime sistem kasir</p>
                </div>
                <div className="h-44 rounded-2xl border border-slate-200 bg-slate-50 p-6">
                  <p className="text-sm font-semibold text-slate-900">Dibangun dengan</p>
                  <ul className="mt-3 space-y-1.5 text-sm text-slate-500">
                    <li>• Next.js App Router</li>
                    <li>• Supabase (Auth + DB)</li>
                    <li>• Tailwind CSS</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <SectionHeading
              align="left"
              eyebrow="Tentang Kami"
              title="Coffee shop yang juga software house"
              description="To Do lahir dari satu keresahan sederhana: mengelola kedai kopi seharusnya tidak serumit itu. Kami membangun sistem Point of Sale sendiri untuk outlet kami — mulai dari pemesanan lewat QR di meja, kasir digital, sampai laporan penjualan otomatis."
            />

            <div className="mt-8 space-y-4">
              {HIGHLIGHTS.map((item) => (
                <div key={item.title} className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-4 transition hover:border-brand-100 hover:bg-brand-50/40">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xl">
                    {item.icon}
                  </span>
                  <div>
                    <h3 className="font-semibold text-slate-900">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button href="/about" variant="secondary" className="mt-8">
              Selengkapnya tentang To Do →
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
