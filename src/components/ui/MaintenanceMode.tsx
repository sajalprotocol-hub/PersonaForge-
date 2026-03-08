'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Clock, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface MaintenanceModeProps {
    targetDate: string; // ISO string
}

export const MaintenanceMode: React.FC<MaintenanceModeProps> = ({ targetDate }) => {
    const [timeLeft, setTimeLeft] = useState({
        days: 0, hours: 0, minutes: 0, seconds: 0
    });

    useEffect(() => {
        const calculateTime = () => {
            const difference = +new Date(targetDate) - +new Date();
            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                });
            }
        };

        const timer = setInterval(calculateTime, 1000);
        calculateTime();
        return () => clearInterval(timer);
    }, [targetDate]);

    const TimeUnit = ({ value, label }: { value: number, label: string }) => (
        <div className="flex flex-col items-center">
            <div className="glass-card w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center mb-2 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent group-hover:from-purple-500/20 transition-all duration-500" />
                <span className="text-2xl sm:text-4xl font-display font-black nebula-text">
                    {value.toString().padStart(2, '0')}
                </span>
            </div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-500">{label}</span>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Pulsing Backdrops */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse-slow" />
            </div>

            <div className="relative z-10 max-w-2xl w-full text-center space-y-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-purple-500/30 text-purple-400 text-xs font-bold uppercase tracking-widest mb-4"
                >
                    <Sparkles className="w-4 h-4" />
                    Forge Under Maintenance
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl sm:text-6xl font-display font-black leading-tight"
                >
                    PersonaForge is <span className="nebula-text italic">Evolving</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-gray-400 text-lg max-w-lg mx-auto font-medium"
                >
                    We're upgrading our neural networks to bring you even more powerful career tools. We'll be back in orbit soon.
                </motion.p>

                {/* Countdown */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex justify-center gap-4 sm:gap-8 pt-8"
                >
                    <TimeUnit value={timeLeft.days} label="Days" />
                    <TimeUnit value={timeLeft.hours} label="Hours" />
                    <TimeUnit value={timeLeft.minutes} label="Mins" />
                    <TimeUnit value={timeLeft.seconds} label="Secs" />
                </motion.div>

                {/* Footer Actions */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="pt-12 flex flex-col items-center gap-6"
                >
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    <div className="flex flex-col sm:flex-row items-center gap-4 text-xs font-bold uppercase tracking-widest text-gray-600">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-purple-500/50" />
                            Next Sync: {new Date(targetDate).toLocaleDateString()}
                        </div>
                        <span className="hidden sm:inline text-white/5">|</span>
                        <Link href="/login" className="flex items-center gap-2 text-purple-500/60 hover:text-purple-400 transition-colors group">
                            <Lock className="w-4 h-4" />
                            Admin Access
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </motion.div>
            </div>

            {/* Aesthetic Grid */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>
    );
};
