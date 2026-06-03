import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow next-auth API routes to pass through unhindered
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Attempt to extract the JWT token using the request and secret
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // If there is no token, redirect to the unauthenticated login page at '/'
  if (!token) {
    const loginUrl = new URL('/', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If trying to access /admin routes, enforce ADMIN role check
  if (pathname.startsWith('/admin')) {
    if (token.role !== 'ADMIN') {
      // User is authenticated but not an admin; redirect to their client dashboard
      return NextResponse.redirect(new URL('/client', request.url));
    }
  }

  // All checks passed; proceed as normal
  return NextResponse.next();
}

export const config = {
  matcher: ['/client/:path*', '/admin/:path*'],
};
