'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';
import { sendMessage } from '@/app/(site)/kontak/actions';

const EMPTY = { name: '', email: '', phone: '', message: '' };

export default function ContactForm() {
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
    if (form.message.trim().length < 10) e.message = 'Pesan minimal 10 karakter.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);
    if (!validate()) return;

    setLoading(true);
    const res = await sendMessage(form);
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
          label="Nama lengkap *"
          value={form.name}
          onChange={(e) => change('name', e.target.value)}
          placeholder="Nama Anda"
          error={errors.name}
        />
        <Input
          label="Nomor WhatsApp"
          value={form.phone}
          onChange={(e) => change('phone', e.target.value)}
          placeholder="08xxxxxxxxxx"
          error={errors.phone}
        />
      </div>

      <Input
        label="Email *"
        type="email"
        value={form.email}
        onChange={(e) => change('email', e.target.value)}
        placeholder="nama@contoh.com"
        hint="Hanya dibaca tim kami untuk membalas. Tidak ditampilkan di website."
        error={errors.email}
      />

      <Textarea
        label="Pesan *"
        value={form.message}
        onChange={(e) => change('message', e.target.value)}
        placeholder="Ceritakan kebutuhan Anda — jenis usaha, jumlah outlet, dan kendala saat ini."
        error={errors.message}
      />

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

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-400">Kolom bertanda * wajib diisi.</p>
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? 'Mengirim...' : 'Kirim Pesan'}
        </Button>
      </div>
    </form>
  );
}
