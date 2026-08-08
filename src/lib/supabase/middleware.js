import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { canOpenAdminPath, STAFF_ROLES, stripTenantPrefix, tenantSlugFromPath } from '@/lib/access';

/**
 * Refresh session Supabase pada tiap request + proteksi route /admin.
 */
export async function updateSession(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  /*
    Seluruh halaman kini hidup di bawah `/k/<slug>`, jadi izin diperiksa
    terhadap path TANPA awalan itu. Aturan "kasir tidak boleh membuka Daftar
    Produk" berlaku sama di semua outlet; yang berbeda hanya outlet mana yang
    sedang dibuka — dan itu diperiksa terpisah di bawah.
  */
  const slug = tenantSlugFromPath(pathname);
  const rutePolos = stripTenantPrefix(pathname);
  const isAdminRoute = Boolean(slug) && rutePolos.startsWith('/admin');
  const diOutlet = (p) => `/k/${slug}${p}`;

  if (isAdminRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = diOutlet('/login');
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (isAdminRoute && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    const role = profile?.role;

    /*
      Dua pertanyaan berbeda, dan keduanya harus dijawab.

      (1) Apakah role ini boleh membuka halaman ini? Kasir hanya Dashboard,
          Kasir, dan Daftar Transaksi — daftarnya di ADMIN_PAGES.
      (2) Apakah ia staf DI OUTLET INI? Tanpa pemeriksaan kedua, admin Kopi
          Pagi yang mengetik /k/roti-88/admin akan lolos middleware dan melihat
          kerangka dashboard milik orang lain. RLS memang tetap mengosongkan
          datanya, tapi membiarkan halamannya terbuka sudah membocorkan bahwa
          outlet itu ada beserta struktur menunya.
    */
    const bolehHalaman = canOpenAdminPath(role, rutePolos);

    let outletSendiri = false;
    if (bolehHalaman) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      outletSendiri = Boolean(tenant?.id) && tenant.id === profile?.tenant_id;
    }

    if (!bolehHalaman || !outletSendiri) {
      const url = request.nextUrl.clone();

      // Staf yang nyasar ke halaman di luar wewenangnya dikembalikan ke
      // dashboard OUTLETNYA SENDIRI, bukan dilempar keluar ke halaman pelanggan.
      if (STAFF_ROLES.includes(role) && outletSendiri) {
        url.pathname = diOutlet('/admin');
        url.search = '';
      } else {
        url.pathname = diOutlet('/');
        url.searchParams.set('forbidden', '1');
      }

      return NextResponse.redirect(url);
    }
  }

  /*
    Yang sudah masuk tidak perlu melihat form daftar lagi — tapi jangan
    dilempar ke beranda publik. Sejak sisi publik tidak lagi memuat tombol
    Keluar, `/login` adalah satu-satunya tempat staf bisa melihat sesinya dan
    keluar. Melempar mereka ke `/` justru mengunci mereka di dalam sesi.
  */
  if (user && slug && rutePolos === '/register') {
    const url = request.nextUrl.clone();
    url.pathname = diOutlet('/login');
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}
