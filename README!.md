# To Do POS — Sistem Point of Sale Multi-UMKM

> **Pesan dari meja, tanpa antre, tanpa login.** Scan QR di meja → menu terbuka → pesan → struk terbit. Satu pemasangan melayani banyak UMKM sekaligus, masing-masing terisolasi sampai level database.

<!-- ═══════════════════════════════════════════════════════
     BAGIAN 1 — UNTUK JURI (baca 2 menit, langsung bisa coba)
     ═══════════════════════════════════════════════════════ -->

## 🚀 Coba Sekarang (Tanpa Setup)

| | |
|---|---|
| 🌐 **Live Demo** | https://todo-pos.vercel.app *(ganti dengan URL asli)* |
| 📱 **Scan QR Meja 07** | Buka https://todo-pos.vercel.app/k/to-do/meja?meja=07 dari HP — ini persis yang dialami pelanggan |
| 🔑 **Akun Admin** | `admin-demo@todopos.web.id` / `DemoAdmin123` → mendarat di Dashboard |
| 💵 **Akun Kasir** | `kasir-demo@todopos.web.id` / `DemoKasir123` → mendarat di layar Kasir |
| 🏪 **Outlet kedua** | https://todo-pos.vercel.app/k/roti-88 — buktikan datanya terpisah total dari outlet pertama |

**Alur uji 3 menit yang kami sarankan:**
1. Buka link **Scan QR Meja 07** dari HP → pesan 2 item → struk digital terbit.
2. Login sebagai **kasir** → pesanan tadi muncul di Daftar Transaksi → tandai **Lunas** → meja otomatis kosong lagi.
3. Login sebagai **admin** → tambah produk baru di Daftar Produk → produk langsung tampil di menu pelanggan.
4. Buka outlet **Roti Bakar 88** → menu, meja, dan transaksinya beda sendiri — admin To Do tidak bisa menyentuh data outlet ini, bahkan lewat API langsung.

## 📸 Tampilan

<!-- 4–6 screenshot, 2 kolom. WAJIB ADA sebelum submit. Urutan yang disarankan: -->

| Pelanggan | Admin |
|---|---|
| ![Scan QR → hub meja](docs/screenshots/scan-qr.png) | ![Dashboard](docs/screenshots/dashboard.png) |
| ![Pilih menu & keranjang](docs/screenshots/menu.png) | ![Daftar Produk (CRUDS)](docs/screenshots/produk.png) |
| ![Struk digital](docs/screenshots/struk.png) | ![Generator QR meja](docs/screenshots/qr-meja.png) |

<!-- Bonus kuat: 1 GIF alur scan QR → checkout → struk (pakai ScreenToGif / Kap, max 10 detik) -->

## ✅ Checklist Ketentuan Lomba

