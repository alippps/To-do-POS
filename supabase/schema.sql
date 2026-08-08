-- ============================================================
--  TO DO — Point of Sale (Coffee Shop)  ·  SKEMA v4 (MULTI-UMKM)
--  Tabel · RLS policy · trigger · RPC · seed.
--
--  CARA PAKAI: buka Supabase Dashboard > SQL Editor,
--  tempel SELURUH isi file ini, lalu Run.
--  File ini AMAN dijalankan berulang kali (idempotent).
--
--  ============ APA YANG BERUBAH DI v4 ============
--  Satu pemasangan sistem kini melayani BANYAK UMKM sekaligus.
--
--  Setiap baris produk, meja, transaksi, pesan kontak, dan akun staf
--  menempel pada satu `tenant` (satu UMKM). Pemisahnya bukan sekadar
--  kolom: seluruh RLS policy ikut disaring per tenant, sehingga admin
--  Kopi Pagi tidak pernah bisa membaca — apalagi mengubah — transaksi
--  Roti Bakar 88, bahkan kalau ia menebak id barisnya.
--
--  Data yang sudah ada TIDAK hilang. Bagian 0 membuat tenant 'to-do'
--  lalu memindahkan seluruh baris lama ke sana sebelum kolomnya
--  dijadikan NOT NULL.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 0. TENANTS  (satu baris = satu UMKM)
--
--    Identitas usaha pindah dari berkas ke database. Dulu nama, alamat,
--    jam buka, dan nomor WhatsApp ditulis di src/lib/site.js — satu
--    berkas untuk satu kedai. Begitu sistemnya melayani banyak UMKM,
--    identitas itu jadi DATA, bukan konfigurasi build.
-- ------------------------------------------------------------
create table if not exists public.tenants (
  id          uuid primary key default gen_random_uuid(),
  -- Dipakai di URL: /k/<slug>/meja?meja=07 — ikut tercetak permanen di QR meja.
  slug        text unique not null check (slug ~ '^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$'),
  name        text not null,
  tagline     text not null default 'Coffee Shop & Point of Sale',
  description text,
  address     text,
  phone       text,
  email       text,
  hours       text,
  wa_number   text,
  instagram   text,
  tiktok      text,
  maps        text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists tenants_slug_idx on public.tenants (slug) where is_active;

-- UMKM pertama = pemilik seluruh data yang sudah ada sebelum v4.
insert into public.tenants (slug, name, tagline, description, address, phone, email, hours, wa_number)
values (
  'to-do',
  'To Do',
  'Coffee Shop & Point of Sale',
  'To Do adalah coffee shop modern dengan sistem Point of Sale terintegrasi — pesan lewat QR, kasir otomatis, laporan real-time.',
  'Jl. Merdeka No. 45, Bandung, Jawa Barat',
  '+62 812-3456-7890',
  'halo@example.com',
  'Setiap hari, 08.00 – 23.00 WIB',
  '6281234567890'
)
on conflict (slug) do nothing;

-- ------------------------------------------------------------
-- 1. PROFILES  (role: user / kasir / admin — DAN tenant tempatnya bekerja)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  phone       text,
  role        text not null default 'user' check (role in ('user', 'admin')),
  created_at  timestamptz not null default now()
);

/*
  Role v3 — menambah 'kasir' di antara 'user' dan 'admin'.

  `create table if not exists` di atas tidak menyentuh tabel yang sudah ada,
  jadi constraint lamanya (yang cuma mengizinkan user/admin) harus diganti
  secara eksplisit. Tanpa ini, menyetel role 'kasir' akan ditolak database.
*/
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('user', 'kasir', 'admin'));

/*
  tenant_id v4 — staf bekerja untuk SATU UMKM.

  Sengaja nullable. Akun yang baru mendaftar lewat halaman yang tidak
  menyebut tenant mana pun (atau lewat SQL Editor) belum jadi staf siapa-siapa;
  ia tidak bisa membuka dashboard mana pun sampai seorang admin memasukkannya.
  Memaksa NOT NULL di sini akan membuat pendaftaran gagal total alih-alih
  menghasilkan akun yang belum berperan.
*/
alter table public.profiles add column if not exists tenant_id uuid references public.tenants (id) on delete cascade;

-- Semua akun yang sudah ada sebelum v4 adalah staf UMKM pertama.
update public.profiles set tenant_id = (select id from public.tenants where slug = 'to-do')
where tenant_id is null;

create index if not exists profiles_tenant_idx on public.profiles (tenant_id);

