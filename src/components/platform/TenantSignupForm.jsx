'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { Input, Wajib } from '@/components/ui/Field';
import { slugify, slugValid, tenantPath } from '@/lib/tenant';
import { BATAS } from '@/lib/limits';
import { daftarOutlet } from '@/app/(platform)/daftar-outlet/actions';
import {
  AlertTriangle,
  PartyPopper,
  ArrowLeft,
  Loader2,
  Store,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

const KOSONG = {
  nama: '',
  slug: '',
  tagline: '',
  alamat: '',
  jam: '',
  wa: '',
  email: '',
  telepon: '',
  kode: '',
};

export default function TenantSignupForm() {
  const [form, setForm] = useState(KOSONG);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null); // { ok: false, message }
  const [loading, setLoading] = useState(false);
  const [jadi, setJadi] = useState(null); // { slug, name }

  const [slugDisentuh, setSlugDisentuh] = useState(false);

  function change(key, value) {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  }

  function changeNama(value) {
    change('nama', value);
    if (!slugDisentuh) {
      setForm((p) => ({ ...p, slug: slugify(value) }));
      setErrors((p) => ({ ...p, slug: undefined }));
    }
  }

  function changeSlug(value) {
    setSlugDisentuh(true);
    change('slug', slugify(value));
  }

  function validate() {
    const e = {};
    if (form.nama.trim().length < 3) e.nama = 'Nama usaha minimal 3 karakter.';

    if (!form.slug) {
      e.slug = 'Alamat outlet wajib diisi.';
    } else if (!slugValid(form.slug)) {
      e.slug = 'Panjang alamat 3–50 karakter, hanya huruf kecil, angka, dan tanda hubung.';
    }

    if (!form.kode.trim()) e.kode = 'Kode undangan wajib diisi.';

    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      e.email = 'Format email tidak valid.';
    }

    const wa = form.wa.trim();
    if (wa && !/^\d{8,15}$/.test(wa.replace(/[\s\-()+]/g, ''))) {
      e.wa = 'Nomor tidak valid. Contoh: 0812-3456-7890.';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);
    if (!validate()) return;

    setLoading(true);
    const res = await daftarOutlet(form);
    setLoading(false);

    if (res.ok) {
      setJadi(res.tenant);
      return;
    }

    setStatus({ ok: false, message: res.message });
    setErrors(res.errors || {});
  }

  if (jadi) return <Berhasil tenant={jadi} />;

  return (
    <form
      onSubmit={handleSubmit}
      className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-200/50 sm:p-10 transition-all"
      noValidate
    >
      <div className="space-y-6">
        <Input
          label={<Wajib>Nama usaha</Wajib>}
          value={form.nama}
          maxLength={BATAS.namaUsaha}
          onChange={(e) => changeNama(e.target.value)}
          placeholder="Kopi Pagi Bandung"
          error={errors.nama}
        />

        <Input
          label={<Wajib>Alamat outlet</Wajib>}
          value={form.slug}
          maxLength={BATAS.slug}
          onChange={(e) => changeSlug(e.target.value)}
          placeholder="kopi-pagi-bandung"
          error={errors.slug}
          hint="Terisi otomatis dari nama usaha. Boleh diubah secara manual."
        />

        {/*
          Warning Box (Slug)
          Desain dipertegas karena ini menyangkut fisik (QR Code tercetak)
        */}
        <div className="flex gap-4 rounded-2xl border border-amber-200/60 bg-amber-50/50 p-5 shadow-sm">
          <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-500" strokeWidth={2} />
          <div>
            <p className="text-sm font-bold text-amber-900">
              Alamat outletmu:{' '}
              <span className="inline-block mt-1 sm:mt-0 ml-0 sm:ml-2 rounded-md bg-amber-100/50 px-2 py-0.5 font-mono text-amber-700 border border-amber-200">
                {form.slug ? tenantPath(form.slug) : '/k/…'}
              </span>
            </p>
            <p className="mt-2 text-xs leading-relaxed text-amber-800">
              Alamat ini akan dicetak permanen ke dalam stiker QR setiap meja. Menggantinya di kemudian hari berarti Anda harus <strong>mencetak ulang seluruh kartu meja</strong>. Pastikan ejaannya sudah benar.
            </p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 pt-2">
          <Input
            label="Tagline"
            value={form.tagline}
            maxLength={BATAS.tagline}
            onChange={(e) => change('tagline', e.target.value)}
            placeholder="Kopi & Sarapan Pagi"
            hint="Muncul di bawah nama usaha."
          />
          <Input
            label="Jam buka"
            value={form.jam}
            maxLength={BATAS.jam}
            onChange={(e) => change('jam', e.target.value)}
            placeholder="Setiap hari, 07.00 – 22.00 WIB"
          />
        </div>

        <Input
          label="Alamat lengkap"
          value={form.alamat}
          maxLength={BATAS.alamat}
          onChange={(e) => change('alamat', e.target.value)}
          placeholder="Jl. Braga No. 12, Bandung"
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <Input
            label="Nomor WhatsApp"
            value={form.wa}
            maxLength={BATAS.telepon}
            onChange={(e) => change('wa', e.target.value)}
            placeholder="0812-3456-7890"
            error={errors.wa}
            hint="Untuk tombol WhatsApp di halaman pelanggan."
          />
          <Input
            label="Email usaha"
            type="email"
            value={form.email}
            maxLength={BATAS.email}
            onChange={(e) => change('email', e.target.value)}
            placeholder="halo@usahamu.com"
            error={errors.email}
          />
        </div>
      </div>

      <div className="mt-8 border-t border-slate-100 pt-8">
        <Input
          label={<Wajib>Kode undangan</Wajib>}
          value={form.kode}
          maxLength={BATAS.kodeUndangan}
          onChange={(e) => change('kode', e.target.value)}
          placeholder="Masukkan kode unik dari admin"
          error={errors.kode}
          hint="Pendaftaran dibatasi dengan kode khusus demi menjaga kualitas layanan."
        />
      </div>

      {status && !status.ok && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 animate-fade-up"
        >
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
          <p>{status.message}</p>
        </div>
      )}

      <div className="mt-8">
        <Button type="submit" size="lg" className="w-full group flex items-center justify-center gap-2" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Menyiapkan Sistem...
            </>
          ) : (
            <>
              <Store className="h-5 w-5" />
              Buat Outlet Sekarang
            </>
          )}
        </Button>
      </div>

      <p className="mt-5 text-center text-xs leading-relaxed text-slate-400">
        Outlet akan dibuat dalam keadaan kosong. Anda dapat mengisi menu dan mengatur denah meja
        dari dalam dashboard admin nanti.
      </p>
    </form>
  );
}