| Ketentuan | Status | Bukti tercepat |
|---|---|---|
| Tema UMKM & transformasi digital | ✅ | Seluruh sistem: digitalisasi pemesanan, produk, transaksi UMKM kuliner |
| **C**reate / **R**ead / **U**pdate / **D**elete / **S**earch | ✅ | `/admin/produk` — satu halaman memuat kelimanya |
| Login & Register | ✅ | `/k/to-do/login` (tautan **Masuk Staf** di footer) · `/k/to-do/register` |
| User: Home, Fitur Utama (jual beli), Kontak + form, About | ✅ | `/k/to-do` · `/k/to-do/menu` · `/k/to-do/kontak` · `/k/to-do/about` |
| Admin: Dashboard, Daftar Produk, Daftar Transaksi | ✅ | `/k/to-do/admin` · `/admin/produk` · `/admin/transaksi` |
| Stack dicantumkan di dokumentasi | ✅ | Bagian [Tech Stack](#-tech-stack) |
| Validasi input | ✅ | Ganda: client (UX) + Server Action (keamanan) — lihat `createOrder()` |
| Keamanan dasar | ✅ | 4 lapis: middleware → layout → server action → Row Level Security |

> **Catatan Register:** halaman `/register` sengaja tidak ditautkan di navbar publik — pelanggan memesan **tanpa akun**, jadi ajakan mendaftar hanya membingungkan mereka. Pintunya tetap ada di halaman Login ("Belum punya akun? Daftar") dan penambahan staf resmi lewat `/admin/akses`.

## 💡 Nilai Inovasi (di luar ketentuan wajib)

1. **Multi-UMKM dalam satu pemasangan** — setiap outlet punya URL, menu, denah meja, dan admin sendiri. Isolasinya bukan filter di aplikasi, tapi **RLS policy per outlet di PostgreSQL**: admin outlet A tidak bisa membaca data outlet B sekalipun memanggil API langsung.
2. **Pendaftaran UMKM mandiri** (`/daftar-outlet`) — warung baru bisa bergabung sendiri tanpa developer, tanpa SQL, tanpa deploy ulang. Ini yang membuat sistemnya benar-benar "melayani UMKM", bukan cuma satu kedai.
3. **QR ordering per meja** — nomor meja terbaca dari QR dan **terkunci** (tidak bisa diketik/diganti), menghapus sumber kesalahan paling mahal di kedai: pesanan nyasar ke meja lain.
4. **Tagihan berjalan per meja** — pesan berkali-kali dari QR yang sama, bayar sekali di akhir. Kasir tinggal menandai lunas.
5. **Automation test (Playwright E2E)** di 2 ukuran layar (desktop + Pixel 7) — termasuk satu suite yang khusus menjaga ketentuan lomba ini tetap terpenuhi: [`tests/e2e/kriteria-halaman.spec.js`](tests/e2e/kriteria-halaman.spec.js).

## 🧰 Tech Stack

| Lapisan | Teknologi |
|---|---|
| Framework | Next.js 14 (App Router) — Server Component, Server Action, middleware |
| UI | React 18 + Tailwind CSS 3.4 — **seluruh komponen ditulis sendiri**, tanpa library UI pihak ketiga |
| Database & Auth | Supabase (PostgreSQL 15 + Row Level Security + Supabase Auth) |
| QR Code | `qrcode` — generator kartu meja siap cetak (PNG) |
| Testing | Playwright E2E (Chrome desktop + Pixel 7) |
| Bahasa | JavaScript (JSX) + SQL (PL/pgSQL) |

<!-- ═══════════════════════════════════════════════════════
     BAGIAN 2 — DOKUMENTASI TEKNIS (untuk yang mau menyelam)
     Isi bagian ini = README lama lu, dipindah ke bawah.
     Juri yang penasaran akan lanjut baca; yang tidak, sudah
     dapat semua yang dia butuhkan di atas.
     ═══════════════════════════════════════════════════════ -->

---

<details>
<summary><b>📖 Dokumentasi lengkap</b> — arsitektur, keamanan, alur pemesanan, cara menjalankan lokal (klik untuk buka)</summary>

## Daftar Isi
- [Cara Menjalankan Lokal](#cara-menjalankan-lokal)
- [Arsitektur Multi-UMKM](#arsitektur-multi-umkm)
- [Alur Pemesanan (QR & Kasir)](#alur-pemesanan)
- [Matriks Hak Akses](#matriks-hak-akses)
- [Keamanan 4 Lapis](#keamanan)
- [Letak CRUDS di Kode](#di-mana-letak-cruds-nya)
- [Automation Test](#automation-test)
- [Struktur Proyek](#struktur-proyek)
- [Catatan Jujur & Batasan](#catatan-jujur)

<!-- ── Pindahkan section-section README lama ke sini, dengan urutan di atas ── -->

### Catatan Jujur
<!-- Kumpulkan semua disclaimer di SATU tempat — juri sangat menghargai ini: -->
- **QRIS-nya simulasi.** Kode QR di struk berisi teks keterangan, bukan muatan EMVCo — sengaja, supaya tidak ada yang mengira sudah membayar padahal belum. Integrasi asli tinggal mengganti fungsi `muatanQris()`.
- **E2E test read-only terhadap database** — yang terbukti adalah alur dan antarmuka; checkout sungguhan diuji manual.
- **Belum ada dashboard pemilik platform** — pesan dari `platform_messages` masih dibaca lewat SQL Editor.

</details>

---

*Dibuat untuk lomba **UMKM Goes Digital** · [Nama Tim] · 2026*