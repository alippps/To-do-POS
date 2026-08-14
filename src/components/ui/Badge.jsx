const TONES = {
  blue: 'bg-brand-50 text-brand-700 border-brand-100',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  rose: 'bg-rose-50 text-rose-700 border-rose-100',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
  /*
    Ditambahkan untuk status "Siap diantar".

    Empat tone lama tidak cukup begitu alur pesanan punya lima tahap: `green`
    sudah dipakai "Lunas", dan memakainya lagi untuk "Siap" membuat dua
    keadaan yang menuntut pekerjaan berbeda — antarkan vs tidak ada apa-apa
    lagi — terlihat sama sekilas di tabel yang penuh.
  */
  violet: 'bg-violet-50 text-violet-700 border-violet-100',
};

export default function Badge({ tone = 'blue', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
        TONES[tone] || TONES.blue
      } ${className}`}
    >
      {children}
    </span>
  );
}
