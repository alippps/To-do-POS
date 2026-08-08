import QRCode from 'qrcode';
import { rupiah } from '@/lib/format';

/**
 * Kode QRIS untuk pesanan yang memilih bayar non-tunai.
 *
 * ============ INI SIMULASI, BUKAN ALAT PEMBAYARAN ============
 * Kode di bawah TIDAK dibuat mengikuti spesifikasi EMVCo/QRIS dan tidak
 * terhubung ke penyedia pembayaran mana pun. Isinya teks biasa berisi nomor
 * pesanan, nama outlet, dan nominalnya — dipindai dengan kamera HP, yang
 * muncul adalah keterangan itu, bukan layar bayar.
 *
 * Ini keputusan sadar, bukan keterbatasan. Membuat muatan yang menyerupai QRIS
 * sungguhan berarti mencetak sesuatu yang bisa dikira alat pembayaran oleh
 * orang yang menempelkannya di meja — dan kegagalannya baru ketahuan setelah
 * ada pelanggan yang merasa sudah membayar. Selama belum ada integrasi penyedia
 * yang sebenarnya, lebih aman kode ini jujur mengaku contoh.
 *
 * Saat integrasi asli dipasang nanti, yang berubah cukup `muatanQris()` di
 * bawah dan label peringatannya; letak, ukuran, dan tempat pemanggilannya
 * sudah pada posisinya.
 */
function muatanQris({ invoice, total, outlet }) {
  return [
    'SIMULASI-QRIS',
    `outlet:${outlet}`,
    `invoice:${invoice}`,
    `nominal:IDR${Math.round(Number(total) || 0)}`,
    'catatan:contoh-tidak-untuk-pembayaran-sungguhan',
  ].join('|');
}

export default async function QrisPayment({ invoice, total, outlet, lunas = false }) {
  const dataUrl = await QRCode.toDataURL(muatanQris({ invoice, total, outlet }), {
    width: 640,
    margin: 1,
    color: { dark: '#341810', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  }).catch(() => '');

  return (
    <section className="card overflow-hidden p-0">
      <div className="border-b border-slate-100 px-5 py-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-600">
          Pembayaran QRIS
        </p>
        <h2 className="mt-1 font-bold text-slate-900">
          {lunas ? 'Pembayaran sudah diterima' : 'Pindai untuk membayar'}
        </h2>
      </div>

      <div className="p-5">
        {lunas ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-center">
            <span className="text-3xl">✅</span>
            <p className="mt-2 text-sm font-semibold text-emerald-800">
              Pesanan ini sudah ditandai lunas oleh kasir.
            </p>
            <p className="mt-1 text-xs leading-snug text-emerald-700">
              Tidak perlu memindai apa pun lagi.
            </p>
          </div>
        ) : (
          <>
            <div className="mx-auto w-full max-w-[260px]">
              <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-card">
                {dataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={dataUrl}
                    alt={`Kode QRIS simulasi untuk pesanan ${invoice}`}
                    className="h-auto w-full"
                  />
                ) : (
                  <div className="skeleton aspect-square w-full rounded-xl" />
                )}

                <div className="mt-3 border-t border-slate-100 pt-3 text-center">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    Nominal
                  </p>
                  <p className="text-xl font-extrabold text-slate-900">{rupiah(total)}</p>
                  <p className="mt-1 font-mono text-[11px] text-slate-400">{invoice}</p>
                </div>
              </div>
            </div>

            {/*
              Peringatan ditaruh menempel pada kodenya, bukan di catatan kaki
              halaman. Yang perlu tahu ini contoh adalah orang yang sedang
              mengangkat HP-nya untuk memindai — bukan yang menggulir sampai
              bawah.
            */}
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-snug text-amber-900">
              <span className="font-bold">Kode contoh untuk peragaan sistem.</span> Belum terhubung
              ke penyedia pembayaran, jadi memindainya tidak memotong saldo apa pun. Untuk
              sekarang, selesaikan pembayaran di kasir sambil menunjukkan nomor pesanan di atas.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
