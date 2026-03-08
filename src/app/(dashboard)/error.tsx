'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="max-w-lg mx-auto text-center py-16 animate-fade-in">
            <div className="glass-card p-8">
                <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-display font-bold mb-2">Something went wrong</h2>
                <p className="text-surface-500 text-sm mb-6">
                    An unexpected error occurred. Don&apos;t worry — your data is safe.
                </p>
                {process.env.NODE_ENV === 'development' && (
                    <pre className="text-xs text-red-400 bg-surface-100 dark:bg-surface-800 rounded-lg p-3 mb-6 text-left overflow-auto max-h-32">
                        {error.message}
                    </pre>
                )}
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="btn-primary flex items-center gap-2 text-sm"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </button>
                    <Link href="/dashboard" className="btn-secondary flex items-center gap-2 text-sm">
                        <Home className="w-4 h-4" />
                        Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
