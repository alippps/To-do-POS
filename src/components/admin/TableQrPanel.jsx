'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import Button from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { platform } from '@/lib/site';
import { tenantUrl } from '@/lib/tenant';
import { tableStatus } from '@/lib/tables';

/**
 * Generator QR per meja — ALAT OPERASIONAL, khusus admin.
 *
 * Dulu komponen ini hidup di landing page publik, artinya pengunjung mana pun
 * bisa mengunduh QR meja mana pun dan mencetak QR untuk meja yang bukan
 * miliknya. Sekarang tinggal penjelasannya saja yang publik
 * (src/components/sections/QrOrder.jsx); alatnya ada di sini.
 */
const CARD_W = 800;
const CARD_H = 1120;
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const INK = '#341810';
const MUTED = '#8a7268';

/**
 * Menggambar QR menjadi kartu meja yang siap cetak.
 *
 * Sebelumnya tombol unduh mengekspor `dataUrl` mentah — kotak hitam-putih tanpa
 * satu huruf pun. Kartu cantik dengan nomor meja hanya hidup di layar admin,
 * sementara yang menempel di meja pelanggan adalah kotak polos. Pelanggan yang
 * baru pertama datang tidak punya cara menebak itu QR pemesanan, password
 * WiFi, atau formulir ulasan — dan QR yang tidak dipindai sama saja tidak ada.
 *
 * Nomor meja sengaja ikut tercetak besar: itu juga jalan keluar untuk HP yang
 * kameranya tidak bisa memindai — pelanggan tinggal membuka `/meja` lalu
 * memilih nomor yang tertulis.
 */
function drawTableCard({ qrDataUrl, tableNo, outlet }) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = CARD_W;
      canvas.height = CARD_H;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CARD_W, CARD_H);

      ctx.strokeStyle = '#e8dcd6';
      ctx.lineWidth = 4;
      ctx.strokeRect(24, 24, CARD_W - 48, CARD_H - 48);

      ctx.textAlign = 'center';

      ctx.fillStyle = MUTED;
      ctx.font = `600 30px ${FONT}`;
      ctx.fillText(outlet.toUpperCase(), CARD_W / 2, 116);

      ctx.font = `700 28px ${FONT}`;
      ctx.fillText('MEJA', CARD_W / 2, 190);

      ctx.fillStyle = INK;
      ctx.font = `800 132px ${FONT}`;
      ctx.fillText(tableNo || '—', CARD_W / 2, 306);

      const qrSize = 460;
      ctx.drawImage(img, (CARD_W - qrSize) / 2, 350, qrSize, qrSize);

      ctx.fillStyle = INK;
      ctx.font = `700 40px ${FONT}`;
      ctx.fillText('Pindai untuk memesan', CARD_W / 2, 888);
      ctx.fillText('dari meja ini', CARD_W / 2, 938);

      ctx.fillStyle = MUTED;
      ctx.font = `400 26px ${FONT}`;
      ctx.fillText('Tanpa aplikasi · tanpa akun · bayar di kasir', CARD_W / 2, 998);

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = reject;
    img.src = qrDataUrl;
  });
}

