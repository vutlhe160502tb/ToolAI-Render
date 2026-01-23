import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdmin = token?.isAdmin as boolean | undefined;
    const pathname = req.nextUrl.pathname;

    // Allow access to login page and API routes
    if (pathname.startsWith('/login') || pathname.startsWith('/api/')) {
      return NextResponse.next();
    }

    // Nếu là admin, chỉ cho phép vào /admin
    if (isAdmin) {
      if (!pathname.startsWith('/admin')) {
        // Redirect admin khỏi các trang user
        return NextResponse.redirect(new URL('/admin', req.url));
      }
    } else {
      // Nếu là user thường, không cho vào /admin
      if (pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to login page and API routes without auth
        if (req.nextUrl.pathname.startsWith('/login') || 
            req.nextUrl.pathname.startsWith('/api/')) {
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

