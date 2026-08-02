# To Do — Sistem Point of Sale (CRUDS)

Sistem **Point of Sale** modern untuk coffee shop, lengkap dengan **Create, Read, Update, Delete, Search**.
Dibangun dengan **Next.js App Router + Tailwind CSS + Supabase**.

---

## ✨ Fitur

| Area | Isi |
| --- | --- |
| **Landing page** | Navbar · Hero · Tentang CoffeeShop & Software House · Layanan Utama · Keunggulan · Menu Favorit · Portfolio · Testimoni · QR Pemesanan · FAQ · CTA WhatsApp · Footer |
| **Auth** | Login & Register (Supabase Auth), role `user` / `admin` |
| **User side** | Home · Fitur Utama (jual beli / keranjang / checkout) · Kontak (form tersimpan ke DB) · About |
| **Admin side** | Dashboard (omzet, produk terlaris, stok menipis) · Daftar Produk (CRUD + Search) · Daftar Transaksi (search, ubah status, detail, hapus) |
| **QR Ordering** | Generator QR per nomor meja, bisa diunduh sebagai PNG |

---

## 🚀 Cara Menjalankan

### 1. Prasyarat

Node.js **18 atau lebih baru** (proyek ini sudah diuji di Node 22).
Jika memakai nvm-windows:

```bash
nvm use 22.16.0
```

### 2. Install dependency

```bash
npm install
```

### 3. Buat proyek Supabase

1. Daftar / masuk ke [supabase.com](https://supabase.com), buat **New Project**.
2. Buka **SQL Editor** → tempel seluruh isi [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
   Skrip ini membuat tabel, RLS policy, trigger, fungsi checkout, dan 12 produk contoh.
3. Buka **Project Settings → API**, salin `Project URL` dan `anon public key`.

### 4. Isi variabel lingkungan

Buka file `.env.local`, ganti dua baris pertama:

> `NEXT_PUBLIC_WA_NUMBER` dipakai tombol **“Konsultasi Gratis via WhatsApp”** — tulis dengan kode negara tanpa tanda `+` (contoh: `628123...`).

### 5. Jalankan

```bash
npm run dev
```

Buka <http://localhost:3000>.

### 6. Jadikan akun Anda admin

1. Daftar lewat halaman `/register`.
2. Kembali ke **SQL Editor** Supabase, jalankan (ganti emailnya):

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'emailkamu@gmail.com');
```

3. Login ulang → menu **Dashboard** muncul di navbar, `/admin` sudah bisa diakses.

> Jika ingin login langsung tanpa konfirmasi email, matikan **Confirm email** di
> Supabase → Authentication → Providers → Email.

---

## 🗂️ Struktur Proyek

```
src/
├─ app/
│  ├─ (site)/                 # Halaman publik (pakai Navbar + Footer)
│  │  ├─ page.jsx             # Home / landing (semua section)
│  │  ├─ fitur/               # Fitur Utama — jual beli + server action checkout
│  │  ├─ kontak/              # Form kontak + server action simpan pesan
│  │  └─ about/
│  ├─ (auth)/                 # Login & Register (layout split-screen)
│  ├─ admin/                  # Area admin (dilindungi middleware + layout)
│  │  ├─ page.jsx             # Dashboard
│  │  ├─ produk/              # CRUD + Search produk
│  │  └─ transaksi/           # Daftar & kelola transaksi
│  ├─ layout.jsx              # Root layout + metadata
│  ├─ not-found.jsx
│  └─ globals.css
├─ components/
│  ├─ ui/                     # Button, Card, Modal, Badge, Field, SearchInput, ...
│  ├─ layout/                 # Navbar, Footer, Logo, WhatsappFloat
│  ├─ sections/               # Hero, About, Services, Advantages, Portfolio,
│  │                          # Testimonials, Faq, QrOrder, CtaWhatsapp, ContactForm
│  ├─ pos/                    # PosClient, ProductCard, CartPanel, ReceiptModal
│  ├─ auth/                   # LoginForm, RegisterForm
│  └─ admin/                  # AdminShell, ProductManager, TransactionManager, ...
├─ lib/
│  ├─ supabase/               # client.js (browser), server.js (SSR), middleware.js
│  ├─ site.js                 # Identitas bisnis, nomor WA, kategori produk
│  └─ format.js               # rupiah(), formatDate(), initials()
└─ middleware.js              # Refresh session + proteksi /admin
```

---

## 🔍 Di mana letak CRUDS-nya?

| Operasi | Lokasi |
| --- | --- |
| **Create** | `src/app/admin/produk/actions.js → createProduct()` · checkout: `src/app/(site)/fitur/actions.js → createOrder()` · pesan kontak: `src/app/(site)/kontak/actions.js` |
| **Read** | Server Component tiap halaman (`page.jsx`) mengambil data langsung dari Supabase |
| **Update** | `updateProduct()`, `toggleProductActive()`, `updateTransactionStatus()` |
| **Delete** | `deleteProduct()`, `deleteTransaction()` |
| **Search** | `ProductManager.jsx`, `TransactionManager.jsx`, `PosClient.jsx` — pencarian instan (client-side `useMemo`) + filter kategori/status/periode + sorting + pagination |

---

## 🔐 Keamanan

- Setiap tabel memakai **Row Level Security**; hanya role `admin` yang boleh menulis produk/transaksi.
- Checkout memakai fungsi `create_order` (`SECURITY DEFINER`) agar tamu bisa memesan **tanpa** diberi izin tulis langsung ke tabel.
- Route `/admin` dijaga dua lapis: `middleware.js` dan pengecekan ulang di `app/admin/layout.jsx`.
- Setiap Server Action memanggil `requireAdmin()` sebelum menjalankan operasi tulis.

---

## 📦 Perintah

```bash
npm run dev      # mode pengembangan
npm run build    # build produksi
npm run start    # jalankan hasil build
npm run lint     # cek lint
```
