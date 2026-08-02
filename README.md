# To Do — Sistem Point of Sale (CRUDS)

Sistem **Point of Sale** modern untuk coffee shop, lengkap dengan **Create, Read, Update, Delete, Search**.
Dibangun dengan **Next.js App Router + Tailwind CSS + Supabase**.

> **Pelanggan tidak perlu login.** Scan QR → lihat meja yang kosong → pilih menu → pesan → struk terbit.
> Akun hanya dibutuhkan oleh **staf/admin** untuk membuka dashboard.

---

## 🧰 Tech Stack

| Lapisan | Teknologi | Versi | Peran |
| --- | --- | --- | --- |
| **Framework** | [Next.js](https://nextjs.org) (App Router) | 14.2 | Routing, Server Component, Server Action, middleware |
| **UI Library** | [React](https://react.dev) | 18.3 | Komponen antarmuka |
| **Styling** | [Tailwind CSS](https://tailwindcss.com) | 3.4 | Design system (palet, tipografi, utilitas) |
| **PostCSS** | Autoprefixer | 10.4 | Prefix vendor otomatis |
| **Database** | [Supabase](https://supabase.com) — PostgreSQL | 15 | Tabel, trigger, fungsi RPC (PL/pgSQL) |
| **Auth** | Supabase Auth (`@supabase/ssr` 0.5) | — | Login/register email-password, sesi berbasis cookie |
| **Keamanan data** | PostgreSQL Row Level Security | — | Policy per tabel + fungsi `SECURITY DEFINER` |
| **QR Code** | [`qrcode`](https://www.npmjs.com/package/qrcode) | 1.5 | Generator QR per nomor meja (PNG) |
| **Font** | Plus Jakarta Sans · Fraunces | — | Dimuat via Google Fonts, fallback ke font sistem |
| **Bahasa** | JavaScript (JSX) + SQL (PL/pgSQL) | ES2022 | — |
| **Runtime** | Node.js | ≥ 18 (diuji di 22) | — |

Tanpa dependensi UI pihak ketiga — seluruh komponen (Button, Modal, Badge, Field, Toast,
Table, Card, dsb.) ditulis sendiri di `src/components/ui/`.

---

## ✨ Fitur

| Area | Isi |
| --- | --- |
| **Landing page** | Navbar · Hero · Tentang CoffeeShop & Software House · Layanan Utama · Keunggulan · Menu Favorit · Portfolio · Testimoni · QR Pemesanan · FAQ · CTA WhatsApp · Footer |
| **Pelanggan (tanpa login)** | `/meja` ketersediaan meja real-time · `/menu` pilih & pesan · `/struk/[invoice]` struk digital yang bisa dicetak · Kontak · About |
| **Auth** | Login & Register (Supabase Auth) — **khusus staf**, role `user` / `admin` |
| **Admin** | Dashboard (omzet, pesanan pending, status meja, stok menipis) · Daftar Produk (CRUD + Search) · Denah Meja (CRUD + status) · Daftar Transaksi · **Hak Akses** |
| **QR Ordering** | Generator QR per nomor meja, bisa diunduh sebagai PNG |

---

## 🧭 Alur pemesanan

```
QR di meja  →  /meja?meja=07        Lihat meja mana yang masih kosong (tanpa login)
            →  /menu?meja=07        Pilih menu, isi nama, checkout
            →  /struk/INV-…         Struk digital — tombol Cetak hanya mencetak struknya
            →  /admin/transaksi     Kasir menandai "Lunas" → meja otomatis kosong lagi
```

Pesanan yang masuk lewat QR berstatus **`pending`** dan menandai mejanya **terisi**.
Begitu kasir menandainya **lunas** (atau **batal**), trigger database membebaskan meja itu kembali.

---

## 🔑 Matriks Hak Akses

Halaman **`/admin/akses`** menampilkan tabel ini secara langsung **beserta ID (UUID) tiap akun**
dan tombol untuk menaikkan/menurunkan role.

| Halaman / Aksi | Tamu | User | Admin |
| --- | :---: | :---: | :---: |
| Landing `/`, About, Kontak | ✅ | ✅ | ✅ |
| Ketersediaan meja `/meja` | ✅ | ✅ | ✅ |
| Menu & pesan `/menu` | ✅ | ✅ | ✅ |
| Struk `/struk/[invoice]` | ✅ | ✅ | ✅ |
| Membuat pesanan (checkout) | ✅ | ✅ | ✅ |
| Mengirim pesan kontak | ✅ | ✅ | ✅ |
| Dashboard `/admin` | ❌ | ❌ | ✅ |
| CRUD produk `/admin/produk` | ❌ | ❌ | ✅ |
| Denah meja `/admin/meja` | ❌ | ❌ | ✅ |
| Daftar transaksi `/admin/transaksi` | ❌ | ❌ | ✅ |
| Hak akses `/admin/akses` | ❌ | ❌ | ✅ |
| Baca produk & meja (DB) | ✅ | ✅ | ✅ |
| Tulis produk & meja (DB) | ❌ | ❌ | ✅ |
| Baca tabel transaksi (DB) | ❌ | ◐ miliknya | ✅ |
| Ubah / hapus transaksi | ❌ | ❌ | ✅ |
| Ubah role akun | ❌ | ❌ | ✅ |
| Baca pesan kontak masuk | ❌ | ❌ | ✅ |

**Siapa itu siapa**

| Role | Identitas | Keterangan |
| --- | --- | --- |
| **Tamu** | tanpa ID akun (`auth.uid()` = `NULL`) | Siapa pun yang membuka website / scan QR |
| **User** | UUID di `profiles` dengan `role = 'user'` | Semua akun baru otomatis `user` |
| **Admin** | UUID di `profiles` dengan `role = 'admin'` | Dinaikkan dari `/admin/akses` atau SQL Editor |

Cek langsung dari SQL Editor Supabase siapa saja yang memegang akses admin:

```sql
select u.email, p.role, p.id
from public.profiles p
join auth.users u on u.id = p.id
order by p.role, u.email;
```

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
   Skrip ini membuat tabel, RLS policy, trigger, fungsi checkout, 12 produk contoh, dan 12 meja contoh.
   File-nya **idempotent** — kalau sebelumnya sudah menjalankan versi lama, cukup jalankan ulang untuk upgrade.
3. Buka **Project Settings → API**, salin `Project URL` dan `anon public key`.

### 4. Isi variabel lingkungan

Buka file `.env.local`, ganti dua baris pertama:

> `NEXT_PUBLIC_WA_NUMBER` dipakai tombol **“Konsultasi Gratis via WhatsApp”** — tulis dengan kode negara tanpa tanda `+` (contoh: `628123...`).
> `NEXT_PUBLIC_SITE_URL` dipakai untuk membuat isi QR code — isi dengan URL yang benar-benar bisa dibuka HP pelanggan.

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
4. Admin berikutnya cukup ditambahkan lewat halaman **`/admin/akses`** — tidak perlu SQL lagi.

> Jika ingin login langsung tanpa konfirmasi email, matikan **Confirm email** di
> Supabase → Authentication → Providers → Email.

### 7. Mencoba alur QR dari HP

QR berisi `NEXT_PUBLIC_SITE_URL`, jadi `localhost` tidak bisa dibuka dari HP.
Untuk uji coba, jalankan `npm run dev -- -H 0.0.0.0` lalu set
`NEXT_PUBLIC_SITE_URL=http://<IP-laptop>:3000`, atau deploy dulu ke Vercel.

---

## 🗂️ Struktur Proyek

```
src/
├─ app/
│  ├─ (site)/                 # Halaman publik (pakai Navbar + Footer)
│  │  ├─ page.jsx             # Home / landing (semua section)
│  │  ├─ meja/                # Ketersediaan meja — tujuan scan QR
│  │  ├─ menu/                # Menu pelanggan + server action checkout
│  │  ├─ fitur/               # Redirect ke /menu (menjaga QR lama tetap jalan)
│  │  ├─ kontak/              # Form kontak + server action simpan pesan
│  │  └─ about/
│  ├─ struk/[invoice]/        # Struk digital 80mm — halaman cetak berdiri sendiri
│  ├─ (auth)/                 # Login & Register (layout split-screen)
│  ├─ admin/                  # Area admin (dilindungi middleware + layout)
│  │  ├─ page.jsx             # Dashboard
│  │  ├─ produk/              # CRUD + Search produk
│  │  ├─ meja/                # CRUD denah meja + status
│  │  ├─ transaksi/           # Daftar & kelola transaksi
│  │  └─ akses/               # Daftar akun + ID + matriks hak akses
│  ├─ layout.jsx              # Root layout + metadata + font
│  ├─ not-found.jsx
│  └─ globals.css             # Tema + aturan @media print untuk struk
├─ components/
│  ├─ ui/                     # Button, Card, Modal, Badge, Field, SearchInput, ...
│  ├─ layout/                 # Navbar, Footer, Logo, WhatsappFloat
│  ├─ sections/               # Hero, About, Services, Advantages, Portfolio,
│  │                          # Testimonials, Faq, QrOrder, CtaWhatsapp, ContactForm
│  ├─ tables/                 # TableAvailability (grid meja pelanggan)
│  ├─ pos/                    # PosClient, ProductCard, CartPanel,
│  │                          # ReceiptModal, ReceiptPaper, PrintReceiptBar
│  ├─ auth/                   # LoginForm, RegisterForm
│  └─ admin/                  # AdminShell, ProductManager, TableManager,
│                             # TransactionManager, AccessManager, ...
├─ lib/
│  ├─ supabase/               # client.js (browser), server.js (SSR), middleware.js
│  ├─ site.js                 # Identitas bisnis, nomor WA, kategori produk
│  ├─ tables.js               # Status meja + label pembayaran/pesanan
│  ├─ access.js               # Matriks hak akses (sumber data /admin/akses)
│  └─ format.js               # rupiah(), formatDate(), initials()
└─ middleware.js              # Refresh session + proteksi /admin
```

---

## ✅ Peta Ketentuan Lomba → Berkas

| Ketentuan | Status | Lokasi |
| --- | :---: | --- |
| Tema UMKM & transformasi digital | ✅ | Landing page (Hero, Layanan, Tentang), seluruh alur POS |
| Sistem **C**reate | ✅ | `admin/produk/actions.js`, `admin/meja/actions.js`, `(site)/menu/actions.js`, `(site)/kontak/actions.js` |
| Sistem **R**ead | ✅ | Server Component tiap `page.jsx` |
| Sistem **U**pdate | ✅ | `updateProduct()`, `updateTable()`, `setTableStatus()`, `updateTransactionStatus()`, `setUserRole()` |
| Sistem **D**elete | ✅ | `deleteProduct()`, `deleteTable()`, `deleteTransaction()` |
| Sistem **S**earch | ✅ | `ProductManager`, `TableManager`, `TransactionManager`, `AccessManager`, `PosClient` |
| Halaman **Login** | ✅ | `/login` — `src/app/(auth)/login/page.jsx` |
| Halaman **Register** | ✅ | `/register` — `src/app/(auth)/register/page.jsx` |
| User Side — **Home** | ✅ | `/` — `src/app/(site)/page.jsx` |
| User Side — **Fitur Utama (jual beli)** | ✅ | `/menu` — `src/app/(site)/menu/page.jsx` (rute lama `/fitur` diarahkan ke sini) |
| User Side — **Kontak + form** | ✅ | `/kontak` — form tervalidasi ganda, tersimpan ke tabel `contact_messages` |
| User Side — **About** | ✅ | `/about` — `src/app/(site)/about/page.jsx` |
| Admin Side — **Dashboard** | ✅ | `/admin` — omzet, pesanan pending, status meja, stok menipis |
| Admin Side — **Daftar Produk** | ✅ | `/admin/produk` — CRUD + search + filter + pagination |
| Admin Side — **Daftar Transaksi** | ✅ | `/admin/transaksi` — search, ubah status, detail, hapus, cetak struk |
| Stack dicantumkan di dokumentasi | ✅ | Bagian [Tech Stack](#-tech-stack) di atas |
| Validasi input | ✅ | Divalidasi 2× — di client (UX) dan di Server Action (keamanan) |
| Keamanan dasar | ✅ | 4 lapis: middleware → layout → server action → Row Level Security |

**Di luar ketentuan (nilai tambah inovasi):** ketersediaan meja real-time hasil scan QR (`/meja`),
struk digital thermal 80mm yang bisa dicetak sendiri (`/struk/[invoice]`), manajemen denah meja
(`/admin/meja`), dan panel hak akses beserta ID tiap akun (`/admin/akses`).

---

## 🔍 Di mana letak CRUDS-nya?

| Operasi | Lokasi |
| --- | --- |
| **Create** | `src/app/admin/produk/actions.js → createProduct()` · `src/app/admin/meja/actions.js → createTable()` · checkout tamu: `src/app/(site)/menu/actions.js → createOrder()` · pesan kontak: `src/app/(site)/kontak/actions.js` |
| **Read** | Server Component tiap halaman (`page.jsx`) mengambil data langsung dari Supabase |
| **Update** | `updateProduct()`, `toggleProductActive()`, `updateTable()`, `setTableStatus()`, `updateTransactionStatus()`, `setUserRole()` |
| **Delete** | `deleteProduct()`, `deleteTable()`, `deleteTransaction()` |
| **Search** | `ProductManager.jsx`, `TableManager.jsx`, `TransactionManager.jsx`, `AccessManager.jsx`, `PosClient.jsx` — pencarian instan (client-side `useMemo`) + filter + sorting + pagination |

---

## 🖨️ Cetak struk

Dulu tombol **Cetak Struk** memanggil `window.print()` di halaman menu, sehingga **seluruh halaman web**
ikut tercetak. Sekarang:

1. Struk punya halamannya sendiri: `/struk/[invoice]` — tanpa navbar & footer.
2. Datanya diambil lewat RPC `get_receipt()` (`SECURITY DEFINER`), jadi pelanggan bisa membukanya **tanpa login**.
3. `globals.css` memuat blok `@media print` yang menyembunyikan semua elemen `.no-print` dan
   memformat `.receipt-paper` menjadi kertas thermal **80 mm**.

Tombol **Cetak** tersedia di modal setelah checkout, di halaman struk, di dashboard, dan di daftar transaksi admin.

---

## 🔐 Keamanan

Akses admin diperiksa **empat lapis** — ringkasannya juga tampil di `/admin/akses`:

| Lapis | Berkas | Fungsi |
| --- | --- | --- |
| 1. Middleware | `src/middleware.js` | Menahan permintaan ke `/admin` bila belum login / bukan admin |
| 2. Layout admin | `src/app/admin/layout.jsx` | Memeriksa ulang user + role sebelum halaman dirender |
| 3. Server Action | `src/app/admin/**/actions.js` | Memanggil `requireAdmin()` sebelum menyentuh database |
| 4. Row Level Security | `supabase/schema.sql` | Policy database — tetap menolak walau API dipanggil langsung |

Catatan lain:

- Checkout memakai `create_order()` (`SECURITY DEFINER`) agar tamu bisa memesan **tanpa** diberi izin tulis ke tabel.
- `get_receipt()` hanya mengembalikan **satu** invoice dan **tidak** menyertakan `user_id` pemesan.
- `admin_set_role()` menolak permintaan menurunkan role akun sendiri, sehingga selalu tersisa minimal satu admin.
- Registrasi selalu menghasilkan role `user`; `role` dari metadata pendaftaran diabaikan.

---

## 📦 Perintah

```bash
npm run dev      # mode pengembangan
npm run build    # build produksi
npm run start    # jalankan hasil build
npm run lint     # cek lint
```
