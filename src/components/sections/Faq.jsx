'use client';

import { useState } from 'react';
import Container from '@/components/ui/Container';
import SectionHeading from '@/components/ui/SectionHeading';

const FAQS = [
  {
    q: 'Apakah sistem To Do bisa dipakai untuk usaha selain coffee shop?',
    a: 'Bisa. Struktur produk, kategori, dan transaksinya generik — sudah dipakai untuk resto, katering, toko roti, sampai kios minuman. Cukup ganti daftar produk di menu Daftar Produk.',
  },
  {
    q: 'Bagaimana cara pelanggan memesan lewat QR?',
    a: 'Setiap meja ditempel QR yang mengarah ke halaman Ketersediaan Meja. Pelanggan scan, melihat meja mana yang masih kosong, memilih menu, lalu memesan — semuanya tanpa perlu membuat akun. Pesanan langsung muncul di Daftar Transaksi admin.',
  },
  {
    q: 'Apakah data penjualan saya aman?',
    a: 'Aman. Autentikasi ditangani Supabase Auth dan setiap tabel dilindungi Row Level Security, sehingga hanya akun dengan role admin yang bisa melihat serta mengubah data transaksi.',
  },
  {
    q: 'Perlu perangkat khusus untuk menjalankannya?',
    a: 'Tidak perlu. Sistem berjalan di browser mana pun — HP, tablet, atau laptop yang sudah Anda punya. Printer struk bersifat opsional.',
  },
  {
    q: 'Apakah bisa dipakai lebih dari satu kasir sekaligus?',
    a: 'Bisa. Buat akun untuk tiap staf, lalu naikkan rolenya sesuai kebutuhan. Semua transaksi tercatat beserta akun yang memprosesnya.',
  },
  {
    q: 'Berapa lama proses setup sampai siap dipakai?',
    a: 'Rata-rata satu hari kerja: input menu, atur akun tim, cetak QR meja. Kami dampingi lewat WhatsApp sampai kasir Anda lancar memakainya.',
  },
];

function Item({ faq, isOpen, onToggle }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border transition ${
        isOpen ? 'border-brand-200 bg-brand-50/40' : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
      >
        <span className={`font-semibold ${isOpen ? 'text-brand-900' : 'text-slate-800'}`}>{faq.q}</span>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
            isOpen ? 'rotate-45 bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'
          }`}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      {isOpen && (
        <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600 sm:px-6">{faq.a}</p>
      )}
    </div>
  );
}

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="bg-slate-50/70 py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="FAQ"
          title="Pertanyaan yang sering ditanyakan"
          description="Belum terjawab? Tanyakan langsung lewat WhatsApp, gratis tanpa komitmen."
        />

        <div className="mx-auto mt-12 flex max-w-3xl flex-col gap-3">
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
