import type { Metadata } from 'next';
import { Inter, Lexend } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AIProvider } from '@/context/AIContext';
import { Toaster } from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { JsonLdSchema, GoogleAnalytics } from '@/components/automation/Analytics';

// Lazy-load heavy visual components — they are NOT needed for first paint
const CustomCursor = dynamic(() => import('@/components/ui/CustomCursor').then(m => ({ default: m.CustomCursor })), { ssr: false });
const ScrollProgress = dynamic(() => import('@/components/ui/ScrollProgress').then(m => ({ default: m.ScrollProgress })), { ssr: false });

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const lexend = Lexend({ subsets: ['latin'], variable: '--font-lexend' });

export const metadata: Metadata = {
    title: 'PersonaForge — AI-Powered Resume & Profile Optimization',
    description: 'Build a job-winning resume in minutes with AI-powered optimization, JD matching, and ATS scoring. Perfect for students and early professionals.',
    keywords: ['resume builder', 'AI resume', 'ATS optimization', 'job description matching', 'career tools'],
    authors: [{ name: 'PersonaForge' }],
    openGraph: {
        title: 'PersonaForge — AI-Powered Resume Builder',
        description: 'Build a job-winning resume in minutes with AI-powered optimization, JD matching, and ATS scoring.',
        siteName: 'PersonaForge',
        type: 'website',
        locale: 'en_US',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'PersonaForge — AI-Powered Resume Builder',
        description: 'Build a job-winning resume in minutes with AI-powered optimization, JD matching, and ATS scoring.',
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${inter.variable} ${lexend.variable}`}>
            <head>
                <GoogleAnalytics />
                <JsonLdSchema />
            </head>
            <body className="min-h-screen bg-black font-sans antialiased selection:bg-purple-500/30">
                <ThemeProvider>
                    <AIProvider>
                        <AuthProvider>
                            <CustomCursor />
                            <ScrollProgress />
                            {children}
                            <Toaster
                                position="top-center"
                                toastOptions={{
                                    className: 'glass !bg-black/50 !text-white !border-white/10 !rounded-2xl backdrop-blur-xl',
                                    duration: 3000,
                                }}
                            />
                        </AuthProvider>
                    </AIProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
