'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
    User,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    updateProfile,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserProfile, createUserProfile } from '@/lib/firestore';
import type { UserProfile } from '@/types/user';

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    isAdmin: boolean;
    authReady: boolean; // NEW: true only after first onAuthStateChanged fires
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, name: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: (optimisticData?: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper: fetch profile with a timeout so Firestore issues don't block auth forever
async function fetchProfileSafe(uid: string, timeoutMs = 2000): Promise<UserProfile | null> {
    try {
        const result = await Promise.race([
            getUserProfile(uid),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
        ]);
        return result;
    } catch (err) {
        console.warn('Could not fetch profile (Firestore may not be set up):', err);
        return null;
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [authReady, setAuthReady] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false); // NEW: prevent triple-clicks/double-pops
    const profileSetBySignIn = useRef(false);
    const loadingRef = useRef(true);

    // C-3 FIX: Admin check from Firestore profile, not client-side env var
    const isAdmin = !!(profile?.isAdmin === true);

    // M-8 FIX: Use functional setState to avoid stale closure over profile
    const refreshProfile = useCallback(async (optimisticData?: Partial<UserProfile>) => {
        if (optimisticData) {
            setProfile(prev => prev ? { ...prev, ...optimisticData } : prev);
        }

        if (user) {
            const p = await fetchProfileSafe(user.uid);
            if (p) setProfile(p);
        }
    }, [user]);

    // Core auth listener — fires once immediately with cached state, then on changes
    useEffect(() => {
        let cancelled = false;

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (cancelled) return;

            setUser(firebaseUser);

            if (firebaseUser) {
                // Only fetch profile from Firestore if it wasn't just set by signIn/signUp/signInWithGoogle
                if (!profileSetBySignIn.current) {
                    const existingProfile = await fetchProfileSafe(firebaseUser.uid);
                    if (!cancelled && existingProfile) {
                        setProfile(existingProfile);
                    }
                }
                // Reset the flag after the first auth state change processes it
                profileSetBySignIn.current = false;
            } else {
                setProfile(null);
            }

            if (!cancelled) {
                setLoading(false);
                loadingRef.current = false;
                setAuthReady(true);
            }
        });

        // L-6 FIX: Use ref instead of state to avoid stale closure + missing dependency
        // This prevents infinite spinner if Firebase SDK hangs
        const safetyTimer = setTimeout(() => {
            if (!cancelled && loadingRef.current) {
                setLoading(false);
                loadingRef.current = false;
                setAuthReady(true);
            }
        }, 3000);

        return () => {
            cancelled = true;
            clearTimeout(safetyTimer);
            unsubscribe();
        };
    }, []);

    const signIn = async (email: string, password: string) => {
        if (isAuthenticating) return;
        setIsAuthenticating(true);
        try {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            setUser(cred.user);
            profileSetBySignIn.current = true;
            fetchProfileSafe(cred.user.uid, 2000).then(existingProfile => {
                if (existingProfile) setProfile(existingProfile);
            });
        } catch (err: unknown) {
            const firebaseErr = err as { code?: string };
            console.error("Auth Error:", firebaseErr.code);
            throw err;
        } finally {
            setIsAuthenticating(false);
        }
    };

    const signUp = async (email: string, password: string, name: string) => {
        if (isAuthenticating) return;
        setIsAuthenticating(true);
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(cred.user, { displayName: name });
            const newProfile: UserProfile = {
                uid: cred.user.uid,
                email: cred.user.email || email,
                displayName: name,
                createdAt: new Date().toISOString(),
                onboardingComplete: false,
                subscription: 'free',
            };
            setUser(cred.user);
            profileSetBySignIn.current = true;
            setProfile(newProfile);
            await createUserProfile(newProfile).catch(() => { });
        } catch (err: unknown) {
            const firebaseErr = err as { code?: string };
            console.error("Auth Error:", firebaseErr.code);
            throw err;
        } finally {
            setIsAuthenticating(false);
        }
    };

    const signInWithGoogle = async () => {
        if (isAuthenticating) return;
        setIsAuthenticating(true);
        try {
            const provider = new GoogleAuthProvider();
            // Ensure any previous operation is cleared by explicitly waiting or checking
            const cred = await signInWithPopup(auth, provider);
            setUser(cred.user);
            profileSetBySignIn.current = true;
            const existingProfile = await fetchProfileSafe(cred.user.uid);
            if (existingProfile) {
                setProfile(existingProfile);
            } else {
                const newProfile: UserProfile = {
                    uid: cred.user.uid,
                    email: cred.user.email || '',
                    displayName: cred.user.displayName || 'User',
                    createdAt: new Date().toISOString(),
                    onboardingComplete: false,
                    subscription: 'free',
                };
                setProfile(newProfile);
                await createUserProfile(newProfile).catch(() => { });
            }
        } catch (err: unknown) {
            const firebaseErr = err as { code?: string };
            console.error("Auth Error:", firebaseErr.code);
            if (firebaseErr.code === 'auth/popup-closed-by-user') {
                // Not a real error that needs alerting
                return;
            }
            throw err;
        } finally {
            setIsAuthenticating(false);
        }
    };

    const signOut = async () => {
        await firebaseSignOut(auth);
        setUser(null);
        setProfile(null);
        profileSetBySignIn.current = false;
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, isAdmin, authReady, signIn, signUp, signInWithGoogle, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
