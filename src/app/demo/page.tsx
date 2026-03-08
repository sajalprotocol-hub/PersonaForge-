'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import {
    Sparkles, ArrowRight, FileText, Target, Zap, Lock,
    User, Mail, Briefcase, CheckCircle2, AlertTriangle,
    ChevronDown, Cpu, Rocket
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Starfield } from '@/components/ui/Starfield';

interface DemoSection {
    summary: string;
    experience: string;
    skills: string;
}

const DEMO_JOB = {
    title: 'Frontend Developer',
    company: 'TechCorp',
    description: 'We are looking for a skilled Frontend Developer with experience in React, TypeScript, and modern CSS frameworks. The ideal candidate should have 2+ years of experience building responsive web applications, strong problem-solving skills, and a passion for clean code architecture.',
};

const DEMO_GENERATED: DemoSection = {
    summary: 'Results-driven Frontend Developer with 3+ years of experience building high-performance web applications using React, TypeScript, and Next.js. Proven track record of improving page load times by 40% and implementing responsive designs that increased mobile engagement by 65%. Passionate about clean code architecture, component reusability, and delivering exceptional user experiences.',
    experience: '• Engineered responsive React components serving 50K+ daily active users, achieving 99.9% uptime\n• Reduced bundle size by 35% through code splitting and lazy loading optimization\n• Implemented TypeScript migration across 120+ components, reducing runtime errors by 60%\n• Built reusable design system with 40+ components, cutting development time by 30%\n• Led A/B testing initiatives that improved conversion rates by 22% across key user flows',
    skills: 'React, TypeScript, Next.js, JavaScript (ES6+), HTML5, CSS3, Tailwind CSS, Redux, REST APIs, GraphQL, Git, Webpack, Jest, Cypress, Figma, Agile/Scrum',
};

