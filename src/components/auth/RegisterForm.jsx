'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { Input, Wajib } from '@/components/ui/Field';
import { createClient } from '@/lib/supabase/client';
import { authErrorMessage } from '@/lib/authErrors';
import { useTenant, useTenantHref } from '@/components/tenant/TenantProvider';

export default function RegisterForm() {
  const router = useRouter();
  const tenant = useTenant();
  const t = useTenantHref();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null); // { ok, text }
  const [loading, setLoading] = useState(false);

  function change(key, value) {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  }

  function validate() {
    const e = {};
    if (form.fullName.trim().length < 3) e.fullName = 'Nama minimal 3 karakter.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Format email tidak valid.';
    if (form.password.length < 6) e.password = 'Kata sandi minimal 6 karakter.';
    if (form.password !== form.confirm) e.confirm = 'Konfirmasi kata sandi tidak cocok.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    if (!validate()) return;

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        /*
          `tenant_slug` dititipkan lewat metadata pendaftaran.

          Trigger `handle_new_user()` di database membacanya untuk menentukan
          outlet mana yang dimasuki akun ini. Tanpa itu, profilnya lahir tanpa
          tenant dan tidak bisa dinaikkan jadi staf outlet mana pun tanpa
          campur tangan SQL.
        */
        data: {
          full_name: form.fullName.trim(),
          phone: form.phone.trim() || null,
          tenant_slug: tenant.slug,
        },
      },
    });
    setLoading(false);

    if (error) {
      setMessage({ ok: false, text: authErrorMessage(error) });
      return;
    }

    /*
      Sesi langsung aktif (konfirmasi email dimatikan) → tetap di halaman ini.

      Dulu akun baru dilempar ke `/menu`. Padahal ini halaman pendaftaran STAF,
      dan sisi publik sengaja tidak punya tombol Keluar maupun identitas akun —
      jadi yang baru mendaftar mendarat di layar pelanggan tanpa cara keluar
      dari sesinya sendiri, persis kondisi terkunci yang `LoginForm` hindari
      dengan sengaja. Tujuannya `/login`, satu-satunya halaman yang berganti
      jadi `SessionPanel` saat sesi aktif — di situ role-nya dijelaskan dan
      tombol keluarnya tersedia.
    */
    if (data.session) {
      router.push(t('/login'));
      router.refresh();
      return;
    }

    setMessage({
      ok: true,
      text: 'Pendaftaran berhasil! Cek email Anda untuk konfirmasi, lalu masuk lewat halaman Login.',
    });
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Buat akun staf</h1>
      <p className="mt-2 text-sm text-slate-500">
        Akun ini dibuat untuk <span className="font-semibold text-slate-700">{tenant.name}</span>{' '}
        dengan role <span className="font-semibold text-slate-700">user</span>. Akses kasir/admin
        diberikan oleh admin outlet ini lewat halaman Hak Akses.
      </p>

      {/*
        Banyak orang ragu menyerahkan email pribadi hanya untuk mencoba sistem.
        Sebutkan sejak awal ke mana email itu dipakai dan ke mana tidak.
      */}
      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
          Soal email kamu
        </p>
        <ul className="mt-2 space-y-1.5 text-xs leading-snug text-slate-500">
          <li>• Dipakai hanya sebagai nama pengguna untuk masuk ke dashboard.</li>
          <li>• Tidak pernah muncul di halaman pelanggan maupun di struk.</li>
          <li>• Tanpa promosi. Satu-satunya kiriman adalah tautan konfirmasi pendaftaran.</li>
          {/*
            Jangan menjanjikan alamat karangan bisa dipakai: Supabase menolak
            alamat yang dianggap email percobaan — lihat pesan
            `email_address_invalid` di src/lib/authErrors.js.
          */}
          <li>• Pakai alamat yang benar-benar bisa kamu buka, boleh alamat kerja bersama.</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
        <Input
          label={<Wajib>Nama lengkap</Wajib>}
          value={form.fullName}
          onChange={(e) => change('fullName', e.target.value)}
          placeholder="Nama Anda"
          error={errors.fullName}
          required
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={<Wajib>Email</Wajib>}
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => change('email', e.target.value)}
            placeholder="nama@emailkamu.com"
            hint="Hanya untuk masuk ke dashboard. Tidak ditampilkan ke pelanggan."
            error={errors.email}
            required
          />
          <Input
            label="No. WhatsApp"
            value={form.phone}
            onChange={(e) => change('phone', e.target.value)}
            placeholder="08xxxxxxxxxx"
          />
        </div>

        <Input
          label={<Wajib>Kata sandi</Wajib>}
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => change('password', e.target.value)}
          placeholder="Minimal 6 karakter"
          error={errors.password}
          required
        />

        <Input
          label={<Wajib>Ulangi kata sandi</Wajib>}
          type="password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={(e) => change('confirm', e.target.value)}
          placeholder="Ulangi kata sandi"
          error={errors.confirm}
          required
        />

        {message && (
          <p
            className={`rounded-xl border px-4 py-3 text-sm font-medium ${
              message.ok
                ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                : 'border-rose-100 bg-rose-50 text-rose-700'
            }`}
          >
            {message.text}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Sudah punya akun?{' '}
        <Link href={t('/login')} className="font-semibold text-brand-600 hover:text-brand-700">
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}
