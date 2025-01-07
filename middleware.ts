// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    // Refresh session if expired - required for Server Components
    const { data: { session }, error } = await supabase.auth.getSession();

    console.log('Middleware - Current path:', req.nextUrl.pathname);
    console.log('Middleware - Session exists:', !!session);

    // If there's an error, we'll redirect to login
    if (error) {
        console.error('Middleware - Session error:', error);
        return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    // Protected routes logic
    if (!session) {
        // If no session and trying to access protected route
        if (
            !req.nextUrl.pathname.startsWith('/auth/') &&
            !req.nextUrl.pathname.startsWith('/_next/') &&
            !req.nextUrl.pathname.startsWith('/api/')
        ) {
            console.log('Middleware - No session, redirecting to login');
            return NextResponse.redirect(new URL('/auth/login', req.url));
        }
    } else {
        // If session exists and trying to access auth routes
        if (req.nextUrl.pathname.startsWith('/auth/')) {
            console.log('Middleware - Session exists, redirecting to home');
            return NextResponse.redirect(new URL('/', req.url));
        }
    }

    return res;
}

// Update the matcher configuration
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public (public files)
         */
        '/((?!_next/static|_next/image|favicon.ico|public).*)',
    ],
};