'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ArrowRight, CheckCircle2, Zap } from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface EmailCaptureModalProps {
    /** Delay in ms before the modal can appear (scroll-triggered) */
    scrollThreshold?: number;
    /** Whether to also trigger on exit intent (mouse leaving viewport) */
    exitIntent?: boolean;
}

export function EmailCaptureModal({ scrollThreshold = 50, exitIntent = true }: EmailCaptureModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [dismissed, setDismissed] = useState(false);

    // Check if already captured or dismissed
    useEffect(() => {
        const alreadyCaptured = localStorage.getItem('pf_email_captured');
        const alreadyDismissed = sessionStorage.getItem('pf_modal_dismissed');
        if (alreadyCaptured || alreadyDismissed) {
            setDismissed(true);
        }
    }, []);

    // Scroll trigger
    useEffect(() => {
        if (dismissed) return;

        const handleScroll = () => {
            const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            if (scrollPercent >= scrollThreshold) {
                setIsOpen(true);
                window.removeEventListener('scroll', handleScroll);
            }
        };

        // Delay attaching to avoid immediate popup
        const timer = setTimeout(() => {
            window.addEventListener('scroll', handleScroll, { passive: true });
        }, 5000);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [scrollThreshold, dismissed]);

    // Exit intent trigger
    useEffect(() => {
        if (!exitIntent || dismissed) return;

        const handleMouseLeave = (e: MouseEvent) => {
            if (e.clientY <= 0 && !isOpen) {
                setIsOpen(true);
            }
        };

        // Delay to avoid triggering on page load
        const timer = setTimeout(() => {
            document.addEventListener('mouseleave', handleMouseLeave);
        }, 10000);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [exitIntent, dismissed, isOpen]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setDismissed(true);
        sessionStorage.setItem('pf_modal_dismissed', 'true');
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || status === 'loading') return;

        setStatus('loading');
        try {
            // Save to Firestore (free tier — no external email service needed)
            const emailId = email.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            await setDoc(doc(db, 'email_subscribers', emailId), {
                email: email.toLowerCase().trim(),
                source: 'modal',
                subscribedAt: serverTimestamp(),
                referrer: typeof window !== 'undefined' ? window.location.pathname : '/',
            });

            localStorage.setItem('pf_email_captured', 'true');
            setStatus('success');

            // Auto-close after success
            setTimeout(() => {
                setIsOpen(false);
                setDismissed(true);
            }, 3000);
        } catch {
            setStatus('error');
        }
    };

    if (dismissed && !isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    onClick={handleClose}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-md glass-card p-8 border-purple-500/30 shadow-purple-glow-lg overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Decorative glow */}
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-600/20 blur-[80px] rounded-full pointer-events-none" />
                        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-indigo-600/20 blur-[80px] rounded-full pointer-events-none" />

                        {/* Close button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {status === 'success' ? (
                            <div className="text-center py-8 relative z-10">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', damping: 15 }}
                                >
                                    <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                                </motion.div>
                                <h3 className="text-2xl font-display font-bold text-white mb-2">You&apos;re In! 🎉</h3>
                                <p className="text-gray-400">Check your inbox for exclusive resume tips and early access features.</p>
                            </div>
                        ) : (
                            <div className="relative z-10">
                                {/* Badge */}
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
                                    <Zap className="w-3.5 h-3.5 text-purple-400" />
                                    <span className="text-purple-400 text-[10px] font-bold uppercase tracking-[0.2em]">Free Forever</span>
                                </div>

                                <h3 className="text-2xl font-display font-bold text-white mb-3">
                                    Get Your Free ATS Cheat Sheet ✨
                                </h3>
                                <p className="text-gray-400 mb-6 leading-relaxed">
                                    Join 1,000+ job seekers. Get weekly resume tips, ATS hacks, and early access to new features — completely free.
                                </p>

                                {/* Benefits */}
                                <div className="space-y-3 mb-6">
                                    {[
                                        'ATS keyword optimization guide',
                                        'Resume bullet point formulas',
                                        'Early access to new templates'
                                    ].map((benefit, i) => (
                                        <div key={i} className="flex items-center gap-3 text-sm text-gray-300">
                                            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                                            {benefit}
                                        </div>
                                    ))}
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-3">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email address"
                                        required
                                        className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all text-sm"
                                    />
                                    <button
                                        type="submit"
                                        disabled={status === 'loading'}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-500 transition-all active:scale-[0.98] disabled:opacity-50 shadow-purple-glow"
                                    >
                                        {status === 'loading' ? (
                                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                Get Free Access
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                    {status === 'error' && (
                                        <p className="text-red-400 text-xs text-center">Something went wrong. Please try again.</p>
                                    )}
                                </form>

                                <p className="text-[10px] text-gray-500 text-center mt-4 uppercase tracking-wider">
                                    No spam ever. Unsubscribe anytime.
                                </p>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
