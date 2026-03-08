'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock } from 'lucide-react';

interface LaunchCountdownProps {
    /** ISO date string for the launch date. Defaults to March 17, 2026 */
    launchDate?: string;
}

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

/**
 * Animated flip-clock countdown to launch day.
 * Auto-hides after the launch date passes.
 * Completely free — pure client-side.
 */
export function LaunchCountdown({ launchDate = '2026-03-17T00:00:00+05:30' }: LaunchCountdownProps) {
    const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
    const [isLaunched, setIsLaunched] = useState(false);

    const calculateTimeLeft = useCallback((): TimeLeft | null => {
        const target = new Date(launchDate).getTime();
        const now = Date.now();
        const diff = target - now;

        if (diff <= 0) {
            setIsLaunched(true);
            return null;
        }

        return {
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((diff % (1000 * 60)) / 1000),
        };
    }, [launchDate]);

    useEffect(() => {
        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearInterval(timer);
    }, [calculateTimeLeft]);

    if (isLaunched || !timeLeft) return null;

    const blocks = [
        { value: timeLeft.days, label: 'Days' },
        { value: timeLeft.hours, label: 'Hours' },
        { value: timeLeft.minutes, label: 'Minutes' },
        { value: timeLeft.seconds, label: 'Seconds' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 sm:p-12 border-purple-500/20 text-center relative overflow-hidden"
        >
            <div className="absolute -top-20 -left-20 w-48 h-48 bg-purple-600/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-indigo-600/10 blur-[80px] rounded-full pointer-events-none" />

            <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-widest mb-6">
                    <Calendar className="w-4 h-4" />
                    Launch Countdown
                </div>

                <h2 className="text-2xl sm:text-4xl font-display font-bold text-white mb-2">
                    We Go Live In
                </h2>
                <p className="text-gray-400 mb-8">
                    Sign up now to get early access and be first in line.
                </p>

                <div className="flex items-center justify-center gap-3 sm:gap-6">
                    {blocks.map((block, i) => (
                        <React.Fragment key={block.label}>
                            <div className="flex flex-col items-center">
                                <motion.div
                                    key={block.value}
                                    initial={{ rotateX: -90, opacity: 0 }}
                                    animate={{ rotateX: 0, opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-2 relative overflow-hidden"
                                >
                                    <div className="absolute inset-x-0 top-1/2 h-[1px] bg-white/5" />
                                    <span className="text-3xl sm:text-5xl font-display font-black text-white tabular-nums">
                                        {String(block.value).padStart(2, '0')}
                                    </span>
                                </motion.div>
                                <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    {block.label}
                                </span>
                            </div>
                            {i < blocks.length - 1 && (
                                <span className="text-2xl sm:text-4xl font-bold text-purple-500/30 -mt-6">:</span>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
