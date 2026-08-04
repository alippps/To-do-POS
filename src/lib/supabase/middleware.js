import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

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

    if (profile?.role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.searchParams.set('forbidden', '1');
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
