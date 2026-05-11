import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const userRole = request.cookies.get('userRole')?.value;
  const { pathname } = request.nextUrl;

  // 1. Rediriger vers /login si pas de token (sauf pour /login lui-même)
  if (!token && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Rediriger vers le dashboard approprié si on est sur / ou déjà loggé sur /login
  if (token) {
    if (pathname === '/' || pathname === '/login') {
      if (userRole === 'admin') return NextResponse.redirect(new URL('/admin', request.url));
      if (userRole === 'caissiere') return NextResponse.redirect(new URL('/super', request.url));
      if (userRole === 'gerant') return NextResponse.redirect(new URL('/quinc', request.url));
    }

    // 3. Protection stricte des routes par rôle
    if (pathname.startsWith('/admin') && userRole !== 'admin') {
      return NextResponse.redirect(new URL(userRole === 'caissiere' ? '/super' : '/quinc', request.url));
    }
    
    if (pathname.startsWith('/super') && userRole !== 'caissiere' && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (pathname.startsWith('/quinc') && userRole !== 'gerant' && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

// Configurer les chemins sur lesquels le middleware s'exécute
export const config = {
  matcher: [
    '/',
    '/admin/:path*',
    '/super/:path*',
    '/quinc/:path*',
    '/login',
  ],
};
