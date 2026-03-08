'use client';

import { useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UTMParams {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    ref?: string;
}

/**
 * Hook that captures UTM parameters from the URL and stores them
 * in localStorage. Call `saveUTMToFirestore(userId)` after signup
 * to persist attribution data.
 *
 * Completely free — uses localStorage + Firestore.
 */
export function useUTM() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const params: UTMParams = {};
        let hasUTM = false;

        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref'].forEach(key => {
            const val = searchParams.get(key);
            if (val) {
                (params as any)[key] = val;
                hasUTM = true;
            }
        });

        if (hasUTM) {
            // Store in localStorage so it persists through redirects/signup
            localStorage.setItem('pf_utm', JSON.stringify(params));
            localStorage.setItem('pf_utm_timestamp', Date.now().toString());
            localStorage.setItem('pf_landing_page', window.location.pathname);
        }
    }, [searchParams]);

    const getStoredUTM = useCallback((): UTMParams | null => {
        try {
            const stored = localStorage.getItem('pf_utm');
            if (!stored) return null;

            // UTM params expire after 30 days
            const timestamp = localStorage.getItem('pf_utm_timestamp');
            if (timestamp) {
                const daysSince = (Date.now() - parseInt(timestamp)) / (1000 * 60 * 60 * 24);
                if (daysSince > 30) {
                    localStorage.removeItem('pf_utm');
                    localStorage.removeItem('pf_utm_timestamp');
                    localStorage.removeItem('pf_landing_page');
                    return null;
                }
            }

            return JSON.parse(stored);
        } catch {
            return null;
        }
    }, []);

    const saveUTMToFirestore = useCallback(async (userId: string) => {
        const utm = getStoredUTM();
        if (!utm) return;

        try {
            await setDoc(doc(db, 'users', userId, 'attribution', 'signup'), {
                ...utm,
                landingPage: localStorage.getItem('pf_landing_page') || '/',
                signupTimestamp: serverTimestamp(),
            });

            // Clean up localStorage after saving
            localStorage.removeItem('pf_utm');
            localStorage.removeItem('pf_utm_timestamp');
            localStorage.removeItem('pf_landing_page');
        } catch (e) {
            console.error('Failed to save UTM data:', e);
        }
    }, [getStoredUTM]);

    return { getStoredUTM, saveUTMToFirestore };
}
