import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('token')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                    request.nextUrl.pathname.startsWith('/register');
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');

  // Allow API routes to handle their own auth
  if (isApiRoute) {
    return NextResponse.next();
  }

  // Redirect to login if accessing protected route without token
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect to diary if accessing auth pages with token
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/diary', request.url));
  }

  // For admin routes, check if user is admin
  if (isAdminRoute && token) {
    try {
      // Get user data from token
      const userData = JSON.parse(atob(token.split('.')[1]));
      if (userData.role !== 'ADMIN') {
        // Return 404 for non-admin users trying to access admin routes
        return new NextResponse(null, { status: 404 });
      }
    } catch (error) {
      // If token is invalid, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 