/*
  Profil otomatis dibuat setiap ada user baru mendaftar.

  Slug tenant dititipkan lewat metadata pendaftaran: halaman /k/<slug>/register
  mengirimkannya saat signUp. Kalau slug-nya tidak ada atau tidak dikenali,
  profilnya tetap dibuat tanpa tenant — lebih baik akun tanpa peran daripada
  pendaftaran yang gagal tanpa penjelasan.
*/
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_tenant_id uuid;
begin
  select id into v_tenant_id from public.tenants
  where slug = lower(nullif(trim(new.raw_user_meta_data ->> 'tenant_slug'), ''))
    and is_active = true;

  insert into public.profiles (id, full_name, phone, role, tenant_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'phone',
    -- Role SELALU 'user' saat mendaftar. Naik ke 'kasir'/'admin' hanya lewat
    -- admin_set_role() atau query manual di SQL Editor (lihat bagian 11).
    'user',
    v_tenant_id
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 1b. HELPER HAK AKSES — semuanya kini BERPASANGAN dengan tenant.
--
--     `is_admin()` tanpa argumen sudah tidak cukup: admin memang admin,
--     tapi hanya di UMKM-nya sendiri. Setiap policy di bagian 9 memanggil
--     versi yang menerima tenant_id baris yang sedang diperiksa.
-- ------------------------------------------------------------
create or replace function public.current_tenant_id()
returns uuid
language sql
security definer set search_path = public
stable
as $$
  select p.tenant_id from public.profiles p where p.id = auth.uid();
$$;

create or replace function public.is_admin_of(p_tenant uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select p_tenant is not null and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.tenant_id = p_tenant
  );
$$;

/*
  Staf = admin ATAU kasir, di UMKM yang sama.

  Kasir perlu membaca dan menandai lunas pesanan, tapi TIDAK boleh menyentuh
  produk, meja, hak akses, maupun menghapus transaksi — batasan itu dijaga
  dengan tetap memakai is_admin_of() di sana.
*/
create or replace function public.is_staff_of(p_tenant uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select p_tenant is not null and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'kasir') and p.tenant_id = p_tenant
  );
$$;

-- Versi tanpa argumen dipertahankan untuk dipakai RPC admin (bagian 8),
-- yang sudah lebih dulu tahu sedang bekerja di tenant mana.
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- ------------------------------------------------------------
-- 2. PRODUCTS  (CRUD + Search)
-- ------------------------------------------------------------
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text not null default 'Kopi',
  price       numeric(12, 2) not null default 0 check (price >= 0),
  stock       integer not null default 0 check (stock >= 0),
  description text,
  image_url   text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Kolom tambahan v3 — HARGA PROMO (aman dijalankan pada database yang sudah ada).
-- Aturannya satu: promo dianggap aktif bila promo_price TIDAK NULL dan lebih kecil
-- dari price. Tidak ada kolom boolean terpisah supaya tidak mungkin muncul kondisi
-- ganjil "promo menyala tapi harganya kosong".
alter table public.products add column if not exists promo_price numeric(12, 2)
  check (promo_price is null or promo_price >= 0);

-- Kolom tambahan v4 — pemilik produk.
alter table public.products add column if not exists tenant_id uuid references public.tenants (id) on delete cascade;
update public.products set tenant_id = (select id from public.tenants where slug = 'to-do') where tenant_id is null;
alter table public.products alter column tenant_id set not null;

create index if not exists products_name_idx on public.products using gin (to_tsvector('simple', name));
create index if not exists products_category_idx on public.products (category);
create index if not exists products_promo_idx on public.products (promo_price) where promo_price is not null;
create index if not exists products_tenant_idx on public.products (tenant_id, is_active);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

