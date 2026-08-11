# To Do POS — Sistem Point of Sale multi-UMKM (CRUDS)

Sistem **Point of Sale** modern untuk UMKM kuliner, lengkap dengan **Create, Read, Update, Delete, Search**.
Dibangun dengan **Next.js App Router + Tailwind CSS + Supabase**.

> **Pelanggan tidak perlu login.** Scan QR di meja → nomor meja terbaca sendiri → pilih menu → pesan → struk terbit.
> Akun hanya dibutuhkan oleh **staf/admin** untuk membuka dashboard.

## 🏪 Satu pemasangan, banyak UMKM

Sejak **v4**, satu pemasangan sistem ini melayani **banyak outlet sekaligus**. Setiap UMKM
punya `slug` sendiri yang muncul di URL dan ikut tercetak permanen di QR mejanya:

```
/                          direktori outlet
/k/kopi-pagi               landing Kopi Pagi
/k/kopi-pagi/meja?meja=07  hasil scan QR meja 07 Kopi Pagi
/k/kopi-pagi/admin         dashboard Kopi Pagi

/k/roti-88/meja?meja=03    outlet lain, denah & menu sendiri
```

Pemisahannya **bukan sekadar penyaring di kueri aplikasi.** Seluruh RLS policy ikut
disaring per outlet (`is_admin_of()` / `is_staff_of()`), nomor meja unik **per outlet**,
dan ketiga RPC publik menerima slug — jadi admin Kopi Pagi tidak bisa membaca apalagi
mengubah data Roti Bakar 88, sekalipun ia menebak id barisnya.

Menambah outlet baru cukup satu baris `insert` — lihat [bagian 11 di `supabase/schema.sql`](supabase/schema.sql).

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
| **Lint** | ESLint + `eslint-config-next` | 8.57 / 14.2 | `no-undef` & aturan React/Next — ikut jalan saat `npm run build` |
| **Runtime** | Node.js | ≥ 18 (diuji di 22) | — |

Tanpa dependensi UI pihak ketiga — seluruh komponen (Button, Modal, Badge, Field, Toast,
Table, Card, dsb.) ditulis sendiri di `src/components/ui/`.

---

## ✨ Fitur

| Area | Isi |
| --- | --- |
| **Landing page** | Navbar · Hero · Tentang CoffeeShop & Software House · Layanan Utama · Keunggulan · Menu Favorit · Portfolio · Testimoni · QR Pemesanan · FAQ · CTA WhatsApp · Footer |
| **Pelanggan (tanpa login)** | `/meja?meja=07` layar hub hasil scan QR · `/katalog` daftar menu baca-saja (ikut membawa `?meja=` supaya ajakan pesannya kembali ke meja yang sama) · `/meja` ketersediaan meja real-time · `/menu` pilih & pesan · `/bayar` tagihan berjalan per meja · `/promo` menu diskon hari ini · `/struk/[invoice]` bukti pesanan · Kontak · About |
| **Auth** | Login & Register (Supabase Auth) — **khusus staf**, role `user` / `kasir` / `admin`. `/login` dijangkau lewat tautan **Masuk Staf** di baris paling bawah footer; `/register` tetap hanya lewat URL langsung |
| **Admin** | Dashboard (omzet, pesanan pending, status meja, stok menipis) · **Kasir** (buat pesanan untuk pelanggan walk-in) · Daftar Produk (CRUD + Search) · Denah Meja (CRUD + status + generator QR) · Daftar Transaksi · **Hak Akses** |
| **QR Ordering** | Landing page menjelaskan alurnya + satu QR contoh. **Generator kartu meja (unduh PNG siap cetak: nomor meja besar + QR + instruksi) ada di `/admin/meja`** — alat operasional pemilik kedai, bukan fitur publik |

---

## 🧭 Alur pemesanan

**QR di tiap meja adalah jalur pemesanan mandiri.** Pelanggan mencari tempat, duduk, lalu
memesan dari mejanya sendiri — kasir bukan pintu masuk, melainkan tempat membayar di akhir.
Pemesanan tambahan memakai pintu yang sama persis: pindai lagi, dan tambahannya menempel ke
tagihan meja itu.

