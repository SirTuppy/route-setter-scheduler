import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });
    const { data: { session } } = await supabase.auth.getSession();

    // Get the pathname from the URL
    const path = req.nextUrl.pathname;
    
    console.log('Middleware check:', {
        path,
        hasSession: !!session,
        isAuthPath: path.startsWith('/auth/')
    });

    // If we're on the root path and have no session, redirect to login
    if (path === '/' && !session) {
        console.log('Redirecting to login from root');
        return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    // If we're on any non-auth path and have no session, redirect to login
    if (!path.startsWith('/auth/') && !session) {
        console.log('Redirecting to login from protected route');
        return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    // If we're on an auth path and have a session, redirect to root
    if (path.startsWith('/auth/') && session) {
        console.log('Redirecting to root from auth path');
        return NextResponse.redirect(new URL('/', req.url));
    }

    return res;
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};