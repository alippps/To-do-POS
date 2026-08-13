import Container from '@/components/ui/Container';
import TenantSignupForm from '@/components/platform/TenantSignupForm';

/*
  Halaman PLATFORM, bukan halaman outlet.

  Letaknya di luar `/k/[slug]` dengan sengaja: yang membukanya belum punya
  outlet, jadi tidak ada tenant yang bisa dibaca untuk mengisi navbar, footer,
  maupun metadata-nya. Semua yang ada di sini milik platform — termasuk navbar
  dan footernya, yang datang dari `(platform)/layout.jsx`.
*/
export const metadata = {
  title: 'Daftarkan UMKM Anda',
  description:
    'Buat outlet baru di To Do POS — pesan lewat QR di meja, kasir digital, dan laporan penjualan, tanpa biaya perangkat tambahan.',
};

export default function DaftarOutletPage() {
  return (
    <div className="bg-slate-50">
      <Container className="py-14 sm:py-20">
        <header className="mx-auto max-w-2xl text-center">
          <span className="eyebrow mx-auto">Pendaftaran outlet</span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Daftarkan UMKM Anda
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-500">
            Isi formulir ini dan outletmu langsung hidup: alamatnya sendiri, menunya sendiri,
            denah mejanya sendiri. Tidak ada pemasangan, tidak ada perangkat yang perlu dibeli.
          </p>
        </header>

        <div className="mx-auto mt-10 grid max-w-5xl gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
          <TenantSignupForm />

          <aside className="space-y-4 lg:sticky lg:top-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Yang kamu dapat
              </p>
              <ul className="mt-3 space-y-2.5 text-sm leading-snug text-slate-600">
                <li>🔳 QR per meja — pelanggan pesan sendiri, tanpa aplikasi & tanpa login</li>
                <li>🧾 Satu tagihan per meja, dibayar sekali di akhir</li>
                <li>🖥️ Halaman kasir untuk pelanggan yang minta dibantu</li>
                <li>📊 Dashboard omzet, pesanan berjalan, dan stok menipis</li>
                <li>👥 Role kasir & admin yang kamu atur sendiri</li>
              </ul>
            </div>

            {/*
              Isolasi antar-outlet disebutkan di halaman pendaftaran, bukan
              disimpan di dokumentasi teknis. Ini pertanyaan pertama pemilik
              usaha yang diminta menaruh data penjualannya di sistem yang juga
              dipakai orang lain — dan jawabannya kebetulan memang kuat.
            */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Datamu terpisah
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Menu, meja, transaksi, dan pesan masuk milikmu dipisahkan di level database —
                bukan sekadar disaring saat ditampilkan. Admin outlet lain tetap ditolak
                sekalipun ia menebak id barismu.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Belum punya kode undangan?
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Hubungi pengelola platform. Kodenya dipakai supaya direktori outlet tidak
                dipenuhi pendaftaran iseng.
              </p>
            </div>
          </aside>
        </div>
      </Container>
    </div>
  );
}
