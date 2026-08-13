'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { Input, Textarea, Wajib } from '@/components/ui/Field';
import { tenantPath } from '@/lib/tenant';
import { simpanProfil } from '@/app/k/[slug]/admin/profil/actions';

/**
 * Formulir profil outlet.
 *
 * Nilai awalnya datang dari server sebagai prop, bukan dibaca ulang di klien:
 * halaman induknya sudah memegang barisnya, dan kolom yang terisi belakangan
 * (setelah render pertama) membuat kursor melompat saat orang sudah mulai
 * mengetik.
 */
function awal(tenant) {
  return {
    name: tenant?.name || '',
    tagline: tenant?.tagline || '',
    description: tenant?.description || '',
    story: tenant?.story || '',
    address: tenant?.address || '',
    hours: tenant?.hours || '',
    phone: tenant?.phone || '',
    email: tenant?.email || '',
    wa_number: tenant?.wa_number || '',
    instagram: tenant?.instagram || '',
    tiktok: tenant?.tiktok || '',
    maps: tenant?.maps || '',
  };
}

export default function ProfileManager({ tenant }) {
  const [form, setForm] = useState(() => awal(tenant));
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null); // { ok, message }
  const [loading, setLoading] = useState(false);

  function change(key, value) {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: undefined }));
    setStatus(null);
  }

  function validate() {
    const e = {};
    if (form.name.trim().length < 3) e.name = 'Nama usaha minimal 3 karakter.';

    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      e.email = 'Format email tidak valid.';
    }

    const wa = form.wa_number.trim();
    if (wa && !/^\d{8,15}$/.test(wa.replace(/[\s\-()+]/g, ''))) {
      e.wa_number = 'Nomor tidak valid. Contoh: 0812-3456-7890.';
    }

    if (form.description.trim().length > 200) {
      e.description = 'Maksimal 200 karakter — cerita panjangnya di kolom Tentang kami.';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);
    if (!validate()) return;

    setLoading(true);
    const res = await simpanProfil(tenant.slug, form);
    setLoading(false);

    setStatus({ ok: res.ok, message: res.message });
    if (!res.ok) setErrors(res.errors || {});
  }

  const sisaDeskripsi = 200 - form.description.trim().length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <Bagian
        judul="Identitas"
        catatan="Tampil di navbar, footer, judul tab browser, dan kartu outlet di direktori platform."
      >
        <Input
          label={<Wajib>Nama usaha</Wajib>}
          value={form.name}
          onChange={(e) => change('name', e.target.value)}
          placeholder="Roti Bakar 88"
          error={errors.name}
        />

        <Input
          label="Tagline"
          value={form.tagline}
          onChange={(e) => change('tagline', e.target.value)}
          placeholder="Roti Bakar & Kopi Malam"
          hint="Satu frasa pendek di bawah nama usaha."
        />

        {/*
          Alamat outlet ditampilkan, bukan disunting.

          Ia tercetak permanen di dalam QR tiap meja — mengubahnya akan
          mematikan seluruh kartu meja yang sudah dicetak. Kolomnya sengaja
          tidak disediakan, dan database menolaknya lewat trigger
          `tenants_slug_immutable` sekalipun ada yang mengirimnya lewat jalan
          lain.
        */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Alamat outlet
          </p>
          <p className="mt-1 font-mono text-sm font-semibold text-slate-700">
            {tenantPath(tenant.slug)}
          </p>
          <p className="mt-2 text-xs leading-snug text-slate-500">
            Tidak bisa diubah — alamat ini sudah tercetak di dalam QR setiap meja.
          </p>
        </div>
      </Bagian>

      <Bagian
        judul="Cerita"
        catatan="Deskripsi singkat jadi ringkasan di mana-mana; cerita panjang tampil di halaman About outletmu."
      >
        <div>
          <Textarea
            label="Deskripsi singkat"
            value={form.description}
            onChange={(e) => change('description', e.target.value)}
            placeholder="Satu kalimat yang menjelaskan warungmu."
            error={errors.description}
            className="min-h-[80px]"
          />
          <p
            className={`mt-1.5 text-xs ${sisaDeskripsi < 0 ? 'font-semibold text-rose-600' : 'text-slate-400'}`}
          >
            {sisaDeskripsi < 0
              ? `${Math.abs(sisaDeskripsi)} karakter melebihi batas`
              : `Sisa ${sisaDeskripsi} karakter`}
          </p>
        </div>

        <Textarea
          label="Tentang kami"
          value={form.story}
          onChange={(e) => change('story', e.target.value)}
          placeholder={
            'Ceritakan warungmu: sejak kapan buka, apa yang jadi andalan, siapa yang biasanya datang.\n\nPisahkan paragraf dengan menekan Enter dua kali.'
          }
          hint="Tampil di halaman About. Kosongkan kalau belum sempat — halamannya tetap menampilkan info praktis."
          className="min-h-[220px]"
        />
      </Bagian>

      <Bagian judul="Lokasi & jam buka" catatan="Tampil di beranda, About, Kontak, dan footer.">
        <Input
          label="Alamat lengkap"
          value={form.address}
          onChange={(e) => change('address', e.target.value)}
          placeholder="Jl. Cihampelas No. 88, Bandung"
        />
        <Input
          label="Jam buka"
          value={form.hours}
          onChange={(e) => change('hours', e.target.value)}
          placeholder="Setiap hari, 16.00 – 01.00 WIB"
        />
      </Bagian>

      <Bagian judul="Kontak" catatan="Nomor WhatsApp dipakai semua tombol chat di halaman pelanggan.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nomor WhatsApp"
            value={form.wa_number}
            onChange={(e) => change('wa_number', e.target.value)}
            placeholder="628123456789"
            error={errors.wa_number}
          />
          <Input
            label="Telepon"
            value={form.phone}
            onChange={(e) => change('phone', e.target.value)}
            placeholder="+62 813-8888-0088"
          />
        </div>
        <Input
          label="Email usaha"
          type="email"
          value={form.email}
          onChange={(e) => change('email', e.target.value)}
          placeholder="halo@usahamu.com"
          error={errors.email}
        />
      </Bagian>

      <Bagian
        judul="Sosial media"
        catatan="Boleh diisi nama akun saja — alamat lengkapnya dilengkapi otomatis saat disimpan."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Instagram"
            value={form.instagram}
            onChange={(e) => change('instagram', e.target.value)}
            placeholder="rotibakar88"
          />
          <Input
            label="TikTok"
            value={form.tiktok}
            onChange={(e) => change('tiktok', e.target.value)}
            placeholder="rotibakar88"
          />
        </div>
        <Input
          label="Google Maps"
          value={form.maps}
          onChange={(e) => change('maps', e.target.value)}
          placeholder="https://maps.google.com/?q=..."
          hint="Alamat di beranda & About jadi bisa diklik kalau ini diisi."
        />
      </Bagian>

      <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        {status ? (
          <p
            role="alert"
            className={`text-sm font-medium ${status.ok ? 'text-emerald-700' : 'text-rose-700'}`}
          >
            {status.ok ? '✓ ' : ''}
            {status.message}
          </p>
        ) : (
          <p className="text-sm text-slate-400">
            Perubahan langsung tampil di halaman pelanggan setelah disimpan.
          </p>
        )}

        <div className="flex gap-3">
          <Button
            href={tenantPath(tenant.slug, '/about')}
            variant="secondary"
            target="_blank"
            rel="noreferrer"
          >
            Lihat halaman About
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan Profil'}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Bagian({ judul, catatan, children }) {
  return (
    <section className="card space-y-4 p-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">{judul}</h2>
        {catatan && <p className="mt-1 text-sm leading-snug text-slate-500">{catatan}</p>}
      </div>
      {children}
    </section>
  );
}
