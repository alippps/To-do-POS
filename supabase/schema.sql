-- ============================================================
--  TO DO — Point of Sale (Coffee Shop)  ·  SKEMA v2
--  Tabel · RLS policy · trigger · RPC · seed.
--
--  CARA PAKAI: buka Supabase Dashboard > SQL Editor,
--  tempel SELURUH isi file ini, lalu Run.
--  File ini AMAN dijalankan berulang kali (idempotent),
--  jadi kalau kamu sudah pernah menjalankan versi lama,
--  cukup jalankan ulang file ini untuk upgrade ke v2.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. PROFILES  (menyimpan role: user / admin)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  phone       text,
  role        text not null default 'user' check (role in ('user', 'admin')),
  created_at  timestamptz not null default now()
);

-- Profil otomatis dibuat setiap ada user baru mendaftar
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'phone',
    -- Role SELALU 'user' saat mendaftar. Naik ke 'admin' hanya lewat
    -- admin_set_role() atau query manual di SQL Editor (lihat bagian 11).
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: cek apakah user yang login adalah admin (SECURITY DEFINER agar bebas rekursi RLS)
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

create index if not exists products_name_idx on public.products using gin (to_tsvector('simple', name));
create index if not exists products_category_idx on public.products (category);
create index if not exists products_promo_idx on public.products (promo_price) where promo_price is not null;

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

-- ------------------------------------------------------------
-- 3. CAFE_TABLES  (denah meja + status ketersediaan)
--    Dipakai halaman /meja yang dibuka pelanggan setelah scan QR.
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

create index if not exists cafe_tables_status_idx on public.cafe_tables (status);

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

create index if not exists transactions_created_idx on public.transactions (created_at desc);
create index if not exists transactions_invoice_idx on public.transactions (invoice_no);
create index if not exists transactions_table_idx   on public.transactions (table_id);

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
-- ------------------------------------------------------------

