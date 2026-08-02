'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { createClient } from '@/lib/supabase/client';
import { authErrorMessage } from '@/lib/authErrors';

export default function RegisterForm() {
  const router = useRouter();

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
        data: { full_name: form.fullName.trim(), phone: form.phone.trim() || null },
      },
    });
    setLoading(false);

    if (error) {
      setMessage({ ok: false, text: authErrorMessage(error) });
      return;
    }

    // Jika konfirmasi email dimatikan, session langsung aktif
    if (data.session) {
      router.push('/menu');
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
        Akun baru dibuat dengan role <span className="font-semibold text-slate-700">user</span>.
        Akses admin diberikan oleh admin yang sudah ada lewat halaman Hak Akses.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
        <Input
          label="Nama lengkap *"
          value={form.fullName}
          onChange={(e) => change('fullName', e.target.value)}
          placeholder="Nama Anda"
          error={errors.fullName}
          required
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Email *"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => change('email', e.target.value)}
            placeholder="nama@email.com"
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
          label="Kata sandi *"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => change('password', e.target.value)}
          placeholder="Minimal 6 karakter"
          error={errors.password}
          required
        />

        <Input
          label="Ulangi kata sandi *"
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
        <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}
