'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { Input, Textarea, Wajib } from '@/components/ui/Field';
import { useTenant } from '@/components/tenant/TenantProvider';
import { UMPAN } from '@/lib/honeypot';
import { BATAS } from '@/lib/limits';
import { sendMessage } from '@/app/k/[slug]/(site)/kontak/actions';

const EMPTY = { name: '', email: '', phone: '', message: '', [UMPAN]: '' };

export default function ContactForm() {
  const tenant = useTenant();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null); // { ok, message }
  const [loading, setLoading] = useState(false);

  function change(key, value) {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  }

  function validate() {
    const e = {};
    if (form.name.trim().length < 3) e.name = 'Nama minimal 3 karakter.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Format email tidak valid.';

    /*
      Nomor WhatsApp opsional — tapi kalau diisi, harus bisa dihubungi.

      Kolom ini sejak dulu meneruskan `errors.phone` ke inputnya padahal tidak
      ada satu pun kode yang mengisinya, jadi nomor salah ketik lolos diam-diam
      dan baru ketahuan saat tim mencoba membalas. Angka, spasi, tanda hubung,
      kurung, dan awalan + dibiarkan supaya orang bebas menulis 0812-3456-7890
      maupun +62 812 3456 7890.
    */
    const phone = form.phone.trim();
    if (phone) {
      const digit = phone.replace(/[\s\-()+]/g, '');
      if (!/^\d{8,15}$/.test(digit)) {
        e.phone = 'Nomor tidak valid. Contoh: 0812-3456-7890.';
      }
    }

    if (form.message.trim().length < 10) e.message = 'Pesan minimal 10 karakter.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);
    if (!validate()) return;

    setLoading(true);
    const res = await sendMessage({ ...form, tenantSlug: tenant.slug });
    setLoading(false);

    setStatus({ ok: res.ok, message: res.message });
    if (res.ok) {
      setForm(EMPTY);
      setErrors({});
    } else if (res.errors) {
      setErrors(res.errors);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-6 sm:p-8" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={<Wajib>Nama lengkap</Wajib>}
          value={form.name}
          onChange={(e) => change('name', e.target.value)}
          placeholder="Nama Anda"
          maxLength={BATAS.nama}
          error={errors.name}
        />
        <Input
          label="Nomor WhatsApp"
          value={form.phone}
          onChange={(e) => change('phone', e.target.value)}
          placeholder="08xxxxxxxxxx"
          maxLength={BATAS.telepon}
          error={errors.phone}
        />
      </div>

      <Input
        label={<Wajib>Email</Wajib>}
        type="email"
        value={form.email}
        onChange={(e) => change('email', e.target.value)}
        placeholder="nama@example.com"
        hint="Hanya dibaca tim kami untuk membalas. Tidak ditampilkan di website."
        maxLength={BATAS.email}
        error={errors.email}
      />

      <Textarea
        label={<Wajib>Pesan</Wajib>}
        value={form.message}
        onChange={(e) => change('message', e.target.value)}
        placeholder="Ceritakan kebutuhan Anda — jenis usaha, jumlah outlet, dan kendala saat ini."
        maxLength={BATAS.pesan}
        error={errors.message}
      />

      {/*
        `aria-live`: hasil kirim muncul jauh di bawah tombol dan tidak memindah
        fokus, jadi tanpa ini pemakai pembaca layar menekan "Kirim Pesan" lalu
        tidak mendengar apa pun — berhasil dan gagal terasa sama saja.
      */}
      <div aria-live="polite">
        {status && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm font-medium ${
              status.ok
                ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                : 'border-rose-100 bg-rose-50 text-rose-700'
            }`}
          >
            {status.message}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-400">Kolom bertanda * wajib diisi.</p>
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? 'Mengirim...' : 'Kirim Pesan'}
        </Button>
      </div>

      {/*
        KOLOM UMPAN — tidak terlihat, tidak terdengar, tidak bisa di-Tab.

        Disembunyikan lewat POSISI (`-left-[9999px]`), bukan `display: none`
        maupun `hidden`: sebagian pengisi formulir otomatis sudah cukup pintar
        untuk melewati kolom yang jelas-jelas disembunyikan begitu, dan
        perangkap yang dilewati tidak menangkap apa-apa.

        Tiga penjaga menemani supaya orang sungguhan tidak pernah tersandung:
        `aria-hidden` menyembunyikannya dari pembaca layar, `tabIndex={-1}`
        mengeluarkannya dari urutan Tab, dan `autoComplete="off"` menahan
        pengisi otomatis BROWSER — yang dipakai manusia — supaya tidak ikut
        mengisinya lalu membuat pesan mereka ditelan diam-diam.

        Ditaruh sebagai anak TERAKHIR, bukan pertama. `space-y-4` pada form
        bekerja lewat `> * + *`, jadi anak pertama yang tak terlihat pun tetap
        membuat elemen sesudahnya mendapat margin atas — satu rem ruang kosong
        di dalam kartu yang tidak ada yang memintanya.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden"
      >
        <label htmlFor={UMPAN}>Website</label>
        <input
          id={UMPAN}
          name={UMPAN}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form[UMPAN]}
          onChange={(e) => change(UMPAN, e.target.value)}
        />
      </div>
    </form>
  );
}
