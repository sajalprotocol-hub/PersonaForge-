'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';

interface Testimonial {
    name: string;
    role: string;
    quote: string;
    rating: number;
    scoreImprovement?: string;
    avatar: string;
}

const TESTIMONIALS: Testimonial[] = [
    {
        name: 'Priya Sharma',
        role: 'Software Engineer at Infosys',
        quote: 'PersonaForge took my resume from a 45% ATS score to 92% in under 5 minutes. I got 3 interview callbacks within a week of updating it.',
        rating: 5,
        scoreImprovement: '45% → 92%',
        avatar: 'PS',
    },
    {
        name: 'Rahul Verma',
        role: 'Marketing Manager at Zomato',
        quote: 'The JD matcher is incredible. It showed me exactly which keywords I was missing and suggested rewrites that sounded natural, not keyword-stuffed.',
        rating: 5,
        scoreImprovement: '58% → 88%',
        avatar: 'RV',
    },
    {
        name: 'Ananya Reddy',
        role: 'Data Analyst at TCS',
        quote: 'I was skeptical about AI resume builders, but PersonaForge actually understood my experience and generated bullet points that highlighted my achievements perfectly.',
        rating: 5,
        scoreImprovement: '52% → 91%',
        avatar: 'AR',
    },
    {
        name: 'Vikram Patel',
        role: 'Product Manager at Flipkart',
        quote: 'The cover letter generator saved me hours. Each letter felt genuinely personalized, not template-y. I landed my dream job at Flipkart thanks to this tool.',
        rating: 5,
        scoreImprovement: '61% → 94%',
        avatar: 'VP',
    },
    {
        name: 'Sneha Iyer',
        role: 'UX Designer at Razorpay',
        quote: 'Finally a tool that understands Indian job market dynamics. The pricing is perfect for someone just starting their career. Worth every rupee.',
        rating: 4,
        scoreImprovement: '49% → 87%',
        avatar: 'SI',
    },
];

export function TestimonialsSection() {
    const [current, setCurrent] = useState(0);
    const [direction, setDirection] = useState(0);

    const next = useCallback(() => {
        setDirection(1);
        setCurrent(prev => (prev + 1) % TESTIMONIALS.length);
    }, []);

    const prev = useCallback(() => {
        setDirection(-1);
        setCurrent(prev => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
    }, []);

    // Auto-advance every 6 seconds
    useEffect(() => {
        const timer = setInterval(next, 6000);
        return () => clearInterval(timer);
    }, [next]);

    const testimonial = TESTIMONIALS[current];

    const variants = {
        enter: (dir: number) => ({ x: dir > 0 ? 100 : -100, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir > 0 ? -100 : 100, opacity: 0 }),
    };

    return (
        <section className="py-20 sm:py-32 relative">
            <div className="absolute -left-40 top-1/2 w-80 h-80 bg-purple-600/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-5xl mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-16">
                    <span className="text-xs font-black text-purple-400 uppercase tracking-[0.3em] mb-4 block">
                        What Our Users Say
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-display font-bold text-white mb-4">
                        Real Results from <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Real People</span>
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Join thousands of Indian professionals who transformed their careers with PersonaForge.
                    </p>
                </div>

                {/* Testimonial Card */}
                <div className="relative max-w-3xl mx-auto">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={current}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.3 }}
                            className="glass-card p-8 sm:p-12 border-purple-500/20 relative overflow-hidden"
                        >
                            <Quote className="absolute top-6 right-6 w-12 h-12 text-purple-500/10" />

                            <div className="flex items-start gap-5">
                                {/* Avatar */}
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-purple-glow">
                                    {testimonial.avatar}
                                </div>

                                <div className="flex-1">
                                    {/* Stars */}
                                    <div className="flex items-center gap-1 mb-3">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-4 h-4 ${i < testimonial.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-700'}`}
                                            />
                                        ))}
                                    </div>

                                    {/* Quote */}
                                    <p className="text-gray-300 text-lg leading-relaxed mb-6 italic">
                                        &ldquo;{testimonial.quote}&rdquo;
                                    </p>

                                    {/* Author & Score */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-bold">{testimonial.name}</p>
                                            <p className="text-gray-500 text-sm">{testimonial.role}</p>
                                        </div>
                                        {testimonial.scoreImprovement && (
                                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
                                                <TrendingUp className="w-4 h-4 text-green-400" />
                                                <span className="text-sm font-bold text-green-400">{testimonial.scoreImprovement}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <button
                            onClick={prev}
                            className="p-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        {/* Dots */}
                        <div className="flex items-center gap-2">
                            {TESTIMONIALS.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                                    className={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? 'bg-purple-500 w-6' : 'bg-white/10 hover:bg-white/20'
                                        }`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={next}
                            className="p-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
