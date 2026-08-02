'use client';

import Badge from '@/components/ui/Badge';
import { rupiah } from '@/lib/format';

export default function ProductCard({ product, qty = 0, onAdd, onRemove }) {
  const habis = product.stock <= 0;

  return (
    <article
      className={`card group flex flex-col overflow-hidden p-0 transition duration-300 ${
        habis ? 'opacity-60' : 'hover:-translate-y-1 hover:shadow-pop'
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">☕</div>
        )}

        <span className="absolute left-3 top-3">
          <Badge tone="blue">{product.category}</Badge>
        </span>

        {habis && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-bold uppercase tracking-wider text-slate-500">
            Stok habis
          </span>
        )}

        {qty > 0 && (
          <span className="absolute right-3 top-3 flex h-7 min-w-7 items-center justify-center rounded-full bg-brand-600 px-2 text-xs font-bold text-white shadow-pop">
            {qty}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-bold text-slate-900">{product.name}</h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-slate-500">
          {product.description || 'Menu pilihan barista kami.'}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-lg font-extrabold text-brand-700">{rupiah(product.price)}</p>
            <p className="text-[11px] text-slate-400">Tersisa {product.stock}</p>
          </div>

          {qty > 0 ? (
            <div className="flex items-center gap-1 rounded-xl border border-brand-200 bg-brand-50 p-1">
              <button
                type="button"
                onClick={() => onRemove(product)}
                aria-label={`Kurangi ${product.name}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-brand-700 transition hover:bg-brand-100"
              >
                −
              </button>
              <span className="w-6 text-center text-sm font-bold text-brand-800">{qty}</span>
              <button
                type="button"
                onClick={() => onAdd(product)}
                disabled={qty >= product.stock}
                aria-label={`Tambah ${product.name}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-40"
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onAdd(product)}
              disabled={habis}
              className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Tambah
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
