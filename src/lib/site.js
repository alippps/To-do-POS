/**
 * Konfigurasi identitas bisnis.
 * Ubah di sini sekali, terpakai di seluruh halaman.
 */
export const site = {
  name: 'To Do',
  tagline: 'Coffee Shop & Point of Sale',
  description:
    'To Do adalah coffee shop modern dengan sistem Point of Sale terintegrasi — pesan lewat QR, kasir otomatis, laporan real-time.',
  address: 'Jl. Merdeka No. 45, Bandung, Jawa Barat',
  email: 'halo@todocoffee.id',
  phone: '+62 812-3456-7890',
  hours: 'Setiap hari, 08.00 – 23.00 WIB',
  waNumber: process.env.NEXT_PUBLIC_WA_NUMBER || '6281234567890',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  social: {
    instagram: 'https://instagram.com/',
    tiktok: 'https://tiktok.com/',
    maps: 'https://maps.google.com/',
  },
};

export const WA_MESSAGE_DEFAULT =
  'Halo To Do! Saya ingin konsultasi gratis soal sistem Point of Sale untuk usaha saya.';

export function waLink(message = WA_MESSAGE_DEFAULT) {
  return `https://wa.me/${site.waNumber}?text=${encodeURIComponent(message)}`;
}

export const CATEGORIES = ['Kopi', 'Non-Kopi', 'Snack', 'Makanan'];