export default function TableQrPanel({ tenant, tables = [] }) {
  const [tableNo, setTableNo] = useState(tables[0]?.table_no || '');
  const [dataUrl, setDataUrl] = useState('');
  // Kartu siap cetak — dipakai untuk pratinjau DAN unduhan, supaya yang dilihat
  // admin di layar persis yang tercetak di meja.
  const [cardUrl, setCardUrl] = useState('');

  /*
    QR mengarah ke `/meja?meja=..`, yang kini bercabang: nomor yang cocok
    disambut layar hub (Menu / Order / Bayar / Promo) dengan nomor mejanya sudah
    terbaca — bukan lagi denah ketersediaan seperti dulu. Menyuruh orang yang
    baru saja duduk untuk "memilih meja" adalah pekerjaan yang sudah dijawab
    tempat duduknya sendiri; denah itu sekarang tinggal di `/meja` tanpa
    parameter, untuk yang datang dari navbar atau hendak pindah meja.

    `src=qr` menegaskan asal-usulnya sampai ke halaman menu dan struk, supaya
    stepper di sana berhenti menghitung "Pilih meja" sebagai langkah.
  */
  const targetUrl = tenantUrl(
    platform.siteUrl,
    tenant.slug,
    `/meja?meja=${encodeURIComponent(tableNo || '01')}&src=qr`
  );
  const selected = tables.find((t) => t.table_no === tableNo);
  const status = selected ? tableStatus(selected.status) : null;

  /*
    QR menyimpan URL secara permanen di atas kertas. Kalau yang tercetak masih
    localhost / 127.0.0.1, hasil scan dari HP pelanggan pasti gagal — dan baru
    ketahuan setelah stikernya tertempel di semua meja.
  */
  const urlLokal = /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(platform.siteUrl);

  useEffect(() => {
    let cancelled = false;

    QRCode.toDataURL(targetUrl, {
      width: 520,
      margin: 1,
      color: { dark: '#341810', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
      .then((url) => !cancelled && setDataUrl(url))
      .catch(() => !cancelled && setDataUrl(''));

    return () => {
      cancelled = true;
    };
  }, [targetUrl]);

  useEffect(() => {
    let cancelled = false;
    setCardUrl('');

    if (!dataUrl) return undefined;

    drawTableCard({ qrDataUrl: dataUrl, tableNo, outlet: tenant.name })
      .then((url) => !cancelled && setCardUrl(url))
      .catch(() => !cancelled && setCardUrl(''));

    return () => {
      cancelled = true;
    };
    // `tenant.name` ikut jadi dependensi karena memang dipakai menggambar kartunya:
    // tanpa itu, kartu yang sudah tergambar tetap memuat nama outlet lama kalau
    // namanya berubah di tengah sesi.
  }, [dataUrl, tableNo, tenant.name]);

  function handleDownload() {
    if (!cardUrl) return;
    const a = document.createElement('a');
    a.href = cardUrl;
    a.download = `kartu-meja-${tableNo || '01'}.png`;
    a.click();
  }

  return (
    <section className="card mt-8 overflow-hidden p-0">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="font-bold text-slate-900">Cetak Kartu Meja</h2>
        <p className="mt-1 text-sm text-slate-500">
          Unduh kartu untuk tiap meja, cetak, lalu tempel atau berdirikan di mejanya. Pelanggan yang
          memindainya langsung masuk ke layar meja itu — nomornya sudah terbaca, tinggal pesan tanpa
          akun.
        </p>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-[300px_1fr]">
        <div className="mx-auto w-full max-w-[280px] space-y-3 text-center">
          {status && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${status.ring} ${status.text}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          )}

          {/*
            Pratinjau memakai gambar kartu yang sama persis dengan yang diunduh.
            Sebelumnya keduanya berbeda — layar menampilkan kartu berbingkai
            lengkap dengan nomor meja, unduhannya QR telanjang — sehingga
            kekeliruan cetak baru ketahuan setelah stikernya tertempel.
          */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
            {cardUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cardUrl}
                alt={`Kartu pemesanan meja ${tableNo}`}
                className="h-auto w-full"
              />
            ) : (
              <div className="skeleton aspect-[800/1120] w-full" />
            )}
          </div>

          <p className="text-[11px] leading-snug text-slate-400">
            Beginilah kartunya tercetak — ukuran asli 800 × 1120 px.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {tables.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
              Belum ada meja aktif. Tambahkan meja dulu lewat tombol “Tambah Meja” di atas.
            </p>
          ) : (
            <>
              <Select
                label="Pilih meja"
                value={tableNo}
                onChange={(e) => setTableNo(e.target.value)}
                hint="Kartu berbeda untuk tiap meja — cocokkan nomor besar di kartu dengan mejanya saat menempel."
              >
                {tables.map((t) => (
                  <option key={t.id} value={t.table_no}>
                    Meja {t.table_no} · {t.label || t.area}
                  </option>
                ))}
              </Select>

              <div>
                <p className="label-base">Isi QR</p>
                <p className="break-all rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-xs text-slate-600">
                  {targetUrl}
                </p>
              </div>

              {urlLokal && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-snug text-amber-900">
                  <span className="font-bold">Jangan dicetak dulu.</span> Alamat di atas masih
                  alamat lokal, jadi QR ini tidak akan bisa dibuka dari HP pelanggan. Isi{' '}
                  <code className="font-semibold">NEXT_PUBLIC_SITE_URL</code> dengan URL hasil deploy
                  lebih dulu, baru unduh ulang QR-nya.
                </p>
              )}

              <Button onClick={handleDownload} disabled={!cardUrl} className="w-fit">
                Unduh Kartu Meja {tableNo} (PNG)
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