```
QR  →  Table ID = 07  →  Pilih menu  →  Sistem  →  Order  →  Meja 07  →  Kasir
```

Nomor meja terbaca dari QR-nya sendiri, jadi pelanggan tidak pernah mengetik atau menyebutkan
nomor meja, dan kasir tidak pernah salah menempelkan pesanan ke meja yang keliru.

Ada **dua jalan masuk**, dan keduanya berakhir di tagihan meja yang sama.

### A. Dilayani kasir (walk-up / pelanggan yang minta dibantu)

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

### B. Duduk → scan QR di meja → pesan sendiri *(jalur utama)*

```
QR di meja  →  /meja?meja=07&src=qr  POPUP langsung muncul, dua pilihan:
                                      Langsung Pesan  → /menu?meja=07&src=qr
                                      Tambah Pesanan  → /menu?meja=07&src=qr&mode=tambah
                                      (urutannya dibalik bila meja sudah punya tagihan)
                                    Popup ditutup → LAYAR HUB di belakangnya:
                                      📖 Lihat Menu → /katalog?meja=07 menu & harga (baca saja)
                                      🛒 Pesan      → /menu?meja=07&src=qr pesan dari meja ini
                                      💳 Bayar   → /bayar?meja=07 tagihan berjalan meja ini
                                      🔥 Promo   → /promo?meja=07 menu yang sedang diskon
            →  /menu?meja=07&src=qr Pilih menu, isi nama, checkout
            →  /struk/INV-…?src=qr  Bukti pesanan digital
            →  /admin/transaksi     Kasir menandai "Lunas" → meja otomatis kosong lagi
```

Mana yang jadi tombol utama di popup ditentukan keadaan meja, bukan tebakan. Meja yang masih
bersih — pelanggan yang baru duduk — menonjolkan **Langsung Pesan**. Begitu meja itu punya
tagihan berjalan, judulnya berganti jadi **“Mau nambah pesanan?”** dan **Tambah Pesanan** yang
naik ke atas beserta jumlah dan totalnya. Satu QR melayani dua keadaan tanpa pelanggan perlu
memilih mana yang berlaku untuknya.

Cabang `mode=tambah` bukan sekadar beda kata: halaman menu berganti judul jadi “Tambah pesanan
untuk Meja 07” dan memunculkan tagihan yang sedang berjalan, supaya jelas tambahannya menempel
ke situ — bukan jadi tagihan terpisah. Apa pun cabangnya, **pembayaran tetap sekali di akhir**.

Yang memindai QR meja 07 memang sedang duduk di meja 07, jadi ia tidak disuruh memilih meja
lagi. Grid ketersediaan meja tetap ada di **`/meja` tanpa parameter** (dari navbar, atau lewat
tautan “Duduk di meja lain?” di bawah hub).

**Penanda `src=qr`.** Meja bisa sampai ke `/menu` lewat dua jalan yang berbeda maknanya:
dipilih sendiri dari denah, atau ditentukan tempat duduk lalu terbaca dari QR. Hanya jalan
pertama yang layak disebut “Pilih meja” di stepper; bagi pemindai QR, langkah itu tidak pernah
ada — menandainya selesai membuat alurnya terasa mengada-ada dan tautan mundurnya menawarkan
pekerjaan fiktif. Penanda ini dipasang oleh `ScanHub`/`ScanIntentDialog`, **bukan dibaca dari
URL yang masuk**, sehingga QR lama yang terlanjur tercetak tanpa `src` tetap ikut benar: sampai
di layar hub itu sendiri sudah berarti habis memindai. Penanda dibawa terus sampai `/struk`
supaya asal-usulnya tidak putus di langkah terakhir.

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
| Footer: kolom **Staf & Admin** (`/login`, `/register`, `/admin`) | Dihapus — disisakan **satu** tautan `Masuk Staf` → `/login` di baris paling bawah |
| Menu Favorit: “tambahkan produk dari Dashboard Admin” | Diganti kalimat netral untuk pelanggan |
| Section QR: pilih meja mana pun → **unduh QR-nya** | Generator pindah ke `/admin/meja`; landing tinggal penjelasan + 1 QR contoh |

