import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const RESERVED_SUBDOMAINS = ['www', 'app', 'api', 'admin', 'dashboard'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = (request.headers.get('host') || '').split(':')[0].toLowerCase();
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.toLowerCase();

  // -------- Мультитенантность по поддомену: estet.easybeauty.kz → витрина estet --------
  if (root && hostname !== root && hostname.endsWith(`.${root}`)) {
    const sub = hostname.slice(0, hostname.length - root.length - 1);
    if (sub && !RESERVED_SUBDOMAINS.includes(sub)) {
      // Кабинет/админка/вход живут на основном домене — отправляем туда
      if (
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/admin') ||
        pathname === '/login' ||
        pathname === '/register'
      ) {
        return NextResponse.redirect(new URL(pathname + request.nextUrl.search, `https://${root}`));
      }
      // Корень поддомена → витрина магазина
      if (pathname === '/') {
        return NextResponse.rewrite(new URL(`/${sub}`, request.url));
      }
      return NextResponse.next();
    }
  }

  // -------- Защита кабинета и админки на основном домене --------
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    let response = NextResponse.next({ request });
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
