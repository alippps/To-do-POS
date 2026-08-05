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
| **Pelanggan (tanpa login)** | `/meja?meja=07` layar hub hasil scan QR · `/katalog` daftar menu baca-saja · `/meja` ketersediaan meja real-time · `/menu` pilih & pesan · `/bayar` tagihan berjalan per meja · `/promo` menu diskon hari ini · `/struk/[invoice]` bukti pesanan · Kontak · About |
| **Auth** | Login & Register (Supabase Auth) — **khusus staf**, role `user` / `admin`. Dibuka lewat URL langsung `/login` & `/register`; tidak ditautkan dari situs publik |
| **Admin** | Dashboard (omzet, pesanan pending, status meja, stok menipis) · **Kasir** (buat pesanan untuk pelanggan walk-in) · Daftar Produk (CRUD + Search) · Denah Meja (CRUD + status + generator QR) · Daftar Transaksi · **Hak Akses** |
| **QR Ordering** | Landing page menjelaskan alurnya + satu QR contoh. **Generator QR per meja (unduh PNG) ada di `/admin/meja`** — alat operasional pemilik kedai, bukan fitur publik |

---

## 🧭 Alur pemesanan

Ada **dua jalan masuk**, dan keduanya berakhir di tagihan meja yang sama.

### A. Datang langsung → pesan di kasir

```
Pelanggan datang  →  /admin/kasir      Kasir: pilih MEJA KOSONG → masukkan pesanan
                  →  duduk di mejanya  Meja otomatis tertandai "Terisi"
                  →  scan QR di meja   Mau nambah? Pesan sendiri, tanpa antre lagi
                  →  /admin/transaksi  Kasir menandai "Lunas" saat pelanggan pulang
```

Pesanan dari kasir sengaja dibuat berstatus **`pending`**, bukan langsung lunas. Alasannya:
status meja diturunkan dari ada-tidaknya pesanan pending, jadi pesanan yang langsung dilunasi
akan membuat mejanya kembali “Tersedia” padahal pelanggan baru saja duduk di situ. Semua
tambahan lewat QR menempel ke meja yang sama dan dilunasi sekali di akhir.

### B. Scan QR di meja → pesan sendiri

```
QR di meja  →  /meja?meja=07        POPUP langsung muncul, dua pilihan:
                                      Tambah Pesanan  → /menu?meja=07&mode=tambah
                                      Langsung Pesan  → /menu?meja=07
                                    Popup ditutup → LAYAR HUB di belakangnya:
                                      📖 Menu    → /katalog      lihat menu & harga (baca saja)
                                      🛒 Order   → /menu?meja=07 pesan dari meja ini
                                      💳 Bayar   → /bayar?meja=07 tagihan berjalan meja ini
                                      🔥 Promo   → /promo?meja=07 menu yang sedang diskon
            →  /menu?meja=07        Pilih menu, isi nama, checkout
            →  /struk/INV-…         Bukti pesanan digital
            →  /admin/transaksi     Kasir menandai "Lunas" → meja otomatis kosong lagi
```

Mana yang jadi tombol utama di popup ditentukan keadaan meja, bukan tebakan: kalau meja itu
sudah punya tagihan berjalan, **Tambah Pesanan** yang ditonjolkan beserta jumlah dan totalnya.
Kalau belum ada apa-apa, **Langsung Pesan** yang di atas.

Cabang `mode=tambah` bukan sekadar beda kata: halaman menu berganti judul jadi “Tambah pesanan
untuk Meja 07” dan memunculkan tagihan yang sedang berjalan, supaya jelas tambahannya menempel
ke situ — bukan jadi tagihan terpisah. Apa pun cabangnya, **pembayaran tetap sekali di akhir**.

Yang memindai QR meja 07 memang sedang duduk di meja 07, jadi ia tidak disuruh memilih meja
lagi. Grid ketersediaan meja tetap ada di **`/meja` tanpa parameter** (dari navbar, atau lewat
tautan “Duduk di meja lain?” di bawah hub).

Pesanan yang masuk lewat QR berstatus **`pending`** dan menandai mejanya **terisi**.
Begitu kasir menandainya **lunas** (atau **batal**), trigger database membebaskan meja itu kembali.
Selama masih `pending`, pesanan itulah yang muncul di halaman **Bayar** meja tersebut.

---

## 🔒 Isolasi sisi pelanggan ↔ admin

