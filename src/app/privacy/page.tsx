'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Shield, ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl py-3 border-b border-white/5">
                <div className="max-w-4xl mx-auto px-6 flex items-center justify-between h-12">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-display font-bold">PersonaForge</span>
                    </Link>
                    <Link href="/" className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Link>
                </div>
            </nav>

            <main className="max-w-3xl mx-auto px-6 pt-32 pb-20">
                <div className="flex items-center gap-3 mb-8">
                    <Shield className="w-8 h-8 text-purple-400" />
                    <h1 className="text-4xl font-display font-bold">Privacy Policy</h1>
                </div>
                <p className="text-sm text-gray-500 mb-10">Last updated: March 3, 2026</p>

                <div className="space-y-8 text-gray-300 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-display font-bold text-white mb-3">1. Information We Collect</h2>
                        <p>We collect information you provide directly, including your name, email address, education, work experience, and skills when you create an account and complete onboarding. We also collect resume content you create using our tools.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-display font-bold text-white mb-3">2. How We Use Your Information</h2>
                        <p>Your data is used to:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                            <li>Generate AI-powered resume content and cover letters</li>
                            <li>Provide job description matching and ATS scoring</li>
                            <li>Save your resumes and profile for future use</li>
                            <li>Process payments through Razorpay</li>
                            <li>Improve our services</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-display font-bold text-white mb-3">3. Data Storage & Security</h2>
                        <p>Your data is stored securely using Firebase with enterprise-grade encryption. We use Firebase Authentication for secure login and Firestore for encrypted data storage. We never store payment card details — all payments are handled by Razorpay.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-display font-bold text-white mb-3">4. Third-Party Services</h2>
                        <p>We use the following third-party services:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                            <li><strong>Firebase</strong> — Authentication and data storage</li>
                            <li><strong>Google Gemini / OpenAI</strong> — AI content generation</li>
                            <li><strong>Razorpay</strong> — Payment processing</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-display font-bold text-white mb-3">5. Your Rights</h2>
                        <p>You can access, update, or delete your personal data at any time through your account settings. To request complete data deletion, contact us at <span className="text-purple-400">support@personaforge.com</span>.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-display font-bold text-white mb-3">6. Contact</h2>
                        <p>For privacy-related questions, reach us at <span className="text-purple-400">support@personaforge.com</span>.</p>
                    </section>
                </div>
            </main>
        </div>
    );
}
