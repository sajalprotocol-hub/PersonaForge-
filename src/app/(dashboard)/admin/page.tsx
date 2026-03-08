'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
    Shield, Users, FileText, BarChart3, Search, RefreshCw,
    Crown, Trash2, Eye, ChevronRight, Sparkles, AlertTriangle,
    Activity, TrendingUp
} from 'lucide-react';
import { collection, getDocs, query, orderBy, limit, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { authFetch } from '@/lib/api-client';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface UserRow {
    uid: string;
    email: string;
    displayName: string;
    subscription: string;
    onboardingComplete: boolean;
    createdAt: string;
    resumeCount?: number;
}

export default function AdminPage() {
    const { user, isAdmin, authReady } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<UserRow[]>([]);
    const [stats, setStats] = useState({ totalUsers: 0, totalResumes: 0, premiumUsers: 0, onboardedUsers: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Guard: redirect non-admins
    useEffect(() => {
        if (authReady && (!user || !isAdmin)) {
            toast.error(`Access denied — ${user?.email || 'not logged in'} is not an admin`);
            router.push('/dashboard');
        }
    }, [authReady, user, isAdmin, router]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch('/api/admin/users');
            const data = await res.json();

            if (data.error) {
                toast.error(data.error);
                return;
            }

            setUsers(data.users || []);
            setStats(data.stats || { totalUsers: 0, totalResumes: 0, premiumUsers: 0, onboardedUsers: 0 });
        } catch (err) {
            console.error('Admin fetch error:', err);
            toast.error('Failed to load admin data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAdmin) fetchData();
    }, [isAdmin, fetchData]);

    const deleteUser = async (uid: string) => {
        if (!confirm(`Permanently delete user ${uid} and all their data? This cannot be undone.`)) return;
        try {
            // Delete user's resumes subcollection
            const resumeSnap = await getDocs(collection(db, 'users', uid, 'resumes'));
            for (const resumeDoc of resumeSnap.docs) {
                await deleteDoc(doc(db, 'users', uid, 'resumes', resumeDoc.id));
            }
            // Delete onboarding subcollection
            try {
                await deleteDoc(doc(db, 'users', uid, 'profile', 'onboarding'));
            } catch { /* may not exist */ }
            // Delete user document
            await deleteDoc(doc(db, 'users', uid));
            toast.success('User deleted');
            setUsers(prev => prev.filter(u => u.uid !== uid));
            setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
        } catch (err) {
            console.error('Delete error:', err);
            toast.error('Failed to delete user');
        }
    };

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isAdmin) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
            </div>
        );
    }

    const usersWithResumes = users.filter(u => (u.resumeCount ?? 0) > 0).length;
    const avgResumes = stats.totalUsers > 0 ? (stats.totalResumes / stats.totalUsers).toFixed(1) : '0';
    const onboardingRate = stats.totalUsers > 0 ? Math.round((stats.onboardedUsers / stats.totalUsers) * 100) : 0;

    const STAT_CARDS = [
        { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        { label: 'Onboarding Rate', value: `${onboardingRate}%`, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
        { label: 'Avg Resumes/User', value: avgResumes, icon: FileText, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
        { label: 'Premium Users', value: stats.premiumUsers, icon: Crown, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
        { label: 'Conversion Rate', value: stats.totalUsers > 0 ? `${Math.round((stats.premiumUsers / stats.totalUsers) * 100)}%` : '0%', icon: BarChart3, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    ];

    return (
        <div className="max-w-6xl mx-auto animate-fade-in space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-display font-bold flex items-center gap-2">
                        <Shield className="w-6 h-6 text-red-500" />
                        Admin Panel
                    </h1>
                    <p className="text-sm text-surface-500 mt-1">
                        Manage users, monitor stats, and access all features
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="btn-ghost text-sm flex items-center gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {STAT_CARDS.map((card) => (
                    <div key={card.label} className="glass-card p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                                <card.icon className={`w-5 h-5 ${card.color}`} />
                            </div>
                        </div>
                        <p className="text-2xl font-bold">
                            {loading ? (
                                <span className="inline-block w-12 h-7 bg-surface-200 dark:bg-surface-700 rounded animate-pulse" />
                            ) : (
                                card.value
                            )}
                        </p>
                        <p className="text-xs text-surface-500 mt-1">{card.label}</p>
                    </div>
                ))}
            </div>

            {/* User Conversion Funnel */}
            <div className="glass-card p-5">
                <h2 className="font-display font-bold text-sm mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-brand-500" />
                    User Conversion Funnel
                </h2>
                <div className="space-y-3">
                    {[
                        { label: 'Signed Up', count: stats.totalUsers, color: 'bg-blue-500' },
                        { label: 'Completed Onboarding', count: stats.onboardedUsers, color: 'bg-green-500' },
                        { label: 'Created Resume', count: usersWithResumes, color: 'bg-orange-500' },
                        { label: 'Upgraded to Premium', count: stats.premiumUsers, color: 'bg-yellow-500' },
                    ].map((step, i) => {
                        const pct = stats.totalUsers > 0 ? Math.round((step.count / stats.totalUsers) * 100) : 0;
                        return (
                            <div key={step.label}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-surface-600 dark:text-surface-400">{step.label}</span>
                                    <span className="text-xs font-bold">{step.count} ({pct}%)</span>
                                </div>
                                <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                                    <div className={`h-full ${step.color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            {/* Quick Actions */}
            <div className="glass-card p-5">
                <h2 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-brand-500" />
                    Quick Actions (Admin Bypass Active)
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        { href: '/resume-builder', label: 'Resume Builder', icon: FileText, desc: 'Full access' },
                        { href: '/jd-match', label: 'JD Match', icon: BarChart3, desc: 'Unlimited' },
                        { href: '/cover-letter', label: 'Cover Letter', icon: Sparkles, desc: 'Premium unlocked' },
                    ].map((action) => (
                        <Link
                            key={action.href}
                            href={action.href}
                            className="flex items-center gap-3 p-3 rounded-xl border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors group"
                        >
                            <action.icon className="w-5 h-5 text-brand-500" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{action.label}</p>
                                <p className="text-xs text-surface-500">{action.desc}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-surface-400 group-hover:text-brand-500 transition-colors" />
                        </Link>
                    ))}
                </div>
            </div>

            {/* User Management */}
            <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display font-bold text-sm flex items-center gap-2">
                        <Users className="w-4 h-4 text-brand-500" />
                        User Management ({filteredUsers.length})
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search users..."
                            className="input-field !pl-9 !py-2 text-sm !w-64"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-14 bg-surface-100 dark:bg-surface-800 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-surface-500">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No users found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-surface-200 dark:border-surface-700">
                                    <th className="text-left py-3 px-2 text-xs font-semibold text-surface-500 uppercase">User</th>
                                    <th className="text-left py-3 px-2 text-xs font-semibold text-surface-500 uppercase">Plan</th>
                                    <th className="text-left py-3 px-2 text-xs font-semibold text-surface-500 uppercase">Resumes</th>
                                    <th className="text-left py-3 px-2 text-xs font-semibold text-surface-500 uppercase">Onboarded</th>
                                    <th className="text-left py-3 px-2 text-xs font-semibold text-surface-500 uppercase">Joined</th>
                                    <th className="text-right py-3 px-2 text-xs font-semibold text-surface-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((u) => (
                                    <tr key={u.uid} className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                                        <td className="py-3 px-2">
                                            <div>
                                                <p className="font-medium">{u.displayName}</p>
                                                <p className="text-xs text-surface-500">{u.email}</p>
                                            </div>
                                        </td>
                                        <td className="py-3 px-2">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${u.subscription === 'monthly' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' :
                                                u.subscription === 'weekly' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' :
                                                    u.subscription === 'pdf_unlock' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                                                        'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'
                                                }`}>
                                                {u.subscription !== 'free' && <Crown className="w-3 h-3" />}
                                                {u.subscription}
                                            </span>
                                        </td>
                                        <td className="py-3 px-2 text-surface-600 dark:text-surface-400">
                                            {u.resumeCount ?? 0}
                                        </td>
                                        <td className="py-3 px-2">
                                            <span className={`text-xs ${u.onboardingComplete ? 'text-green-500' : 'text-surface-400'}`}>
                                                {u.onboardingComplete ? '✓ Yes' : '✗ No'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-2 text-xs text-surface-500">
                                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="py-3 px-2 text-right">
                                            <button
                                                onClick={() => deleteUser(u.uid)}
                                                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-500 transition-colors"
                                                title="Delete user"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Admin Notice */}
            <div className="glass-card p-4 border border-yellow-200 dark:border-yellow-800/30 bg-yellow-50/50 dark:bg-yellow-900/10">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Admin Mode Active</p>
                        <p className="text-xs text-yellow-600/70 dark:text-yellow-500/70 mt-1">
                            All subscription restrictions are bypassed. Rate limits are increased to 100 req/min.
                            User deletions are permanent and cannot be undone.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
