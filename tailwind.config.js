/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        /**
         * Palet aksen: karamel / kopi sangrai.
         * Dipakai untuk tombol utama, highlight, dan elemen aktif.
         */
        brand: {
          50: '#fdf8f3',
          100: '#f8ecdf',
          200: '#f0d5b8',
          300: '#e4b686',
          400: '#d69354',
          500: '#c97832',
          600: '#b05f27',
          700: '#8f4823',
          800: '#743b23',
          900: '#60321f',
          950: '#341810',
        },

        /**
         * Netral hangat menggantikan `slate` bawaan Tailwind.
         * Semua kelas `text-slate-*` / `bg-slate-*` di seluruh aplikasi
         * otomatis ikut menghangat — satu sumber kebenaran untuk warna netral.
         */
        slate: {
          50: '#fbf9f7',
          100: '#f5f1ec',
          200: '#e9e2d8',
          300: '#d5cabc',
          400: '#a99b8b',
          500: '#7b7063',
          600: '#5d554a',
          700: '#48413a',
          800: '#332d28',
          900: '#221e1a',
          950: '#151210',
        },

        /** Hijau daun untuk status "tersedia" & nominal positif. */
        emerald: {
          50: '#f0f9f3',
          100: '#dcf0e2',
          200: '#bbe1c9',
          300: '#8ccaa6',
          400: '#57ac7d',
          500: '#358f60',
          600: '#25724c',
          700: '#1e5b3f',
          800: '#1a4833',
          900: '#163c2c',
        },
      },

      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'ui-sans-serif', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },

      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },

      boxShadow: {
        card: '0 1px 2px rgba(52,24,16,.04), 0 10px 30px -18px rgba(52,24,16,.25)',
        pop: '0 10px 30px -10px rgba(176,95,39,.45)',
        lift: '0 24px 60px -28px rgba(52,24,16,.45)',
      },

      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(.8)', opacity: '.7' },
          '80%, 100%': { transform: 'scale(1.6)', opacity: '0' },
        },
      },

      animation: {
        'fade-up': 'fade-up .5s cubic-bezier(.22,1,.36,1) both',
        'fade-in': 'fade-in .4s ease-out both',
        'scale-in': 'scale-in .25s cubic-bezier(.22,1,.36,1) both',
        shimmer: 'shimmer 1.8s linear infinite',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(.22,1,.36,1) infinite',
      },
    },
  },
  plugins: [],
};
