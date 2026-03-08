import { auth } from '@/lib/firebase';

/**
 * Fetch wrapper that automatically attaches the Firebase ID token
 * to the Authorization header for authenticated API calls.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const user = auth.currentUser;

    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');

    if (user) {
        try {
            const token = await user.getIdToken();
            headers.set('Authorization', `Bearer ${token}`);
        } catch (err) {
            console.warn('Could not get ID token:', err);
        }
    }

    return fetch(url, {
        ...options,
        headers,
    });
}
