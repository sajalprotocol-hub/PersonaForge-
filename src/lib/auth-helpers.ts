import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from './firebase-admin';

export interface AuthResult {
    uid: string;
    email: string;
    isAdmin: boolean;
    subscription: string; // 'free' | 'pdf_unlock' | 'weekly' | 'monthly'
}

// Server-side admin emails — NOT exposed to client bundle via NEXT_PUBLIC_
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

/**
 * Verify the Firebase ID token and return enriched auth result with admin + subscription info.
 */
export async function verifyAuth(req: NextRequest): Promise<AuthResult | NextResponse> {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
            { error: 'Unauthorized — missing or invalid Authorization header' },
            { status: 401 }
        );
    }

    const token = authHeader.split('Bearer ')[1];

    if (!token || token.length < 10) {
        return NextResponse.json(
            { error: 'Unauthorized — invalid token' },
            { status: 401 }
        );
    }

    let uid = '';
    let email = '';

    try {
        const decoded = await adminAuth.verifyIdToken(token);
        uid = decoded.uid;
        email = decoded.email || '';
    } catch (err: unknown) {

        if (!uid) {
            const message = err instanceof Error ? err.message : 'Failed to verify token';
            return NextResponse.json(
                { error: `Unauthorized — ${message}` },
                { status: 401 }
            );
        }
    }

    // Determine admin status from server-side env var
    const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());

    // Fetch subscription tier from Firestore (server-side via Admin SDK)
    let subscription = 'free';
    try {
        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (userDoc.exists) {
            subscription = (userDoc.data()?.subscription as string) || 'free';
        }
    } catch {
        // If Firestore unavailable, default to free (admins bypass anyway)
        console.warn('Could not fetch user subscription from Firestore');
    }

    return { uid, email, isAdmin, subscription };
}

/**
 * Helper to check if verifyAuth returned an error response
 */
export function isAuthError(result: AuthResult | NextResponse): result is NextResponse {
    return result instanceof NextResponse;
}

/**
 * Check if user has required subscription tier (or is admin).
 * Returns null if allowed, or a NextResponse error if denied.
 */
export function requireSubscription(
    auth: AuthResult,
    requiredTiers: string[]
): NextResponse | null {
    if (auth.isAdmin) return null; // Admins bypass all checks
    if (requiredTiers.includes(auth.subscription)) return null;

    return NextResponse.json(
        { error: 'This feature requires a premium subscription. Please upgrade your plan.' },
        { status: 403 }
    );
}
