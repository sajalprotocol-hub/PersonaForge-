'use client';

import React, { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { MaintenanceMode } from '@/components/ui/MaintenanceMode';

interface MaintenanceGuardProps {
    children: React.ReactNode;
}

// Configuration
const MAINTENANCE_MODE = true; // Set to false to disable globally
const MAINTENANCE_END_DATE = '2026-03-10T00:00:00Z'; // 24 hours from now (approx)

export const MaintenanceGuard: React.FC<MaintenanceGuardProps> = ({ children }) => {
    const { isAdmin, loading, authReady } = useAuth();
    const pathname = usePathname();

    // Paths that are ALWAYS accessible (so admins can login/signup)
    const isPublicPath = useMemo(() => {
        const publicPaths = ['/login', '/signup', '/api/auth'];
        return publicPaths.some(path => pathname?.startsWith(path));
    }, [pathname]);

    // If maintenance is off, or user is an admin, or it's a public path, show the content
    if (!MAINTENANCE_MODE || isAdmin || isPublicPath) {
        return <>{children}</>;
    }

    // While auth is still determining if user is an admin, show nothing/loading to prevent flicker
    if (!authReady || loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
            </div>
        );
    }

    // Otherwise, show maintenance mode
    return <MaintenanceMode targetDate={MAINTENANCE_END_DATE} />;
};
