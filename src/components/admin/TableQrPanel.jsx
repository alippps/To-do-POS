'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import Button from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { site } from '@/lib/site';
import { tableStatus } from '@/lib/tables';

/**
 * Generator QR per meja — ALAT OPERASIONAL, khusus admin.
 *
 * Dulu komponen ini hidup di landing page publik, artinya pengunjung mana pun
 * bisa mengunduh QR meja mana pun dan mencetak QR untuk meja yang bukan
 * miliknya. Sekarang tinggal penjelasannya saja yang publik
 * (src/components/sections/QrOrder.jsx); alatnya ada di sini.
 */
export default function TableQrPanel({ tables = [] }) {
  const [tableNo, setTableNo] = useState(tables[0]?.table_no || '');
  const [dataUrl, setDataUrl] = useState('');

  // QR mengarah ke halaman ketersediaan meja, BUKAN langsung ke menu —
  // supaya pelanggan lebih dulu melihat meja mana yang masih kosong.
  const targetUrl = `${site.siteUrl}/meja?meja=${encodeURIComponent(tableNo || '01')}`;
  const selected = tables.find((t) => t.table_no === tableNo);
  const status = selected ? tableStatus(selected.status) : null;

  /*
    QR menyimpan URL secara permanen di atas kertas. Kalau yang tercetak masih
    localhost / 127.0.0.1, hasil scan dari HP pelanggan pasti gagal — dan baru
    ketahuan setelah stikernya tertempel di semua meja.
  */
  const urlLokal = /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(site.siteUrl);

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

  function handleDownload() {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `qr-meja-${tableNo || '01'}.png`;
    a.click();
  }

  return (
    <section className="card mt-8 overflow-hidden p-0">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="font-bold text-slate-900">Cetak QR Meja</h2>
        <p className="mt-1 text-sm text-slate-500">
          Unduh QR untuk tiap meja, cetak, lalu tempel di mejanya. Pelanggan yang memindainya
          langsung melihat ketersediaan meja dan bisa memesan tanpa akun.
        </p>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-[300px_1fr]">
        <div className="mx-auto w-full max-w-[280px] rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600">
            Meja {tableNo || '—'}
          </p>

          {status && (
            <span
              className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${status.ring} ${status.text}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          )}

          <div className="mt-4 flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-white">
            {dataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={dataUrl}
                alt={`QR pemesanan meja ${tableNo}`}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="skeleton h-full w-full rounded-2xl" />
            )}
          </div>
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
                hint="QR berbeda untuk tiap meja — jangan tertukar saat menempel."
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

              <Button onClick={handleDownload} disabled={!dataUrl} className="w-fit">
                Unduh QR Meja {tableNo} (PNG)
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
