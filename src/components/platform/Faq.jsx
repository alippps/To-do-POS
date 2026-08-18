'use client';

import { useState } from 'react';
import Container from '@/components/ui/Container';
import SectionHeading from '@/components/ui/SectionHeading';
import { Plus } from 'lucide-react';

/*
  Copywriting pada FAQ "Data Penjualan Aman" diperbarui.
  Menghilangkan jargon "Supabase Auth & RLS" menjadi penjelasan keamanan
  dan hak akses yang mudah dipahami oleh pemilik bisnis.
*/
const FAQS = [
  {
    q: 'Apakah sistem ini bisa dipakai untuk usaha selain coffee shop?',
    a: 'Bisa. Struktur produk, kategori, dan transaksinya generik — sudah dipakai untuk resto, katering, toko roti, sampai kios minuman. Cukup ganti daftar produk di menu Daftar Produk.',
  },
  {
    q: 'Bagaimana cara pelanggan memesan lewat QR?',
    a: 'Setiap meja punya QR-nya sendiri. Pelanggan yang sudah duduk cukup memindainya: nomor mejanya langsung terbaca, tinggal pilih menu lalu pesan — tanpa membuat akun dan tanpa antre di kasir. Pesanannya seketika muncul di Daftar Transaksi. Mau menambah nanti? Pindai lagi, tambahannya menempel ke tagihan meja yang sama dan dibayar sekali di akhir.',
  },
  {
    q: 'Apakah data penjualan saya aman?',
    a: 'Sangat aman. Sistem kami menggunakan enkripsi standar industri. Aksesnya juga dibatasi ketat: kasir hanya bisa memproses pesanan harian, sementara hak untuk mengubah menu, melihat total omzet, dan menghapus data sepenuhnya hanya ada di tangan Anda sebagai pemilik.',
  },
  {
    q: 'Perlu perangkat khusus untuk menjalankannya?',
    a: 'Tidak perlu. Sistem berjalan di browser mana pun — HP, tablet, atau laptop yang sudah Anda punya. Printer struk bersifat opsional jika Anda masih membutuhkannya.',
  },
  {
    q: 'Apakah bisa dipakai lebih dari satu kasir sekaligus?',
    a: 'Bisa. Buat akun untuk tiap staf, lalu naikkan rolenya jadi Kasir atau Admin lewat halaman Hak Akses. Kasir hanya melihat layar yang ia butuhkan; semua transaksi otomatis tercatat beserta nama staf yang memprosesnya.',
  },
  {
    q: 'Berapa lama proses setup sampai siap dipakai?',
    a: 'Rata-rata hanya satu hari kerja: input menu, atur akun tim, dan cetak QR meja. Kami juga akan mendampingi tim Anda via WhatsApp sampai kasir benar-benar lancar memakainya.',
  },
];

/*
  Komponen Item diisolasi untuk kemudahan maintainability.
  Menerapkan CSS Grid Transition untuk animasi buka/tutup yang mulus.
*/
function Item({ faq, isOpen, onToggle }) {
  return (
    <div
      className={`group overflow-hidden rounded-2xl border transition-all duration-300 ${
        isOpen
          ? 'border-brand-200 bg-brand-50/50 shadow-md shadow-brand-900/5'
          : 'border-slate-200 bg-white hover:border-brand-200 hover:shadow-sm'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        /* focus-visible memastikan outline hanya muncul saat navigasi via keyboard, bukan klik mouse */
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset sm:py-6"
      >
        <span
          className={`text-base font-bold transition-colors duration-300 ${
            isOpen ? 'text-brand-900' : 'text-slate-800 group-hover:text-brand-700'
          }`}
        >
          {faq.q}
        </span>

        {/* Ikon Plus yang berputar 45deg menjadi 'X' saat isOpen */}
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-500 ${
            isOpen
              ? 'rotate-45 bg-brand-600 text-white shadow-sm'
              : 'bg-slate-50 text-slate-400 group-hover:bg-brand-100 group-hover:text-brand-600'
          }`}
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
        </span>
      </button>

      {/*
        Trik Animasi CSS Grid:
        Mengubah grid-template-rows dari 0fr ke 1fr memungkinkan browser
        menganimasikan tinggi elemen meskipun kita tidak tahu tinggi pastinya (height: auto).
      */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-6 text-sm leading-relaxed text-slate-600 sm:pb-7">
            {faq.a}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(0); // Item pertama terbuka secara default

  return (
    <section id="faq" className="scroll-mt-20 bg-slate-50/50 py-20 sm:py-24 relative overflow-hidden">
      {/* Dekorasi Background Halus */}
      <div className="absolute right-0 bottom-0 translate-y-1/2 translate-x-1/4 w-[500px] h-[500px] bg-brand-100/40 rounded-full blur-[80px] -z-10 pointer-events-none" />

      <Container className="relative z-10">
        <SectionHeading
          // eyebrow="FAQ"
          title="Pertanyaan yang sering ditanyakan"
          description="Masih ada hal lain yang belum terjawab? Jangan ragu untuk bertanya langsung kepada tim kami lewat WhatsApp, gratis tanpa komitmen apa pun."
        />

        <div className="mx-auto mt-14 flex max-w-3xl flex-col gap-3.5">
          {FAQS.map((faq, i) => (
            <Item
              key={faq.q}
              faq={faq}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}