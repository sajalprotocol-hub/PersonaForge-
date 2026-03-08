'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
    Sparkles, LayoutDashboard, FileText, Target, RefreshCw,
    Mail, Settings, LogOut, Menu, X, ChevronLeft,
    Crown, User, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { UsageProvider } from '@/components/automation/UsageTracker';
import { ReferralSystem } from '@/components/automation/ReferralSystem';

// Lazy-load heavy components — not needed for first paint
const FloatingAssistant = dynamic(() => import('@/components/ai-assistant/FloatingAssistant'), { ssr: false });
const Starfield = dynamic(() => import('@/components/ui/Starfield').then(m => ({ default: m.Starfield })), { ssr: false });

const NAV_ITEMS = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/resume-builder', icon: FileText, label: 'Resume Builder' },
    { href: '/jd-match', icon: Target, label: 'JD Match' },
    { href: '/cover-letter', icon: Mail, label: 'Cover Letter', premium: true },
    { href: '/settings', icon: Settings, label: 'Settings' },
    { href: '/admin', icon: Shield, label: 'Admin Panel', adminOnly: true },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { user, profile, loading, isAdmin, authReady, signOut } = useAuth();

    // Auth guard
    useEffect(() => {
        if (authReady && !user) {
            router.push('/login');
        }
    }, [authReady, user, router]);

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    if (!authReady) {
        return (
            <div className="flex h-screen items-center justify-center bg-black">
                <div className="text-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-12 h-12 border-4 border-purple-900 border-t-purple-500 rounded-full mx-auto mb-4"
                    />
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Forging Reality...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex h-screen items-center justify-center bg-black">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-900 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">Redirecting...</p>
                </div>
            </div>
        );
    }

    return (
        <UsageProvider>
            <div className="flex h-screen overflow-hidden bg-black text-white selection:bg-purple-500/30 font-sans">
                <Starfield />

                {/* Desktop Sidebar */}
                <motion.aside
                    initial={false}
                    animate={{ width: sidebarOpen ? 256 : 80 }}
                    className="hidden lg:flex flex-col border-r border-white/5 bg-black/40 backdrop-blur-xl relative z-20 shrink-0"
                >
                    {/* Logo */}
                    <div className="flex items-center justify-between h-20 px-6 border-b border-white/5">
                        <Link href="/dashboard" className="flex items-center gap-3">
                            <motion.div
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center shrink-0 shadow-purple-glow"
                            >
                                <Sparkles className="w-5 h-5 text-white" />
                            </motion.div>
                            {sidebarOpen && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-xl font-display font-bold text-white tracking-tight"
                                >
                                    PersonaForge
                                </motion.span>
                            )}
                        </Link>
                        {sidebarOpen && (
                            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                        {NAV_ITEMS.filter(item => !item.adminOnly || isAdmin).map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link key={item.href} href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 group ${isActive
                                        ? 'bg-purple-600 text-white shadow-purple-glow translate-x-1'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'group-hover:text-purple-400'}`} />
                                    {sidebarOpen && <span className="flex-1 whitespace-nowrap">{item.label}</span>}
                                    {sidebarOpen && item.premium && !isAdmin && <Crown className="w-3.5 h-3.5 text-yellow-500" />}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User section */}
                    <div className="p-4 border-t border-white/5 bg-white/[0.02]">
                        <div className={`flex items-center gap-3 ${sidebarOpen ? 'px-4 py-2' : 'justify-center py-2'}`}>
                            <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-purple-glow">
                                {profile?.displayName?.[0] || user?.email?.[0] || 'U'}
                            </div>
                            {sidebarOpen && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{profile?.displayName || 'User'}</p>
                                    <p className="text-[10px] text-purple-400 uppercase tracking-widest font-black">
                                        {isAdmin ? 'Admin' : profile?.subscription || 'Free'}
                                    </p>
                                </div>
                            )}
                            {sidebarOpen && (
                                <button onClick={handleSignOut} className="p-2 text-gray-500 hover:text-red-400 transition-colors" title="Sign out">
                                    <LogOut className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        {!sidebarOpen && (
                            <div className="flex justify-center mt-2">
                                <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-400 hover:text-white">
                                    <ChevronLeft className="w-4 h-4 rotate-180" />
                                </button>
                            </div>
                        )}
                    </div>
                </motion.aside>

                {/* Mobile sidebar overlay */}
                <AnimatePresence>
                    {mobileOpen && (
                        <div className="lg:hidden fixed inset-0 z-50">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                                onClick={() => setMobileOpen(false)}
                            />
                            <motion.aside
                                initial={{ x: '-100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '-100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="absolute left-0 top-0 bottom-0 w-80 bg-black border-r border-white/5 flex flex-col shadow-2xl"
                            >
                                <div className="flex items-center justify-between h-20 px-6 border-b border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center">
                                            <Sparkles className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="text-xl font-display font-bold text-white tracking-tight">PersonaForge</span>
                                    </div>
                                    <button onClick={() => setMobileOpen(false)} className="p-2 text-gray-400 hover:text-white">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <nav className="flex-1 py-8 px-4 space-y-2">
                                    {NAV_ITEMS.filter(item => !item.adminOnly || isAdmin).map((item) => {
                                        const isActive = pathname === item.href;
                                        return (
                                            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                                                className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-base font-bold transition-all ${isActive
                                                    ? 'bg-purple-600 text-white shadow-purple-glow'
                                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                                    }`}>
                                                <item.icon className="w-6 h-6" />
                                                {item.label}
                                                {item.premium && !isAdmin && <Crown className="w-4 h-4 text-yellow-500 ml-auto" />}
                                            </Link>
                                        );
                                    })}
                                </nav>
                                <div className="p-6 border-t border-white/5">
                                    <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-3 py-4 rounded-xl text-red-400 bg-red-400/5 font-bold hover:bg-red-400/10 transition-colors">
                                        <LogOut className="w-5 h-5" />
                                        Sign Out
                                    </button>
                                </div>
                            </motion.aside>
                        </div>
                    )}
                </AnimatePresence>

                {/* Main content */}
                <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                    {/* Top bar */}
                    <header className="h-20 border-b border-white/5 bg-black/20 backdrop-blur-xl flex items-center justify-between px-6 lg:px-10 shrink-0 relative z-30">
                        <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 text-gray-400 hover:text-white">
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="hidden lg:block text-xs font-black text-gray-400 uppercase tracking-[0.3em]">
                            <span className="nebula-text">{pathname.substring(1).replace('/', ' / ').replace('-', ' ') || 'Dashboard'}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <ReferralSystem />
                            <Link href="/settings" className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
                                <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center group-hover:bg-purple-600/40 transition-colors">
                                    <User className="w-4 h-4 text-purple-400 group-hover:text-white transition-colors" />
                                </div>
                                <span className="text-sm font-bold text-white hidden sm:inline">{profile?.displayName || 'Profile'}</span>
                            </Link>
                        </div>
                    </header>

                    {/* Page content */}
                    <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="max-w-7xl mx-auto"
                        >
                            {children}
                        </motion.div>
                    </main>
                </div>
                <FloatingAssistant />
            </div>
        </UsageProvider>
    );
}
