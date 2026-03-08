'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ArrowRight, X, Sparkles, Crown } from 'lucide-react';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

/* ─── Usage Limits by Tier ─── */
const TIER_LIMITS: Record<string, { aiGenerations: number; resumes: number; jdMatches: number }> = {
    free: { aiGenerations: 5, resumes: 1, jdMatches: 3 },
    growth: { aiGenerations: 30, resumes: 3, jdMatches: -1 },   // -1 = unlimited
    pro: { aiGenerations: -1, resumes: -1, jdMatches: -1 },
    lifetime: { aiGenerations: -1, resumes: -1, jdMatches: -1 },
};

interface UsageData {
    aiGenerations: number;
    resumes: number;
    jdMatches: number;
    lastResetDate: string;
}

interface UsageContextType {
    usage: UsageData;
    limits: typeof TIER_LIMITS['free'];
    canUseFeature: (feature: keyof Omit<UsageData, 'lastResetDate'>) => boolean;
    trackUsage: (feature: keyof Omit<UsageData, 'lastResetDate'>) => Promise<boolean>;
    showUpgradePrompt: boolean;
    setShowUpgradePrompt: (show: boolean) => void;
    upgradeReason: string;
}

const UsageContext = createContext<UsageContextType | undefined>(undefined);

export function UsageProvider({ children }: { children: React.ReactNode }) {
    const { user, profile } = useAuth();
    const [usage, setUsage] = useState<UsageData>({
        aiGenerations: 0,
        resumes: 0,
        jdMatches: 0,
        lastResetDate: new Date().toISOString().split('T')[0],
    });
    const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
    const [upgradeReason, setUpgradeReason] = useState('');

    const tier = profile?.subscription || 'free';
    const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;

    // Fetch usage data
    useEffect(() => {
        if (!user) return;

        const fetchUsage = async () => {
            const today = new Date().toISOString().split('T')[0];
            const usageDoc = doc(db, 'users', user.uid, 'usage', 'daily');
            const usageSnap = await getDoc(usageDoc);

            if (usageSnap.exists()) {
                const data = usageSnap.data() as UsageData;
                // Reset daily counters
                if (data.lastResetDate !== today) {
                    const resetData: UsageData = {
                        aiGenerations: 0,
                        resumes: data.resumes, // Keep cumulative resume count
                        jdMatches: 0,
                        lastResetDate: today,
                    };
                    await setDoc(usageDoc, resetData);
                    setUsage(resetData);
                } else {
                    setUsage(data);
                }
            } else {
                const initialData: UsageData = {
                    aiGenerations: 0,
                    resumes: 0,
                    jdMatches: 0,
                    lastResetDate: today,
                };
                await setDoc(usageDoc, initialData);
                setUsage(initialData);
            }
        };

        fetchUsage().catch(console.error);
    }, [user]);

    const canUseFeature = useCallback((feature: keyof Omit<UsageData, 'lastResetDate'>) => {
        const limit = limits[feature];
        if (limit === -1) return true; // Unlimited
        return usage[feature] < limit;
    }, [usage, limits]);

    const trackUsage = useCallback(async (feature: keyof Omit<UsageData, 'lastResetDate'>): Promise<boolean> => {
        if (!canUseFeature(feature)) {
            const featureNames: Record<string, string> = {
                aiGenerations: 'AI generations',
                resumes: 'resumes',
                jdMatches: 'JD matches',
            };
            setUpgradeReason(`You've used all your free ${featureNames[feature]} for today.`);
            setShowUpgradePrompt(true);
            return false;
        }

        // Update local state
        setUsage(prev => ({ ...prev, [feature]: prev[feature] + 1 }));

        // Update Firestore
        if (user) {
            const usageDoc = doc(db, 'users', user.uid, 'usage', 'daily');
            await updateDoc(usageDoc, { [feature]: increment(1) }).catch(() => { });
        }

        // Show soft nudge when approaching limit
        const limit = limits[feature];
        if (limit !== -1 && usage[feature] + 1 >= limit * 0.8) {
            setUpgradeReason(`You're running low on free ${feature}. Upgrade to continue without limits.`);
            // Don't auto-show, just set the reason for later
        }

        return true;
    }, [canUseFeature, user, usage, limits]);

    return (
        <UsageContext.Provider value={{
            usage,
            limits,
            canUseFeature,
            trackUsage,
            showUpgradePrompt,
            setShowUpgradePrompt,
            upgradeReason,
        }}>
            {children}
            <UpgradePromptModal
                isOpen={showUpgradePrompt}
                onClose={() => setShowUpgradePrompt(false)}
                reason={upgradeReason}
            />
        </UsageContext.Provider>
    );
}

export function useUsage() {
    const context = useContext(UsageContext);
    if (!context) {
        throw new Error('useUsage must be used within a UsageProvider');
    }
    return context;
}

/* ─── Upgrade Prompt Modal ─── */
function UpgradePromptModal({ isOpen, onClose, reason }: {
    isOpen: boolean;
    onClose: () => void;
    reason: string;
}) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25 }}
                        className="relative w-full max-w-md glass-card p-8 border-purple-500/30 shadow-purple-glow-lg overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-600/20 blur-[80px] rounded-full pointer-events-none" />

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="relative z-10 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-purple-glow">
                                <Crown className="w-8 h-8 text-white" />
                            </div>

                            <h3 className="text-2xl font-display font-bold text-white mb-3">
                                Unlock Full Power
                            </h3>

                            <p className="text-gray-400 mb-6 leading-relaxed">
                                {reason || 'Upgrade to Pro for unlimited AI generations, premium templates, and priority support.'}
                            </p>

                            <div className="space-y-3 mb-6 text-left">
                                {[
                                    'Unlimited AI resume generations',
                                    'Priority GPT-4 processing',
                                    'Unlimited JD matching',
                                    'Cover letter generator',
                                    'Early access to new features',
                                ].map((feature, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm text-gray-300">
                                        <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                                        {feature}
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3">
                                <Link
                                    href="/#pricing"
                                    onClick={onClose}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-500 transition-all active:scale-[0.98] shadow-purple-glow"
                                >
                                    <Zap className="w-4 h-4" />
                                    View Plans — Starting at ₹29/week
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                                <button
                                    onClick={onClose}
                                    className="w-full px-6 py-3 rounded-xl bg-white/5 text-gray-400 text-sm font-bold hover:bg-white/10 transition-all"
                                >
                                    Maybe Later
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
