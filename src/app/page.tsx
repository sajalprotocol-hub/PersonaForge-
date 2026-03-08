'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Sparkles, ShieldCheck, Zap, BarChart3, Target,
    ArrowRight, Star, CheckCircle2, ChevronDown,
    Menu, X, Play, Award, Globe, Users,
    Layers, Cpu, Rocket, FileText, Check, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Starfield } from '@/components/ui/Starfield';
import { AIOrb } from '@/components/ai-assistant/AIOrb';
import { TiltCard } from '@/components/ui/TiltCard';
import { RollingCounter } from '@/components/ui/RollingCounter';
import dynamic from 'next/dynamic';

// Lazy-load below-the-fold automation components
const EmailCaptureModal = dynamic(() => import('@/components/automation/EmailCaptureModal').then(m => ({ default: m.EmailCaptureModal })), { ssr: false });
const SocialProofBar = dynamic(() => import('@/components/automation/SocialProofBar').then(m => ({ default: m.SocialProofBar })), { ssr: false });
const LaunchCountdown = dynamic(() => import('@/components/automation/LaunchCountdown').then(m => ({ default: m.LaunchCountdown })), { ssr: false });
const TestimonialsSection = dynamic(() => import('@/components/automation/TestimonialsSection').then(m => ({ default: m.TestimonialsSection })), { ssr: false });

const FEATURES = [
    {
        title: "AI-Powered Resume Builder",
        description: "Transform your experience into high-impact bullet points with our advanced GPT-4 integration.",
        icon: Cpu,
        color: "from-purple-500 to-indigo-500",
        benefits: ["Smart wording suggestions", "Action verb optimization", "Role-specific templates"]
    },
    {
        title: "ATS Scorer & JD Matcher",
        description: "Instantly see how your resume matches any job description and get actionable tips to optimize it.",
        icon: Target,
        color: "from-violet-500 to-purple-600",
        benefits: ["Keyword gap analysis", "Formatting checks", "Instant ATS score"]
    },
    {
        title: "Dynamic Profile Dashboard",
        description: "Manage multiple resumes, track applications, and visualize your career growth in one place.",
        icon: BarChart3,
        color: "from-indigo-600 to-violet-500",
        benefits: ["Version control", "Application tracking", "Skill visualization"]
    },
    {
        title: "Instant PDF Export",
        description: "Download beautifully formatted, industry-standard resumes that are guaranteed to be ATS-friendly.",
        icon: ShieldCheck,
        color: "from-purple-600 to-indigo-600",
        benefits: ["Clean layouts", "Multiple themes", "Standard font sizing"]
    }
];

const PRICING_PLANS = [
    {
        id: 'free',
        name: "Free",
        price: { weekly: "₹0", monthly: "₹0" },
        description: "For students getting started.",
        features: ["1 Basic Resume", "AI Optimization", "Manual JD Matching", "Public Link"],
        cta: "Start for Free",
        highlight: false
    },
    {
        id: 'growth',
        name: "Growth",
        price: { weekly: "₹29", monthly: "₹109" },
        description: "For job seekers in a rush.",
        features: ["3 Premium Resumes", "Advanced AI Rebuild", "Unlimited JD Matching", "ATS Keyword Sync"],
        cta: "Go Growth",
        highlight: false
    },
    {
        id: 'pro',
        name: "Pro",
        price: { weekly: "₹49", monthly: "₹199" },
        description: "Our most popular choice.",
        features: ["Unlimited Resumes", "Priority AI Support", "Cover Letter Generator", "Early Access Features"],
        cta: "Get Pro Now",
        highlight: true
    },
    {
        id: 'lifetime',
        name: "Lifetime",
        price: { weekly: "₹499", monthly: "₹499" },
        isOneTime: true,
        description: "One-time payment for life.",
        features: ["Everything in Pro", "Lifetime Updates", "Exclusive Templates", "Personal Career Audit"],
        cta: "Get Lifetime",
        highlight: false
    }
];

