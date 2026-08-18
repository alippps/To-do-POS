'use client';

import { useState } from 'react';
import Container from '@/components/ui/Container';
import SectionHeading from '@/components/ui/SectionHeading';
import Button from '@/components/ui/Button';
import { Input, Textarea, Wajib } from '@/components/ui/Field';
import { platform } from '@/lib/site';
import { UMPAN } from '@/lib/honeypot';
import { BATAS } from '@/lib/limits';
import { kirimPesanPlatform } from '@/app/(platform)/actions';
import {
  MessageCircle,
  CheckCircle2,
  ArrowRight,
  Send,
  Loader2
} from 'lucide-react';

const KOSONG = { name: '', email: '', phone: '', business: '', message: '', [UMPAN]: '' };

export default function PlatformContact() {
  const [form, setForm] = useState(KOSONG);
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

    const phone = form.phone.trim();
    if (phone && !/^\d{8,15}$/.test(phone.replace(/[\s\-()+]/g, ''))) {
      e.phone = 'Nomor tidak valid. Contoh: 0812-3456-7890.';
    }

    if (form.message.trim().length < 10) e.message = 'Pertanyaan minimal 10 karakter.';

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);
    if (!validate()) return;

    setLoading(true);
    const res = await kirimPesanPlatform(form);
    setLoading(false);

    setStatus({ ok: res.ok, message: res.message });
    if (res.ok) {
      setForm(KOSONG);
      setErrors({});
    } else {
      setErrors(res.errors || {});
    }
  }

  const waLink = platform.waNumber
    ? `https://wa.me/${platform.waNumber}?text=${encodeURIComponent(
        `Halo ${platform.name}! Saya mau tanya soal sistem kasirnya untuk usaha saya.`
      )}`
    : null;

  return (
    <section id="kontak" className="scroll-mt-20 py-20 sm:py-24 bg-white relative overflow-hidden">
      {/* Dekorasi Background */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/3 w-[800px] h-[800px] bg-slate-50 rounded-full blur-3xl -z-10" />

      <Container className="relative z-10">
        <SectionHeading
          // eyebrow="Kontak"
          title="Masih ada yang mau ditanyakan?"
          description="Belum yakin sistem ini cocok untuk usahamu, atau butuh penjelasan sebelum mendaftar? Tanyakan di sini — gratis dan tanpa kewajiban apa pun."
        />

        <div className="mx-auto mt-16 grid max-w-6xl gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">

          {/* KIRI: Formulir Tertulis */}
          <form
            onSubmit={handleSubmit}
            className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-200/50 sm:p-10"
            noValidate
          >
            {/* Header Form Internal (Opsional, memperjelas konteks) */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-slate-900">Kirim Pesan Tertulis</h3>
              <p className="mt-1 text-sm text-slate-500">Kami akan membalas via email secepatnya.</p>
            </div>

            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <Input
                  label={<Wajib>Nama lengkap</Wajib>}
                  value={form.name}
                  onChange={(e) => change('name', e.target.value)}
                  placeholder="Nama Anda"
                  maxLength={BATAS.nama}
                  error={errors.name}
                />
                <Input
                  label="Nama usaha"
                  value={form.business}
                  onChange={(e) => change('business', e.target.value)}
                  placeholder="Warung Kopi Sudut"
                  hint="Kosongkan jika belum berjalan."
                  maxLength={BATAS.bisnis}
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <Input
                  label={<Wajib>Email</Wajib>}
                  type="email"
                  value={form.email}
                  onChange={(e) => change('email', e.target.value)}
                  placeholder="nama@emailkamu.com"
                  hint="Ke sinilah jawabannya dikirim."
                  maxLength={BATAS.email}
                  error={errors.email}
                />
                <Input
                  label="Nomor WhatsApp"
                  value={form.phone}
                  onChange={(e) => change('phone', e.target.value)}
                  placeholder="0812-3456-7890"
                  maxLength={BATAS.telepon}
                  error={errors.phone}
                />
              </div>

              <Textarea
                label={<Wajib>Pertanyaanmu</Wajib>}
                value={form.message}
                onChange={(e) => change('message', e.target.value)}
                placeholder="Contoh: Warung saya cuma punya 4 meja, apakah tetap masuk akal pakai QR per meja?"
                maxLength={BATAS.pesan}
                error={errors.message}
                className="min-h-[120px]"
              />
            </div>

            {/* Kolom Umpan (Honeypot) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden"
            >
              <label htmlFor={`platform-${UMPAN}`}>Website</label>
              <input
                id={`platform-${UMPAN}`}
                name={UMPAN}
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={form[UMPAN]}
                onChange={(e) => change(UMPAN, e.target.value)}
              />
            </div>

            {/* Notifikasi Status */}
            {status && (
              <div
                role="alert"
                className={`mt-6 rounded-xl border p-4 text-sm font-medium flex items-start gap-3 animate-fade-up ${
                  status.ok
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-rose-200 bg-rose-50 text-rose-800'
                }`}
              >
                {status.ok ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                ) : (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-200 text-rose-700 font-bold">!</span>
                )}
                <p className="mt-0.5">{status.message}</p>
              </div>
            )}

            <div className="mt-8">
              <Button type="submit" size="lg" className="w-full group flex items-center justify-center gap-2" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    Kirim Pertanyaan
                    <Send className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* KANAN: Sidebar Kontak */}
          <div className="space-y-6">

            {/* Kartu WhatsApp CTA */}
            {waLink && (
              <div className="group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-500 to-emerald-600 p-8 text-white shadow-xl shadow-emerald-900/10 transition-transform duration-300 hover:-translate-y-1">
                {/* Ikon Latar Transparan (Watermark) */}
                <MessageCircle
                  className="absolute -right-8 -bottom-8 h-48 w-48 text-emerald-400/30 transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-12"
                  aria-hidden="true"
                  strokeWidth={1}
                />

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                      <MessageCircle className="h-6 w-6 text-white" fill="currentColor" />
                    </span>
                    <h3 className="text-xl font-bold">Mau ngobrol langsung?</h3>
                  </div>

                  <p className="mt-2 text-sm leading-relaxed text-emerald-50">
                    Untuk pertanyaan yang lebih enak dijawab sambil bolak-balik — soal harga, soal
                    alur di warungmu — WhatsApp adalah jalur paling cepat.
                  </p>

                  <Button
                    as="a"
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    variant="inverse"
                    className="mt-8 w-full shadow-sm hover:shadow-md"
                  >
                    Chat via WhatsApp
                  </Button>
                </div>
              </div>
            )}

            {/* Kartu "Sebelum Bertanya" */}
            <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-5">Sebelum bertanya</h3>

              <ul className="space-y-4 text-sm leading-relaxed text-slate-600">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-500 mt-0.5" strokeWidth={2.5} />
                  <span>Bertanya di sini <strong>100% gratis</strong> dan tidak mengikat Anda untuk berlangganan apa pun.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-500 mt-0.5" strokeWidth={2.5} />
                  <span>Bukan cuma untuk coffee shop — cocok untuk warung, kios, katering, hingga toko roti.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-500 mt-0.5" strokeWidth={2.5} />
                  <span>Sudah yakin dan ingin langsung mencoba sistemnya? Lewati formulir ini.</span>
                </li>
              </ul>

              <div className="mt-8 border-t border-slate-200/80 pt-6">
                <Button href="/daftar-outlet" variant="secondary" className="w-full group flex items-center justify-center gap-2">
                  Daftarkan UMKM Anda
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>

          </div>
        </div>
      </Container>
    </section>
  );
}