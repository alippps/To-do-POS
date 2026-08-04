'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { createClient } from '@/lib/supabase/client';
import { authErrorMessage } from '@/lib/authErrors';

/**
 * Hanya izinkan tujuan redirect yang berada di dalam situs ini.
 *
 * Tanpa penyaringan ini, tautan seperti `/login?next=https://situs-jahat.com`
 * akan melempar pengguna ke luar tepat setelah login berhasil (open redirect).
 * `//host` juga ditolak karena URL protocol-relative tetap keluar dari situs.
 */
function safeNext(value) {
  if (typeof value !== 'string') return '/';
  if (!value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get('next'));

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    });

    if (authError) {
      setLoading(false);
      setError(authErrorMessage(authError));
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    /*
      Hanya admin yang punya tujuan setelah login. Akun ber-role `user` sengaja
      TIDAK dilempar ke /menu: sisi publik kini tanpa tombol keluar, jadi mereka
      akan terkunci di sesi yang tidak bisa dipakai apa-apa. Cukup refresh —
      halaman ini berganti jadi panel sesi yang menjelaskan situasinya.
    */
    if (profile?.role !== 'admin') {
      router.refresh();
      return;
    }

    router.push(next !== '/' ? next : '/admin');
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Selamat datang kembali</h1>
      <p className="mt-2 text-sm text-slate-500">
        Masuk untuk mengelola outlet Anda. Pelanggan tidak perlu akun untuk memesan.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          placeholder="kasir@todocoffee.id"
          hint="Email akun staf — bukan email pelanggan."
          required
        />

        <div className="relative">
          <Input
            label="Kata sandi"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            placeholder="••••••••"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-[38px] text-xs font-semibold text-slate-400 transition hover:text-brand-600"
          >
            {showPassword ? 'Sembunyikan' : 'Lihat'}
          </button>
        </div>

        {error && (
          <p className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Memproses...' : 'Masuk'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Belum punya akun?{' '}
        <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-700">
          Daftar gratis
        </Link>
      </p>
    </div>
  );
}
