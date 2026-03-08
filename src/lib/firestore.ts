import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    getDocs,
    serverTimestamp,
    writeBatch,
    orderBy,
    limit,
} from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile, OnboardingData } from '@/types/user';

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
    }
    return null;
}

export async function createUserProfile(profile: UserProfile): Promise<void> {
    const docRef = doc(db, 'users', profile.uid);
    await setDoc(docRef, {
        ...profile,
        createdAt: serverTimestamp(),
    });
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, data);
}

export async function saveOnboardingData(uid: string, data: OnboardingData): Promise<void> {
    const batch = writeBatch(db);

    // Save onboarding details to subcollection
    const onboardingRef = doc(db, 'users', uid, 'profile', 'onboarding');
    batch.set(onboardingRef, {
        ...data,
        updatedAt: serverTimestamp(),
    });

    // Mark onboarding as complete in main user document
    const userRef = doc(db, 'users', uid);
    batch.update(userRef, { onboardingComplete: true });

    await batch.commit();
}

export async function getOnboardingData(uid: string): Promise<OnboardingData | null> {
    const docRef = doc(db, 'users', uid, 'profile', 'onboarding');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as OnboardingData;
    }
    return null;
}

export async function saveResumeData(uid: string, resumeId: string, data: Record<string, unknown>): Promise<void> {
    const docRef = doc(db, 'users', uid, 'resumes', resumeId);
    await setDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
    }, { merge: true });
}

export async function getUserResumes(uid: string) {
    const q = query(collection(db, 'users', uid, 'resumes'));
    const querySnap = await getDocs(q);
    return querySnap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateSubscription(uid: string, tier: string, paymentId?: string, expiryDate?: string): Promise<void> {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
        subscription: tier,
        subscriptionExpiry: expiryDate || null,
        lastPaymentId: paymentId || null,
    });
}

// -- Match History --
export interface MatchResult {
    jobTitle: string;
    matchPercentage: number;
    keywordsMatched: number;
    keywordsTotal: number;
    timestamp: string;
}

export async function saveMatchResult(uid: string, data: MatchResult): Promise<void> {
    const matchId = `match_${crypto.randomUUID().slice(0, 8)}`;
    const docRef = doc(db, 'users', uid, 'matchHistory', matchId);
    await setDoc(docRef, {
        ...data,
        createdAt: serverTimestamp(),
    });
}

export async function getMatchHistory(uid: string): Promise<MatchResult[]> {
    try {
        const q = query(
            collection(db, 'users', uid, 'matchHistory'),
            orderBy('createdAt', 'desc'),
            limit(10)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => d.data() as MatchResult);
    } catch {
        return [];
    }
}

// -- Stats --
export async function getUserStats(uid: string): Promise<{
    resumeCount: number;
    bestMatchScore: number;
    totalMatches: number;
}> {
    try {
        const resumeQ = query(collection(db, 'users', uid, 'resumes'));
        const resumeSnap = await getDocs(resumeQ);

        let bestMatchScore = 0;
        let totalMatches = 0;
        try {
            const matchQ = query(
                collection(db, 'users', uid, 'matchHistory'),
                orderBy('createdAt', 'desc'),
                limit(20)
            );
            const matchSnap = await getDocs(matchQ);
            totalMatches = matchSnap.size;
            matchSnap.docs.forEach(d => {
                const score = d.data().matchPercentage || 0;
                if (score > bestMatchScore) bestMatchScore = score;
            });
        } catch { /* matchHistory might not exist yet */ }

        return { resumeCount: resumeSnap.size, bestMatchScore, totalMatches };
    } catch {
        return { resumeCount: 0, bestMatchScore: 0, totalMatches: 0 };
    }
}

export async function deleteResumeData(uid: string, resumeId: string): Promise<void> {
    const docRef = doc(db, 'users', uid, 'resumes', resumeId);
    await deleteDoc(docRef);
}
