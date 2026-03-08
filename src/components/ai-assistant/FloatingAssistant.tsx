'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Lightbulb, ChevronRight, Sparkles, Cpu, RotateCw, Brain } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAI } from '@/context/AIContext';
import { motion, AnimatePresence } from 'framer-motion';

const TIPS: Record<string, string[]> = {
    // ... (keep tips)
    '/dashboard': [
        '👋 Welcome! Start by completing your onboarding to get personalized suggestions.',
        '📊 Check your resume score and improve it with AI-powered suggestions.',
        '🎯 Use JD Match to check how well your resume fits a specific job.',
    ],
    '/resume-builder': [
        '✨ Click "Generate All" to create a complete resume in seconds.',
        '🎨 Try different tones — Professional, Creative, Technical, or Executive.',
        '📄 Download your resume as a PDF when you\'re happy with it.',
        '✏️ You can edit the generated text directly in the text fields.',
    ],
    '/jd-match': [
        '📋 Paste a full job description for the most accurate keyword analysis.',
        '🔍 Focus on fixing "Critical" gaps first — they have the biggest impact.',
        '💡 Use the AI-suggested rewrites to improve weak sections.',
    ],
    '/cover-letter': [
        '✉️ Paste a JD and choose a tone for a tailored cover letter.',
        '📝 Edit the generated letter directly before downloading.',
        '🎨 Try Enthusiastic tone for startups, Formal for corporates.',
    ],
    '/settings': [
        '⚙️ View and manage your profile and subscription here.',
        '💳 Upgrade your plan to unlock premium features like Cover Letters.',
    ],
    '/onboarding': [
        '📝 Fill in your details for AI to personalize your resume content.',
        '🎓 Add education and experience for better results.',
        '⚡ You can always update this information later in Settings.',
    ],
};

export default function FloatingAssistant({ customTips }: { customTips?: string[] }) {
    const [open, setOpen] = useState(false);
    const [tipIndex, setTipIndex] = useState(0);
    const pathname = usePathname();
    const { state, message } = useAI();

    // Choose tips: customTips take precedence, then page-specific, then default
    const pageTips = customTips && customTips.length > 0 ? customTips : (TIPS[pathname] || TIPS['/dashboard'] || []);

    useEffect(() => {
        setTipIndex(0);
    }, [pathname, customTips]);

    const nextTip = () => {
        setTipIndex((prev) => (prev + 1) % pageTips.length);
    };

    const isProcessing = state === 'processing';
    const isThinking = state === 'thinking' || state === 'speaking';
    const isActive = isProcessing || isThinking;

    return (
        <>
            {/* Floating button / AI Orb */}
            <div className="fixed bottom-6 right-6 z-50">
                <AnimatePresence mode="wait">
                    {isActive ? (
                        <motion.div
                            key="orb"
                            initial={{ scale: 0, rotate: -180, y: 20 }}
                            animate={{ scale: 1, rotate: 0, y: 0 }}
                            exit={{ scale: 0, rotate: 180, y: 20 }}
                            className="relative group cursor-wait"
                        >
                            {/* Inner Glow Layers */}
                            <div className="absolute inset-[-12px] bg-purple-500/30 rounded-full blur-2xl animate-pulse" />
                            <div className="absolute inset-[-4px] bg-indigo-500/20 rounded-full blur-lg animate-ping" style={{ animationDuration: '3s' }} />

                            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 via-violet-500 to-indigo-600 flex items-center justify-center border border-white/20 shadow-[0_0_30px_rgba(124,58,237,0.5)] overflow-hidden">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.4),transparent)] opacity-60" />

                                <AnimatePresence mode="wait">
                                    {isThinking ? (
                                        <motion.div
                                            key="brain"
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.5 }}
                                        >
                                            <Brain className="w-8 h-8 text-white relative z-10" />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="sparkles"
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.5 }}
                                        >
                                            <Sparkles className="w-8 h-8 text-white relative z-10 animate-pulse" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent rotate-45 translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                            </div>

                            {/* Processing Tooltip - Enhanced */}
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="absolute bottom-full right-0 mb-6 px-4 py-2 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl text-white text-xs font-bold whitespace-nowrap shadow-2xl flex items-center gap-3"
                            >
                                <div className="relative">
                                    <RotateCw className="w-3 h-3 animate-spin text-purple-400" />
                                    <div className="absolute inset-0 bg-purple-400/20 blur-sm rounded-full animate-pulse" />
                                </div>
                                <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent uppercase tracking-wider">
                                    {message || 'Processing Matrix...'}
                                </span>
                            </motion.div>
                        </motion.div>
                    ) : (
                        <motion.button
                            key="button"
                            initial={{ scale: 0, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0, y: 20 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setOpen(!open)}
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-2xl ${open ? 'bg-white text-black rotate-90' : 'bg-purple-600 text-white shadow-purple-glow'
                                }`}
                        >
                            {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Tips popup */}
            <AnimatePresence>
                {open && !isProcessing && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-24 right-6 z-50 w-80 glass-card shadow-2xl rounded-2xl overflow-hidden border border-white/10"
                    >
                        {/* Header */}
                        <div className="bg-purple-600 p-4">
                            <div className="flex items-center gap-2 text-white">
                                <Lightbulb className="w-5 h-5 text-purple-200" />
                                <div>
                                    <h3 className="font-display font-bold text-sm">PersonaForge Tips</h3>
                                    <p className="text-[10px] uppercase font-black tracking-widest text-purple-200/70">Contextual Guide</p>
                                </div>
                            </div>
                        </div>

                        {/* Tip display */}
                        <div className="p-6 bg-black/40 backdrop-blur-md">
                            <div className="bg-white/5 border border-white/5 rounded-xl p-4 min-h-[100px] flex items-center">
                                <p className="text-sm font-medium leading-relaxed text-gray-200">{pageTips[tipIndex]}</p>
                            </div>

                            {/* Navigation */}
                            <div className="flex items-center justify-between mt-6">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                    {tipIndex + 1} / {pageTips.length}
                                </span>
                                <button
                                    onClick={nextTip}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-white text-black hover:bg-gray-200 transition-colors"
                                >
                                    NEXT TIP <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
