import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import { PARAM_DEMO } from '@/lib/demo';
import { tenantPath, waLinkOf } from '@/lib/tenant';

/*
  Hero KEDAI — bukan hero produk.

  Yang berdiri di sini sampai v5 adalah hero platform: judulnya menawarkan
  "kelola kedai kopi Anda tanpa ribet", tombolnya mengajak konsultasi POS
  gratis, dan di sebelahnya terpampang mockup dashboard admin. Semua itu
  ditujukan kepada pemilik usaha — padahal yang membuka halaman ini pelanggan
  yang baru saja memindai QR di mejanya, atau yang sedang mencari tahu kedai
  ini buka jam berapa.

  Sekarang isinya menjawab pertanyaan pelanggan: ini kedai apa, buka kapan,
  di mana, dan bagaimana cara memesannya.

  Outlet diterima sebagai PROP, bukan lewat `useTenant()` — section ini
  komponen server, dan context hanya hidup di klien.
*/
export default function OutletHero({ tenant, mejaSimulasi = null }) {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 -top-40 h-[420px] w-[420px] rounded-full bg-brand-100/60 blur-3xl" />
        <div className="absolute -right-24 top-24 h-[360px] w-[360px] rounded-full bg-brand-50 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0ebe4_1px,transparent_1px),linear-gradient(to_bottom,#f0ebe4_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      </div>

      <Container className="grid items-center gap-14 py-16 lg:grid-cols-[1.15fr_1fr] lg:py-24">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
            </span>
            {tenant.tagline}
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem]">
            {tenant.name}
          </h1>

          {tenant.description && (
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-slate-500">
              {tenant.description}
            </p>
          )}

          {/*
            "Pesan Sekarang" DICABUT, dan penggantinya bukan tombol.

            Tombol itu tidak pernah masuk akal bagi pelanggan sungguhan. Ia
            mengarah ke denah meja — layar untuk MEMILIH meja — padahal
            pelanggan tidak pernah memilih meja dari browser: ia sudah duduk di
            salah satunya, dan QR di mejanya yang menentukan nomornya. Satu
            tombol besar bertuliskan "Pesan Sekarang" di beranda mengajarkan
            kebalikan dari cara sistem ini bekerja, lalu menyodorkan daftar meja
            kepada orang yang mejanya sudah jelas.

            Yang menggantikannya keterangan, bukan ajakan: yang perlu ia
            lakukan memang bukan menekan sesuatu di layar ini.
          */}
          <div className="mt-9 flex items-start gap-4 rounded-2xl border border-brand-100 bg-brand-50/60 p-5">
            <span
              aria-hidden="true"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-card"
            >
              📱
            </span>
            <div className="min-w-0">
              <p className="font-bold text-slate-900">Scan QR di meja Anda untuk memesan</p>
              <p className="mt-1 text-sm leading-snug text-slate-600">
                Nomor meja terbaca sendiri dari QR-nya — tidak perlu mengetik, tidak perlu
                memanggil pelayan, dan tidak perlu membuat akun.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button href={tenantPath(tenant.slug, '/katalog')} variant="secondary" size="lg">
              Lihat Daftar Harga
            </Button>
          </div>

          {/*
            Pintu untuk yang MENILAI sistem ini dari laptop, dan ia menyebut
            dirinya apa adanya.

            Menyamarkannya sebagai tombol pesan biasa akan mengembalikan persis
            kekeliruan yang baru saja dicabut. Menghilangkannya sama sekali
            membuat sistem ini mustahil dicoba tanpa mencetak QR lebih dulu.
            Jadi ia ada, tampil lebih kecil daripada ajakan sungguhan, dan
            menuliskan nomor mejanya di label — supaya jelas mejanya sudah
            ditentukan, bukan dipilih oleh yang menekannya.
          */}
          {mejaSimulasi && (
            <p className="mt-6 border-t border-slate-100 pt-5">
              <a
                href={tenantPath(
                  tenant.slug,
                  `/meja?meja=${encodeURIComponent(mejaSimulasi)}&src=qr&${PARAM_DEMO}=1`
                )}
                className="inline-flex items-center gap-2.5 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
              >
                <span aria-hidden="true">🔳</span>
                Simulasi Scan QR — Meja {mejaSimulasi}
              </a>
              <span className="mt-2 block text-xs leading-snug text-slate-400">
                Untuk mencoba dari laptop. Memperagakan hasil pindaian QR Meja {mejaSimulasi};
                pada penggunaan nyata langkah ini terjadi di meja pelanggan.
              </span>
            </p>
          )}
        </div>

        {/* Kartu informasi kedai */}
        <div className="relative animate-fade-up">
          <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-to-tr from-brand-600/10 via-brand-200/20 to-transparent blur-2xl" />

          <div className="card space-y-5 p-6 sm:p-7">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">
              Informasi kedai
            </h2>

            <dl className="space-y-4">
              {tenant.hours && (
                <Baris icon="🕘" label="Jam buka">
                  {tenant.hours}
                </Baris>
              )}
              {tenant.address && (
                <Baris icon="📍" label="Alamat" href={tenant.maps}>
                  {tenant.address}
                </Baris>
              )}
              {tenant.phone && (
                <Baris icon="📞" label="Telepon" href={`tel:${tenant.phone.replace(/\s|-/g, '')}`}>
                  {tenant.phone}
                </Baris>
              )}
            </dl>

            {tenant.wa_number && (
              <Button
                as="a"
                href={waLinkOf(tenant, `Halo ${tenant.name}! Saya mau tanya-tanya dulu.`)}
                target="_blank"
                rel="noreferrer"
                variant="whatsapp"
                className="w-full"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Z" />
                </svg>
                Chat via WhatsApp
              </Button>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

function Baris({ icon, label, href, children }) {
  return (
    <div className="flex gap-3">
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-lg"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</dt>
        <dd className="mt-0.5 text-sm font-medium leading-snug text-slate-700">
          {href ? (
            <a
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel="noreferrer"
              className="transition hover:text-brand-600"
            >
              {children}
            </a>
          ) : (
            children
          )}
        </dd>
      </div>
    </div>
  );
}
