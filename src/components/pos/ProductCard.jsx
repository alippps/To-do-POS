'use client';

import { useState } from 'react';
import Image from 'next/image';
import Badge from '@/components/ui/Badge';
import { rupiah } from '@/lib/format';
import { promoInfo } from '@/lib/promo';

/*
  Lebar kartu pada tiap titik henti, dipakai `sizes`.

  Grid menunya 1 kolom di HP, 2 di sm, 3 di lg (lihat PosClient & katalog).
  Tanpa `sizes`, next/image menganggap gambarnya selebar viewport dan
  mengunduh berkas 1200px untuk kartu yang di layar cuma 380px — boros kuota
  pelanggan yang justru sedang memesan dari HP-nya.
*/
const UKURAN = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw';

export default function ProductCard({ product, qty = 0, onAdd, onRemove }) {
  const habis = product.stock <= 0;
  const { isPromo, basePrice, finalPrice, discountPercent } = promoInfo(product);

  /*
    Gambar yang GAGAL dimuat harus punya jalan keluar.

    `image_url` diisi admin lewat /admin/produk sebagai URL bebas: tautan bisa
    mati, host bisa berganti, atau alamatnya salah ketik sejak awal. Tanpa
    penanganan ini yang tersisa adalah ikon gambar rusak bawaan browser di
    tengah kartu menu — dan pelanggan menyimpulkan menunya yang bermasalah,
    bukan tautannya.

    Jatuh ke lambang cangkir yang sama dengan produk yang memang belum
    berfoto, jadi kartu tanpa gambar dan kartu bergambar rusak terlihat
    sama-sama disengaja.
  */
  const [gagalMuat, setGagalMuat] = useState(false);
  const pakaiGambar = Boolean(product.image_url) && !gagalMuat;

  return (
    <article
      className={`card group flex flex-col overflow-hidden p-0 transition duration-300 ${
        habis ? 'opacity-60' : 'hover:-translate-y-1 hover:shadow-pop'
      }`}
    >
      {/*
        `aspect-[4/3]` sudah ada sejak versi <img>, dan ia yang menahan layout
        shift: kotaknya punya tinggi sebelum gambarnya tiba, jadi harga dan
        tombol di bawah tidak pernah melompat saat gambar selesai dimuat.
        `fill` membuat next/image mengisi kotak itu alih-alih membawa ukuran
        intrinsiknya sendiri — yang tidak bisa diketahui di muka, sebab URL-nya
        diisi admin dan bisa berukuran apa saja.
      */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {pakaiGambar ? (
          <Image
            src={product.image_url}
            /*
              Nama produk saja, tanpa "Foto" atau "Gambar" di depannya —
              pembaca layar sudah mengumumkan elemennya sebagai gambar, dan
              menambahkannya membuat kalimatnya berbunyi "gambar Gambar
              Cappuccino".
            */
            alt={product.name}
            fill
            sizes={UKURAN}
            onError={() => setGagalMuat(true)}
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            /*
              Lambangnya dekoratif — namanya sudah tertulis sebagai judul tepat
              di bawah kartu ini, jadi membacakan "cangkir kopi panas" hanya
              menambah kebisingan.
            */
            aria-hidden="true"
            className="flex h-full items-center justify-center text-4xl"
          >
            ☕
          </div>
        )}

        <span className="absolute left-3 top-3">
          <Badge tone="blue">{product.category}</Badge>
        </span>

        {habis && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-bold uppercase tracking-wider text-slate-500">
            Stok habis
          </span>
        )}

        {qty > 0 ? (
          <span className="absolute right-3 top-3 flex h-7 min-w-7 items-center justify-center rounded-full bg-brand-600 px-2 text-xs font-bold text-white shadow-pop">
            {qty}
          </span>
        ) : (
          isPromo && (
            <span className="absolute right-3 top-3 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-extrabold text-white shadow-pop">
              −{discountPercent}%
            </span>
          )
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-bold text-slate-900">{product.name}</h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-slate-500">
          {product.description || 'Menu pilihan barista kami.'}
        </p>

        {/*
          Harga dan tombol sengaja ditumpuk (bukan bersebelahan) supaya tidak
          berdesakan saat kartu menyempit — harga panjang seperti "Rp 38.000"
          tetap punya ruang, dan tombolnya jadi lebar & mudah ditekan di HP.
        */}
        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="flex items-baseline gap-2">
              <span
                className={`text-lg font-extrabold ${isPromo ? 'text-rose-600' : 'text-brand-700'}`}
              >
                {rupiah(finalPrice)}
              </span>
              {isPromo && (
                <span className="text-xs font-medium text-slate-400 line-through">
                  {rupiah(basePrice)}
                </span>
              )}
            </p>
            <p className="shrink-0 text-[11px] text-slate-400">Tersisa {product.stock}</p>
          </div>

          {qty > 0 ? (
            <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-brand-200 bg-brand-50 p-1.5">
              <button
                type="button"
                onClick={() => onRemove(product)}
                aria-label={`Kurangi ${product.name}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-lg text-brand-700 transition hover:bg-brand-100"
              >
                −
              </button>
              <span className="text-sm font-bold text-brand-800">{qty} di keranjang</span>
              <button
                type="button"
                onClick={() => onAdd(product)}
                disabled={qty >= product.stock}
                aria-label={`Tambah ${product.name}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-lg text-white transition hover:bg-brand-700 disabled:opacity-40"
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onAdd(product)}
              disabled={habis}
              className="mt-3 w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {habis ? 'Stok habis' : 'Tambah ke keranjang'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
