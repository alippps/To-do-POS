import './globals.css';
import { site } from '@/lib/site';

export const metadata = {
  metadataBase: new URL(site.siteUrl),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  keywords: ['point of sale', 'pos coffee shop', 'kasir digital', 'qr ordering', 'to do pos'],
  openGraph: {
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
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
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
