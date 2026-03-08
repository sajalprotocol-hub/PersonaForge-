'use client';

import React from 'react';
import { Sparkles, Brain, RotateCw } from 'lucide-react';
import { useAI } from '@/context/AIContext';
import { motion, AnimatePresence } from 'framer-motion';

export const AIOrb: React.FC = () => {
    const { state, message } = useAI();
    const isProcessing = state === 'processing';
    const isThinking = state === 'thinking' || state === 'speaking';
    const isActive = isProcessing || isThinking;

    return (
        <div className="fixed bottom-8 right-8 z-50 cursor-pointer group">
            <div className="relative">
                {/* Glow ring layers */}
                <div className="absolute inset-[-12px] bg-purple-500/20 rounded-full blur-2xl group-hover:bg-purple-500/40 transition-all duration-500 animate-pulse" />
                <div className="absolute inset-[-4px] bg-indigo-500/10 rounded-full blur-xl animate-ping" style={{ animationDuration: '4s' }} />

                {/* Main Orb */}
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 via-violet-500 to-indigo-600 flex items-center justify-center border border-white/20 shadow-[0_0_20px_rgba(124,58,237,0.4)] animate-orb-float overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.4),transparent)] opacity-60" />

                    <AnimatePresence mode="wait">
                        {isThinking ? (
                            <motion.div
                                key="brain"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                            >
                                <Brain className="w-8 h-8 text-white relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="sparkles"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                            >
                                <Sparkles className="w-8 h-8 text-white relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent rotate-45 translate-x-[-100%] animate-[shimmer_3s_infinite]" />
                </div>

                {/* Status indicator */}
                <div className={`absolute top-1 right-1 w-4 h-4 rounded-full border-2 border-black z-20 transition-colors duration-500 ${isActive ? 'bg-purple-400 animate-pulse' : 'bg-green-500'}`} />

                {/* Tooltip / Status Message */}
                <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl text-white text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none shadow-2xl flex items-center gap-2">
                    {isActive ? (
                        <>
                            <RotateCw className="w-3 h-3 animate-spin text-purple-400" />
                            {message || 'AI Synthesizing...'}
                        </>
                    ) : (
                        "Ask PersonaForge AI"
                    )}
                </div>
            </div>
        </div>
    );
};
