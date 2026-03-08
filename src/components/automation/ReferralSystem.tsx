'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Copy, CheckCircle2, Gift, Users, X, Trophy } from 'lucide-react';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export function ReferralSystem() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [referralCode, setReferralCode] = useState('');
    const [referralCount, setReferralCount] = useState(0);
    const [copied, setCopied] = useState(false);

    // Generate or fetch referral code
    useEffect(() => {
        if (!user) return;

        const fetchOrCreateReferral = async () => {
            const refDoc = doc(db, 'referrals', user.uid);
            const refSnap = await getDoc(refDoc);

            if (refSnap.exists()) {
                const data = refSnap.data();
                setReferralCode(data.code);
                setReferralCount(data.referralCount || 0);
            } else {
                // Generate unique code: PF-[first 4 chars of name]-[random 4]
                const namePrefix = (user.displayName || 'user').replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase();
                const randomSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
                const code = `PF-${namePrefix}-${randomSuffix}`;

                await setDoc(refDoc, {
                    code,
                    userId: user.uid,
                    email: user.email,
                    referralCount: 0,
                    createdAt: serverTimestamp(),
                });
                // Also store a lookup entry so trackReferral() can find the referrer by code
                const codeLookupDoc = doc(db, 'referral_codes', code);
                await setDoc(codeLookupDoc, {
                    userId: user.uid,
                    code,
                    createdAt: serverTimestamp(),
                });
                setReferralCode(code);
            }
        };

        fetchOrCreateReferral().catch(console.error);
    }, [user]);

    const referralLink = typeof window !== 'undefined'
        ? `${window.location.origin}/signup?ref=${referralCode}`
        : '';

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(referralLink);
            setCopied(true);
            toast.success('Referral link copied!');
            setTimeout(() => setCopied(false), 3000);
        } catch {
            toast.error('Failed to copy');
        }
    }, [referralLink]);

    const handleShare = useCallback(async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'PersonaForge — AI Resume Builder',
                    text: 'Build an ATS-perfect resume in minutes with AI. Use my referral link:',
                    url: referralLink,
                });
            } catch {
                // User cancelled share
            }
        } else {
            handleCopy();
        }
    }, [referralLink, handleCopy]);

    if (!user) return null;

    const milestones = [
        { count: 3, reward: '1 Month Pro Free', icon: Gift },
        { count: 10, reward: 'Lifetime Access', icon: Trophy },
        { count: 25, reward: 'Exclusive Badge', icon: Users },
    ];

    const nextMilestone = milestones.find(m => referralCount < m.count);
    const progressPercent = nextMilestone
        ? (referralCount / nextMilestone.count) * 100
        : 100;

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-400 text-sm font-bold hover:bg-purple-600/20 transition-all"
            >
                <Gift className="w-4 h-4" />
                Refer & Earn
                {referralCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-black">
                        {referralCount}
                    </span>
                )}
            </button>

            {/* Referral Modal */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                        onClick={() => setIsOpen(false)}
                    >
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', damping: 25 }}
                            className="relative w-full max-w-lg glass-card p-8 border-purple-500/30 shadow-purple-glow-lg overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Decorative */}
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-600/20 blur-[80px] rounded-full pointer-events-none" />

                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/20 flex items-center justify-center">
                                        <Gift className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-display font-bold text-white">Refer & Earn</h3>
                                        <p className="text-gray-400 text-sm">Share PersonaForge, unlock rewards</p>
                                    </div>
                                </div>

                                {/* Referral Link */}
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 font-mono truncate">
                                        {referralLink}
                                    </div>
                                    <button
                                        onClick={handleCopy}
                                        className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                                    >
                                        {copied ? (
                                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                                        ) : (
                                            <Copy className="w-5 h-5 text-gray-400" />
                                        )}
                                    </button>
                                    <button
                                        onClick={handleShare}
                                        className="px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 transition-colors"
                                    >
                                        <Share2 className="w-5 h-5 text-white" />
                                    </button>
                                </div>

                                {/* Progress */}
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-400 font-bold">
                                            {referralCount} referral{referralCount !== 1 ? 's' : ''}
                                        </span>
                                        {nextMilestone && (
                                            <span className="text-xs text-purple-400 font-bold">
                                                {nextMilestone.count - referralCount} more for {nextMilestone.reward}
                                            </span>
                                        )}
                                    </div>
                                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(progressPercent, 100)}%` }}
                                            transition={{ duration: 1, ease: 'easeOut' }}
                                        />
                                    </div>
                                </div>

                                {/* Milestones */}
                                <div className="space-y-3">
                                    {milestones.map((milestone, i) => {
                                        const achieved = referralCount >= milestone.count;
                                        return (
                                            <div
                                                key={i}
                                                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${achieved
                                                    ? 'bg-purple-600/10 border-purple-500/30'
                                                    : 'bg-white/[0.02] border-white/5'
                                                    }`}
                                            >
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${achieved ? 'bg-purple-600/20' : 'bg-white/5'
                                                    }`}>
                                                    {achieved ? (
                                                        <CheckCircle2 className="w-5 h-5 text-purple-400" />
                                                    ) : (
                                                        <milestone.icon className="w-5 h-5 text-gray-500" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`text-sm font-bold ${achieved ? 'text-white' : 'text-gray-400'}`}>
                                                        {milestone.count} Referrals
                                                    </p>
                                                    <p className={`text-xs ${achieved ? 'text-purple-400' : 'text-gray-500'}`}>
                                                        {milestone.reward}
                                                    </p>
                                                </div>
                                                {achieved && (
                                                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider">Unlocked</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

/**
 * Server-side helper: Track when a referred user signs up.
 * Call this from the signup API or auth flow.
 */
export async function trackReferral(referralCode: string): Promise<boolean> {
    try {
        // Find the referral doc by code (in a real app, use a query)
        // For simplicity, we store a lookup in a separate collection
        const lookupDoc = doc(db, 'referral_codes', referralCode);
        const lookupSnap = await getDoc(lookupDoc);

        if (lookupSnap.exists()) {
            const referrerId = lookupSnap.data().userId;
            const refDoc = doc(db, 'referrals', referrerId);
            await updateDoc(refDoc, {
                referralCount: increment(1),
            });
            return true;
        }
        return false;
    } catch {
        return false;
    }
}
