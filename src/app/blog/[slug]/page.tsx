import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPostBySlug, getRelatedPosts, getAllPosts } from '@/lib/blog';
import { ArrowLeft, Clock, Tag, Sparkles, ArrowRight } from 'lucide-react';

interface PageProps {
    params: { slug: string };
}

export async function generateStaticParams() {
    const posts = getAllPosts();
    return posts.map(post => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const post = getPostBySlug(params.slug);
    if (!post) return { title: 'Post Not Found' };

    return {
        title: `${post.title} — PersonaForge Blog`,
        description: post.excerpt,
        openGraph: {
            title: post.title,
            description: post.excerpt,
            type: 'article',
            publishedTime: post.date,
            authors: [post.author],
            tags: post.tags,
        },
    };
}

export default function BlogPostPage({ params }: PageProps) {
    const post = getPostBySlug(params.slug);
    if (!post) notFound();

    const related = getRelatedPosts(params.slug);

    // Simple markdown-like rendering (handles ##, **, *, -, |, ❌, ✅)
    const renderContent = (content: string) => {
        const lines = content.trim().split('\n');
        const elements: React.ReactNode[] = [];
        let inTable = false;
        let tableRows: string[][] = [];

        const processInline = (text: string): React.ReactNode => {
            // Bold
            const parts = text.split(/\*\*(.*?)\*\*/g);
            return parts.map((part, i) =>
                i % 2 === 1 ? <strong key={i} className="text-white font-bold">{part}</strong> : part
            );
        };

        lines.forEach((line, idx) => {
            const trimmed = line.trim();

            // Table rows
            if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
                const cells = trimmed.split('|').filter(c => c.trim()).map(c => c.trim());
                if (cells.every(c => /^[-:]+$/.test(c))) {
                    // Separator row — skip
                    return;
                }
                if (!inTable) {
                    inTable = true;
                    tableRows = [];
                }
                tableRows.push(cells);
                return;
            }

            // End of table
            if (inTable) {
                inTable = false;
                elements.push(
                    <div key={`table-${idx}`} className="overflow-x-auto my-6">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    {tableRows[0]?.map((cell, ci) => (
                                        <th key={ci} className="px-4 py-3 text-left text-purple-400 font-bold uppercase tracking-wider text-xs">{processInline(cell)}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {tableRows.slice(1).map((row, ri) => (
                                    <tr key={ri} className="border-b border-white/5">
                                        {row.map((cell, ci) => (
                                            <td key={ci} className="px-4 py-3 text-gray-300">{processInline(cell)}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
                tableRows = [];
            }

            if (trimmed === '') {
                return;
            }

            // H2
            if (trimmed.startsWith('## ')) {
                elements.push(
                    <h2 key={idx} className="text-2xl font-display font-bold text-white mt-10 mb-4">{trimmed.slice(3)}</h2>
                );
                return;
            }

            // H3
            if (trimmed.startsWith('### ')) {
                elements.push(
                    <h3 key={idx} className="text-xl font-display font-bold text-white mt-8 mb-3">{trimmed.slice(4)}</h3>
                );
                return;
            }

            // Horizontal rule
            if (trimmed === '---') {
                elements.push(<hr key={idx} className="border-white/10 my-8" />);
                return;
            }

            // List items
            if (trimmed.startsWith('- ')) {
                elements.push(
                    <li key={idx} className="flex items-start gap-3 text-gray-300 leading-relaxed ml-4 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2.5 shrink-0" />
                        <span>{processInline(trimmed.slice(2))}</span>
                    </li>
                );
                return;
            }

            // Numbered list
            if (/^\d+\.\s/.test(trimmed)) {
                const text = trimmed.replace(/^\d+\.\s/, '');
                elements.push(
                    <li key={idx} className="flex items-start gap-3 text-gray-300 leading-relaxed ml-4 mb-2">
                        <span className="text-purple-400 font-bold shrink-0">{trimmed.match(/^\d+/)?.[0]}.</span>
                        <span>{processInline(text)}</span>
                    </li>
                );
                return;
            }

            // Links: [text](url)
            if (trimmed.match(/\[.*?\]\(.*?\)/)) {
                const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
                const parts: React.ReactNode[] = [];
                let lastIndex = 0;
                let match;
                while ((match = linkRegex.exec(trimmed)) !== null) {
                    if (match.index > lastIndex) {
                        parts.push(processInline(trimmed.slice(lastIndex, match.index)));
                    }
                    parts.push(
                        <Link key={match.index} href={match[2]} className="text-purple-400 hover:text-purple-300 font-bold underline underline-offset-4 transition-colors">
                            {match[1]}
                        </Link>
                    );
                    lastIndex = match.index + match[0].length;
                }
                if (lastIndex < trimmed.length) {
                    parts.push(processInline(trimmed.slice(lastIndex)));
                }
                elements.push(<p key={idx} className="text-gray-300 leading-relaxed mb-4">{parts}</p>);
                return;
            }

            // Italic *text*
            if (trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.startsWith('**')) {
                elements.push(
                    <p key={idx} className="text-gray-500 italic text-sm mb-4">{trimmed.slice(1, -1)}</p>
                );
                return;
            }

            // Regular paragraph
            elements.push(
                <p key={idx} className="text-gray-300 leading-relaxed mb-4">{processInline(trimmed)}</p>
            );
        });

        // Flush remaining table
        if (inTable && tableRows.length > 0) {
            elements.push(
                <div key="table-final" className="overflow-x-auto my-6">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/10">
                                {tableRows[0]?.map((cell, ci) => (
                                    <th key={ci} className="px-4 py-3 text-left text-purple-400 font-bold uppercase tracking-wider text-xs">{processInline(cell)}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tableRows.slice(1).map((row, ri) => (
                                <tr key={ri} className="border-b border-white/5">
                                    {row.map((cell, ci) => (
                                        <td key={ci} className="px-4 py-3 text-gray-300">{processInline(cell)}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }

        return elements;
    };

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
                    <Link href="/signup" className="glass-card px-6 py-2.5 rounded-xl text-sm font-bold border-purple-500/50 hover:bg-purple-500/10 transition-all shadow-purple-glow">
                        Get Started
                    </Link>
                </div>
            </nav>

            <article className="max-w-3xl mx-auto px-6 pt-12 pb-20">
                {/* Back link */}
                <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8 font-bold">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Blog
                </Link>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {post.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold uppercase tracking-widest">
                            {tag}
                        </span>
                    ))}
                </div>

                {/* Title */}
                <h1 className="text-3xl sm:text-5xl font-display font-bold text-white mb-6 tracking-tight leading-tight">
                    {post.title}
                </h1>

                {/* Meta */}
                <div className="flex items-center gap-4 text-xs text-gray-500 font-bold uppercase tracking-wider mb-12 pb-8 border-b border-white/5">
                    <span>{post.author}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {post.readTime}
                    </span>
                    <span>•</span>
                    <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>

                {/* Content */}
                <div className="prose-dark">
                    {renderContent(post.content)}
                </div>

                {/* CTA */}
                <div className="mt-16 glass-card p-8 border-purple-500/20 text-center">
                    <h3 className="text-2xl font-display font-bold text-white mb-3">Ready to optimize your resume?</h3>
                    <p className="text-gray-400 mb-6">Try PersonaForge free — no credit card required.</p>
                    <Link href="/signup" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 transition-all shadow-purple-glow active:scale-[0.98]">
                        <Sparkles className="w-5 h-5" />
                        Get Started Free
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Related Posts */}
                {related.length > 0 && (
                    <div className="mt-16">
                        <h3 className="text-sm font-black text-gray-500 uppercase tracking-[0.3em] mb-6">Related Articles</h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {related.map(rp => (
                                <Link key={rp.slug} href={`/blog/${rp.slug}`} className="glass-card p-6 hover:border-purple-500/30 transition-all group">
                                    <h4 className="font-display font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">{rp.title}</h4>
                                    <p className="text-sm text-gray-400 line-clamp-2">{rp.excerpt}</p>
                                    <span className="inline-flex items-center gap-1 text-xs text-purple-400 font-bold mt-3">
                                        Read More <ArrowRight className="w-3 h-3" />
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </article>
        </div>
    );
}
