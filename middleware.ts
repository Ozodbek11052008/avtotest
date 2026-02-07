import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    // Handle case-insensitive image folder paths
    // Redirect /Images/ to /images/ (lowercase)
    if (pathname.match(/^\/Images\//i)) {
        const normalizedPath = pathname.replace(/^\/Images\//i, '/images/');
        if (pathname !== normalizedPath) {
            console.log(`[Middleware] Redirecting ${pathname} to ${normalizedPath} (case fix)`);
            const url = request.nextUrl.clone();
            url.pathname = normalizedPath;
            return NextResponse.redirect(url, 301); // Permanent redirect
        }
    }
    
    // Log image requests for debugging
    if (pathname.startsWith('/images/')) {
        console.log(`[Middleware] Image request: ${pathname}`);
    }
    
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/images/:path*',
        '/Images/:path*',
    ],
};
