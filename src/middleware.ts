import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for PersonaForge:
 * - Origin validation for /api routes to prevent CSRF and cross-origin abuse.
 */
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only protect /api routes
    if (pathname.startsWith('/api')) {
        const origin = request.headers.get('origin');
        const host = request.headers.get('host');
        const referer = request.headers.get('referer');

        // Local development might use different methods, but host check is generally safe
        // In local, host is often localhost:3000

        // If Origin header is present, it MUST match the host
        if (origin) {
            const originHost = new URL(origin).host;
            if (originHost !== host) {
                console.warn(`[Middleware] Blocked unauthorized origin: ${origin}`);
                return new NextResponse(
                    JSON.stringify({ error: 'Unauthorized origin' }),
                    { status: 403, headers: { 'content-type': 'application/json' } }
                );
            }
        }

        // Additional Referer check for browser-based requests without Origin
        if (!origin && referer) {
            try {
                const refererHost = new URL(referer).host;
                if (refererHost !== host) {
                    console.warn(`[Middleware] Blocked unauthorized referer: ${referer}`);
                    return new NextResponse(
                        JSON.stringify({ error: 'Unauthorized referer' }),
                        { status: 403, headers: { 'content-type': 'application/json' } }
                    );
                }
            } catch (e) {
                // Invalid referer URL
                return new NextResponse(
                    JSON.stringify({ error: 'Invalid referer' }),
                    { status: 403, headers: { 'content-type': 'application/json' } }
                );
            }
        }

        // Note: Requests from non-browser clients (curl, mobile apps) might have neither Origin nor Referer.
        // For a web app, we usually expect at least one from the same domain.
        // If you need to support mobile/curl, you might want to allow empty headers if an API key is present.
    }

    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: '/api/:path*',
};
