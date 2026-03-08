export interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    currency: string;
    period: 'one-time' | 'weekly' | 'monthly';
    features: string[];
    popular?: boolean;
    tier: import('./user').SubscriptionTier;
}

export interface PaymentOrder {
    orderId: string;
    amount: number;
    currency: string;
    receipt: string;
}

export interface PaymentVerification {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

export const PRICING_PLANS: SubscriptionPlan[] = [
    {
        id: 'free',
        name: 'Free',
        price: 0,
        currency: 'INR',
        period: 'one-time',
        tier: 'free',
        features: [
            '3 AI generations per day',
            'Basic resume builder',
            'Limited JD matching',
            'ATS score check',
        ],
    },
    {
        id: 'pdf_unlock',
        name: 'PDF Unlock',
        price: 29,
        currency: 'INR',
        period: 'one-time',
        tier: 'pdf_unlock',
        features: [
            'Everything in Free',
            'Unlimited PDF downloads',
            'High-quality PDF export',
            'Custom resume templates',
        ],
    },
    {
        id: 'weekly',
        name: 'Pro Weekly',
        price: 109,
        currency: 'INR',
        period: 'weekly',
        tier: 'weekly',
        popular: true,
        features: [
            'Everything in PDF Unlock',
            'Unlimited AI optimizations',
            'Full JD match analysis',
            'Resume rebuild feature',
            'Priority AI processing',
        ],
    },
    {
        id: 'monthly',
        name: 'Ultimate Monthly',
        price: 499,
        currency: 'INR',
        period: 'monthly',
        tier: 'monthly',
        features: [
            'Everything in Pro Weekly',
            'Cover letter generator',
            'AI career assistant',
            'Advanced analytics',
            'Email support',
            'Early access to features',
        ],
    },
];