const FAQS = [
    { q: 'How does the AI resume optimization work?', a: 'Our AI analyzes your experience, skills, and target job description to generate tailored bullet points, professional summaries, and skill highlights that pass ATS systems and impress recruiters.' },
    { q: 'Is my data secure?', a: 'Absolutely. We use Firebase with enterprise-grade security, encrypted data storage, and never share your personal information with third parties.' },
    { q: 'Can I use PersonaForge for free?', a: 'Yes! Our free tier includes basic resume building and ATS score checking. Upgrade anytime for unlimited AI generations.' },
    { q: 'What is ATS scoring?', a: 'ATS (Applicant Tracking System) scoring evaluates how well your resume matches the format and keywords that automated hiring systems look for.' },
];

const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
};

const staggerContainer = {
    initial: {},
    whileInView: { transition: { staggerChildren: 0.1 } }
};

export default function LandingPage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [billingCycle, setBillingCycle] = useState<'weekly' | 'monthly'>('monthly');
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [scrolled, setScrolled] = useState(false);


    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);


    return (
        <div className="relative min-h-screen bg-black text-white selection:bg-purple-500/30 font-sans overflow-x-hidden">
            <Starfield />
            <AIOrb />

            {/* Navbar */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-black/80 backdrop-blur-xl py-3 border-b border-white/5' : 'bg-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-purple-glow group-hover:scale-110 transition-transform">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-display font-bold text-white tracking-tight">PersonaForge</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        {['Features', 'Pricing', 'FAQ'].map((item) => (
                            <Link key={item} href={`#${item.toLowerCase()}`} className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">
                                {item}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/login" className="hidden sm:block text-sm font-semibold text-gray-400 hover:text-white transition-colors">
                            Sign In
                        </Link>
                        <Link href="/signup" className="glass-card px-6 py-2.5 rounded-xl text-sm font-bold border-purple-500/50 hover:bg-purple-500/10 transition-all shadow-purple-glow hover:scale-105 active:scale-95">
                            Get Started
                        </Link>
                        <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            {isMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>
            </nav>

            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        className="fixed inset-0 z-40 bg-black flex flex-col items-center justify-center gap-8 md:hidden"
                    >
                        {['Features', 'Pricing', 'FAQ'].map((item) => (
                            <Link key={item} href={`#${item.toLowerCase()}`} onClick={() => setIsMenuOpen(false)} className="text-2xl font-display font-bold text-white">
                                {item}
                            </Link>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 sm:pt-60 sm:pb-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
                    <motion.div
                        {...fadeIn}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-widest mb-8 shadow-purple-glow backdrop-blur-md"
                    >
                        <Zap className="w-4 h-4" />
                        Next-Gen AI Resume Engine
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="text-6xl sm:text-8xl lg:text-9xl font-display font-bold text-white mb-8 tracking-tighter leading-[0.85] text-balance"
                    >
                        Forge Your <br />
                        <span className="nebula-text">Future Self.</span>
                    </motion.h1>

                    <motion.p
                        {...fadeIn}
                        transition={{ delay: 0.2 }}
                        className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-400 mb-12 leading-relaxed"
                    >
                        Move beyond basic templates. Use precision AI to optimize every bullet point, match every job description, and bypass the ATS algorithm with ease.
                    </motion.p>

                    <motion.div
                        {...fadeIn}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
                    >
                        <Link href="/signup" className="group relative px-10 py-5 rounded-2xl bg-purple-600 text-white font-bold text-lg shadow-purple-glow-lg hover:scale-105 transition-all overflow-hidden">
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                            Build Your Resume
                            <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link href="/demo" className="px-10 py-5 rounded-2xl bg-white/5 border border-purple-500/30 hover:bg-purple-500/10 text-white font-bold text-lg transition-all shadow-purple-glow">
                            Try AI Demo
                        </Link>
                    </motion.div>

                    {/* Trust Tracker */}
                    <div
                        className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10 border-t border-white/5"
                    >
                        {[
                            { label: "Resume Sections", value: 12, suffix: "+", icon: FileText },
                            { label: "ATS Accuracy", value: 92, suffix: "%", icon: Target },
                            { label: "AI Models", value: 2, suffix: "", icon: Rocket },
                            { label: "Uptime Target", value: 99.9, suffix: "%", icon: Globe }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.5 }}
                                className="flex flex-col items-center gap-2"
                            >
                                <div className="flex items-center gap-2 text-purple-400 mb-1">
                                    <stat.icon className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{stat.label}</span>
                                </div>
                                <div className="text-3xl sm:text-4xl font-display font-black text-white">
                                    <RollingCounter value={stat.value} suffix={stat.suffix} duration={1.5} />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Launch Countdown Component */}
                <div className="max-w-4xl mx-auto px-6 mt-12">
                    <LaunchCountdown launchDate="2026-03-17T00:00:00+05:30" />
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-32 relative bg-white/[0.01]">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div {...fadeIn} className="text-center mb-24">
                        <h2 className="text-4xl sm:text-6xl font-display font-bold text-white mb-4">The Forge Process.</h2>
                        <p className="text-gray-400 max-w-xl mx-auto text-lg text-balance">Three steps to a mathematically superior career narrative.</p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8 relative">
                        {/* Connecting Line (Optional cinematic touch) */}
                        <div className="hidden md:block absolute top-[120px] left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

                        {[
                            {
                                step: "01",
                                title: "Input & Analyze",
                                desc: "Upload your raw experience or paste a job description. Our AI orb scans for semantic gaps and ATS keywords.",
                                icon: Layers
                            },
                            {
                                step: "02",
                                title: "Forge & Optimize",
                                desc: "Watch high-impact bullet points materialize. We use deep-profile context to weave your story into role-perfect logic.",
                                icon: Cpu
                            },
                            {
                                step: "03",
                                title: "Launch & Secure",
                                desc: "Export to industry-standard PDF designs. Your resume is now a precision tool ready for the highest level of scrutiny.",
                                icon: Rocket
                            }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.2 }}
                                viewport={{ once: true }}
                                className="relative glass-card p-12 group hover:border-purple-500/30 transition-all duration-500 bg-gray-900/10 backdrop-blur-sm shadow-2xl"
                            >
                                <div className="text-7xl font-display font-black text-white/5 absolute top-2 left-2 select-none group-hover:text-purple-500/10 transition-colors">
                                    {item.step}
                                </div>
                                <div className="w-16 h-16 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center mb-8 relative z-10 group-hover:scale-110 group-hover:shadow-purple-glow transition-all">
                                    <item.icon className="w-8 h-8 text-purple-400" />
                                </div>
                                <h3 className="text-2xl font-display font-bold text-white mb-4 relative z-10">{item.title}</h3>
                                <p className="text-gray-400 leading-relaxed relative z-10 font-medium">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Feature Section */}
            <section id="features" className="py-32 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        {...fadeIn}
                        className="text-center mb-24"
                    >
                        <h2 className="text-4xl sm:text-6xl font-display font-bold text-white mb-4">Precision Engineering.</h2>
                        <p className="text-gray-400 max-w-xl mx-auto text-lg">Advanced AI tools built to give you the competitive edge in today's job market.</p>
                    </motion.div>

                    <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="whileInView"
                        viewport={{ once: true }}
                        className="grid md:grid-cols-2 gap-10"
                    >
                        {FEATURES.map((feature, i) => (
                            <motion.div
                                key={i}
                                variants={fadeIn}
                                className="h-full"
                            >
                                <TiltCard className="h-full">
                                    <div className="glass-card p-10 flex flex-col gap-8 group hover:border-purple-500/50 transition-all shadow-purple-glow duration-500 h-full shimmer-sweep">
                                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                                            <feature.icon className="w-8 h-8 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-display font-bold text-white mb-4">{feature.title}</h3>
                                            <p className="text-gray-400 mb-8 leading-relaxed text-lg">{feature.description}</p>
                                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-semibold text-gray-300">
                                                {feature.benefits.map((b, j) => (
                                                    <li key={j} className="flex items-center gap-3">
                                                        <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                                                            <Check className="w-3 h-3 text-purple-400" />
                                                        </div>
                                                        {b}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </TiltCard>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>


            {/* Why PersonaForge - Benefits Section */}
            <section className="py-32 relative bg-black">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <motion.div {...fadeIn}>
                            <h2 className="text-5xl sm:text-7xl font-display font-bold text-white mb-8 leading-[0.9]">Why Build With Our <span className="nebula-text">AI?</span></h2>
                            <p className="text-xl text-gray-400 mb-12 font-medium leading-relaxed">Most resume builders just fill in boxes. We architect careers. Our engine thinks like a recruiter and speaks like an expert.</p>

                            <div className="space-y-8">
                                {[
                                    { title: "Psychological Anchoring", desc: "We place your key achievements at eye-level hotspots to ensure maximum retention.", icon: Target },
                                    { title: "Semantic Mirroring", desc: "Our AI matches your tone to the JD's company culture automatically.", icon: Globe },
                                    { title: "Algorithmic Precision", desc: "Every word is weighted against actual ATS scoring models for 99%+ bypass rates.", icon: Cpu }
                                ].map((benefit, i) => (
                                    <div key={i} className="flex gap-6 group">
                                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-purple-600/10 group-hover:border-purple-500/30 transition-all">
                                            <benefit.icon className="w-6 h-6 text-purple-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-display font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">{benefit.title}</h4>
                                            <p className="text-gray-400 font-medium leading-relaxed">{benefit.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            className="relative"
                        >
                            <div className="glass-card p-1 bg-gradient-to-br from-purple-500/20 to-transparent">
                                <div className="glass-card p-8 bg-black/40 backdrop-blur-2xl">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                        <div className="w-3 h-3 rounded-full bg-green-500/50" />
                                        <span className="ml-2 text-[10px] font-black text-white/20 uppercase tracking-widest">Live Engine Analysis</span>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 animate-pulse">
                                            <div className="h-2 w-3/4 bg-purple-500/20 rounded mb-3" />
                                            <div className="h-2 w-full bg-white/5 rounded" />
                                        </div>
                                        <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 shadow-purple-glow">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="h-2 w-1/2 bg-purple-400 rounded" />
                                                <span className="text-[10px] font-black text-purple-400">OPTIMIZED</span>
                                            </div>
                                            <div className="h-2 w-full bg-purple-400/20 rounded" />
                                        </div>
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 opacity-50">
                                            <div className="h-2 w-2/3 bg-white/10 rounded mb-3" />
                                            <div className="h-2 w-full bg-white/5 rounded" />
                                        </div>
                                    </div>
                                    <div className="mt-10 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Synthesizing...</span>
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map(j => <div key={j} className="w-6 h-6 rounded-full bg-purple-600/20 border border-purple-500/30" />)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Decorative blur */}
                            <div className="absolute -inset-20 bg-purple-600/10 blur-[100px] -z-10" />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-32 relative bg-white/[0.02]">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div {...fadeIn} className="text-center mb-20">
                        <h2 className="text-4xl sm:text-6xl font-display font-bold text-white mb-8">Ready to Unlock?</h2>

                        <div className="inline-flex items-center p-1.5 rounded-2xl bg-white/5 border border-white/10 gap-2">
                            <button
                                onClick={() => setBillingCycle('weekly')}
                                className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${billingCycle === 'weekly' ? 'bg-purple-600 text-white shadow-purple-glow' : 'text-gray-400 hover:text-white'}`}
                            >
                                Weekly
                            </button>
                            <button
                                onClick={() => setBillingCycle('monthly')}
                                className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${billingCycle === 'monthly' ? 'bg-purple-600 text-white shadow-purple-glow' : 'text-gray-400 hover:text-white'}`}
                            >
                                Monthly
                            </button>
                        </div>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {PRICING_PLANS.map((plan, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                viewport={{ once: true }}
                                className="h-full"
                            >
                                <TiltCard className="h-full">
                                    <div className={`flex flex-col glass-card p-10 group h-full shimmer-sweep ${plan.highlight ? 'border-purple-500 border-2 shadow-purple-glow-lg scale-105 relative z-10 !overflow-visible' : 'hover:border-white/20'}`}>
                                        {plan.highlight && (
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-1.5 rounded-full bg-purple-600 text-[10px] font-black uppercase tracking-widest text-white shadow-purple-glow z-20">
                                                Goal Slayer
                                            </div>
                                        )}
                                        <div className="mb-10">
                                            <h3 className="text-xl font-display font-bold text-white mb-3">{plan.name}</h3>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-5xl font-display font-bold text-white">{plan.price[billingCycle]}</span>
                                                <span className="text-gray-500 text-xs uppercase font-bold tracking-widest">{plan.isOneTime ? '/one-time' : `/${billingCycle}`}</span>
                                            </div>
                                            <p className="mt-6 text-sm text-gray-400 leading-relaxed">{plan.description}</p>
                                        </div>
                                        <ul className="flex-1 space-y-5 mb-10">
                                            {plan.features.map((f, j) => (
                                                <li key={j} className="flex items-start gap-3 text-sm text-gray-300 font-semibold">
                                                    <CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0" />
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                        <Link href="/signup" className={`w-full py-4 rounded-xl font-black text-sm transition-all active:scale-95 block text-center ${plan.highlight ? 'bg-purple-600 text-white shadow-purple-glow hover:bg-purple-500' : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'}`}>
                                            {plan.cta}
                                        </Link>
                                    </div>
                                </TiltCard>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="py-32 relative">
                <div className="max-w-3xl mx-auto px-6">
                    <motion.h2 {...fadeIn} className="text-4xl font-display font-bold text-center text-white mb-16 underline decoration-purple-500 underline-offset-8">Common Queries.</motion.h2>
                    <div className="space-y-4">
                        {FAQS.map((faq, i) => (
                            <motion.div
                                key={i}
                                {...fadeIn}
                                transition={{ delay: i * 0.1 }}
                                className="glass-card overflow-hidden transition-all duration-500"
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full p-8 flex items-center justify-between text-left hover:bg-white/5 transition-colors group"
                                >
                                    <span className="font-bold text-white text-lg group-hover:text-purple-400 transition-colors uppercase tracking-tight">{faq.q}</span>
                                    {openFaq === i ? <ChevronUp className="w-6 h-6 text-purple-500" /> : <ChevronDown className="w-6 h-6 text-gray-500" />}
                                </button>
                                <AnimatePresence>
                                    {openFaq === i && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="px-8 overflow-hidden"
                                        >
                                            <p className="pb-8 text-gray-400 leading-relaxed text-lg">{faq.a}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <TestimonialsSection />

            {/* Final CTA */}
            <section className="py-40 relative overflow-hidden">
                <div className="absolute inset-0 bg-purple-600/10 blur-[200px] animate-pulse" />
                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <motion.h2
                        {...fadeIn}
                        className="text-6xl sm:text-8xl font-display font-bold text-white mb-8 tracking-tighter"
                    >
                        Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Forge?</span>
                    </motion.h2>
                    <motion.p {...fadeIn} transition={{ delay: 0.1 }} className="text-xl sm:text-2xl text-gray-400 mb-12 font-medium">
                        Join 1,000+ early professionals building their dream careers with PersonaForge.
                    </motion.p>
                    <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="flex justify-center">
                        <Link href="/signup" className="group relative flex items-center gap-3 px-10 py-5 rounded-2xl bg-purple-600 text-white font-bold text-lg shadow-purple-glow-lg transition-all hover:scale-105 active:scale-95 overflow-hidden border border-purple-400/30">
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
                            <span className="relative z-10">Launch Your Resume</span>
                            <Rocket className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform relative z-10 flex-shrink-0" />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 border-t border-white/5 bg-black">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <div className="flex items-center justify-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-display font-bold text-white">PersonaForge</span>
                    </div>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-10">© 2026 PersonaForge AI. Built for the next generation of talent.</p>
                    <div className="flex flex-wrap justify-center gap-8 sm:gap-12">
                        {['Features', 'Pricing', 'FAQ'].map(item => (
                            <Link key={item} href={`#${item.toLowerCase()}`} className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest">
                                {item}
                            </Link>
                        ))}
                        <Link href="/blog" className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest">Blog</Link>
                        <Link href="/demo" className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest">Demo</Link>
                        <Link href="/privacy" className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest">Privacy</Link>
                        <Link href="/terms" className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest">Terms</Link>
                    </div>
                </div>
            </footer>

            {/* Automation Components */}
            <EmailCaptureModal scrollThreshold={40} exitIntent={true} />
            <SocialProofBar />
        </div>
    );
}