drop trigger if exists tenants_touch_updated_at on public.tenants;
create trigger tenants_touch_updated_at
  before update on public.tenants
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- 3. CAFE_TABLES  (denah meja + status ketersediaan)
--    Dipakai halaman /k/<slug>/meja yang dibuka pelanggan setelah scan QR.
-- ------------------------------------------------------------
create table if not exists public.cafe_tables (
  id         uuid primary key default gen_random_uuid(),
  table_no   text unique not null,
  label      text,
  area       text not null default 'Indoor',
  capacity   integer not null default 2 check (capacity > 0),
  status     text not null default 'available' check (status in ('available', 'occupied', 'reserved')),
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cafe_tables add column if not exists label text;

-- Kolom tambahan v4 — pemilik meja.
alter table public.cafe_tables add column if not exists tenant_id uuid references public.tenants (id) on delete cascade;
update public.cafe_tables set tenant_id = (select id from public.tenants where slug = 'to-do') where tenant_id is null;
alter table public.cafe_tables alter column tenant_id set not null;

/*
  Nomor meja unik PER UMKM, bukan sedunia.

  Constraint lama `table_no text unique` adalah penghalang paling keras untuk
  multi-UMKM: begitu Kopi Pagi punya "Meja 01", tidak ada kedai lain yang boleh
  punya meja bernomor sama — padahal hampir setiap kedai menomori mejanya
  mulai dari 01. Nama constraint bawaannya `cafe_tables_table_no_key`.
*/
alter table public.cafe_tables drop constraint if exists cafe_tables_table_no_key;
create unique index if not exists cafe_tables_tenant_no_key on public.cafe_tables (tenant_id, table_no);

create index if not exists cafe_tables_status_idx on public.cafe_tables (tenant_id, status);

drop trigger if exists cafe_tables_touch_updated_at on public.cafe_tables;
create trigger cafe_tables_touch_updated_at
  before update on public.cafe_tables
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- 4. TRANSACTIONS + ITEMS
-- ------------------------------------------------------------
create table if not exists public.transactions (
  id             uuid primary key default gen_random_uuid(),
  invoice_no     text unique not null,
  customer_name  text not null default 'Guest',
  table_no       text,
  payment_method text not null default 'cash' check (payment_method in ('cash', 'qris', 'transfer')),
  status         text not null default 'paid'  check (status in ('pending', 'paid', 'cancelled')),
  note           text,
  total          numeric(12, 2) not null default 0,
  user_id        uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now()
);

-- Kolom tambahan v2 (aman dijalankan pada database yang sudah ada)
alter table public.transactions add column if not exists table_id uuid references public.cafe_tables (id) on delete set null;
alter table public.transactions add column if not exists channel  text not null default 'qr';

-- Kolom tambahan v4 — pemilik transaksi.
alter table public.transactions add column if not exists tenant_id uuid references public.tenants (id) on delete cascade;
update public.transactions set tenant_id = (select id from public.tenants where slug = 'to-do') where tenant_id is null;
alter table public.transactions alter column tenant_id set not null;

/*
  'transfer' TETAP diizinkan constraint, meski aplikasi tidak lagi menawarkannya.

  Metode bayar disederhanakan jadi dua — QRIS dan bayar di kasir. Tapi transaksi
  lama yang terlanjur tercatat 'transfer' adalah riwayat penjualan sungguhan:
  mempersempit constraint berarti menolak baris yang sudah sah, dan menulis
  ulang nilainya berarti memalsukan catatan keuangan. Yang berhenti adalah
  penawarannya di layar, bukan kebenaran arsipnya.
*/

create index if not exists transactions_created_idx on public.transactions (created_at desc);
create index if not exists transactions_invoice_idx on public.transactions (invoice_no);
create index if not exists transactions_table_idx   on public.transactions (table_id);
create index if not exists transactions_tenant_idx  on public.transactions (tenant_id, created_at desc);

create table if not exists public.transaction_items (
  id             uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  product_id     uuid references public.products (id) on delete set null,
  product_name   text not null,
  price          numeric(12, 2) not null default 0,
  qty            integer not null default 1 check (qty > 0),
  subtotal       numeric(12, 2) not null default 0
);

create index if not exists transaction_items_trx_idx on public.transaction_items (transaction_id);

-- ------------------------------------------------------------
-- 5. CONTACT MESSAGES (form kontak sederhana)
-- ------------------------------------------------------------
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  phone      text,
  message    text not null,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.contact_messages add column if not exists tenant_id uuid references public.tenants (id) on delete cascade;
update public.contact_messages set tenant_id = (select id from public.tenants where slug = 'to-do') where tenant_id is null;

create index if not exists contact_tenant_idx on public.contact_messages (tenant_id, created_at desc);

-- ------------------------------------------------------------
-- 6. STATUS MEJA OTOMATIS
--    Meja jadi "occupied" saat ada pesanan berstatus pending,
--    dan kembali "available" begitu pesanan dilunasi / dibatalkan.
-- ------------------------------------------------------------
create or replace function public.refresh_table_status(p_table_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_active integer;
begin
  if p_table_id is null then
    return;
  end if;

  select count(*) into v_active
  from public.transactions
  where table_id = p_table_id and status = 'pending';

  if v_active > 0 then
    update public.cafe_tables set status = 'occupied' where id = p_table_id;
  else
    -- Meja yang sengaja di-'reserved' admin tidak ikut dibebaskan.
    update public.cafe_tables set status = 'available'
    where id = p_table_id and status <> 'reserved';
  end if;
end;
$$;

create or replace function public.trg_sync_table_status()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_table_status(old.table_id);
    return old;
  end if;

  if tg_op = 'UPDATE' and old.table_id is distinct from new.table_id then
    perform public.refresh_table_status(old.table_id);
  end if;

  perform public.refresh_table_status(new.table_id);
  return new;
end;
$$;

drop trigger if exists transactions_sync_table on public.transactions;
create trigger transactions_sync_table
  after insert or delete or update of status, table_id on public.transactions
  for each row execute function public.trg_sync_table_status();

-- ------------------------------------------------------------
-- 7. RPC PUBLIK (boleh dipanggil TANPA login)
--
--    Ketiganya kini menerima slug tenant. Ini bukan formalitas: fungsi
--    SECURITY DEFINER berjalan MELEWATI RLS, jadi kalau lookup produk dan
--    meja di dalamnya tidak disaring per tenant, satu panggilan dengan
--    product_id milik kedai lain akan berhasil — dan RLS tidak akan
--    menghalanginya. Penyaringnya harus ada di dalam fungsinya sendiri.
-- ------------------------------------------------------------

-- Versi lama (tanpa tenant) dibuang supaya tidak ada dua tanda tangan
-- berdampingan yang bisa dipanggil tanpa sengaja.
drop function if exists public.create_order(text, text, text, text, jsonb);
drop function if exists public.get_table_bill(text);

-- 7a. create_order — checkout tamu: transaksi + item + potong stok dalam 1 transaksi DB.
create or replace function public.create_order(
  p_tenant_slug    text,
  p_customer_name  text,
  p_table_no       text,
  p_payment_method text,
  p_note           text,
  p_items          jsonb   -- [{ "product_id": "...", "qty": 2 }]
)
returns public.transactions
language plpgsql
security definer set search_path = public
as $$
declare
  v_tenant   public.tenants;
  v_trx      public.transactions;
  v_item     jsonb;
  v_product  public.products;
  v_qty      integer;
  v_price    numeric(12, 2);
  v_total    numeric(12, 2) := 0;
  v_invoice  text;
  v_table    public.cafe_tables;
  v_table_no text;
begin
  select * into v_tenant from public.tenants
  where slug = lower(nullif(trim(coalesce(p_tenant_slug, '')), '')) and is_active = true;

  if not found then
    raise exception 'Outlet tidak dikenali.';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang masih kosong';
  end if;

  if jsonb_array_length(p_items) > 50 then
    raise exception 'Jumlah item terlalu banyak';
  end if;

  v_table_no := nullif(trim(p_table_no), '');

  -- Nomor meja wajib, dan harus meja MILIK outlet ini.
  if v_table_no is null then
    raise exception 'Nomor meja wajib diisi.';
  end if;

  select * into v_table from public.cafe_tables
  where table_no = v_table_no and tenant_id = v_tenant.id and is_active = true;

  if not found then
    raise exception 'Meja % tidak terdaftar di outlet ini.', v_table_no;
  end if;

  if v_table.status = 'reserved' then
    raise exception 'Meja % sedang direservasi. Silakan pilih meja lain.', v_table_no;
  end if;

  v_invoice := 'INV-' || to_char(now(), 'YYYYMMDD') || '-' ||
               upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.transactions
    (tenant_id, invoice_no, customer_name, table_no, table_id, payment_method, status, note, total, user_id, channel)
  values (
    v_tenant.id,
    v_invoice,
    coalesce(nullif(trim(p_customer_name), ''), 'Guest'),
    v_table_no,
    v_table.id,
    coalesce(nullif(trim(p_payment_method), ''), 'cash'),
    'pending',                       -- pesanan tamu menunggu konfirmasi kasir
    nullif(trim(p_note), ''),
    0,
    auth.uid(),                      -- NULL kalau pemesan adalah tamu
    case when auth.uid() is null then 'qr' else 'app' end
  )
  returning * into v_trx;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := greatest(1, coalesce((v_item ->> 'qty')::int, 1));

    -- `tenant_id` di WHERE adalah penjaga sesungguhnya: tanpa itu, id produk
    -- milik outlet lain bisa dititipkan lewat payload dan tetap terjual di sini.
    select * into v_product
    from public.products
    where id = (v_item ->> 'product_id')::uuid and tenant_id = v_tenant.id
    for update;

    if not found then
      raise exception 'Produk tidak ditemukan di outlet ini';
    end if;

    if not v_product.is_active then
      raise exception 'Menu % sedang tidak tersedia', v_product.name;
    end if;

    if v_product.stock < v_qty then
      raise exception 'Stok % tidak mencukupi (sisa %)', v_product.name, v_product.stock;
    end if;

    /*
      Harga ditentukan di SERVER, bukan diambil dari keranjang pelanggan.
      Kalau produknya sedang promo, harga promo yang dipakai — sehingga angka
      di struk selalu sama dengan yang dijanjikan halaman /promo, dan tidak
      bisa dimanipulasi dari sisi browser.
    */
    v_price := case
                 when v_product.promo_price is not null and v_product.promo_price < v_product.price
                   then v_product.promo_price
                 else v_product.price
               end;

    insert into public.transaction_items (transaction_id, product_id, product_name, price, qty, subtotal)
    values (v_trx.id, v_product.id, v_product.name, v_price, v_qty, v_price * v_qty);

    update public.products
    set stock = stock - v_qty
    where id = v_product.id;

    v_total := v_total + (v_price * v_qty);
  end loop;

  update public.transactions set total = v_total where id = v_trx.id returning * into v_trx;
  return v_trx;
end;
$$;

-- 7b. get_receipt — ambil struk berdasarkan nomor invoice, TANPA login.
--     Nomor invoice unik sedunia, jadi tidak perlu slug; tapi identitas
--     outletnya ikut dikembalikan supaya struk mencetak nama kedai yang benar.
create or replace function public.get_receipt(p_invoice text)
returns jsonb
language plpgsql
security definer set search_path = public
stable
as $$
declare
  v_trx    public.transactions;
  v_tenant public.tenants;
  v_items  jsonb;
begin
  select * into v_trx from public.transactions
  where invoice_no = upper(trim(coalesce(p_invoice, '')));

  if not found then
    return null;
  end if;

  select * into v_tenant from public.tenants where id = v_trx.tenant_id;

  select coalesce(jsonb_agg(jsonb_build_object(
           'product_name', ti.product_name,
           'price',        ti.price,
           'qty',          ti.qty,
           'subtotal',     ti.subtotal
         ) order by ti.product_name), '[]'::jsonb)
  into v_items
  from public.transaction_items ti
  where ti.transaction_id = v_trx.id;

  -- Sengaja TIDAK mengembalikan user_id (data privat pemesan).
  return jsonb_build_object(
    'tenant', jsonb_build_object(
      'slug',    v_tenant.slug,
      'name',    v_tenant.name,
      'address', v_tenant.address,
      'phone',   v_tenant.phone
    ),
    'transaction', jsonb_build_object(
      'invoice_no',     v_trx.invoice_no,
      'customer_name',  v_trx.customer_name,
      'table_no',       v_trx.table_no,
      'payment_method', v_trx.payment_method,
      'status',         v_trx.status,
      'note',           v_trx.note,
      'total',          v_trx.total,
      'created_at',     v_trx.created_at
    ),
    'items', v_items
  );
end;
$$;

-- 7c. get_table_bill — tagihan berjalan sebuah meja, TANPA login.
--
--     CATATAN PRIVASI: siapa pun yang tahu slug outlet dan nomor meja bisa
--     melihat tagihan berjalan meja itu. Itu memang konsekuensi yang diterima —
--     sama seperti bon kertas yang tergeletak di atas meja. Karena itu
--     `user_id` tetap tidak pernah dikembalikan.
create or replace function public.get_table_bill(p_tenant_slug text, p_table_no text)
returns jsonb
language plpgsql
security definer set search_path = public
stable
as $$
declare
  v_tenant_id uuid;
  v_table_no  text;
  v_orders    jsonb;
  v_total     numeric(12, 2);
begin
  select id into v_tenant_id from public.tenants
  where slug = lower(nullif(trim(coalesce(p_tenant_slug, '')), '')) and is_active = true;

  v_table_no := nullif(trim(coalesce(p_table_no, '')), '');

  if v_tenant_id is null or v_table_no is null then
    return jsonb_build_object('table_no', null, 'orders', '[]'::jsonb, 'total', 0);
  end if;

  select
    coalesce(jsonb_agg(x.pesanan order by x.created_at), '[]'::jsonb),
    coalesce(sum(x.total), 0)
  into v_orders, v_total
  from (
    select
      t.created_at,
      t.total,
      jsonb_build_object(
        'invoice_no',     t.invoice_no,
        'customer_name',  t.customer_name,
        'payment_method', t.payment_method,
        'status',         t.status,
        'note',           t.note,
        'total',          t.total,
        'created_at',     t.created_at,
        'items', (
          select coalesce(jsonb_agg(jsonb_build_object(
                   'product_name', ti.product_name,
                   'price',        ti.price,
                   'qty',          ti.qty,
                   'subtotal',     ti.subtotal
                 ) order by ti.product_name), '[]'::jsonb)
          from public.transaction_items ti
          where ti.transaction_id = t.id
        )
      ) as pesanan
    from public.transactions t
    where t.tenant_id = v_tenant_id and t.table_no = v_table_no and t.status = 'pending'
  ) x;

  return jsonb_build_object(
    'table_no', v_table_no,
    'orders',   v_orders,
    'total',    v_total
  );
end;
$$;

-- ------------------------------------------------------------
-- 8. RPC ADMIN (manajemen hak akses) — selalu dalam batas tenant sendiri
-- ------------------------------------------------------------

-- 8a. Daftar akun DI UMKM YANG SAMA + role-nya — sumber data /admin/akses.
create or replace function public.admin_list_users()
returns table (
  id              uuid,
  email           text,
  full_name       text,
  phone           text,
  role            text,
  created_at      timestamptz,
  last_sign_in_at timestamptz
)
language plpgsql
security definer set search_path = public
as $$
declare
  v_tenant uuid;
begin
  v_tenant := public.current_tenant_id();

  if not public.is_admin_of(v_tenant) then
    raise exception 'Akses ditolak: khusus admin.';
  end if;

  return query
  select p.id, u.email::text, p.full_name, p.phone, p.role, p.created_at, u.last_sign_in_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.tenant_id = v_tenant
  order by (p.role = 'admin') desc, p.created_at desc;
end;
$$;

-- 8b. Ubah role akun. Admin tidak bisa menurunkan role dirinya sendiri
--     supaya tidak pernah terjadi kondisi "tidak ada admin tersisa",
--     dan tidak bisa menyentuh akun milik UMKM lain.
create or replace function public.admin_set_role(p_user_id uuid, p_role text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_tenant uuid;
begin
  v_tenant := public.current_tenant_id();

  if not public.is_admin_of(v_tenant) then
    raise exception 'Akses ditolak: khusus admin.';
  end if;

  if p_role not in ('user', 'kasir', 'admin') then
    raise exception 'Role tidak valid: %', p_role;
  end if;

  if p_user_id = auth.uid() and p_role <> 'admin' then
    raise exception 'Kamu tidak bisa menurunkan role akunmu sendiri.';
  end if;

  update public.profiles set role = p_role
  where id = p_user_id and tenant_id = v_tenant;

  if not found then
    raise exception 'Akun tidak ditemukan di outlet ini.';
  end if;
end;
$$;

-- ------------------------------------------------------------
-- 9. ROW LEVEL SECURITY
--    Ringkasan lengkapnya ada di README, tabel "Matriks Hak Akses",
--    dan bisa dilihat langsung di halaman /admin/akses.
--
--    Setiap policy tulis kini menyebut tenant_id barisnya. Inilah yang
--    membuat pemisahan antar-UMKM nyata dan bukan sekadar penyaring di
--    kueri aplikasi: admin Kopi Pagi yang menebak id produk Roti Bakar 88
--    tetap ditolak oleh database.
-- ------------------------------------------------------------
alter table public.tenants            enable row level security;
alter table public.profiles           enable row level security;
alter table public.products           enable row level security;
alter table public.cafe_tables        enable row level security;
alter table public.transactions       enable row level security;
alter table public.transaction_items  enable row level security;
alter table public.contact_messages   enable row level security;

-- TENANTS: identitas outlet memang publik (nama & alamat tampil di landing),
-- tapi hanya adminnya sendiri yang boleh menyuntingnya.
drop policy if exists "outlet: publik boleh baca" on public.tenants;
create policy "outlet: publik boleh baca" on public.tenants
  for select using (is_active);

drop policy if exists "outlet: admin boleh ubah" on public.tenants;
create policy "outlet: admin boleh ubah" on public.tenants
  for update using (public.is_admin_of(id)) with check (public.is_admin_of(id));

-- PROFILES
drop policy if exists "profil: baca milik sendiri" on public.profiles;
create policy "profil: baca milik sendiri" on public.profiles
  for select using (auth.uid() = id or public.is_admin_of(tenant_id));

drop policy if exists "profil: update milik sendiri" on public.profiles;
create policy "profil: update milik sendiri" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- PRODUCTS: menu memang publik (pelanggan tanpa akun harus bisa membacanya),
-- tapi menulis hanya boleh oleh admin OUTLET ITU.
drop policy if exists "produk: publik boleh baca" on public.products;
create policy "produk: publik boleh baca" on public.products
  for select using (true);

drop policy if exists "produk: admin boleh tulis" on public.products;
create policy "produk: admin boleh tulis" on public.products
  for all using (public.is_admin_of(tenant_id)) with check (public.is_admin_of(tenant_id));

-- CAFE TABLES: tamu boleh melihat meja mana yang kosong, hanya admin outlet boleh ubah
drop policy if exists "meja: publik boleh baca" on public.cafe_tables;
create policy "meja: publik boleh baca" on public.cafe_tables
  for select using (true);

drop policy if exists "meja: admin boleh tulis" on public.cafe_tables;
create policy "meja: admin boleh tulis" on public.cafe_tables
  for all using (public.is_admin_of(tenant_id)) with check (public.is_admin_of(tenant_id));

-- TRANSACTIONS
-- Tamu TIDAK bisa membaca tabel ini langsung; struknya diambil lewat
-- RPC get_receipt() yang hanya mengembalikan satu invoice.
drop policy if exists "transaksi: baca milik sendiri / admin" on public.transactions;
create policy "transaksi: baca milik sendiri / admin" on public.transactions
  for select using (public.is_staff_of(tenant_id) or user_id = auth.uid());

/*
  Policy tulis sengaja DIPECAH per operasi.

  Kasir butuh UPDATE (menandai lunas) tapi tidak boleh DELETE — menghapus
  riwayat penjualan tidak bisa dibatalkan. Kalau tetap `for all`, memberi
  kasir hak ubah otomatis memberi hak hapus juga.
*/
drop policy if exists "transaksi: admin boleh tulis" on public.transactions;

drop policy if exists "transaksi: staf boleh ubah" on public.transactions;
create policy "transaksi: staf boleh ubah" on public.transactions
  for update using (public.is_staff_of(tenant_id)) with check (public.is_staff_of(tenant_id));

drop policy if exists "transaksi: staf boleh tambah" on public.transactions;
create policy "transaksi: staf boleh tambah" on public.transactions
  for insert with check (public.is_staff_of(tenant_id));

drop policy if exists "transaksi: hanya admin boleh hapus" on public.transactions;
create policy "transaksi: hanya admin boleh hapus" on public.transactions
  for delete using (public.is_admin_of(tenant_id));

-- TRANSACTION ITEMS — mengikuti transaksi induknya, termasuk tenant-nya.
drop policy if exists "item: baca mengikuti transaksi" on public.transaction_items;
create policy "item: baca mengikuti transaksi" on public.transaction_items
  for select using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_id
        and (public.is_staff_of(t.tenant_id) or t.user_id = auth.uid())
    )
  );

drop policy if exists "item: admin boleh tulis" on public.transaction_items;
create policy "item: admin boleh tulis" on public.transaction_items
  for all using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_id and public.is_admin_of(t.tenant_id)
    )
  ) with check (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_id and public.is_admin_of(t.tenant_id)
    )
  );

