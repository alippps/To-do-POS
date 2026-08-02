import Container from '@/components/ui/Container';
import SectionHeading from '@/components/ui/SectionHeading';

const ITEMS = [
  {
    title: 'Cepat & Ringan',
    text: 'Dibangun dengan Next.js App Router. Halaman terbuka instan bahkan di jaringan warung sebelah.',
    icon: '⚡',
  },
  {
    title: 'Data Aman',
    text: 'Supabase Auth + Row Level Security memastikan data transaksi hanya bisa diakses yang berhak.',
    icon: '🛡️',
  },
  {
    title: 'Mobile First',
    text: 'Tampilan rapi di HP kasir maupun tablet. Pelanggan pun nyaman memesan dari layar kecil.',
    icon: '📲',
  },
  {
    title: 'Tanpa Biaya Perangkat',
    text: 'Cukup HP atau laptop yang sudah ada. Tidak perlu mesin kasir mahal untuk mulai.',
    icon: '💰',
  },
  {
    title: 'Setup 1 Hari',
    text: 'Impor menu, atur akun, tempel QR di meja. Besok pagi outlet Anda sudah bisa jalan.',
    icon: '🚀',
  },
  {
    title: 'Support Responsif',
    text: 'Tim kami standby via WhatsApp setiap hari kerja. Kendala kasir tidak boleh menunggu lama.',
    icon: '💬',
  },
];

export default function Advantages() {
  return (
    <section id="keunggulan" className="py-20 sm:py-24">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.35fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:h-fit">
            <SectionHeading
              align="left"
              eyebrow="Keunggulan"
              title="Kenapa memilih To Do?"
              description="Bukan sekadar aplikasi kasir. Kami paham operasional kedai kopi karena kami menjalankannya sendiri setiap hari."
            />
            <div className="mt-8 rounded-2xl border border-brand-100 bg-brand-50/70 p-6">
              <p className="text-sm leading-relaxed text-brand-900">
                “Sistem yang bagus adalah sistem yang tidak terasa kehadirannya — kasir tinggal fokus
                melayani, laporan datang sendiri.”
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-brand-700">
                — Tim Produk To Do
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {ITEMS.map((item, i) => (
              <div
                key={item.title}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-brand-200 hover:shadow-card"
              >
                <span className="absolute right-5 top-4 text-5xl font-black text-slate-50 transition group-hover:text-brand-50">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="relative text-2xl">{item.icon}</span>
                <h3 className="relative mt-4 font-bold text-slate-900">{item.title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-slate-500">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
