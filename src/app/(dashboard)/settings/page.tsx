'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Settings, CreditCard, User, Check, Crown, Sparkles } from 'lucide-react';
import { PRICING_PLANS } from '@/types/subscription';
import toast from 'react-hot-toast';
import { authFetch } from '@/lib/api-client';

export default function SettingsPage() {
    const { profile, user, loading: authLoading } = useAuth();
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

    // Load Razorpay checkout.js script
    useEffect(() => {
        if (typeof window !== 'undefined' && !(window as any).Razorpay) {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);

    if (authLoading || !profile) {
        return (
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
                <div className="h-8 w-48 bg-surface-200 dark:bg-surface-700 rounded animate-pulse" />
                <div className="glass-card p-6 space-y-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-12 bg-surface-100 dark:bg-surface-800 rounded-lg animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    const handleUpgrade = async (planId: string, amount: number) => {
        setLoadingPlan(planId);
        try {
            const res = await authFetch('/api/payments/create-order', {
                method: 'POST',
                body: JSON.stringify({ planId, amount }),
            });
            const data = await res.json();

            if (data.orderId && typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).Razorpay) {
                const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                    amount: amount * 100,
                    currency: 'INR',
                    name: 'PersonaForge',
                    description: `${planId} Plan`,
                    order_id: data.orderId,
                    handler: async (response: Record<string, string>) => {
                        await authFetch('/api/payments/verify', {
                            method: 'POST',
                            body: JSON.stringify({
                                ...response,
                                planId,
                                userId: user?.uid,
                            }),
                        });
                        toast.success('Payment successful! Enjoy your upgrade.');
                        window.location.reload();
                    },
                    prefill: {
                        email: user?.email,
                        name: profile?.displayName,
                    },
                    theme: { color: '#4c6ef5' },
                };
                const razorpay = new ((window as unknown as Record<string, new (opts: unknown) => { open: () => void }>).Razorpay)(options);
                (razorpay as { open: () => void }).open();
            } else {
                toast.error('Payment system unavailable. Please try again.');
            }
        } catch {
            toast.error('Payment failed. Please try again.');
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
            <div>
                <h1 className="text-2xl font-display font-bold flex items-center gap-2">
                    <Settings className="w-6 h-6 text-surface-500" />
                    Settings
                </h1>
            </div>

            {/* Profile */}
            <div className="glass-card p-6">
                <h2 className="font-display font-bold text-sm mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-brand-500" /> Profile
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-surface-500">Name</label>
                        <p className="font-medium">{profile?.displayName || 'Not set'}</p>
                    </div>
                    <div>
                        <label className="text-xs text-surface-500">Email</label>
                        <p className="font-medium">{user?.email || 'Not set'}</p>
                    </div>
                    <div>
                        <label className="text-xs text-surface-500">Current Plan</label>
                        <p className="font-medium capitalize flex items-center gap-1.5">
                            {profile?.subscription === 'monthly' && <Crown className="w-4 h-4 text-yellow-500" />}
                            {profile?.subscription || 'Free'}
                        </p>
                    </div>
                    <div>
                        <label className="text-xs text-surface-500">Member Since</label>
                        <p className="font-medium">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}</p>
                    </div>
                </div>
            </div>

            {/* Pricing */}
            <div className="glass-card p-6">
                <h2 className="font-display font-bold text-sm mb-4 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-brand-500" /> Subscription Plans
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {PRICING_PLANS.map((plan) => {
                        const isCurrent = profile?.subscription === plan.tier;
                        return (
                            <div key={plan.id} className={`p-4 rounded-xl border-2 transition-all ${isCurrent ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/10' :
                                plan.popular ? 'border-brand-300 dark:border-brand-700' :
                                    'border-surface-200 dark:border-surface-700'
                                }`}>
                                {plan.popular && (
                                    <span className="text-xs font-bold text-brand-500 flex items-center gap-1 mb-2">
                                        <Sparkles className="w-3 h-3" /> Popular
                                    </span>
                                )}
                                <h3 className="font-display font-bold text-sm">{plan.name}</h3>
                                <p className="text-xl font-bold mt-1">
                                    {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                                    {plan.price > 0 && <span className="text-xs font-normal text-surface-500">/{plan.period === 'one-time' ? 'once' : plan.period === 'weekly' ? 'wk' : 'mo'}</span>}
                                </p>
                                <ul className="my-3 space-y-1.5">
                                    {plan.features.slice(0, 3).map((f, i) => (
                                        <li key={i} className="flex items-start gap-1.5 text-xs text-surface-600 dark:text-surface-400">
                                            <Check className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                {isCurrent ? (
                                    <span className="block text-center text-xs font-bold text-brand-500 py-2">Current Plan</span>
                                ) : plan.price > 0 ? (
                                    <button
                                        onClick={() => handleUpgrade(plan.id, plan.price)}
                                        disabled={loadingPlan === plan.id}
                                        className="btn-primary w-full text-xs !py-2"
                                    >
                                        {loadingPlan === plan.id ? 'Processing...' : 'Upgrade'}
                                    </button>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