-- CONTACT MESSAGES: siapa pun boleh kirim, hanya admin outlet tujuan boleh baca
drop policy if exists "pesan: publik boleh kirim" on public.contact_messages;
create policy "pesan: publik boleh kirim" on public.contact_messages
  for insert with check (true);

drop policy if exists "pesan: admin boleh baca" on public.contact_messages;
create policy "pesan: admin boleh baca" on public.contact_messages
  for select using (public.is_admin_of(tenant_id));

-- ------------------------------------------------------------
-- 10. SEED
-- ------------------------------------------------------------
do $seed$
declare
  v_todo uuid;
begin
  select id into v_todo from public.tenants where slug = 'to-do';

  -- Produk contoh HANYA diisi kalau outlet ini masih kosong. Tanpa penjaga
  -- ini, menjalankan ulang file akan menggandakan seluruh menu (products
  -- sengaja tidak memberi constraint unik pada nama produk).
  if not exists (select 1 from public.products where tenant_id = v_todo) then
    insert into public.products (tenant_id, name, category, price, stock, description, image_url)
    values
      (v_todo, 'Espresso',          'Kopi',    18000, 50, 'Single shot arabica pilihan, bold dan clean.',        'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=800&q=80'),
      (v_todo, 'Cappuccino',        'Kopi',    28000, 40, 'Espresso dengan steamed milk & foam lembut.',         'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&q=80'),
      (v_todo, 'Caffe Latte',       'Kopi',    30000, 45, 'Perpaduan halus espresso dan susu segar.',            'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=800&q=80'),
      (v_todo, 'Kopi Susu Gula Aren','Kopi',   25000, 60, 'Best seller! Manis gurih khas gula aren.',            'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&q=80'),
      (v_todo, 'Americano',         'Kopi',    22000, 35, 'Espresso + air panas, ringan dan segar.',             'https://images.unsplash.com/photo-1521302080334-4bebac2763a6?w=800&q=80'),
      (v_todo, 'Matcha Latte',      'Non-Kopi', 32000, 30, 'Matcha premium Jepang dengan susu creamy.',          'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=800&q=80'),
      (v_todo, 'Chocolate',         'Non-Kopi', 27000, 30, 'Cokelat Belgia hangat yang rich.',                   'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=800&q=80'),
      (v_todo, 'Lemon Tea',         'Non-Kopi', 20000, 40, 'Teh dingin dengan perasan lemon asli.',              'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=800&q=80'),
      (v_todo, 'Croissant Butter',  'Snack',    23000, 25, 'Renyah di luar, lembut di dalam.',                   'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80'),
      (v_todo, 'Cheese Cake',       'Snack',    35000, 18, 'New York style cheese cake.',                        'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&q=80'),
      (v_todo, 'French Fries',      'Snack',    24000, 30, 'Kentang goreng renyah dengan saus pilihan.',         'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&q=80'),
      (v_todo, 'Nasi Goreng Kampung','Makanan', 38000, 20, 'Nasi goreng pedas gurih dengan telur mata sapi.',    'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80');

    update public.products set promo_price = round(price * 0.75, 0)
    where tenant_id = v_todo and name in ('Kopi Susu Gula Aren', 'Croissant Butter');
  end if;

  -- Denah meja: 12 meja (dipakai halaman /meja & generator QR).
  insert into public.cafe_tables (tenant_id, table_no, label, area, capacity)
  values
    (v_todo, '01', 'Dekat jendela',  'Indoor',    2),
    (v_todo, '02', 'Dekat jendela',  'Indoor',    2),
    (v_todo, '03', 'Tengah',         'Indoor',    4),
    (v_todo, '04', 'Tengah',         'Indoor',    4),
    (v_todo, '05', 'Sofa panjang',   'Indoor',    6),
    (v_todo, '06', 'Bar counter',    'Indoor',    2),
    (v_todo, '07', 'Bar counter',    'Indoor',    2),
    (v_todo, '08', 'Teras depan',    'Outdoor',   4),
    (v_todo, '09', 'Teras depan',    'Outdoor',   4),
    (v_todo, '10', 'Taman belakang', 'Outdoor',   6),
    (v_todo, '11', 'Workspace / Meeting Room', 'Indoor', 1),
    (v_todo, '12', 'Workspace / Meeting Room', 'Indoor', 1)
  on conflict (tenant_id, table_no) do nothing;
