import Container from '@/components/ui/Container';
import SectionHeading from '@/components/ui/SectionHeading';

/*
  Kembaran halaman platform untuk `sections/QrOrder.jsx`.

  Keduanya menceritakan alur yang sama, tapi kepada dua orang yang berbeda dan
  karena itu tidak bisa jadi satu komponen. QrOrder berbicara kepada pelanggan
  yang sedang duduk di kedai ("scan QR di mejamu") dan menampilkan QR contoh
  milik outlet itu; yang di sini berbicara kepada pemilik usaha yang sedang
  menimbang ("begini yang akan terjadi di warungmu") dan tidak punya outlet
  untuk dibuatkan QR-nya.
*/
const STEPS = [
  {
    num: '1',
    title: 'Tempel QR di tiap meja',
    text: 'Cetak kartu mejanya dari dashboard — nomor meja besar, QR, dan instruksi singkat. Sekali cetak, dipakai seterusnya.',
  },
  {
    num: '2',
    title: 'Pelanggan pesan dari tempat duduknya',
    text: 'Pindai, nomor mejanya terbaca sendiri, pilih menu, pesan. Tanpa aplikasi, tanpa akun, tanpa antre di kasir.',
  },
  {
    num: '3',
    title: 'Pesanan langsung masuk ke dashboard',
    text: 'Lengkap dengan nomor mejanya. Kasir tidak pernah salah menempelkan pesanan ke meja yang keliru.',
  },
  {
    num: '4',
    title: 'Bayar sekali di akhir',
    text: 'Nambah pesanan cukup pindai lagi — tambahannya menempel ke tagihan meja yang sama. Kasir menandai lunas, mejanya kosong lagi.',
  },
];

export default function HowItWorks() {
  return (
    <section id="cara-kerja" className="scroll-mt-20 py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Cara Kerja"
          title="Empat langkah, dan kasirmu berhenti jadi antrean"
          description="Yang berubah bukan cuma alat catatnya — pintu masuk pesanan pindah dari kasir ke meja pelanggan."
        />

        <ol className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <li key={s.num} className="card relative overflow-hidden">
              <span
                aria-hidden="true"
                className="absolute -right-3 -top-5 text-7xl font-extrabold text-slate-100"
              >
                {s.num}
              </span>
              <div className="relative">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
                  {s.num}
                </span>
                <h3 className="mt-5 font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>

        {/*
          Kalimat penutup ini menjawab keberatan yang paling sering muncul dan
          paling jarang diucapkan: "pelanggan saya tidak mau ribet install
          aplikasi". Memang tidak ada yang perlu diinstal — itu perlu ditulis,
          bukan disiratkan.
        */}
        <p className="mx-auto mt-12 max-w-2xl text-center text-sm leading-relaxed text-slate-500">
          Pelanggan tidak mengunduh apa pun dan tidak membuat akun apa pun. Yang mereka pakai
          cuma kamera HP dan browser yang sudah ada di dalamnya.
        </p>
      </Container>
    </section>
  );
}
