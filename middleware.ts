
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define public routes that do not require authentication
const publicRoutes = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const sessionCookie = request.cookies.get('session_token')?.value

  const isPublicRoute = publicRoutes.some(publicPath => path.startsWith(publicPath));
  const isApiRoute = path.startsWith('/api');
  const isStaticFile = /\.(.*)$/.test(path) || path.startsWith('/_next');

  // If user is logged in and tries to access a public route (like /login), redirect to dashboard
  if (sessionCookie && isPublicRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  // If user is not logged in and tries to access a protected route, redirect to login
  if (!sessionCookie && !isPublicRoute && !isApiRoute && !isStaticFile) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - favicon.ico (favicon file)
     * - images, logos, etc.
     *
     * This ensures the middleware runs on all pages and API routes.
     */
    '/((?!_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)',
  ],
}
