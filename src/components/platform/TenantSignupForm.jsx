'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { Input, Wajib } from '@/components/ui/Field';
import { slugify, slugValid, tenantPath } from '@/lib/tenant';
import { daftarOutlet } from '@/app/(platform)/daftar-outlet/actions';

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
  const [jadi, setJadi] = useState(null); // { slug, name } — outlet yang berhasil dibuat

  /*
    Slug ikut terisi sambil nama diketik — SAMPAI kolomnya disentuh sendiri.

    Tanpa penanda ini, pemilik yang sudah menulis slug pilihannya akan melihat
    tulisannya terhapus begitu ia kembali ke atas dan memperbaiki satu huruf di
    nama usahanya. Sesudah disentuh, kolom itu jadi miliknya sepenuhnya.
  */
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
    // Dirapikan sambil diketik, bukan divonis salah setelah dikirim: spasi jadi
    // tanda hubung, huruf besar jadi kecil. Yang mustahil diketik tidak perlu
    // dilarang lewat pesan error.
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
    <form onSubmit={handleSubmit} className="card space-y-5 p-6 sm:p-8" noValidate>
      <Input
        label={<Wajib>Nama usaha</Wajib>}
        value={form.nama}
        onChange={(e) => changeNama(e.target.value)}
        placeholder="Kopi Pagi Bandung"
        error={errors.nama}
      />

      <Input
        label={<Wajib>Alamat outlet</Wajib>}
        value={form.slug}
        onChange={(e) => changeSlug(e.target.value)}
        placeholder="kopi-pagi-bandung"
        error={errors.slug}
        hint="Terisi otomatis dari nama usaha. Boleh diubah — tapi hanya sekarang."
      />

      {/*
        Peringatan slug ditaruh menempel di kolomnya, bukan di syarat & ketentuan.

        Slug ini dicetak permanen ke dalam QR tiap meja. Menggantinya nanti
        berarti seluruh kartu meja yang sudah tercetak berhenti bekerja — dan
        itu baru ketahuan setelah ada pelanggan yang memindai dan mendapat
        halaman kosong.
      */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-900">
          Alamat outletmu:{' '}
          <span className="font-mono">
            {form.slug ? tenantPath(form.slug) : '/k/…'}
          </span>
        </p>
        <p className="mt-1 text-xs leading-snug text-amber-800">
          Alamat ini ikut tercetak di dalam QR setiap meja. Setelah kartu mejanya dicetak,
          menggantinya berarti mencetak ulang semuanya — pilih baik-baik sekarang.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Tagline"
          value={form.tagline}
          onChange={(e) => change('tagline', e.target.value)}
          placeholder="Kopi & Sarapan Pagi"
          hint="Muncul di bawah nama usaha. Kosongkan kalau belum kepikiran."
        />
        <Input
          label="Jam buka"
          value={form.jam}
          onChange={(e) => change('jam', e.target.value)}
          placeholder="Setiap hari, 07.00 – 22.00 WIB"
        />
      </div>

      <Input
        label="Alamat lengkap"
        value={form.alamat}
        onChange={(e) => change('alamat', e.target.value)}
        placeholder="Jl. Braga No. 12, Bandung"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Nomor WhatsApp"
          value={form.wa}
          onChange={(e) => change('wa', e.target.value)}
          placeholder="0812-3456-7890"
          error={errors.wa}
          hint="Dipakai tombol WhatsApp di halaman pelanggan."
        />
        <Input
          label="Email usaha"
          type="email"
          value={form.email}
          onChange={(e) => change('email', e.target.value)}
          placeholder="halo@usahamu.com"
          error={errors.email}
        />
      </div>

      <div className="border-t border-slate-100 pt-5">
        <Input
          label={<Wajib>Kode undangan</Wajib>}
          value={form.kode}
          onChange={(e) => change('kode', e.target.value)}
          placeholder="Minta ke pengelola platform"
          error={errors.kode}
          hint="Pendaftaran outlet dibatasi supaya direktori tidak dipenuhi outlet iseng."
        />
      </div>

      {status && !status.ok && (
        <p
          role="alert"
          className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
        >
          {status.message}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? 'Membuat outlet...' : 'Buat Outlet'}
      </Button>

      <p className="text-center text-xs leading-snug text-slate-400">
        Outlet dibuat dalam keadaan kosong — tanpa menu dan tanpa meja. Keduanya kamu isi
        sendiri dari dashboard setelah akun adminmu jadi.
      </p>
    </form>
  );
}

/**
 * Layar sesudah outlet jadi.
 *
 * Bukan sekadar ucapan selamat: outlet yang baru dibuat belum bisa dipakai
 * siapa pun sampai ada akun admin di dalamnya, dan akun itu HARUS didaftarkan
 * dari halaman register outlet ini sendiri — di situlah slug-nya ikut terkirim
 * sebagai metadata pendaftaran. Karena itu langkah berikutnya ditaruh sebagai
 * tombol utama, bukan sebagai kalimat penutup yang bisa terlewat.
 */
function Berhasil({ tenant }) {
  return (
    <div className="card p-6 text-center sm:p-8">
      <span className="text-4xl" aria-hidden="true">
        🎉
      </span>
      <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">
        {tenant.name} sudah terdaftar
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        Outletmu hidup di{' '}
        <span className="font-mono font-semibold text-slate-700">{tenantPath(tenant.slug)}</span>{' '}
        dan sudah muncul di direktori. Satu langkah lagi sebelum bisa dipakai.
      </p>

      <ol className="mt-6 space-y-3 text-left">
        <Langkah nomor="1" judul="Daftarkan akun adminmu">
          Akun <strong>pertama</strong> yang mendaftar di outlet ini otomatis jadi adminnya.
          Lakukan sekarang, sebelum orang lain yang melakukannya.
        </Langkah>
        <Langkah nomor="2" judul="Isi menu & denah meja">
          Dari dashboard: <span className="font-mono text-xs">/admin/produk</span> untuk menu,{' '}
          <span className="font-mono text-xs">/admin/meja</span> untuk denah meja sekaligus
          mengunduh kartu QR-nya.
        </Langkah>
        <Langkah nomor="3" judul="Cetak kartu mejanya">
          Tempel di tiap meja. Sejak itu pelanggan memesan sendiri dari mejanya, tanpa aplikasi
          dan tanpa akun.
        </Langkah>
      </ol>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button href={tenantPath(tenant.slug, '/register')} size="lg">
          Daftarkan Akun Admin
        </Button>
        <Button href={tenantPath(tenant.slug)} variant="secondary" size="lg">
          Lihat Outletnya
        </Button>
      </div>

      <p className="mt-6 text-xs text-slate-400">
        <Link href="/#outlet" className="font-semibold text-brand-600 hover:text-brand-700">
          ← Kembali ke direktori
        </Link>
      </p>
    </div>
  );
}

function Langkah({ nomor, judul, children }) {
  return (
    <li className="flex gap-3 rounded-2xl bg-slate-50 p-4">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
        {nomor}
      </span>
      <div className="min-w-0">
        <p className="font-bold text-slate-900">{judul}</p>
        <p className="mt-0.5 text-sm leading-snug text-slate-500">{children}</p>
      </div>
    </li>
  );
}
