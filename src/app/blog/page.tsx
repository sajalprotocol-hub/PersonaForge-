import { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';
import { FileText, ArrowRight, Clock, Tag, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Blog — PersonaForge | Resume Tips, ATS Hacks & Career Advice',
    description: 'Expert guides on resume building, ATS optimization, and career advancement. Free tips to land your dream job faster.',
    openGraph: {
        title: 'PersonaForge Blog — Resume Tips & ATS Hacks',
        description: 'Expert guides on resume building, ATS optimization, and career advancement.',
    },
};

export default function BlogListingPage() {
    const posts = getAllPosts();

    return (
        <div className="min-h-screen bg-black text-white font-sans">
            {/* Navbar */}
            <nav className="border-b border-white/5 bg-black/80 backdrop-blur-xl py-3">
                <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-purple-glow group-hover:scale-110 transition-transform">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-display font-bold text-white tracking-tight">PersonaForge</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">
                            Sign In
                        </Link>
                        <Link href="/signup" className="glass-card px-6 py-2.5 rounded-xl text-sm font-bold border-purple-500/50 hover:bg-purple-500/10 transition-all shadow-purple-glow">
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Header */}
            <div className="max-w-4xl mx-auto px-6 pt-20 pb-12 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-widest mb-6">
                    <FileText className="w-4 h-4" />
                    PersonaForge Blog
                </div>
                <h1 className="text-4xl sm:text-6xl font-display font-bold text-white mb-4 tracking-tight">
                    Career <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Intelligence</span>
                </h1>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                    Expert guides on resume building, ATS optimization, and getting hired faster with AI.
                </p>
            </div>

            {/* Posts Grid */}
            <div className="max-w-4xl mx-auto px-6 pb-20">
                <div className="space-y-6">
                    {posts.map((post, i) => (
                        <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
                            <article className="glass-card p-8 hover:border-purple-500/30 transition-all duration-300 relative overflow-hidden">
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-600/5 blur-[60px] rounded-full pointer-events-none group-hover:bg-purple-600/10 transition-colors" />

                                <div className="relative z-10">
                                    <div className="flex flex-wrap items-center gap-3 mb-4">
                                        {post.tags.map(tag => (
                                            <span key={tag} className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold uppercase tracking-widest">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    <h2 className="text-2xl font-display font-bold text-white mb-3 group-hover:text-purple-400 transition-colors">
                                        {post.title}
                                    </h2>
                                    <p className="text-gray-400 leading-relaxed mb-4">
                                        {post.excerpt}
                                    </p>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-xs text-gray-500 font-bold uppercase tracking-wider">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                {post.readTime}
                                            </span>
                                            <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        </div>
                                        <span className="flex items-center gap-1 text-sm font-bold text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            Read More <ArrowRight className="w-4 h-4" />
                                        </span>
                                    </div>
                                </div>
                            </article>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Footer CTA */}
            <div className="border-t border-white/5 py-12">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
                        © 2026 PersonaForge AI. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
