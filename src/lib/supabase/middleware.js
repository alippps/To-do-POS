import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { canOpenAdminPath, STAFF_ROLES } from '@/lib/access';

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
  const isAdminRoute = pathname.startsWith('/admin');

  if (isAdminRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (isAdminRoute && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role;

    /*
      Izin diperiksa PER HALAMAN, bukan sekadar "admin atau bukan".
      Kasir boleh membuka Dashboard, Kasir, dan Daftar Transaksi saja —
      daftarnya ada di ADMIN_PAGES (src/lib/access.js).
    */
    if (!canOpenAdminPath(role, pathname)) {
      const url = request.nextUrl.clone();

      // Staf yang nyasar ke halaman di luar wewenangnya dikembalikan ke
      // dashboard, bukan dilempar keluar ke halaman pelanggan.
      if (STAFF_ROLES.includes(role)) {
        url.pathname = '/admin';
        url.search = '';
      } else {
        url.pathname = '/';
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
  if (user && pathname === '/register') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}
