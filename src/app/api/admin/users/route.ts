import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuth, isAuthError } from '@/lib/auth-helpers';

interface UserData {
    uid: string;
    email?: string;
    displayName?: string;
    subscription?: string;
    onboardingComplete?: boolean;
    createdAt?: { toDate?: () => Date } | string;
}

export async function GET(req: NextRequest) {
    const authResult = await verifyAuth(req);
    if (isAuthError(authResult)) return authResult;
    if (!authResult.isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const usersSnap = await adminDb.collection('users').orderBy('createdAt', 'desc').limit(200).get();

        // Stats aggregation
        let premiumCount = 0;
        let onboardedCount = 0;

        const users: UserData[] = usersSnap.docs.map(d => ({ uid: d.id, ...d.data() } as UserData));

        // H-3 FIX: Batch resume count queries with Promise.all instead of sequential N+1
        const resumeCountPromises = users.map(u =>
            adminDb.collection('users').doc(u.uid).collection('resumes').count().get()
        );
        const resumeCountResults = await Promise.all(resumeCountPromises);

        let totalResumes = 0;
        const userList = users.map((u, i) => {
            const resumeCount = resumeCountResults[i].data().count;
            totalResumes += resumeCount;
            if (u.subscription && u.subscription !== 'free') premiumCount++;
            if (u.onboardingComplete) onboardedCount++;

            const createdAt = u.createdAt;
            let createdAtStr = '';
            if (createdAt && typeof createdAt === 'object' && 'toDate' in createdAt && typeof createdAt.toDate === 'function') {
                createdAtStr = createdAt.toDate().toISOString();
            } else if (typeof createdAt === 'string') {
                createdAtStr = createdAt;
            }

            return {
                uid: u.uid,
                email: u.email || '',
                displayName: u.displayName || 'No Name',
                subscription: u.subscription || 'free',
                onboardingComplete: u.onboardingComplete || false,
                createdAt: createdAtStr,
                resumeCount,
            };
        });

        return NextResponse.json({
            users: userList,
            stats: {
                totalUsers: userList.length,
                totalResumes,
                premiumUsers: premiumCount,
                onboardedUsers: onboardedCount,
            }
        });
    } catch (error) {
        console.error('Admin API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch admin data' }, { status: 500 });
    }
}