-- 7a. create_order — checkout tamu: transaksi + item + potong stok dalam 1 transaksi DB.
--     SECURITY DEFINER supaya pelanggan TIDAK PERLU LOGIN untuk memesan.
--     Pesanan tamu masuk sebagai 'pending' → kasir yang menandai lunas.
create or replace function public.create_order(
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
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang masih kosong';
  end if;

  if jsonb_array_length(p_items) > 50 then
    raise exception 'Jumlah item terlalu banyak';
  end if;

  v_table_no := nullif(trim(p_table_no), '');

  -- Cocokkan nomor meja dengan denah meja (kalau meja itu terdaftar).
  if v_table_no is not null then
    select * into v_table from public.cafe_tables
    where table_no = v_table_no and is_active = true;

    if found and v_table.status = 'reserved' then
      raise exception 'Meja % sedang direservasi. Silakan pilih meja lain.', v_table_no;
    end if;
  end if;

  v_invoice := 'INV-' || to_char(now(), 'YYYYMMDD') || '-' ||
               upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.transactions
    (invoice_no, customer_name, table_no, table_id, payment_method, status, note, total, user_id, channel)
  values (
    v_invoice,
    coalesce(nullif(trim(p_customer_name), ''), 'Guest'),
    v_table_no,
    v_table.id,
    coalesce(p_payment_method, 'cash'),
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

    select * into v_product
    from public.products
    where id = (v_item ->> 'product_id')::uuid
    for update;

    if not found then
      raise exception 'Produk tidak ditemukan';
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
--     Dipakai halaman /struk/[invoice] agar tamu bisa membuka & mencetak struknya.
create or replace function public.get_receipt(p_invoice text)
returns jsonb
language plpgsql
security definer set search_path = public
stable
as $$
declare
  v_trx    public.transactions;
  v_items  jsonb;
begin
  select * into v_trx from public.transactions
  where invoice_no = upper(trim(coalesce(p_invoice, '')));

  if not found then
    return null;
  end if;

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
--     Dipakai tombol "Bayar" pada layar yang muncul setelah scan QR meja.
--
--     Hanya mengembalikan pesanan berstatus 'pending' (yang belum dibayar);
--     pesanan yang sudah lunas atau batal tidak ikut, jadi meja yang baru
--     ditempati tamu berikutnya tidak menampilkan riwayat tamu sebelumnya.
--
--     CATATAN PRIVASI: siapa pun yang tahu nomor meja bisa melihat tagihan
--     berjalan meja itu. Itu memang konsekuensi yang diterima — sama seperti
--     bon kertas yang tergeletak di atas meja. Karena itu `user_id` tetap
--     tidak pernah dikembalikan.
create or replace function public.get_table_bill(p_table_no text)
returns jsonb
language plpgsql
security definer set search_path = public
stable
as $$
declare
  v_table_no text;
  v_orders   jsonb;
  v_total    numeric(12, 2);
begin
  v_table_no := nullif(trim(coalesce(p_table_no, '')), '');

  if v_table_no is null then
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
    where t.table_no = v_table_no and t.status = 'pending'
  ) x;

  return jsonb_build_object(
    'table_no', v_table_no,
    'orders',   v_orders,
    'total',    v_total
  );
end;
$$;

-- ------------------------------------------------------------
-- 8. RPC ADMIN (manajemen hak akses)
-- ------------------------------------------------------------

-- 8a. Daftar semua akun + role-nya — sumber data halaman /admin/akses.
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
begin
  if not public.is_admin() then
    raise exception 'Akses ditolak: khusus admin.';
  end if;

  return query
  select p.id, u.email::text, p.full_name, p.phone, p.role, p.created_at, u.last_sign_in_at
  from public.profiles p
  join auth.users u on u.id = p.id
  order by (p.role = 'admin') desc, p.created_at desc;
end;
$$;

-- 8b. Ubah role akun. Admin tidak bisa menurunkan role dirinya sendiri
--     supaya tidak pernah terjadi kondisi "tidak ada admin tersisa".
create or replace function public.admin_set_role(p_user_id uuid, p_role text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Akses ditolak: khusus admin.';
  end if;

  if p_role not in ('user', 'admin') then
    raise exception 'Role tidak valid: %', p_role;
  end if;

  if p_user_id = auth.uid() and p_role <> 'admin' then
    raise exception 'Kamu tidak bisa menurunkan role akunmu sendiri.';
  end if;

  update public.profiles set role = p_role where id = p_user_id;

  if not found then
    raise exception 'Akun tidak ditemukan.';
  end if;
end;
$$;

-- ------------------------------------------------------------
-- 9. ROW LEVEL SECURITY
--    Ringkasan lengkapnya ada di README, tabel "Matriks Hak Akses",
--    dan bisa dilihat langsung di halaman /admin/akses.
-- ------------------------------------------------------------
alter table public.profiles           enable row level security;
alter table public.products           enable row level security;
alter table public.cafe_tables        enable row level security;
alter table public.transactions       enable row level security;
alter table public.transaction_items  enable row level security;
alter table public.contact_messages   enable row level security;

-- PROFILES
drop policy if exists "profil: baca milik sendiri" on public.profiles;
create policy "profil: baca milik sendiri" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profil: update milik sendiri" on public.profiles;
create policy "profil: update milik sendiri" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- PRODUCTS: semua orang (termasuk tamu) boleh lihat, hanya admin boleh ubah
drop policy if exists "produk: publik boleh baca" on public.products;
create policy "produk: publik boleh baca" on public.products
  for select using (true);

drop policy if exists "produk: admin boleh tulis" on public.products;
create policy "produk: admin boleh tulis" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- CAFE TABLES: tamu boleh melihat meja mana yang kosong, hanya admin boleh ubah
drop policy if exists "meja: publik boleh baca" on public.cafe_tables;
create policy "meja: publik boleh baca" on public.cafe_tables
  for select using (true);

drop policy if exists "meja: admin boleh tulis" on public.cafe_tables;
create policy "meja: admin boleh tulis" on public.cafe_tables
  for all using (public.is_admin()) with check (public.is_admin());

-- TRANSACTIONS
-- Tamu TIDAK bisa membaca tabel ini langsung; struknya diambil lewat
-- RPC get_receipt() yang hanya mengembalikan satu invoice.
drop policy if exists "transaksi: baca milik sendiri / admin" on public.transactions;
create policy "transaksi: baca milik sendiri / admin" on public.transactions
  for select using (public.is_admin() or user_id = auth.uid());

drop policy if exists "transaksi: admin boleh tulis" on public.transactions;
create policy "transaksi: admin boleh tulis" on public.transactions
  for all using (public.is_admin()) with check (public.is_admin());

-- TRANSACTION ITEMS
drop policy if exists "item: baca mengikuti transaksi" on public.transaction_items;
create policy "item: baca mengikuti transaksi" on public.transaction_items
  for select using (
    public.is_admin() or exists (
      select 1 from public.transactions t
      where t.id = transaction_id and t.user_id = auth.uid()
    )
  );

drop policy if exists "item: admin boleh tulis" on public.transaction_items;
create policy "item: admin boleh tulis" on public.transaction_items
  for all using (public.is_admin()) with check (public.is_admin());

-- CONTACT MESSAGES: siapa pun boleh kirim, hanya admin boleh baca
drop policy if exists "pesan: publik boleh kirim" on public.contact_messages;
create policy "pesan: publik boleh kirim" on public.contact_messages
  for insert with check (true);

drop policy if exists "pesan: admin boleh baca" on public.contact_messages;
create policy "pesan: admin boleh baca" on public.contact_messages
  for select using (public.is_admin());

-- ------------------------------------------------------------
-- 10. SEED
-- ------------------------------------------------------------
-- Produk contoh HANYA diisi kalau tabelnya masih kosong.
-- Tanpa penjaga ini, menjalankan ulang file ini akan menggandakan seluruh menu
-- (tabel products sengaja tidak memberi constraint unik pada nama produk).
do $seed$
begin
if not exists (select 1 from public.products) then

insert into public.products (name, category, price, stock, description, image_url)
values
  ('Espresso',          'Kopi',    18000, 50, 'Single shot arabica pilihan, bold dan clean.',        'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=800&q=80'),
  ('Cappuccino',        'Kopi',    28000, 40, 'Espresso dengan steamed milk & foam lembut.',         'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&q=80'),
  ('Caffe Latte',       'Kopi',    30000, 45, 'Perpaduan halus espresso dan susu segar.',            'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=800&q=80'),
  ('Kopi Susu Gula Aren','Kopi',   25000, 60, 'Best seller! Manis gurih khas gula aren.',            'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&q=80'),
  ('Americano',         'Kopi',    22000, 35, 'Espresso + air panas, ringan dan segar.',             'https://images.unsplash.com/photo-1521302080334-4bebac2763a6?w=800&q=80'),
  ('Matcha Latte',      'Non-Kopi', 32000, 30, 'Matcha premium Jepang dengan susu creamy.',          'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=800&q=80'),
  ('Chocolate',         'Non-Kopi', 27000, 30, 'Cokelat Belgia hangat yang rich.',                   'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=800&q=80'),
  ('Lemon Tea',         'Non-Kopi', 20000, 40, 'Teh dingin dengan perasan lemon asli.',              'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=800&q=80'),
  ('Croissant Butter',  'Snack',    23000, 25, 'Renyah di luar, lembut di dalam.',                   'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80'),
  ('Cheese Cake',       'Snack',    35000, 18, 'New York style cheese cake.',                        'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&q=80'),
  ('French Fries',      'Snack',    24000, 30, 'Kentang goreng renyah dengan saus pilihan.',         'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&q=80'),
  ('Nasi Goreng Kampung','Makanan', 38000, 20, 'Nasi goreng pedas gurih dengan telur mata sapi.',    'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80');

  -- Dua menu contoh dipasang promo supaya halaman /promo tidak kosong saat
  -- pertama kali dijalankan. Ada di DALAM penjaga seed, jadi menjalankan ulang
  -- file ini tidak akan menimpa promo yang sudah diatur admin.
  update public.products set promo_price = round(price * 0.75, 0)
  where name in ('Kopi Susu Gula Aren', 'Croissant Butter');

end if;
end
$seed$;

-- Denah meja: 12 meja (dipakai halaman /meja & generator QR).
-- Aman diulang karena table_no punya constraint UNIQUE.
insert into public.cafe_tables (table_no, label, area, capacity)
values
  ('01', 'Dekat jendela',  'Indoor',    2),
  ('02', 'Dekat jendela',  'Indoor',    2),
  ('03', 'Tengah',         'Indoor',    4),
  ('04', 'Tengah',         'Indoor',    4),
  ('05', 'Sofa panjang',   'Indoor',    6),
  ('06', 'Bar counter',    'Indoor',    2),
  ('07', 'Bar counter',    'Indoor',    2),
  ('08', 'Teras depan',    'Outdoor',   4),
  ('09', 'Teras depan',    'Outdoor',   4),
  ('10', 'Taman belakang', 'Outdoor',   6),
  ('11', 'Workspace / Meeting Room', 'Indoor', 1),
  ('12', 'Workspace / Meeting Room', 'Indoor', 1)
on conflict (table_no) do nothing;

/*
  Area disederhanakan jadi Indoor & Outdoor saja.

  'Workspace' dan 'VIP' bukan area — ruang kerja dan meeting room sama-sama di
  dalam ruangan. Sifat ruangannya pindah ke kolom `label`, jadi `area` tetap
  menjawab satu pertanyaan: pelanggan duduk di dalam atau di luar.

  Blok ini perlu karena seed di atas memakai `on conflict do nothing` — meja
  yang sudah telanjur dibuat dengan area lama tidak akan tersentuh olehnya.
*/
update public.cafe_tables set area = 'Indoor'
where area in ('Workspace', 'VIP');

-- Hanya menimpa label bawaan versi lama; label yang sudah diubah admin dibiarkan.
update public.cafe_tables set label = 'Workspace / Meeting Room'
where label in ('Ruang kerja', 'Ruang Kerja');

-- ------------------------------------------------------------
-- 11. JADIKAN AKUN KAMU ADMIN
--     Daftar dulu lewat /register, lalu jalankan query di bawah
--     (ganti alamat emailnya). Setelah itu, penambahan admin
--     berikutnya cukup lewat halaman /admin/akses.
-- ------------------------------------------------------------
-- update public.profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'emailkamu@gmail.com');

-- Cek siapa saja yang punya akses admin:
-- select u.email, p.role, p.id
-- from public.profiles p join auth.users u on u.id = p.id
-- order by p.role, u.email;
