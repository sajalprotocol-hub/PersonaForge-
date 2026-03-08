'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, FileText, TrendingUp, X } from 'lucide-react';

interface ProofNotification {
    id: number;
    message: string;
    icon: React.ElementType;
    time: string;
}

// Simulated social proof notifications — replace with real Firestore data later
const PROOF_MESSAGES: ProofNotification[] = [
    { id: 1, message: 'Someone from Mumbai just created a resume', icon: FileText, time: '2 min ago' },
    { id: 2, message: 'Priya improved her ATS score to 94%', icon: TrendingUp, time: '5 min ago' },
    { id: 3, message: '12 resumes created in the last hour', icon: Users, time: 'Just now' },
    { id: 4, message: 'Rahul got shortlisted using PersonaForge', icon: TrendingUp, time: '8 min ago' },
    { id: 5, message: 'Someone from Bangalore matched 97% to a JD', icon: FileText, time: '3 min ago' },
    { id: 6, message: '500+ resumes forged this week', icon: Users, time: 'Just now' },
    { id: 7, message: 'Ankit landed an interview at Google', icon: TrendingUp, time: '15 min ago' },
    { id: 8, message: 'Someone from Delhi built a cover letter', icon: FileText, time: '1 min ago' },
];

export function SocialProofBar() {
    const [currentNotification, setCurrentNotification] = useState<ProofNotification | null>(null);
    const [dismissed, setDismissed] = useState(false);
    const [notifIndex, setNotifIndex] = useState(0);

    useEffect(() => {
        // Don't show if user dismissed all notifications
        if (dismissed) return;

        // Show first notification after 15 seconds
        const initialDelay = setTimeout(() => {
            setCurrentNotification(PROOF_MESSAGES[0]);
        }, 15000);

        return () => clearTimeout(initialDelay);
    }, [dismissed]);

    useEffect(() => {
        if (!currentNotification || dismissed) return;

        // Auto-hide after 5 seconds
        const hideTimer = setTimeout(() => {
            setCurrentNotification(null);
        }, 5000);

        // Show next notification 20-40 seconds later
        const nextTimer = setTimeout(() => {
            const nextIndex = (notifIndex + 1) % PROOF_MESSAGES.length;
            setNotifIndex(nextIndex);
            setCurrentNotification(PROOF_MESSAGES[nextIndex]);
        }, 20000 + Math.random() * 20000);

        return () => {
            clearTimeout(hideTimer);
            clearTimeout(nextTimer);
        };
    }, [currentNotification, notifIndex, dismissed]);

    const handleDismiss = () => {
        setCurrentNotification(null);
        setDismissed(true);
        sessionStorage.setItem('pf_proof_dismissed', 'true');
    };

    // Check session dismissal
    useEffect(() => {
        if (sessionStorage.getItem('pf_proof_dismissed')) {
            setDismissed(true);
        }
    }, []);

    return (
        <AnimatePresence>
            {currentNotification && !dismissed && (
                <motion.div
                    initial={{ opacity: 0, x: -100, y: 0 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed bottom-6 left-6 z-50 flex items-center gap-4 px-5 py-4 glass-card border-white/10 shadow-2xl max-w-sm"
                >
                    <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/20 flex items-center justify-center shrink-0">
                        <currentNotification.icon className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-semibold truncate">{currentNotification.message}</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">{currentNotification.time}</p>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="text-gray-500 hover:text-white transition-colors shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
