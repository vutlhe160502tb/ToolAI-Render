import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const pathname = req.nextUrl.pathname;

    // Allow access to login page and API routes
    if (
      pathname.startsWith('/login') ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/surrealAdmin')
    ) {
      return NextResponse.next();
    }

    // Legacy route: redirect /admin -> /surrealAdmin
    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/surrealAdmin', req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Allow access without NextAuth
        if (
          pathname.startsWith('/login') ||
          pathname.startsWith('/api/') ||
          pathname.startsWith('/surrealAdmin') ||
          pathname.startsWith('/admin')
        ) {
          return true;
        }
        
        // Require auth for all other pages
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

