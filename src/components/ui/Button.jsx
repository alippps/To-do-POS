import Link from 'next/link';

/*
  Setiap tampilan tombol punya varian sendiri — tidak ada yang ditimpa lewat
  `className`.

  Ini bukan soal kerapian. `className` memang disambung paling belakang, tapi
  Tailwind menentukan pemenang dari urutan aturan di FILE CSS, bukan urutan
  kata di atribut. `bg-white/10` yang menimpa `bg-brand-600` kebetulan menang
  hari ini semata-mata karena `white` tersusun sesudah `brand` di palet — dan
  itu berubah begitu ada yang menambah atau menyusun ulang warna di
  tailwind.config.js. Tombol yang tampilannya berbeda diberi nama, bukan
  ditumpangkan.
*/
const VARIANTS = {
  primary:
    'bg-brand-600 text-white shadow-pop hover:bg-brand-700 focus-visible:ring-brand-200',
  secondary:
    'bg-white text-brand-700 border border-brand-200 hover:bg-brand-50 focus-visible:ring-brand-100',
  ghost: 'text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-200',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-200',
  whatsapp: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 focus-visible:ring-emerald-200',
  dark: 'bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-300',
  /** Tombol sekunder di atas panel berwarna pekat (gradien brand). */
  glass: 'bg-white/10 text-white backdrop-blur hover:bg-white/20 focus-visible:ring-white/40',
  /** Tombol utama di atas panel berwarna pekat — putih solid, teks gelap. */
  inverse: 'bg-white text-brand-700 hover:bg-brand-50 focus-visible:ring-white/60',
};

const SIZES = {
  sm: 'px-3.5 py-2 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3.5 text-base',
};

export default function Button({
  as = 'button',
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  const classes = [
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition',
    'focus:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60',
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
    className,
  ].join(' ');

  if (href && as === 'a') {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    );
  }

  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
