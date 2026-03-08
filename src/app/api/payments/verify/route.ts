import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthError } from '@/lib/auth-helpers';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    // Auth check
    const authResult = await verifyAuth(req);
    if (isAuthError(authResult)) return authResult;

    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = await req.json();

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planId) {
            return NextResponse.json({ error: 'Missing required payment fields' }, { status: 400 });
        }

        // Security: Verify Razorpay signature
        const crypto = await import('crypto');
        const secret = process.env.RAZORPAY_KEY_SECRET;

        if (!secret) {
            console.error('RAZORPAY_KEY_SECRET is not configured');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            console.warn('Invalid payment signature attempt:', { razorpay_order_id, userId: authResult.uid });
            return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
        }

        // Determine subscription tier and expiry from planId
        const PLAN_DURATIONS: Record<string, number> = {
            pdf_unlock: 36500,  // one-time — ~100 years
            weekly: 7,
            monthly: 30,
        };

        const durationDays = PLAN_DURATIONS[planId];
        if (!durationDays) {
            return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
        }

        const tier = planId;
        const expiryDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

        // CRITICAL: Actually update the user's subscription in Firestore
        await adminDb.collection('users').doc(authResult.uid).update({
            subscription: tier,
            subscriptionExpiry: expiryDate,
            lastPaymentId: razorpay_payment_id,
            lastPaymentDate: new Date().toISOString(),
        });

        console.log('Payment verified and subscription updated:', {
            razorpay_order_id,
            razorpay_payment_id,
            planId,
            userId: authResult.uid,
            tier,
            expiryDate,
        });

        return NextResponse.json({
            success: true,
            message: 'Payment verified and subscription updated',
            subscription: tier,
            expiryDate,
        });
    } catch (error) {
        console.error('Verify Payment Error:', error);
        return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
    }
}
