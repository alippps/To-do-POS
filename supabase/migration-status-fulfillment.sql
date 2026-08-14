-- ============================================================
--  MIGRASI — TAHAP DAPUR PADA STATUS PESANAN  (v7)
--
--  Menyisipkan dua tahap di ANTARA "pesanan masuk" dan "lunas":
--
--      pending  →  diproses  →  siap  →  paid
--                     ↘          ↘
--                      cancelled (dari tahap mana pun sebelum paid)
--
--  Tempel seluruh isi berkas ini ke SQL Editor Supabase lalu Run.
--  Aman dijalankan berkali-kali, dan aman dijalankan di database yang sudah
--  berisi transaksi: tidak ada satu pun baris yang diubah nilainya.
--
--  Kembarannya di sisi aplikasi ada di `src/lib/tables.js` (ORDER_STATUS,
--  ORDER_ACTIVE_STATUSES, ORDER_TRANSITIONS). Perubahan di sini tanpa
--  perubahan di sana akan membuat kasir menekan tombol yang ditolak database.
--
--  Isi migrasi ini sudah ikut tertanam di `supabase/schema.sql`, jadi
--  pemasangan baru TIDAK perlu menjalankannya terpisah. Berkas ini untuk
--  database yang sudah hidup dan tidak ingin menjalankan ulang seluruh schema.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Check constraint — terima dua nilai baru
--
--    Constraint di-drop lalu dibuat lagi, bukan diubah: PostgreSQL tidak
--    punya `alter constraint` untuk mengganti ekspresi CHECK. Nama
--    constraint-nya mengikuti bawaan PostgreSQL untuk check kolom
--    (`<tabel>_<kolom>_check`) — sama dengan yang lahir dari `create table`
--    di schema.sql, jadi yang di-drop memang constraint yang itu.
-- ------------------------------------------------------------
alter table public.transactions
  drop constraint if exists transactions_status_check;

alter table public.transactions
  add constraint transactions_status_check
  check (status in ('pending', 'diproses', 'siap', 'paid', 'cancelled'));

-- ------------------------------------------------------------
-- 2. Status meja otomatis — INI YANG PALING MUDAH TERLEWAT
--
--    Fungsi lama menghitung meja terisi dari `status = 'pending'` saja.
--    Dengan dua tahap baru, pesanan yang mulai dimasak berhenti berstatus
--    `pending` — dan meja yang makanannya sedang dibuat akan terlihat KOSONG.
--    Akibatnya bukan sekadar angka yang salah di dashboard: layar kasir
--    menawarkan meja itu ke tamu berikutnya, dan dua rombongan diarahkan ke
--    meja yang sama.
--
--    Daftar status "masih terisi" harus sama persis dengan
--    ORDER_ACTIVE_STATUSES di src/lib/tables.js.
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
  where table_id = p_table_id
    and status in ('pending', 'diproses', 'siap');

  if v_active > 0 then
    update public.cafe_tables set status = 'occupied' where id = p_table_id;
  else
    -- Meja yang sengaja di-'reserved' admin tidak ikut dibebaskan.
    update public.cafe_tables set status = 'available'
    where id = p_table_id and status <> 'reserved';
  end if;
end;
$$;

-- ------------------------------------------------------------
-- 3. Tagihan berjalan sebuah meja — lubang yang sama, halaman berbeda
--
--    `get_table_bill()` juga menyaring `status = 'pending'`. Tanpa perubahan
--    ini, pelanggan yang membuka /bayar sementara pesanannya sedang dimasak
--    membaca "Belum ada tagihan di meja ini" — padahal ia jelas berutang.
--
--    Yang berubah HANYA baris `where`-nya. Sisanya disalin apa adanya dari
--    schema.sql supaya kedua berkas tidak menyimpang.
-- ------------------------------------------------------------
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
    where t.tenant_id = v_tenant_id
      and t.table_no = v_table_no
      and t.status in ('pending', 'diproses', 'siap')
  ) x;

  return jsonb_build_object(
    'table_no', v_table_no,
    'orders',   v_orders,
    'total',    v_total
  );
end;
$$;

-- ------------------------------------------------------------
-- 4. Menyelaraskan ulang status seluruh meja
--
--    Fungsi di atas hanya berjalan lewat trigger, yaitu saat ada transaksi
--    yang berubah. Meja yang statusnya sudah terlanjur salah sebelum migrasi
--    ini tidak akan tersentuh sampai ada pesanan berikutnya di meja itu.
--
--    Sekali jalan di sini membereskannya. Meja 'reserved' tetap tidak
--    disentuh — itu keputusan admin, bukan turunan dari transaksi.
-- ------------------------------------------------------------
do $$
declare
  v_id uuid;
begin
  for v_id in select id from public.cafe_tables loop
    perform public.refresh_table_status(v_id);
  end loop;
end $$;

-- ------------------------------------------------------------
-- 5. Pemeriksaan — jalankan untuk memastikan migrasinya benar-benar masuk
-- ------------------------------------------------------------
-- select conname, pg_get_constraintdef(oid)
-- from pg_constraint
-- where conrelid = 'public.transactions'::regclass and conname = 'transactions_status_check';
--
-- Harus memuat: 'pending', 'diproses', 'siap', 'paid', 'cancelled'
