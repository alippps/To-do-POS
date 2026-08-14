import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import { tenantPath } from '@/lib/tenant';

/*
  Angka di sini adalah angka PLATFORM, bukan angka satu kedai.

  Sampai v5 hero ini berdiri di landing tiap outlet dan menuliskan "12.400+
  transaksi/bulan" seolah itu capaian warung yang sedang dibuka pengunjung —
  klaim yang tidak pernah benar untuk outlet yang baru mendaftar kemarin.
  Setelah pindah ke halaman platform, satuannya jadi jujur dengan sendirinya:
  yang dihitung adalah seluruh outlet yang memakai sistem ini.
*/
const STATS = [
  { value: '12.400+', label: 'Transaksi / bulan' },
  { value: '38', label: 'Outlet mitra' },
  { value: '< 30 dtk', label: 'Rata-rata antrean' },
];

export default function PlatformHero({ outletCount = 0, demo = null }) {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* dekorasi latar */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 -top-40 h-[420px] w-[420px] rounded-full bg-brand-100/60 blur-3xl" />
        <div className="absolute -right-24 top-24 h-[360px] w-[360px] rounded-full bg-brand-50 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0ebe4_1px,transparent_1px),linear-gradient(to_bottom,#f0ebe4_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      </div>

      <Container className="grid items-center gap-14 py-16 lg:grid-cols-2 lg:py-24">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
            </span>
            UMKM Goes Digital — satu pemasangan, banyak UMKM
          </span>

          {/*
            Frasa yang digarisbawahi sengaja PENDEK, dan garisnya bertinggi tetap.

            Dua hal yang membuat versi sebelumnya rusak, dan keduanya baru
            muncul setelah frasanya diperpanjang jadi "modalnya selembar QR":

            (1) `whitespace-nowrap` pada frasa sepanjang itu melebihi lebar
                kolom kiri grid, jadi teksnya meluber menimpa mockup dashboard
                di sebelahnya — dan `overflow-hidden` di section memotongnya.
            (2) SVG-nya `w-full` tanpa tinggi, jadi tingginya ikut rasio
                200:12 terhadap lebar frasa. Frasa dua kali lebih panjang =
                garis dua kali lebih tinggi, dan `-bottom-2` mendorongnya naik
                menyilang di tengah huruf alih-alih di bawahnya.

            Tingginya kini dikunci `h-[10px]`, jadi garisnya tetap setipis itu
            sepanjang apa pun frasanya — `preserveAspectRatio="none"` memang
            dipasang supaya ia boleh direntang tanpa mempertahankan rasio.
            `pb-3` menyediakan ruang di bawah baris terakhir supaya garisnya
            tidak terpotong batas h1.
          */}
          <h1 className="mt-6 pb-3 text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem]">
            Kasir digital untuk UMKM kuliner, modalnya{' '}
            <span className="relative inline-block whitespace-nowrap text-brand-600">
              selembar QR
              <svg
                className="absolute -bottom-1.5 left-0 h-[10px] w-full text-brand-200"
                viewBox="0 0 200 12"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d="M2 9c40-6 120-9 196-3" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          {/*
            Satu baris yang menyebut produknya apa, sebelum kalimat apa pun yang
            menjelaskan cara kerjanya.

            Judul di atas memakai kiasan ("modalnya selembar QR") — itu bagus
            untuk diingat, tapi buruk untuk MENGENALI. Pengunjung baru mendarat
            di sini tanpa tahu apakah alamat ini milik sebuah kedai atau milik
            sistemnya, dan kiasan tidak menjawabnya. Kalimat datar ini yang
            menjawab, dan sengaja berdiri sendiri di atas paragraf penjelas
            supaya terbaca lebih dulu.
          */}
          <p className="mt-7 text-xl font-semibold leading-snug text-slate-800 sm:text-2xl">
            Sistem kasir &amp; pemesanan QR untuk UMKM kuliner.
          </p>

          <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-500">
            Pelanggan memindai QR di mejanya, memesan sendiri, dan membayar sekali di akhir.
            Kamu dapat dashboard omzet, stok, dan riwayat transaksinya — tanpa mesin kasir,
            tanpa aplikasi yang harus diunduh siapa pun.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button href="/daftar-outlet" size="lg">
              Daftarkan UMKM Anda
            </Button>
            {/*
              Ajakan kedua membuka satu kedai SUNGGUHAN, bukan demo buatan dan
              bukan lagi lompatan ke daftar.

              Sebelumnya tombol ini menggulir ke `#outlet` — satu klik lagi
              sebelum orang melihat apa pun. Padahal yang ingin dijawabnya cuma
              "seperti apa jadinya?", dan jawaban itu ada di halaman kedainya,
              bukan di daftar nama. Outlet yang terdaftar punya menu dan denah
              meja sendiri: membukanya memperlihatkan persis apa yang dilihat
              pelanggan mereka, dan itu bukti yang lebih kuat daripada tangkapan
              layar mana pun.
            */}
            {demo ? (
              <Button href={tenantPath(demo.slug)} variant="secondary" size="lg">
                Lihat contoh kedai
              </Button>
            ) : (
              <Button href="#outlet" variant="secondary" size="lg">
                {outletCount > 0
                  ? `Lihat ${outletCount} outlet yang pakai`
                  : 'Lihat outlet yang pakai'}
              </Button>
            )}
          </div>

          <dl className="mt-12 grid max-w-lg grid-cols-2 gap-6 border-t border-slate-200 pt-8 sm:grid-cols-3">
            {STATS.map((s) => (
              <div key={s.label}>
                <dt className="text-xl font-extrabold text-slate-900 sm:whitespace-nowrap sm:text-3xl">
                  {s.value}
                </dt>
                <dd className="mt-1 text-xs leading-snug text-slate-500 sm:text-sm">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Mockup dashboard */}
        <div className="relative animate-fade-up lg:pl-6">
          <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-to-tr from-brand-600/10 via-brand-200/20 to-transparent blur-2xl" />

          <div className="card overflow-hidden p-0">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="ml-3 truncate text-xs font-medium text-slate-400">
                /k/warung-anda/admin
              </span>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">Pendapatan hari ini</p>
                  <p className="text-2xl font-extrabold text-slate-900">Rp 4.820.000</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600">
                  ↑ 18,2%
                </span>
              </div>

              <div className="flex h-32 items-end gap-2.5">
                {[42, 58, 35, 72, 61, 88, 76].map((h, i) => (
                  <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <div
                      className={`w-full rounded-t-lg ${i === 5 ? 'bg-brand-600' : 'bg-brand-100'}`}
                      style={{ height: `${h}%` }}
                    />
                    <span className="text-[10px] text-slate-400">
                      {['S', 'S', 'R', 'K', 'J', 'S', 'M'][i]}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2.5 rounded-2xl bg-slate-50 p-4">
                {[
                  ['Kopi Susu Gula Aren', '32 cup', 'Rp 800.000'],
                  ['Roti Bakar Cokelat', '24 porsi', 'Rp 528.000'],
                  ['Indomie Rebus Telur', '19 porsi', 'Rp 342.000'],
                ].map(([name, qty, total]) => (
                  <div key={name} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{name}</span>
                    <span className="text-xs text-slate-400">{qty}</span>
                    <span className="font-semibold text-slate-900">{total}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute -bottom-6 -left-2 hidden rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-pop sm:flex sm:items-center sm:gap-3 lg:-left-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">✓</span>
            <div>
              <p className="text-xs font-semibold text-slate-900">Pesanan #INV-0421 selesai</p>
              <p className="text-[11px] text-slate-400">Meja 07 · 2 detik lalu</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
