'use client';

// Sejak memakai `useId` untuk menghubungkan label & pesan error ke inputnya,
// modul ini wajib hidup di sisi klien. Kedelapan pemakainya memang sudah client
// component; direktif ini membuatnya jadi kontrak, bukan kebetulan.
import { forwardRef, useId } from 'react';

/*
  Label memakai `htmlFor`, bukan membungkus inputnya.

  Bentuk lama (<label> membungkus semuanya) bekerja selama isinya cuma teks.
  Begitu ada kendali lain di dalam kotak input — tombol lihat/sembunyikan kata
  sandi — teksnya ikut terhitung sebagai nama input, dan pembaca layar
  mengumumkan "Kata sandi Lihat". Dengan `htmlFor`, label hanya berisi labelnya
  sendiri dan sisanya bebas ditempati apa pun.

  Pesan error juga dihubungkan, tidak sekadar diletakkan di bawah input:
  sebelumnya "Format email tidak valid." hanya berupa <span> yang kebetulan
  berdekatan, jadi tidak pernah terdengar dan formulir terasa menolak tanpa
  alasan. `aria-invalid` menyatakan keadaannya, `aria-describedby` menunjuk
  kalimat penjelasnya.
*/
function useField({ id: idProp, hint, error }) {
  const generated = useId();
  const id = idProp || generated;
  const hintId = hint && !error ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return {
    id,
    describedBy: [hintId, errorId].filter(Boolean).join(' ') || undefined,
    hintId,
    errorId,
  };
}

/**
 * Penanda kolom wajib.
 *
 * Dulu ada dua cara menandainya: komponen ber-asterisk merah di keranjang, dan
 * teks polos `"Nama lengkap *"` di formulir kontak & pendaftaran. Bintangnya
 * sama-sama muncul, tapi yang satu terbaca sebagai penanda dan yang lain
 * seperti salah ketik. Nama yang terbaca pembaca layar tetap sama persis
 * ("Nama lengkap *"), jadi penyeragaman ini tidak mengubah label apa pun.
 */
export function Wajib({ children }) {
  return (
    <>
      {children} <span className="font-bold text-rose-500">*</span>
    </>
  );
}

function Label({ htmlFor, children }) {
  if (!children) return null;
  return (
    <label htmlFor={htmlFor} className="label-base">
      {children}
    </label>
  );
}

function Hint({ id, children }) {
  return (
    <span id={id} className="mt-1.5 block text-xs text-slate-400">
      {children}
    </span>
  );
}

function ErrorText({ id, children }) {
  return (
    <span id={id} role="alert" className="mt-1.5 block text-xs text-rose-600">
      {children}
    </span>
  );
}

const errorRing = 'border-rose-300 focus:ring-rose-100';

/**
 * @param {React.ReactNode} [adornment]
 *   Kendali kecil yang menempel di dalam kotak input — misalnya tombol
 *   lihat/sembunyikan kata sandi.
 *
 *   Dibuat sebagai prop, bukan diletakkan sendiri oleh pemakainya. Waktu
 *   `LoginForm` memosisikannya sendiri dengan `top-[38px]`, angka itu benar
 *   hanya selama kolomnya tidak punya `hint` atau pesan error — menambah salah
 *   satunya menggeser input turun sementara tombolnya tinggal di tempat.
 *   Dibungkus di sini, kendalinya terikat pada kotak inputnya sendiri dan tidak
 *   peduli ada apa di atas maupun di bawahnya.
 */
/*
  `forwardRef` supaya pemanggilnya bisa MEMINDAHKAN FOKUS ke kolom ini.

  Formulir yang menolak kiriman perlu menunjukkan kolom mana yang bermasalah,
  bukan sekadar menuliskannya. Di layar sempit — keranjang sebagai bottom sheet,
  misalnya — kolom yang salah bisa berada di luar layar saat pesannya muncul,
  dan tanpa cara memindahkan fokus, satu-satunya petunjuk adalah kalimat yang
  menyuruh mencari sendiri.
*/
export const Input = forwardRef(function Input(
  { label, hint, error, adornment, className = '', ...props },
  ref
) {
  const { id, describedBy, hintId, errorId } = useField({ id: props.id, hint, error });

  const input = (
    <input
      {...props}
      ref={ref}
      id={id}
      className={`input-base ${error ? errorRing : ''} ${adornment ? 'pr-24' : ''} ${className}`}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy}
    />
  );

  return (
    <div className="block">
      <Label htmlFor={id}>{label}</Label>
      {adornment ? (
        <span className="relative block">
          {input}
          <span className="absolute inset-y-0 right-3 flex items-center">{adornment}</span>
        </span>
      ) : (
        input
      )}
      {hint && !error && <Hint id={hintId}>{hint}</Hint>}
      {error && <ErrorText id={errorId}>{error}</ErrorText>}
    </div>
  );
});

export function Textarea({ label, hint, error, className = '', ...props }) {
  const { id, describedBy, hintId, errorId } = useField({ id: props.id, hint, error });

  return (
    <div className="block">
      <Label htmlFor={id}>{label}</Label>
      <textarea
        {...props}
        id={id}
        // Cincin fokus merah disamakan dengan Input & Select — sebelumnya
        // textarea yang bermasalah hanya berganti warna border, dan warnanya
        // hilang lagi begitu kolomnya difokuskan.
        className={`input-base min-h-[120px] resize-y ${error ? errorRing : ''} ${className}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
      {hint && !error && <Hint id={hintId}>{hint}</Hint>}
      {error && <ErrorText id={errorId}>{error}</ErrorText>}
    </div>
  );
}

export function Select({ label, hint, error, children, className = '', ...props }) {
  const { id, describedBy, hintId, errorId } = useField({ id: props.id, hint, error });

  return (
    <div className="block">
      <Label htmlFor={id}>{label}</Label>
      <select
        {...props}
        id={id}
        className={`input-base cursor-pointer ${error ? errorRing : ''} ${className}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      >
        {children}
      </select>
      {hint && !error && <Hint id={hintId}>{hint}</Hint>}
      {error && <ErrorText id={errorId}>{error}</ErrorText>}
    </div>
  );
}
