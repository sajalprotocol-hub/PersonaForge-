import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthError } from '@/lib/auth-helpers';
import Razorpay from 'razorpay';

// Server-side pricing table — never trust client-sent amounts
// Plan IDs match PRICING_PLANS in src/types/subscription.ts
const PRICING: Record<string, number> = {
    pdf_unlock: 2900,   // ₹29 in paise
    weekly: 10900,      // ₹109 in paise
    monthly: 49900,     // ₹499 in paise
};

export async function POST(req: NextRequest) {
    const authResult = await verifyAuth(req);
    if (isAuthError(authResult)) return authResult;

    try {
        const { planId } = await req.json();

        const amount = PRICING[planId];
        if (!amount) {
            return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
        }

        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            console.error('Razorpay keys not configured');
            return NextResponse.json({ error: 'Payment system not configured' }, { status: 500 });
        }

        const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
        const order = await instance.orders.create({
            amount,
            currency: 'INR',
            receipt: `receipt_${planId}_${Date.now()}`,
        });

        return NextResponse.json({
            orderId: order.id,
            amount,
            currency: 'INR',
            receipt: `receipt_${planId}_${Date.now()}`,
        });
    } catch (error) {
        console.error('Create Order Error:', error);
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
}
