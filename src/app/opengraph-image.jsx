import { ImageResponse } from 'next/og';
import { platform as site } from '@/lib/site';

/**
 * Gambar preview tautan — dibuat di sini, bukan diunggah sebagai berkas.
 *
 * Kanal utama proyek ini WhatsApp: tombol "Konsultasi Gratis via WhatsApp" ada
 * di hero, di CTA penutup, di footer, dan di halaman kontak. Tanpa gambar OG,
 * setiap tautan yang dibagikan ke sana tampil sebagai baris teks polos —
 * bentuk yang paling mudah diabaikan di antara pesan lain.
 *
 * Dirender oleh `next/og` supaya tidak ada berkas gambar yang harus dijaga
 * tetap sinkron saat nama atau tagline usaha berubah di `lib/site.js`.
 */
/*
  Runtime edge, bukan node.

  Pemuat font bawaan `@vercel/og` versi node menghitung lokasinya lewat
  `fileURLToPath()`, dan jalur Windows (`D:\...`) membuat panggilan itu
  melempar "Invalid URL" saat build. Versi edge memuat fontnya dengan cara
  berbeda dan tidak menyentuh jalur berkas sama sekali, jadi gambar ini bisa
  dibangun di Windows maupun di Linux tanpa perlakuan khusus.
*/
export const runtime = 'edge';

export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: 'linear-gradient(135deg, #8f4823 0%, #b05f27 55%, #c97832 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: 'rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 34,
            }}
          >
            ☕
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: -0.5 }}>{site.name}</div>
            <div style={{ fontSize: 20, color: '#f8ecdf' }}>{site.tagline}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.1, letterSpacing: -2 }}>
            Duduk, pindai, pesan —
          </div>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.1, letterSpacing: -2 }}>
            tanpa antre di kasir.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14 }}>
          {['Pesan lewat QR', 'Kasir digital', 'Laporan real-time'].map((t) => (
            <div
              key={t}
              style={{
                display: 'flex',
                padding: '12px 24px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.16)',
                fontSize: 24,
                fontWeight: 600,
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
