import './globals.css';
import { platform } from '@/lib/site';

/*
  Metadata di sini adalah metadata PLATFORM.

  Judul dan deskripsi tiap outlet ditimpa oleh `generateMetadata` di
  src/app/k/[slug]/layout.jsx — yang membacanya dari database, karena satu
  pemasangan melayani banyak UMKM dan nama kedainya baru diketahui per
  permintaan.
*/
export const metadata = {
  metadataBase: new URL(platform.siteUrl),
  title: {
    default: `${platform.name} — ${platform.tagline}`,
    template: `%s | ${platform.name}`,
  },
  description: platform.description,
  keywords: ['point of sale', 'pos coffee shop', 'kasir digital', 'qr ordering', 'umkm'],
  openGraph: {
    title: `${platform.name} — ${platform.tagline}`,
    description: platform.description,
    type: 'website',
    locale: 'id_ID',
  },
};

export const viewport = {
  themeColor: '#b05f27',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        {/*
          Font dimuat lewat <link> (bukan next/font) supaya proses build tidak
          bergantung pada koneksi internet. Kalau font gagal dimuat, tampilan
          otomatis jatuh ke font sistem — lihat --font-sans di globals.css.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/*
          `no-page-custom-font` dimatikan di sini, bukan diikuti.

          Peringatannya berbunyi "hanya termuat untuk satu halaman" — itu benar
          untuk Pages Router, tempat font harus dipasang di `pages/_document.js`.
          Berkas ini adalah ROOT LAYOUT App Router: isinya membungkus seluruh
          halaman, jadi premis peringatannya tidak berlaku. Alasan memilih <link>
          daripada next/font ada di catatan tepat di atas.
        */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