export default function DemoPage() {
    const [step, setStep] = useState<'input' | 'generating' | 'result'>('input');
    const [name, setName] = useState('Alex Johnson');
    const [role, setRole] = useState('Frontend Developer');
    const [experience, setExperience] = useState('3 years building web apps with React and TypeScript');
    const [generated, setGenerated] = useState<DemoSection | null>(null);
    const [atsScore, setAtsScore] = useState(0);

    const handleGenerate = useCallback(async () => {
        // Check localStorage rate limit (1 demo per 24h)
        const lastDemo = localStorage.getItem('pf_last_demo');
        if (lastDemo) {
            const hoursSince = (Date.now() - parseInt(lastDemo)) / (1000 * 60 * 60);
            if (hoursSince < 24) {
                // Still allow but show a notice
            }
        }

        setStep('generating');

        // Simulate AI generation with progressive reveal
        await new Promise(r => setTimeout(r, 2000));
        setGenerated(DEMO_GENERATED);
        setAtsScore(87);
        setStep('result');

        localStorage.setItem('pf_last_demo', Date.now().toString());
    }, []);

    return (
        <div className="relative min-h-screen bg-black text-white selection:bg-purple-500/30 font-sans overflow-x-hidden">
            <Starfield />

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl py-3 border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-purple-glow group-hover:scale-110 transition-transform">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-display font-bold text-white tracking-tight">PersonaForge</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">
                            Sign In
                        </Link>
                        <Link href="/signup" className="glass-card px-6 py-2.5 rounded-xl text-sm font-bold border-purple-500/50 hover:bg-purple-500/10 transition-all shadow-purple-glow hover:scale-105 active:scale-95">
                            Get Full Access
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-6 pt-32 pb-20">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-widest mb-6">
                        <Zap className="w-4 h-4" />
                        Free Demo — No Signup Required
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-display font-bold text-white mb-4 tracking-tight">
                        Try the AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Resume Engine</span>
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        See how PersonaForge transforms your experience into ATS-optimized bullet points. No account needed.
                    </p>
                </motion.div>

                <AnimatePresence mode="wait">
                    {/* Step 1: Input */}
                    {step === 'input' && (
                        <motion.div
                            key="input"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid lg:grid-cols-2 gap-8"
                        >
                            {/* Your Info */}
                            <div className="glass-card p-8 border-purple-500/20">
                                <h2 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-3">
                                    <User className="w-5 h-5 text-purple-400" />
                                    Your Details
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-400 mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-400 mb-2">Target Role</label>
                                        <input
                                            type="text"
                                            value={role}
                                            onChange={(e) => setRole(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-400 mb-2">Your Experience (Brief)</label>
                                        <textarea
                                            value={experience}
                                            onChange={(e) => setExperience(e.target.value)}
                                            rows={3}
                                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 text-sm resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Job Description */}
                            <div className="glass-card p-8 border-purple-500/20">
                                <h2 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-3">
                                    <Target className="w-5 h-5 text-purple-400" />
                                    Sample Job Description
                                </h2>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Briefcase className="w-4 h-4 text-purple-400" />
                                        <span className="text-sm font-bold text-white">{DEMO_JOB.title} at {DEMO_JOB.company}</span>
                                    </div>
                                    <p className="text-sm text-gray-400 leading-relaxed">{DEMO_JOB.description}</p>
                                </div>

                                <div className="p-4 rounded-xl bg-purple-600/5 border border-purple-500/20">
                                    <h3 className="text-sm font-bold text-purple-400 mb-2 flex items-center gap-2">
                                        <Cpu className="w-4 h-4" />
                                        What the AI will do:
                                    </h3>
                                    <ul className="space-y-2 text-sm text-gray-400">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                                            Generate a tailored professional summary
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                                            Create ATS-optimized experience bullet points
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                                            Match skills keywords to the job description
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                                            Calculate your ATS compatibility score
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Generate Button */}
                            <div className="lg:col-span-2 flex justify-center">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleGenerate}
                                    className="group relative flex items-center gap-3 px-10 py-5 rounded-2xl bg-purple-600 text-white font-bold text-lg shadow-purple-glow-lg transition-all overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                    <Sparkles className="w-5 h-5 relative z-10" />
                                    <span className="relative z-10">Generate My Resume</span>
                                    <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                                </motion.button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Generating */}
                    {step === 'generating' && (
                        <motion.div
                            key="generating"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex flex-col items-center justify-center py-20"
                        >
                            <div className="relative mb-8">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                    className="w-20 h-20 border-4 border-purple-900 border-t-purple-500 rounded-full"
                                />
                                <Cpu className="absolute inset-0 m-auto w-8 h-8 text-purple-400" />
                            </div>
                            <h3 className="text-2xl font-display font-bold text-white mb-2">Forging Your Resume...</h3>
                            <p className="text-gray-400 text-sm">Our AI is analyzing the job description and optimizing your content</p>

                            <div className="mt-8 space-y-3 w-full max-w-md">
                                {['Analyzing job keywords...', 'Generating professional summary...', 'Optimizing bullet points...', 'Calculating ATS score...'].map((step, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.4 }}
                                        className="flex items-center gap-3 text-sm"
                                    >
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: i * 0.4 + 0.3 }}
                                        >
                                            <CheckCircle2 className="w-4 h-4 text-purple-400" />
                                        </motion.div>
                                        <span className="text-gray-400">{step}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: Results */}
                    {step === 'result' && generated && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-8"
                        >
                            {/* ATS Score Banner */}
                            <div className="glass-card p-8 border-purple-500/30 relative overflow-hidden">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-600/20 blur-[80px] rounded-full pointer-events-none" />
                                <div className="flex items-center justify-between relative z-10">
                                    <div>
                                        <h2 className="text-sm font-black text-purple-400 uppercase tracking-[0.2em] mb-2">ATS Compatibility Score</h2>
                                        <p className="text-gray-400 text-sm">Your resume matches <strong className="text-white">{atsScore}%</strong> of the job requirements</p>
                                    </div>
                                    <div className="text-right">
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', damping: 10 }}
                                            className="text-5xl font-display font-black text-green-400"
                                        >
                                            {atsScore}%
                                        </motion.span>
                                    </div>
                                </div>
                            </div>

                            {/* Generated Content */}
                            <div className="grid lg:grid-cols-1 gap-6">
                                {[
                                    { title: 'Professional Summary', content: generated.summary, icon: User },
                                    { title: 'Experience Highlights', content: generated.experience, icon: Briefcase },
                                    { title: 'Optimized Skills', content: generated.skills, icon: Target },
                                ].map((section, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.15 }}
                                        className="glass-card p-6 border-white/5"
                                    >
                                        <h3 className="text-sm font-black text-purple-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                            <section.icon className="w-4 h-4" />
                                            {section.title}
                                        </h3>
                                        <p className="text-gray-300 leading-relaxed whitespace-pre-line">{section.content}</p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Locked Features Notice */}
                            <div className="glass-card p-8 border-purple-500/30 bg-purple-600/5">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/20 flex items-center justify-center shrink-0">
                                        <Lock className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-display font-bold text-white mb-2">Unlock Full Power</h3>
                                        <p className="text-gray-400 mb-4">This demo shows a fraction of what PersonaForge can do. Sign up free to unlock:</p>
                                        <div className="grid sm:grid-cols-2 gap-3 mb-6">
                                            {[
                                                'Save & export to PDF',
                                                'Multiple resume templates',
                                                'Unlimited JD matching',
                                                'Cover letter generator',
                                                'Resume version history',
                                                'Priority AI processing',
                                            ].map((feature, i) => (
                                                <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                                                    <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                                    {feature}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <Link
                                                href="/signup"
                                                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 transition-all active:scale-[0.98] shadow-purple-glow"
                                            >
                                                <Rocket className="w-5 h-5" />
                                                Create Free Account
                                                <ArrowRight className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => { setStep('input'); setGenerated(null); }}
                                                className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all"
                                            >
                                                Try Again
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
