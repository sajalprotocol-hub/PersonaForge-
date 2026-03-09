'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getUserStats } from '@/lib/firestore';
import {
    FileText, Target, RefreshCw, Mail, TrendingUp,
    Sparkles, ArrowRight, Crown, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { TiltCard } from '@/components/ui/TiltCard';
import { WelcomeNudge } from '@/components/automation/WelcomeNudge';
import { ReferralSystem } from '@/components/automation/ReferralSystem';

const QUICK_ACTIONS = [
    { href: '/resume-builder', icon: FileText, title: 'Build Resume', desc: 'Create an AI-optimized resume', color: 'from-brand-500 to-brand-600' },
    { href: '/jd-match', icon: Target, title: 'Match JD', desc: 'Analyze job description fit', color: 'from-green-500 to-emerald-600' },
    { href: '/cover-letter', icon: Mail, title: 'Cover Letter', desc: 'Generate tailored letters', color: 'from-purple-500 to-violet-600' },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

export default function DashboardPage() {
    const { profile, user } = useAuth();
    const [stats, setStats] = useState({ resumeCount: 0, bestMatchScore: 0, totalMatches: 0 });
    const [statsLoading, setStatsLoading] = useState(true);

    useEffect(() => {
        if (user?.uid) {
            setStatsLoading(true);
            getUserStats(user.uid)
                .then(setStats)
                .catch(() => setStats({ resumeCount: 0, bestMatchScore: 0, totalMatches: 0 }))
                .finally(() => setStatsLoading(false));
        } else {
            setStatsLoading(false);
        }
    }, [user?.uid]);

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const matchScoreColor = stats.bestMatchScore >= 80 ? 'text-green-500' : stats.bestMatchScore >= 60 ? 'text-yellow-500' : stats.bestMatchScore > 0 ? 'text-orange-500' : 'text-surface-400';

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-6xl mx-auto space-y-8"
        >
            {/* Welcome Nudge for new users */}
            <WelcomeNudge />

            {/* Welcome section */}
            <motion.div variants={itemVariants} className="glass-card p-6 sm:p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/20 transition-colors duration-500" />
                <div className="relative">
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        <span className="text-sm font-bold text-purple-400 uppercase tracking-widest">Dashboard</span>
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-display font-bold mb-2">
                        {greeting()}, <span className="nebula-text">{profile?.displayName?.split(' ')[0] || 'there'}</span>! 👋
                    </h1>
                    <p className="text-gray-400 font-medium">Ready to build your career? Pick an action below to get started.</p>
                </div>
            </motion.div>

            {/* Onboarding prompt */}
            {!profile?.onboardingComplete && (
                <motion.div variants={itemVariants} className="glass-card p-6 border-2 border-purple-500/30 relative overflow-hidden">
                    <div className="absolute inset-0 bg-purple-500/5 animate-pulse-glow" />
                    <div className="flex items-start gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-purple-900/30 flex items-center justify-center shrink-0 border border-purple-500/20">
                            <Clock className="w-6 h-6 text-purple-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-display font-bold text-lg mb-1">Complete Your Profile</h3>
                            <p className="text-sm text-gray-400 mb-4 font-medium">
                                Fill in your details so our AI can generate personalized resume content for you.
                            </p>
                            <Link href="/onboarding" className="group relative px-6 py-2.5 bg-purple-600 rounded-xl overflow-hidden inline-flex items-center gap-2 transition-all hover:bg-purple-500 hover:shadow-purple-glow">
                                <span className="relative z-10 font-bold">Start Onboarding</span>
                                <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Quick actions */}
            <div>
                <h2 className="font-display font-black text-xs text-gray-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                    <span className="w-4 h-[1px] bg-white/10" />
                    Quick Actions
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {QUICK_ACTIONS.map((action, idx) => (
                        <motion.div key={action.href} variants={itemVariants} className="h-full">
                            <TiltCard className="h-full">
                                <Link href={action.href}
                                    className="glass-card p-5 glass-card-hover group relative overflow-hidden block h-full shimmer-sweep">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:rotate-6 transition-all duration-300 shadow-lg`}>
                                        <action.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="font-display font-bold text-base mb-1 group-hover:text-purple-400 transition-colors">{action.title}</h3>
                                    <p className="text-xs text-gray-500 font-medium leading-relaxed">{action.desc}</p>

                                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all duration-300">
                                        <ArrowRight className="w-4 h-4 text-purple-400" />
                                    </div>
                                </Link>
                            </TiltCard>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Actionable Stats */}
            <div>
                <h2 className="font-display font-black text-xs text-gray-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                    <span className="w-4 h-[1px] bg-white/10" />
                    Your Progress
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Best ATS Score', value: stats.bestMatchScore > 0 ? `${stats.bestMatchScore}%` : '—', icon: Target, color: matchScoreColor, sub: stats.bestMatchScore > 0 ? 'From JD analyses' : 'Run a JD Match' },
                        { label: 'JD Analyses', value: stats.totalMatches, icon: TrendingUp, color: 'text-purple-400', sub: 'Total analyses run' },
                        { label: 'Resumes', value: stats.resumeCount, icon: FileText, color: 'text-blue-400', sub: 'Created & saved' },
                        { label: 'Current Plan', value: profile?.subscription || 'Free', icon: Crown, color: 'text-yellow-500', sub: profile?.subscription === 'free' ? 'Upgrade for more' : 'Premium access' },
                    ].map((stat, i) => (
                        <motion.div key={i} variants={itemVariants}>
                            <TiltCard>
                                <div className="glass-card p-5 group shimmer-sweep">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.label}</span>
                                        <stat.icon className={`w-4 h-4 ${stat.color} opacity-50 group-hover:opacity-100 transition-opacity`} />
                                    </div>
                                    <p className={`text-2xl font-display font-black mb-1 ${stat.color}`}>
                                        {statsLoading ? (
                                            <span className="inline-block w-8 h-7 rounded bg-white/5 animate-pulse" />
                                        ) : stat.value}
                                    </p>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{stat.sub}</p>
                                </div>
                            </TiltCard>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Rewards & Referrals */}
            <div>
                <h2 className="font-display font-black text-xs text-gray-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                    <span className="w-4 h-[1px] bg-white/10" />
                    Rewards Program
                </h2>
                <motion.div variants={itemVariants}>
                    <div className="glass-card p-0 overflow-hidden group border-purple-500/20 shadow-purple-glow-sm">
                        <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />

                            <div className="text-center md:text-left relative z-10 flex-1">
                                <h3 className="text-2xl font-display font-black mb-2 flex items-center justify-center md:justify-start gap-3">
                                    <Sparkles className="w-6 h-6 text-purple-400" />
                                    The Elite Circle Rewards
                                </h3>
                                <p className="text-gray-400 font-medium max-w-xl">
                                    Invite your network to PersonaForge. For every 3 successful referrals, you unlock **1 Month of Pro access** absolutely free. Reach 10 for **Lifetime access**.
                                </p>
                            </div>

                            <div className="shrink-0 relative z-10">
                                <ReferralSystem variant="button" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Subscription info */}
            <motion.div variants={itemVariants} className="glass-card p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-transparent" />
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="text-center sm:text-left">
                        <h3 className="font-display font-bold text-xl mb-1 flex items-center justify-center sm:justify-start gap-2">
                            Current Plan: <span className="nebula-text uppercase tracking-widest">{profile?.subscription || 'Free'}</span>
                        </h3>
                        <p className="text-sm text-gray-400 font-medium">
                            {profile?.subscription === 'free' || !profile?.subscription
                                ? 'Upgrade to unlock unlimited AI optimizations and premium features.'
                                : 'You have full access to all features.'}
                        </p>
                    </div>
                    {(profile?.subscription === 'free' || !profile?.subscription) && (
                        <Link href="/settings" className="px-8 py-3 bg-white text-black hover:bg-purple-100 transition-all rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-white/10 hover:shadow-purple-glow-lg active:scale-95">
                            Upgrade Now
                        </Link>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
