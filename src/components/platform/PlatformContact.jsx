'use client';

import { useState } from 'react';
import Container from '@/components/ui/Container';
import SectionHeading from '@/components/ui/SectionHeading';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input, Textarea, Wajib } from '@/components/ui/Field';
import { platform } from '@/lib/site';
import { kirimPesanPlatform } from '@/app/(platform)/actions';

const KOSONG = { name: '', email: '', phone: '', business: '', message: '' };

/*
  Dua kanal, ditampilkan berdampingan dan bukan bertingkat.

  Formulir untuk pertanyaan yang butuh jawaban tertulis dan tidak buru-buru;
  WhatsApp untuk yang ingin langsung ngobrol. Menyembunyikan salah satunya di
  balik yang lain memaksa orang menebak mana yang "benar" — padahal yang
  menentukan bukan kita, melainkan seberapa mendesak pertanyaannya.
*/
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
    <section id="kontak" className="scroll-mt-20 py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Kontak"
          title="Masih ada yang mau ditanyakan?"
          description="Belum yakin sistem ini cocok untuk usahamu, atau butuh penjelasan sebelum mendaftar? Tanyakan di sini — tidak ada kewajiban apa pun."
        />

        <div className="mx-auto mt-14 grid max-w-5xl gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <form onSubmit={handleSubmit} className="card space-y-4 p-6 sm:p-8" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={<Wajib>Nama lengkap</Wajib>}
                value={form.name}
                onChange={(e) => change('name', e.target.value)}
                placeholder="Nama Anda"
                error={errors.name}
              />
              <Input
                label="Nama usaha"
                value={form.business}
                onChange={(e) => change('business', e.target.value)}
                placeholder="Warung Kopi Sudut"
                hint="Kosongkan kalau usahanya belum berjalan."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={<Wajib>Email</Wajib>}
                type="email"
                value={form.email}
                onChange={(e) => change('email', e.target.value)}
                placeholder="nama@emailkamu.com"
                hint="Ke sinilah jawabannya dikirim."
                error={errors.email}
              />
              <Input
                label="Nomor WhatsApp"
                value={form.phone}
                onChange={(e) => change('phone', e.target.value)}
                placeholder="0812-3456-7890"
                error={errors.phone}
              />
            </div>

            <Textarea
              label={<Wajib>Pertanyaanmu</Wajib>}
              value={form.message}
              onChange={(e) => change('message', e.target.value)}
              placeholder="Contoh: warung saya cuma punya 4 meja, apakah tetap masuk akal pakai QR per meja?"
              error={errors.message}
            />

            {status && (
              <p
                role="alert"
                className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                  status.ok
                    ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                    : 'border-rose-100 bg-rose-50 text-rose-700'
                }`}
              >
                {status.message}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Mengirim...' : 'Kirim Pertanyaan'}
            </Button>
          </form>

          <div className="space-y-5">
            {waLink && (
              <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                <h3 className="text-lg font-bold">Mau ngobrol langsung?</h3>
                <p className="mt-2 text-sm text-emerald-50">
                  Untuk pertanyaan yang lebih enak dijawab sambil bolak-balik — soal harga, soal
                  alur di warungmu — WhatsApp lebih cepat daripada formulir.
                </p>
                <Button
                  as="a"
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  variant="inverse"
                  className="mt-5 w-full"
                >
                  Chat via WhatsApp
                </Button>
              </Card>
            )}

            {/*
              Pertanyaan yang paling sering datang, dijawab sebelum ditanyakan.

              Bukan pengganti FAQ di atas: yang ini tiga hal yang membuat orang
              ragu MENGIRIM pesan sama sekali — takut ditagih biaya, takut
              dipaksa berlangganan, takut sudah telanjur salah tempat karena
              usahanya bukan coffee shop.
            */}
            <Card className="space-y-3">
              <h3 className="text-lg font-bold text-slate-900">Sebelum bertanya</h3>
              <ul className="space-y-2.5 text-sm leading-snug text-slate-600">
                <li className="flex gap-2">
                  <span aria-hidden="true" className="text-brand-600">
                    ✓
                  </span>
                  Bertanya tidak dipungut biaya dan tidak mengikat apa pun.
                </li>
                <li className="flex gap-2">
                  <span aria-hidden="true" className="text-brand-600">
                    ✓
                  </span>
                  Bukan cuma untuk coffee shop — warung, kios, katering, toko roti.
                </li>
                <li className="flex gap-2">
                  <span aria-hidden="true" className="text-brand-600">
                    ✓
                  </span>
                  Sudah yakin? Lewati saja formulirnya dan langsung daftar.
                </li>
              </ul>
              <div className="pt-1">
                <Button href="/daftar-outlet" variant="secondary" className="w-full">
                  Daftarkan UMKM Anda →
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </section>
  );
}