Antarmuka publik **murni melayani pemesanan**. Tidak ada satu pun tautan, tombol, atau
identitas akun yang mengarah ke area staf — bahkan ketika yang membuka situs adalah admin
yang sedang login.

| Dulu ada di sisi publik | Sekarang |
| --- | --- |
| Navbar: tautan **Dashboard** (untuk admin) | Dihapus |
| Navbar: tautan **Login staf** | Dihapus |
| Navbar: chip identitas akun + tombol **Keluar** | Dihapus |
| Footer: kolom **Staf & Admin** (`/login`, `/register`, `/admin`) | Dihapus |
| Menu Favorit: “tambahkan produk dari Dashboard Admin” | Diganti kalimat netral untuk pelanggan |
| Section QR: pilih meja mana pun → **unduh QR-nya** | Generator pindah ke `/admin/meja`; landing tinggal penjelasan + 1 QR contoh |

**Pintu masuk staf:** ketik `/login` langsung di address bar. Halaman itu tidak ditautkan
dari mana pun, tapi tetap publik dan berfungsi normal — tidak ada rahasia yang bergantung
pada URL ini, seluruh proteksi tetap dijaga 4 lapis (lihat [Keamanan](#-keamanan)).

**Kendali sesi pindah ke `/login`.** Karena sisi publik tidak lagi punya tombol Keluar,
`/login` berperan ganda: saat belum ada sesi ia menampilkan form login, saat sesi aktif ia
menampilkan panel sesi — siapa yang masuk, role-nya, tombol **Buka Dashboard Admin** (khusus
admin), dan tombol **Keluar**. Tanpa panel ini akun ber-role `user` akan terkunci: tidak bisa
membuka `/admin`, tidak bisa keluar dari mana pun.

`SiteLayout` juga tidak lagi memanggil `getSessionUser()` — tidak ada elemen publik yang
berubah karena status login, jadi query sesi per request itu murni beban tanpa guna.

> **Catatan untuk penguji/juri:** halaman **Login** dan **Register** tetap ada dan tetap
> memenuhi ketentuan lomba — buka `/login` dan `/register` langsung. Keduanya tidak
> ditautkan dari situs publik semata-mata karena isolasi ini.

---

## 🔑 Matriks Hak Akses

Halaman **`/admin/akses`** menampilkan tabel ini secara langsung **beserta ID (UUID) tiap akun**
dan tombol untuk menaikkan/menurunkan role.

| Halaman / Aksi | Tamu | User | Kasir | Admin |
| --- | :---: | :---: | :---: | :---: |
| Landing `/`, About, Kontak | ✅ | ✅ | ✅ | ✅ |
| Katalog menu `/katalog` (baca saja) | ✅ | ✅ | ✅ | ✅ |
| Promo hari ini `/promo` | ✅ | ✅ | ✅ | ✅ |
| Tagihan meja `/bayar?meja=07` | ✅ | ✅ | ✅ | ✅ |
| Ketersediaan meja `/meja` | ✅ | ✅ | ✅ | ✅ |
| Menu & pesan `/menu` | ✅ | ✅ | ✅ | ✅ |
| Struk `/struk/[invoice]` | ✅ | ✅ | ✅ | ✅ |
| Membuat pesanan (checkout) | ✅ | ✅ | ✅ | ✅ |
| Mengirim pesan kontak | ✅ | ✅ | ✅ | ✅ |
| Dashboard `/admin` | ❌ | ❌ | ✅ | ✅ |
| Kasir `/admin/kasir` | ❌ | ❌ | ✅ | ✅ |
| Daftar transaksi `/admin/transaksi` | ❌ | ❌ | ✅ | ✅ |
| CRUD produk `/admin/produk` | ❌ | ❌ | ❌ | ✅ |
| Denah meja `/admin/meja` | ❌ | ❌ | ❌ | ✅ |
| Hak akses `/admin/akses` | ❌ | ❌ | ❌ | ✅ |
| Baca produk & meja (DB) | ✅ | ✅ | ✅ | ✅ |
| Tulis produk & meja (DB) | ❌ | ❌ | ❌ | ✅ |
| Baca tabel transaksi (DB) | ❌ | ◐ miliknya | ✅ | ✅ |
| Ubah status transaksi (lunas/batal) | ❌ | ❌ | ✅ | ✅ |
| **Hapus transaksi** | ❌ | ❌ | ❌ | ✅ |
| Ubah role akun | ❌ | ❌ | ❌ | ✅ |
| Baca pesan kontak masuk | ❌ | ❌ | ❌ | ✅ |

**Siapa itu siapa**

| Role | Identitas | Keterangan |
| --- | --- | --- |
| **Tamu** | tanpa ID akun (`auth.uid()` = `NULL`) | Siapa pun yang membuka website / scan QR |
| **User** | UUID di `profiles` dengan `role = 'user'` | Semua akun baru otomatis `user` |
| **Kasir** | UUID di `profiles` dengan `role = 'kasir'` | Petugas kasir. Hanya Dashboard, Kasir, dan Daftar Transaksi |
| **Admin** | UUID di `profiles` dengan `role = 'admin'` | Pemilik. Seluruh area admin. Dinaikkan dari `/admin/akses` atau SQL Editor |

Cek langsung dari SQL Editor Supabase siapa saja yang memegang akses admin:

```sql
select u.email, p.role, p.id
from public.profiles p
join auth.users u on u.id = p.id
order by p.role, u.email;
```

---

## ⚠️ Sudah pernah menjalankan schema versi lama? Jalankan ulang.

Fitur **Bayar** dan **Promo Hari Ini** menambah hal baru di database:

| Tambahan | Dipakai oleh |
| --- | --- |
| **Role `kasir`** | Constraint `profiles_role_check`, helper `is_staff()`, policy transaksi dipecah per operasi, `admin_set_role()` menerima `kasir` |
| Kolom `products.promo_price` | `/promo`, katalog, menu, keranjang, `/admin/produk` |
| RPC `get_table_bill(p_table_no)` | Tombol **Bayar** pada hub & halaman `/bayar` |
| `create_order()` versi baru | Menagih harga promo, bukan harga normal |
| Penyederhanaan area meja | Area `Workspace`/`VIP` diubah jadi `Indoor`; sifat ruangannya pindah ke label |

Tempel ulang **seluruh** isi [`supabase/schema.sql`](supabase/schema.sql) ke SQL Editor Supabase
lalu **Run**. File-nya idempotent — data yang sudah ada tidak akan hilang, dan promo yang sudah
kamu atur di `/admin/produk` tidak tertimpa.

**Area meja sekarang hanya `Indoor` dan `Outdoor`.** Ruang kerja dan meeting room sama-sama
berada di dalam ruangan, jadi keduanya bukan area tersendiri — sifat ruangannya ditulis di kolom
**label** meja (mis. “Workspace / Meeting Room”, “Bar counter”, “Teras depan”). Menjalankan
skrip di atas otomatis memindahkan meja lama yang berarea `Workspace`/`VIP` ke `Indoor`.

Tanpa langkah ini, halaman menu/katalog/promo akan menampilkan pesan gagal memuat karena
kolom `promo_price` belum ada.

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
   Skrip ini membuat tabel, RLS policy, trigger, fungsi checkout, RPC struk & tagihan meja,
   12 produk contoh (2 di antaranya dipasang promo), dan 12 meja contoh.
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

3. Buka **`/login`** langsung lewat address bar (tautannya sengaja tidak ada di situs publik —
   lihat [Isolasi sisi pelanggan ↔ admin](#-isolasi-sisi-pelanggan--admin)), lalu masuk.
   Setelah masuk sebagai admin, `/login` menampilkan tombol **Buka Dashboard Admin**.
4. Admin berikutnya cukup ditambahkan lewat halaman **`/admin/akses`** — tidak perlu SQL lagi.

> Jika ingin login langsung tanpa konfirmasi email, matikan **Confirm email** di
> Supabase → Authentication → Providers → Email.

**Uji coba tanpa email pribadi.** Email di `/register` hanya dipakai sebagai nama pengguna
untuk masuk ke dashboard — tidak pernah tampil di halaman pelanggan maupun di struk.
Untuk sesi uji coba atau demo, matikan **Confirm email** lebih dulu (lihat catatan di atas),
lalu daftar memakai alamat contoh seperti `kasir@todocoffee.id`. Tanpa konfirmasi email,
alamat itu tidak perlu benar-benar ada dan akunnya langsung bisa dipakai login.
Kalau **Confirm email** dibiarkan menyala, alamatnya harus asli karena tautan konfirmasi
dikirim ke sana.

### 7. Mencoba alur QR dari HP

QR berisi `NEXT_PUBLIC_SITE_URL`, jadi `localhost` tidak bisa dibuka dari HP.
Untuk uji coba, jalankan `npm run dev -- -H 0.0.0.0` lalu set
`NEXT_PUBLIC_SITE_URL=http://<IP-laptop>:3000`, atau deploy dulu ke Vercel.

QR per meja diunduh dari **`/admin/meja` → panel “Cetak QR Meja”** (bukan dari landing page).
Panel itu menolak mencetak diam-diam: kalau `NEXT_PUBLIC_SITE_URL` masih alamat lokal, muncul
peringatan bahwa QR-nya tidak akan bisa dipindai pelanggan — supaya ketahuan sebelum stikernya
terlanjur tertempel di semua meja.

---

## 🗂️ Struktur Proyek

```
src/
├─ app/
│  ├─ (site)/                 # Halaman publik (pakai Navbar + Footer)
│  │  ├─ page.jsx             # Home / landing (semua section)
│  │  ├─ loading.jsx          # Kerangka bawaan semua halaman publik
│  │  ├─ katalog/             # Daftar menu BACA SAJA (tanpa keranjang)
│  │  ├─ promo/               # Menu yang sedang diskon (kolom promo_price)
│  │  ├─ bayar/               # Tagihan berjalan sebuah meja (RPC get_table_bill)
│  │  ├─ meja/                # Hub hasil scan QR + ketersediaan meja (+ loading.jsx)
│  │  ├─ menu/                # Menu pelanggan + server action checkout (+ loading.jsx)
│  │  ├─ fitur/               # Redirect ke /menu (menjaga QR lama tetap jalan)
│  │  ├─ kontak/              # Form kontak + server action simpan pesan
│  │  └─ about/
│  ├─ struk/[invoice]/        # Struk digital 80mm — halaman cetak berdiri sendiri
│  ├─ (auth)/                 # Login & Register (layout split-screen)
│  ├─ admin/                  # Area admin (dilindungi middleware + layout)
│  │  ├─ page.jsx             # Dashboard
│  │  ├─ loading.jsx          # Kerangka semua halaman admin
│  │  ├─ kasir/               # Buat pesanan untuk pelanggan walk-in
│  │  ├─ produk/              # CRUD + Search produk
│  │  ├─ meja/                # CRUD denah meja + status + generator QR
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
│  ├─ pos/                    # ScanIntentDialog, ScanHub, FlowSteps, PosClient,
│  │                          # ProductCard, CartPanel, ReceiptModal, ReceiptPaper,
│  │                          # PrintReceiptBar
│  ├─ auth/                   # LoginForm, RegisterForm, SessionPanel
│  └─ admin/                  # AdminShell, CashierClient, ProductManager, TableManager,
│                             # TableQrPanel, TransactionManager, AccessManager, ...
├─ lib/
│  ├─ supabase/               # client.js (browser), server.js (SSR + createPublicClient),
│  │                          # middleware.js
│  ├─ site.js                 # Identitas bisnis, nomor WA, kategori produk
│  ├─ promo.js                # Aturan harga promo (dipakai semua halaman)
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
| Sistem **C**reate | ✅ | `admin/produk/actions.js`, `admin/meja/actions.js`, `admin/kasir/actions.js`, `(site)/menu/actions.js`, `(site)/kontak/actions.js` |
| Sistem **R**ead | ✅ | Server Component tiap `page.jsx` |
| Sistem **U**pdate | ✅ | `updateProduct()`, `updateTable()`, `setTableStatus()`, `updateTransactionStatus()`, `setUserRole()` |
| Sistem **D**elete | ✅ | `deleteProduct()`, `deleteTable()`, `deleteTransaction()` |
| Sistem **S**earch | ✅ | `ProductManager`, `TableManager`, `TransactionManager`, `AccessManager`, `PosClient` |
| Halaman **Login** | ✅ | `/login` — `src/app/(auth)/login/page.jsx` (buka langsung; tidak ditautkan dari situs publik, lihat [Isolasi](#-isolasi-sisi-pelanggan--admin)) |
| Halaman **Register** | ✅ | `/register` — `src/app/(auth)/register/page.jsx` (buka langsung) |
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

**Di luar ketentuan (nilai tambah inovasi):** layar hub 4 pilihan hasil scan QR meja
(`/meja?meja=07`), tagihan berjalan per meja tanpa login (`/bayar`), promo harian yang dikelola
dari daftar produk (`/promo`), katalog menu baca-saja (`/katalog`), ketersediaan meja real-time
(`/meja`), struk digital thermal 80mm (`/struk/[invoice]`), manajemen denah meja + generator QR
per meja (`/admin/meja`), dan panel hak akses beserta ID tiap akun (`/admin/akses`).

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
