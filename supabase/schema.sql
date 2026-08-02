-- ============================================================
--  TO DO — Point of Sale (Coffee Shop)
--  Skema database Supabase: tabel, RLS policy, trigger, seed.
--  Jalankan seluruh file ini di Supabase Dashboard > SQL Editor.
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
    coalesce(new.raw_user_meta_data ->> 'role', 'user')
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

create index if not exists products_name_idx on public.products using gin (to_tsvector('simple', name));
create index if not exists products_category_idx on public.products (category);

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
-- 3. TRANSACTIONS + ITEMS
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

create index if not exists transactions_created_idx on public.transactions (created_at desc);
create index if not exists transactions_invoice_idx on public.transactions (invoice_no);

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
-- 4. CONTACT MESSAGES (form kontak sederhana)
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
-- 5. RPC: checkout (transaksi + item + potong stok dalam 1 transaksi DB)
-- ------------------------------------------------------------
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
  v_total    numeric(12, 2) := 0;
  v_invoice  text;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang masih kosong';
  end if;

  v_invoice := 'INV-' || to_char(now(), 'YYYYMMDD') || '-' ||
               upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.transactions (invoice_no, customer_name, table_no, payment_method, note, total, user_id)
  values (
    v_invoice,
    coalesce(nullif(trim(p_customer_name), ''), 'Guest'),
    nullif(trim(p_table_no), ''),
    coalesce(p_payment_method, 'cash'),
    nullif(trim(p_note), ''),
    0,
    auth.uid()
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

    if v_product.stock < v_qty then
      raise exception 'Stok % tidak mencukupi (sisa %)', v_product.name, v_product.stock;
    end if;

    insert into public.transaction_items (transaction_id, product_id, product_name, price, qty, subtotal)
    values (v_trx.id, v_product.id, v_product.name, v_product.price, v_qty, v_product.price * v_qty);

    update public.products
    set stock = stock - v_qty
    where id = v_product.id;

    v_total := v_total + (v_product.price * v_qty);
  end loop;

  update public.transactions set total = v_total where id = v_trx.id returning * into v_trx;
  return v_trx;
end;
$$;

-- ------------------------------------------------------------
-- 6. ROW LEVEL SECURITY
-- ------------------------------------------------------------
alter table public.profiles           enable row level security;
alter table public.products           enable row level security;
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

-- PRODUCTS: semua orang boleh lihat, hanya admin boleh ubah
drop policy if exists "produk: publik boleh baca" on public.products;
create policy "produk: publik boleh baca" on public.products
  for select using (true);

drop policy if exists "produk: admin boleh tulis" on public.products;
create policy "produk: admin boleh tulis" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- TRANSACTIONS
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
-- 7. SEED PRODUK
-- ------------------------------------------------------------
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
  ('Nasi Goreng Kampung','Makanan', 38000, 20, 'Nasi goreng pedas gurih dengan telur mata sapi.',    'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80')
on conflict do nothing;

-- ------------------------------------------------------------
-- 8. JADIKAN AKUN KAMU ADMIN
--    Daftar dulu lewat /register, lalu jalankan query di bawah.
-- ------------------------------------------------------------
-- update public.profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'emailkamu@gmail.com');
