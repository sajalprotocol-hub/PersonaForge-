import Link from 'next/link';
import { Sparkles, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center px-6">
            <div className="max-w-md text-center">
                <div className="flex justify-center mb-8">
                    <div className="w-20 h-20 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center">
                        <Sparkles className="w-10 h-10 text-purple-400" />
                    </div>
                </div>
                <h1 className="text-7xl font-display font-bold text-white mb-4">404</h1>
                <p className="text-xl text-gray-400 mb-8 font-medium">
                    This page doesn&apos;t exist. It might have been moved or deleted.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/" className="btn-primary flex items-center gap-2">
                        <Home className="w-4 h-4" />
                        Go Home
                    </Link>
                    <Link href="/dashboard" className="btn-secondary flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
