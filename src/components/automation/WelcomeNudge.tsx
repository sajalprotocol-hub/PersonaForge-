'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export function WelcomeNudge() {
    const { profile, user } = useAuth();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Only show if user is logged in and hasn't completed onboarding
        if (user && profile && !profile.onboardingComplete) {
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [user, profile]);

    const handleDismiss = () => {
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    className="relative z-50 mb-8"
                >
                    <div className="glass-card overflow-hidden border-2 border-brand-500/30 shadow-2xl shadow-brand-500/10">
                        {/* Animated background elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 animate-pulse" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

                        <div className="relative p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/20 rotate-3 group-hover:rotate-6 transition-transform">
                                <Sparkles className="w-8 h-8 text-white" />
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                    <span className="text-xs font-black text-brand-400 uppercase tracking-[0.2em]">New Member Perk</span>
                                    <div className="px-2 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-[10px] font-bold text-brand-400 uppercase tracking-wider flex items-center gap-1">
                                        <Zap className="w-2.5 h-2.5 fill-current" />
                                        AI Ready
                                    </div>
                                </div>
                                <h2 className="text-xl sm:text-2xl font-display font-black mb-2 leading-tight">
                                    Welcome to the <span className="nebula-text">PersonaForge</span> Elite Circle!
                                </h2>
                                <p className="text-gray-400 font-medium max-w-xl">
                                    Your profile is waiting for its finishing touches. Complete our AI onboarding to unlock personalized resume optimizations tailored to your dream career.
                                </p>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <Link
                                    href="/onboarding"
                                    className="px-8 py-3 bg-white text-black font-black rounded-xl text-sm uppercase tracking-widest hover:bg-brand-50 transition-all hover:shadow-brand-glow active:scale-95 group flex items-center gap-2"
                                >
                                    Claim Access
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>

                                <button
                                    onClick={handleDismiss}
                                    className="p-3 text-gray-500 hover:text-white transition-colors hover:bg-white/5 rounded-xl border border-white/5"
                                    aria-label="Dismiss"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
