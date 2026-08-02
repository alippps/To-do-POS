'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { createClient } from '@/lib/supabase/client';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';

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
      setError(
        authError.message === 'Invalid login credentials'
          ? 'Email atau kata sandi salah.'
          : authError.message
      );
      return;
    }

    // Admin diarahkan ke dashboard, pengguna biasa ke halaman tujuan
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    const target = next !== '/' ? next : profile?.role === 'admin' ? '/admin' : '/fitur';

    router.push(target);
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Selamat datang kembali</h1>
      <p className="mt-2 text-sm text-slate-500">Masuk untuk memesan atau mengelola outlet Anda.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          placeholder="nama@email.com"
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