**Pintu masuk staf: tautan `Masuk Staf` di baris paling bawah footer.** Satu tautan, ke
`/login` saja, dan sengaja hanya di sana.

Menghapusnya sama sekali — seperti sebelumnya — memindahkan cara masuk ke luar produk:
kasir baru di hari pertamanya harus diberi tahu lisan untuk mengetik `/login`. Sebaliknya,
menaruhnya di navbar bersebelahan dengan **Pesan Sekarang** adalah cara paling cepat
membuat pelanggan yang baru memindai QR mengira ia harus punya akun dulu — padahal seluruh
alur pemesanan justru dibangun supaya ia tidak perlu. Footer bagian bawah menyelesaikan
keduanya: staf tahu tempat mencarinya, pelanggan yang sedang memesan tidak pernah
menggulung sejauh itu.

`/register` tetap tidak ditautkan dari mana pun — penambahan staf berikutnya memang
lewat `/admin/akses`, bukan pendaftaran mandiri. Keduanya tetap publik dan berfungsi
normal: tidak ada rahasia yang bergantung pada URL-nya, seluruh proteksi tetap dijaga
4 lapis (lihat [Keamanan](#-keamanan)).

**Kendali sesi pindah ke `/login`.** Karena sisi publik tidak lagi punya tombol Keluar,
`/login` berperan ganda: saat belum ada sesi ia menampilkan form login, saat sesi aktif ia
menampilkan panel sesi — siapa yang masuk, role-nya, tombol masuk area staf, dan tombol
**Keluar**. Tanpa panel ini akun ber-role `user` akan terkunci: tidak bisa membuka `/admin`,
tidak bisa keluar dari mana pun.

**Tujuan sesudah masuk ditentukan role, bukan satu alamat untuk semua.** Admin mendarat di
Dashboard (`/admin`), kasir langsung di layar kasir (`/admin/kasir`). Alasannya sederhana:
yang dikerjakan kasir sepanjang shift adalah memasukkan pesanan, sedangkan dashboard berisi
angka ringkasan yang gunanya bagi pemilik — mengantar kasir ke sana berarti menyuruhnya
menekan satu menu lagi, setiap kali, seumur pemakaian. Pemetaannya ada di satu tempat,
`STAFF_HOME` di [`src/lib/access.js`](src/lib/access.js), dan dipakai bersama oleh form
login maupun panel sesi (yang tombolnya ikut berganti jadi **Buka Layar Kasir**) — supaya
keduanya tidak bisa berbeda pendapat soal ke mana seorang kasir seharusnya pergi. Staf yang
tiba lewat `?next=` tetap diantar ke halaman yang tadi ia coba buka.

`SiteLayout` juga tidak lagi memanggil `getSessionUser()` — tidak ada elemen publik yang
berubah karena status login, jadi query sesi per request itu murni beban tanpa guna.

> **Catatan untuk penguji/juri:** halaman **Login** dan **Register** tetap ada dan tetap
> memenuhi ketentuan lomba. **Login** dijangkau lewat tautan **Masuk Staf** di baris paling
> bawah footer (atau buka `/login` langsung); **Register** hanya lewat URL langsung
> `/register` — tidak ditautkan, semata-mata karena isolasi ini.

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

## 💳 Metode pembayaran — tinggal dua

| Metode | Yang terjadi |
| --- | --- |
| **QRIS** | Kode QRIS muncul di halaman bukti pesanan (`/k/<slug>/struk/INV-…`), pelanggan memindainya dari HP-nya sendiri |
| **Bayar di kasir** | Pelanggan menunjukkan nomor pesanan di kasir dan membayar tunai di sana |

**Transfer bank dihapus dari pilihan.** Ia satu-satunya metode yang tidak bisa
diselesaikan di tempat: pelanggan pergi ke aplikasi banknya, kasir menunggu bukti
transfer yang tidak pernah masuk ke sistem, dan status pesanan menggantung tanpa ada
yang tahu sudah dibayar atau belum.

> ### ⚠️ Kode QRIS-nya SIMULASI
>
> `src/components/pos/QrisPayment.jsx` **tidak** membangun muatan EMVCo/QRIS dan tidak
> terhubung ke penyedia pembayaran mana pun. Isinya teks biasa berisi nomor pesanan,
> nama outlet, dan nominalnya; dipindai dengan kamera HP, yang muncul adalah keterangan
> itu — bukan layar bayar. Peringatannya ditulis menempel pada kodenya di layar, bukan di
> catatan kaki.
>
> Ini keputusan sadar. Membuat muatan yang menyerupai QRIS sungguhan berarti mencetak
> sesuatu yang bisa dikira alat pembayaran, dan kegagalannya baru ketahuan setelah ada
> pelanggan yang merasa sudah membayar. Saat integrasi asli dipasang nanti, yang berubah
> cukup fungsi `muatanQris()` dan label peringatannya.

---

## 🔒 Nomor meja tidak bisa diketik

Satu barcode untuk satu meja: QR di meja 07 memuat `?meja=07`, dan nomor itu masuk ke
keranjang dalam keadaan **terkunci** — tidak ada dropdown, tidak ada kolom isian.

Dropdown lama membuat nomor meja bisa diganti jadi meja mana pun, dan itu sumber
kesalahan yang paling mahal: minuman diantar ke meja yang salah, atau tagihan menempel ke
meja orang lain.

Ada dua jalan yang sah untuk menentukannya, dan keduanya mengunci hasilnya:

| Jalan | URL | Stepper |
| --- | --- | --- |
| Pindai QR di meja | `/menu?meja=07&src=qr` | Langkah 1 berbunyi “Meja 07 · Terbaca dari QR”, tidak bisa diklik |
| Pilih dari denah `/meja` | `/menu?meja=07` | Langkah 1 berbunyi “Pilih meja”, ditandai selesai & bisa diklik |

Yang membuka `/menu` tanpa nomor meja tidak diberi kolom untuk mengarangnya — ia
disuguhi kartu “Meja belum diketahui” beserta tautan ke denah. Server action
`createOrder()` juga menolak pesanan tanpa nomor meja, jadi penjaganya tidak bergantung
pada tampilan.

---

## ⚠️ Sudah pernah menjalankan schema versi lama? Jalankan ulang.

**v4 mengubah skema secara besar.** Jalankan ulang seluruh isi
[`supabase/schema.sql`](supabase/schema.sql) — file-nya idempotent dan sudah berisi
migrasinya sendiri: tabel `tenants` dibuat, outlet `to-do` dibentuk, lalu SELURUH produk,
meja, transaksi, pesan kontak, dan akun yang sudah ada dipindahkan ke sana sebelum kolom
`tenant_id`-nya dijadikan `NOT NULL`. **Tidak ada data yang hilang.**

| Tambahan v4 | Dipakai oleh |
| --- | --- |
| Tabel `tenants` | Seluruh URL `/k/<slug>`, identitas outlet (dulu di `src/lib/site.js`) |
| Kolom `tenant_id` di 5 tabel | Penyaring setiap kueri + seluruh RLS policy |
| `cafe_tables` unik **(tenant_id, table_no)** | Meja 01 boleh ada di banyak outlet — constraint global lama di-drop |
| `is_admin_of()` / `is_staff_of()` / `current_tenant_id()` | Policy yang menyaring per outlet |
| RPC menerima `p_tenant_slug` | `create_order`, `get_table_bill` |
| `handle_new_user()` membaca `tenant_slug` | Pendaftaran di `/k/<slug>/register` |

Tambahan dari versi sebelumnya yang tetap berlaku:

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

Skema membuat outlet pertama ber-slug **`to-do`**, jadi seluruh alamat di bawah memakai
`/k/to-do/…`. Ganti dengan slug outlet Anda sendiri bila sudah menambah yang lain.

1. Daftar lewat **`/k/to-do/register`**. Halaman ini menitipkan slug outlet ke metadata
   pendaftaran, sehingga akunnya langsung menempel ke outlet yang benar.
2. Kembali ke **SQL Editor** Supabase, jalankan (ganti emailnya):

```sql
update public.profiles
set role = 'admin', tenant_id = (select id from public.tenants where slug = 'to-do')
where id = (select id from auth.users where email = 'emailkamu@gmail.com');
```

3. Buka **`/k/to-do/login`** — lewat tautan **Masuk Staf** di baris paling bawah footer,
   atau langsung dari address bar (lihat [Isolasi sisi pelanggan ↔ admin](#-isolasi-sisi-pelanggan--admin)),
   lalu masuk. Setelah masuk sebagai admin outlet itu, halaman tersebut menampilkan
   tombol **Buka Dashboard**.
4. Admin berikutnya cukup ditambahkan lewat **`/k/to-do/admin/akses`** — tidak perlu SQL lagi.

> Akun terikat pada **satu** outlet. Admin Kopi Pagi yang membuka `/k/roti-88/admin`
> ditolak middleware, dan `/k/roti-88/login` menjelaskan bahwa akunnya milik outlet lain
> alih-alih menawarkan tombol dashboard yang pasti gagal.

### 6b. Menambah UMKM kedua

```sql
insert into public.tenants (slug, name, address, phone, hours, wa_number)
values ('kopi-pagi', 'Kopi Pagi Bandung', 'Jl. Braga No. 12, Bandung',
        '+62 812-0000-0000', 'Setiap hari, 07.00 – 22.00 WIB', '628120000000');
```

Outletnya langsung hidup di `/k/kopi-pagi` dengan menu & denah meja kosong. Daftarkan
adminnya lewat `/k/kopi-pagi/register`, naikkan rolenya seperti langkah 2 di atas
(ganti slug-nya), lalu isi produk dan mejanya dari dashboard.

> Jika ingin login langsung tanpa konfirmasi email, matikan **Confirm email** di
> Supabase → Authentication → Providers → Email.

**Soal email pendaftaran.** Email di `/register` hanya dipakai sebagai nama pengguna untuk
masuk ke dashboard — tidak pernah tampil di halaman pelanggan maupun di struk.

Perlu diketahui: **alamat karangan tidak selalu bisa dipakai.** Supabase punya validasi sendiri
yang menolak alamat yang dianggap email percobaan — termasuk pola `admin@`, `test@`, dan `demo@`
walau domainnya asli, serta domain cadangan seperti `example.com`. Penolakannya muncul sebagai
`email_address_invalid` dan sudah diterjemahkan di `src/lib/authErrors.js`.

Yang berlaku:

| Kondisi | Yang bisa dipakai |
| --- | --- |
| **Confirm email** menyala | Alamat asli yang kotak masuknya bisa kamu buka — tautan konfirmasi dikirim ke sana |
| **Confirm email** mati | Alamat mana pun yang lolos validasi Supabase. Hindari pola `admin@`/`test@`/`demo@` |

Kalau SMTP masih memakai bawaan Supabase, pengiriman hanya sampai ke anggota organisasi
Supabase kamu sendiri (`email_address_not_authorized`). Untuk demo, cara paling mulus tetap
mematikan **Confirm email**.

> Alamat contoh yang tampil di footer, halaman kontak, dan placeholder formulir memakai
> `example.com` — domain yang dicadangkan permanen oleh RFC 2606, jadi tidak mungkin menunjuk
> ke kotak masuk milik orang lain.

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

Seluruh halaman outlet hidup di bawah `src/app/k/[slug]/`. Yang tersisa di akar hanyalah
milik platform: direktori outlet, favicon, dan gambar OG.

```
src/
├─ app/
│  ├─ page.jsx                # Direktori outlet (beranda platform)
│  ├─ icon.svg                # Favicon
│  ├─ opengraph-image.jsx     # Preview tautan (next/og, runtime edge)
│  └─ k/[slug]/               # ← SEMUA halaman outlet ada di sini
│     ├─ layout.jsx           # Memvalidasi slug + TenantProvider
│     ├─ (site)/              # Halaman publik (pakai Navbar + Footer)
│     │  ├─ page.jsx          # Home / landing (semua section)
│     │  ├─ katalog/          # Daftar menu BACA SAJA (ikut membawa ?meja=)
│     │  ├─ promo/            # Menu yang sedang diskon (kolom promo_price)
│     │  ├─ bayar/            # Tagihan berjalan sebuah meja (RPC get_table_bill)
│     │  ├─ meja/             # Hub hasil scan QR + ketersediaan meja
│     │  ├─ menu/             # Menu pelanggan + server action checkout
│     │  ├─ fitur/            # Redirect ke /menu (menjaga QR lama tetap jalan)
│     │  ├─ kontak/           # Form kontak + server action simpan pesan
│     │  └─ about/
│     ├─ struk/[invoice]/     # Bukti pesanan + kode QRIS + struk 80mm (kasir)
│     ├─ (auth)/              # Login & Register (layout split-screen)
│     └─ admin/               # Area admin (dilindungi middleware + layout)
│        ├─ page.jsx          # Dashboard
│        ├─ kasir/            # Buat pesanan untuk pelanggan walk-in
│        ├─ produk/           # CRUD + Search produk
│        ├─ meja/             # CRUD denah meja + status + generator QR
│        ├─ transaksi/        # Daftar & kelola transaksi
│        └─ akses/            # Daftar akun + ID + matriks hak akses
│  ├─ layout.jsx              # Root layout + metadata PLATFORM
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
│  │                          # QrisPayment, PrintReceiptBar
│  ├─ tenant/                 # TenantProvider — identitas outlet untuk sisi klien
│  ├─ auth/                   # LoginForm, RegisterForm, SessionPanel
│  └─ admin/                  # AdminShell, CashierClient, ProductManager, TableManager,
│                             # TableQrPanel, TransactionManager, AccessManager, ...
├─ lib/
│  ├─ supabase/               # client.js (browser), server.js (SSR + createPublicClient),
│  │                          # middleware.js
│  ├─ tenant.js               # tenantPath(), slugValid(), waLinkOf() — MURNI, boleh di klien
│  ├─ tenant.server.js        # getTenant(), requireTenant(), listTenants() — server saja
│  ├─ site.js                 # Identitas PLATFORM (bukan identitas kedai)
│  ├─ adminGuard.js           # Penjaga halaman & server action, selalu per outlet
│  ├─ promo.js                # Aturan harga promo (dipakai semua halaman)
│  ├─ tables.js               # Status meja + metode bayar + status pesanan
│  ├─ access.js               # Matriks hak akses + stripTenantPrefix()
│  └─ format.js               # rupiah(), formatDate(), initials()
└─ middleware.js              # Refresh session + proteksi /k/<slug>/admin
```

> **Kenapa `tenant.js` dan `tenant.server.js` dipisah?** `Footer` dan `Logo` adalah
> komponen klien yang tetap butuh helper outlet. Kalau keduanya satu berkas, satu impor
> dari sisi klien menyeret `lib/supabase/server.js` (yang menyentuh `next/headers`) ke
> bundle browser dan build-nya berhenti.

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
| Halaman **Login** | ✅ | `/login` — `src/app/(auth)/login/page.jsx` (tautan **Masuk Staf** di baris paling bawah footer, lihat [Isolasi](#-isolasi-sisi-pelanggan--admin)) |
| Halaman **Register** | ✅ | `/register` — `src/app/(auth)/register/page.jsx` (buka langsung) |
| User Side — **Home** | ✅ | `/` — `src/app/(site)/page.jsx` |
| User Side — **Fitur Utama (jual beli)** | ✅ | `/menu` — `src/app/(site)/menu/page.jsx` (rute lama `/fitur` diarahkan ke sini). **Di antarmuka pelanggan halaman ini bernama “Pesan”** — istilah “Fitur Utama” milik dokumen lomba, bukan bahasa yang dimengerti pengunjung kedai |
| User Side — **Kontak + form** | ✅ | `/kontak` — form tervalidasi ganda, tersimpan ke tabel `contact_messages` |
| User Side — **About** | ✅ | `/about` — `src/app/(site)/about/page.jsx` |
| Admin Side — **Dashboard** | ✅ | `/admin` — omzet, pesanan pending, status meja, stok menipis |
| Admin Side — **Daftar Produk** | ✅ | `/admin/produk` — CRUD + search + filter + pagination |
| Admin Side — **Daftar Transaksi** | ✅ | `/admin/transaksi` — search, ubah status, detail, hapus, cetak struk |
| Stack dicantumkan di dokumentasi | ✅ | Bagian [Tech Stack](#-tech-stack) di atas |
| Validasi input | ✅ | Divalidasi 2× — di client (UX) dan di Server Action (keamanan). Checkout menolak nama pemesan kosong, meja kosong, dan metode bayar asing di `createOrder()`; formulir kontak memeriksa nama, email, dan nomor WhatsApp di `sendMessage()` |
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

## 🧪 Automation Test (Playwright E2E)

```bash
npm test              # jalankan seluruh suite (Chrome desktop + Pixel 7)
npm run test:ui       # mode interaktif, enak untuk menelusuri kegagalan
npm run test:report   # buka laporan HTML hasil eksekusi terakhir
```

Playwright menyalakan `npm run dev` sendiri bila belum jalan, dan menempel ke
server yang sudah ada bila sudah — jadi tidak bentrok dengan sesi pengembangan.

**Suite ini read-only terhadap Supabase.** Tidak ada checkout, pendaftaran akun,
maupun pesan kontak yang benar-benar terkirim: form hanya diuji dengan isian yang
pasti ditolak validasi, sehingga eksekusinya berhenti sebelum menyentuh database.
Konsekuensinya harus disadari — yang terbukti adalah alur dan antarmukanya, bukan
bahwa `create_order` menulis baris yang benar. Karena itu suite ini aman
dijalankan kapan saja, termasuk beberapa menit sebelum demo.

| Berkas | Yang dijaga |
|---|---|
| `tests/e2e/kriteria-halaman.spec.js` | Seluruh halaman wajib lomba terbuka · navbar memuat semuanya · `/login` & `/register` ada tapi **tidak** ditautkan dari sisi publik · tiga halaman admin tertutup bagi yang belum masuk |
| `tests/e2e/qr-scan.spec.js` | Popup niat mengenali nomor meja · layar hub tidak lagi menampilkan status ketersediaan · penanda `src=qr` terbawa ke `/menu` · **pemindai QR tidak disuruh memilih meja**, sedangkan yang datang dari denah tetap melihat langkah itu · QR tak terdaftar jatuh ke denah |
| `tests/e2e/validasi-form.spec.js` | Validasi sisi klien form kontak & pendaftaran, termasuk pesan galat yang hilang begitu kolomnya diperbaiki |
| `tests/e2e/helpers.js` | Nomor meja diambil dari denah saat test berjalan, bukan ditulis tetap — denah meja itu data yang bisa diganti pemilik kedai kapan saja |

Dijalankan di dua lebar layar. QR meja dipindai dari HP, jadi kerusakan layout di
lebar ponsel justru yang paling merugikan — profil `mobile` (Pixel 7) ada untuk itu.

Yang **belum** tercakup dan masih perlu diuji manual: checkout sampai struk
terbit, login staf sungguhan, CRUD produk, dan tata letak kartu meja hasil
`drawTableCard()` (dirender canvas di browser).

---

## 📦 Perintah

```bash
npm run dev      # mode pengembangan
npm run build    # build produksi
npm run start    # jalankan hasil build
npm run lint     # cek lint
npm test         # automation test E2E (Playwright)
```

### Tentang `npm run lint`

Konfigurasinya di [`.eslintrc.json`](.eslintrc.json), memperluas `eslint:recommended`
**dan** `next/core-web-vitals`. Yang pertama sengaja disertakan: `next/core-web-vitals`
sendirian tidak menyalakan **`no-undef`**, padahal justru aturan itu yang menangkap
nama yang dipakai tanpa diimpor.

Kasus nyatanya pernah terjadi — `TransactionManager` memanggil `PAYMENT_LABEL` sementara
yang diimpor `PAYMENT_LABEL_SHORT`, dan `/admin/transaksi` gagal dirender setiap kali ada
minimal satu transaksi. `next build` tidak menangkapnya: nama yang tidak ada baru meledak
saat dirender, bukan saat di-bundle. Sejak lint terpasang, kekeliruan yang sama berhenti
sebagai **error** dengan kode keluar bukan-nol.

Cakupannya `src` dan `tests` (diatur lewat `eslint.dirs` di `next.config.mjs`) — `next lint`
bawaan tidak menyentuh folder test.
