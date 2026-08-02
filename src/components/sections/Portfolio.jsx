import Container from '@/components/ui/Container';
import SectionHeading from '@/components/ui/SectionHeading';
import Badge from '@/components/ui/Badge';

const PROJECTS = [
  {
    name: 'Kopi Pagi Bandung',
    type: 'Coffee Shop · 3 outlet',
    result: 'Antrean turun 42%',
    text: 'Migrasi dari kasir manual ke QR ordering. Pesanan langsung ke barista tanpa perantara.',
    color: 'from-brand-600 to-brand-800',
    tags: ['QR Order', 'POS', 'Laporan'],
  },
  {
    name: 'Roti Bakar 88',
    type: 'F&B Street Food',
    result: 'Omzet naik 27%',
    text: 'Sistem stok otomatis membuat menu habis tidak lagi tampil di daftar pelanggan.',
    color: 'from-slate-800 to-slate-900',
    tags: ['Stok', 'Multi Kasir'],
  },
  {
    name: 'Nusantara Catering',
    type: 'Katering Kantor',
    result: '1.200 pesanan/bulan',
    text: 'Dashboard rekap transaksi harian mempermudah penagihan ke klien korporat.',
    color: 'from-brand-500 to-brand-700',
    tags: ['Rekap', 'Invoice'],
  },
];

export default function Portfolio() {
  return (
    <section id="portfolio" className="bg-slate-50/70 py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Portfolio"
          title="Sudah dipakai bisnis seperti Anda"
          description="Beberapa mitra yang tumbuh bersama sistem To Do."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PROJECTS.map((p) => (
            <article
              key={p.name}
              className="card group overflow-hidden p-0 transition duration-300 hover:-translate-y-1 hover:shadow-pop"
            >
              <div className={`relative h-44 bg-gradient-to-br ${p.color} p-6`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,.25),transparent_60%)]" />
                <p className="relative text-xs font-semibold uppercase tracking-wider text-white/70">
                  {p.type}
                </p>
                <p className="relative mt-2 text-xl font-bold text-white">{p.name}</p>
                <span className="relative mt-6 inline-flex rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
                  {p.result}
                </span>
              </div>
              <div className="p-6">
                <p className="text-sm leading-relaxed text-slate-500">{p.text}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.tags.map((t) => (
                    <Badge key={t} tone="slate">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