/**
 * Layar sesudah outlet jadi.
 * Mendesak pendaftar untuk segera mendaftarkan Akun Admin agar tidak dibajak.
 */
function Berhasil({ tenant }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-brand-200 bg-white p-6 shadow-2xl shadow-brand-900/10 sm:p-10 text-center animate-fade-up">
      {/* Dekorasi Background Confetti/Glow */}
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-brand-50 blur-3xl -z-10" />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-emerald-50 blur-3xl -z-10" />

      {/* Ikon Reward Sukses */}
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/30">
        <PartyPopper className="h-10 w-10" strokeWidth={2} />
      </div>

      <h2 className="mt-6 text-3xl font-black tracking-tight text-slate-900">
        Berhasil, {tenant.name}!
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600">
        Outlet Anda telah hidup di{' '}
        <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 font-mono font-bold text-slate-800">
          {tenantPath(tenant.slug)}
        </span>{' '}
        dan sudah muncul di direktori. Selesaikan langkah terakhir di bawah ini.
      </p>

      {/* Onboarding Checklist */}
      <ol className="mt-10 space-y-4 text-left">
        <Langkah nomor="1" judul="Daftarkan akun adminmu (Krusial)">
          Akun <strong>pertama</strong> yang mendaftar di outlet ini akan otomatis menjadi Admin Utama.
          Lakukan sekarang juga sebelum URL outlet Anda diakses orang lain.
        </Langkah>
        <Langkah nomor="2" judul="Isi menu & denah meja">
          Masuk ke dashboard: <span className="font-mono text-xs font-semibold bg-slate-100 px-1 py-0.5 rounded">/admin/produk</span> untuk menambah menu, dan{' '}
          <span className="font-mono text-xs font-semibold bg-slate-100 px-1 py-0.5 rounded">/admin/meja</span> untuk mengatur meja sekaligus mengunduh file QR Code.
        </Langkah>
        <Langkah nomor="3" judul="Cetak kartu meja">
          Cetak dan tempel QR di tiap meja. Pelanggan kini bisa memesan sendiri dari tempat duduknya tanpa antre di kasir.
        </Langkah>
      </ol>

      {/* CTA Sukses */}
      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
        <Button href={tenantPath(tenant.slug, '/register')} size="lg" className="group flex items-center justify-center gap-2 shadow-md">
          Daftarkan Akun Admin
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
        <Button href={tenantPath(tenant.slug)} variant="secondary" size="lg">
          Lihat Halaman Outlet
        </Button>
      </div>

      <div className="mt-8 border-t border-slate-100 pt-6">
        <Link href="/#outlet" className="group inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
          Kembali ke direktori
        </Link>
      </div>
    </div>
  );
}

function Langkah({ nomor, judul, children }) {
  return (
    <li className="group flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-5 transition-colors hover:border-brand-200 hover:bg-brand-50/50">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-black text-brand-600 ring-4 ring-white transition-colors group-hover:bg-brand-600 group-hover:text-white">
        {nomor}
      </span>
      <div className="min-w-0 flex-1 pt-1">
        <p className="font-bold text-slate-900">{judul}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{children}</p>
      </div>
    </li>
  );
}