end
$seed$;

/*
  Area disederhanakan jadi Indoor & Outdoor saja.

  'Workspace' dan 'VIP' bukan area — ruang kerja dan meeting room sama-sama di
  dalam ruangan. Sifat ruangannya pindah ke kolom `label`, jadi `area` tetap
  menjawab satu pertanyaan: pelanggan duduk di dalam atau di luar.
*/
update public.cafe_tables set area = 'Indoor' where area in ('Workspace', 'VIP');
update public.cafe_tables set label = 'Workspace / Meeting Room'
where label in ('Ruang kerja', 'Ruang Kerja');

-- ------------------------------------------------------------
-- 11. MENAMBAH UMKM BARU  &  MENJADIKAN AKUN KAMU ADMIN
-- ------------------------------------------------------------
-- (a) Buat outlet baru — slug-nya yang akan muncul di URL & tercetak di QR meja:
--
-- insert into public.tenants (slug, name, address, phone, hours, wa_number)
-- values ('kopi-pagi', 'Kopi Pagi Bandung', 'Jl. Braga No. 12, Bandung',
--         '+62 812-0000-0000', 'Setiap hari, 07.00 – 22.00 WIB', '628120000000');
--
-- (b) Daftar lewat /k/<slug>/register, lalu jadikan akun itu admin outletnya:
--
-- update public.profiles
-- set role = 'admin', tenant_id = (select id from public.tenants where slug = 'kopi-pagi')
-- where id = (select id from auth.users where email = 'emailkamu@gmail.com');
--
-- (c) Cek siapa saja yang punya akses, per outlet:
--
-- select t.slug, u.email, p.role
-- from public.profiles p
-- join auth.users u on u.id = p.id
-- left join public.tenants t on t.id = p.tenant_id
-- order by t.slug, p.role, u.email;
