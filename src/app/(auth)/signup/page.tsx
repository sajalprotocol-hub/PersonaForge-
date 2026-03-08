'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { trackReferral } from '@/components/automation/ReferralSystem';
import { useUTM } from '@/hooks/useUTM';

function SignupForm() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { signUp, signInWithGoogle } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { saveUTMToFirestore } = useUTM();
    const referralCode = searchParams.get('ref') || '';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // H-7 FIX: Proper email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!emailRegex.test(email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        if (!name.trim()) {
            toast.error('Please enter your name');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        setLoading(true);
        try {
            await signUp(email.trim(), password, name.trim());
            // Track referral if code exists
            if (referralCode) {
                await trackReferral(referralCode).catch(() => { });
            }
            // Save UTM attribution — get uid from the auth state after signup
            try {
                const { getAuth } = await import('firebase/auth');
                const currentUser = getAuth().currentUser;
                if (currentUser?.uid) {
                    await saveUTMToFirestore(currentUser.uid).catch(() => { });
                }
            } catch { }
            toast.success('Account created! Let\'s get started.');
            router.push('/onboarding');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to create account';
            toast.error(msg.includes('already-in-use') ? 'Email already registered' : msg);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        try {
            await signInWithGoogle();
            toast.success('Welcome!');
            // Send to onboarding — it'll redirect to dashboard if already completed
            router.push('/onboarding');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to sign in with Google';
            toast.error(msg);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden text-surface-900 dark:text-white">
            <div className="absolute inset-0">
                <div className="absolute top-20 right-20 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-20 left-20 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
            </div>

            <div className="relative w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 mb-6">
                        <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-display font-bold gradient-text">PersonaForge</span>
                    </Link>
                    <h1 className="text-2xl font-display font-bold mb-2">Create Your Account</h1>
                    <p className="text-surface-500">Start building your career in minutes</p>
                </div>

                <div className="glass-card p-8">
                    <button
                        onClick={handleGoogle}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors font-medium mb-6"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </button>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-surface-200 dark:border-surface-700" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white dark:bg-surface-900 text-surface-500">or sign up with email</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                                    placeholder="John Doe" required className="input-field !pl-10" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com" required className="input-field !pl-10" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Min. 6 characters" required minLength={6}
                                    className="input-field !pl-10 !pr-10"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>Create Account <ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-sm text-surface-500 mt-6">
                    Already have an account?{' '}
                    <Link href="/login" className="text-brand-500 hover:text-brand-600 font-semibold">Sign In</Link>
                </p>
            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="w-10 h-10 border-4 border-purple-900 border-t-purple-500 rounded-full animate-spin" />
            </div>
        }>
            <SignupForm />
        </Suspense>
    );
}

