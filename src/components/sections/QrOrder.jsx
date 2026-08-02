'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import Container from '@/components/ui/Container';
import SectionHeading from '@/components/ui/SectionHeading';
import Button from '@/components/ui/Button';
import { site } from '@/lib/site';
import { tableStatus } from '@/lib/tables';

const STEPS = [
  {
    title: 'Scan QR di meja',
    text: 'Arahkan kamera HP ke QR. Tanpa install aplikasi, tanpa buat akun.',
  },
  {
    title: 'Lihat meja yang tersedia',
    text: 'Layar langsung menampilkan denah meja beserta status kosong / terisi.',
  },
  {
    title: 'Pilih menu favorit',
    text: 'Daftar menu selalu terbaru — item yang habis otomatis tidak bisa dipesan.',
  },
  {
    title: 'Struk langsung terbit',
    text: 'Barista menerima pesanan seketika, struk bisa dicetak sendiri dari HP.',
  },
];

export default function QrOrder({ tables = [] }) {
  const [tableNo, setTableNo] = useState(tables[0]?.table_no || '01');
  const [dataUrl, setDataUrl] = useState('');

  // QR mengarah ke halaman ketersediaan meja, BUKAN langsung ke menu —
  // supaya pelanggan lebih dulu melihat meja mana yang masih kosong.
  const targetUrl = `${site.siteUrl}/meja?meja=${encodeURIComponent(tableNo || '01')}`;
  const selected = tables.find((t) => t.table_no === tableNo);
  const status = selected ? tableStatus(selected.status) : null;

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
    <section id="qr" className="surface-warm py-20 sm:py-24">
      <Container>
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
          <div className="grid lg:grid-cols-2">
            <div className="p-8 sm:p-12">
              <SectionHeading
                align="left"
                eyebrow="QR Ordering"
                title="Scan, lihat meja kosong, pesan"
                description="Cetak QR untuk setiap meja, tempel, selesai. Pelanggan memesan sendiri tanpa login sementara kasir fokus meracik."
              />

              <ol className="mt-8 space-y-5">
                {STEPS.map((s, i) => (
                  <li key={s.title} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">{s.title}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{s.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex flex-col items-center justify-center gap-6 border-t border-slate-100 bg-gradient-to-br from-brand-50 to-white p-8 sm:p-12 lg:border-l lg:border-t-0">
              <div className="w-full max-w-xs rounded-3xl border border-brand-100 bg-white p-6 text-center shadow-pop">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-600">
                  Meja {tableNo || '01'}
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

                <p className="mt-4 text-sm font-semibold text-slate-900">Scan untuk memesan</p>
                <p className="mt-1 break-all text-[11px] text-slate-400">{targetUrl}</p>
              </div>

              <div className="flex w-full max-w-xs flex-col gap-3">
                <label className="block">
                  <span className="label-base">Nomor meja</span>
                  {tables.length > 0 ? (
                    <select
                      value={tableNo}
                      onChange={(e) => setTableNo(e.target.value)}
                      className="input-base cursor-pointer text-center font-semibold"
                    >
                      {tables.map((t) => (
                        <option key={t.id} value={t.table_no}>
                          Meja {t.table_no} · {t.label || t.area}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={tableNo}
                      onChange={(e) => setTableNo(e.target.value.slice(0, 4))}
                      placeholder="01"
                      className="input-base text-center font-semibold"
                    />
                  )}
                </label>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={handleDownload}
                    disabled={!dataUrl}
                  >
                    Unduh QR
                  </Button>
                  <Button href={`/meja?meja=${encodeURIComponent(tableNo || '01')}`} className="flex-1">
                    Coba Scan
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
