'use client';

import React, { useState } from 'react';
import { Mail, Loader2, Download, Sparkles, Crown, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useAI } from '@/context/AIContext';
import { authFetch } from '@/lib/api-client';
import { getOnboardingData } from '@/lib/firestore';

const TONES = [
    { value: 'formal', label: 'Formal' },
    { value: 'enthusiastic', label: 'Enthusiastic' },
    { value: 'concise', label: 'Concise' },
    { value: 'data-driven', label: 'Data-Driven' },
];

export default function CoverLetterPage() {
    const { user, profile, isAdmin } = useAuth();
    const { startProcessing, stopProcessing } = useAI();
    const isPremium = isAdmin || profile?.subscription === 'monthly' || profile?.subscription === 'weekly';
    const [jdText, setJdText] = useState('');
    const [tone, setTone] = useState('formal');
    const [loading, setLoading] = useState(false);
    const [coverLetter, setCoverLetter] = useState('');

    const generateCoverLetter = async () => {
        if (!jdText.trim()) { toast.error('Please paste a job description'); return; }
        setLoading(true);
        startProcessing('Synthesizing Professional Narrative...');
        try {
            // Fetch onboarding data for context — wrap in try-catch to avoid blocking
            let profileData = null;
            if (user?.uid) {
                try {
                    profileData = await getOnboardingData(user.uid);
                } catch (err) {
                    console.warn('Failed to fetch profile data for cover letter:', err);
                }
            }

            const res = await authFetch('/api/ai/cover-letter', {
                method: 'POST',
                body: JSON.stringify({ jobDescription: jdText, tone, profileData }),
            });
            const data = await res.json();
            if (data.error) {
                toast.error(data.error);
                setLoading(false);
                stopProcessing();
                return;
            }
            setCoverLetter(data.coverLetter ?? `Dear Hiring Manager,

I am writing to express my strong interest in the position advertised. With my background in software development and a passion for building impactful products, I believe I would be an excellent fit for your team.

During my recent role, I successfully developed and deployed multiple full-stack applications using React and Node.js, resulting in a 30% improvement in user engagement. My experience with agile methodologies and cross-functional collaboration has prepared me to contribute effectively from day one.

I am particularly drawn to this opportunity because of your company's commitment to innovation and the chance to work on challenging problems at scale. I am confident that my technical skills, combined with my enthusiasm for learning, make me a strong candidate.

I would welcome the opportunity to discuss how my skills and experience align with your needs. Thank you for considering my application.

Best regards,
[Your Name]`);
            toast.success('Cover letter generated!');
            if (data.demoMode) toast('📋 Demo mode — connect OpenAI key for real AI content', { icon: 'ℹ️' });
        } catch {
            toast.error('Generation failed. Please try again.');
        } finally {
            setLoading(false);
            stopProcessing();
        }
    };

    const downloadCoverLetter = () => {
        const blob = new Blob([coverLetter], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'PersonaForge_CoverLetter.txt';
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Downloaded TXT!');
    };

    const downloadCoverLetterPDF = async () => {
        toast.loading('Generating PDF...', { id: 'cl-pdf' });
        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const container = document.createElement('div');
            container.style.cssText = 'padding:48px;font-family:Georgia,serif;font-size:13px;line-height:1.8;color:#1a1a1a;max-width:700px;';
            container.innerHTML = coverLetter.replace(/\n/g, '<br/>');
            document.body.appendChild(container);
            await html2pdf()
                .set({
                    margin: [15, 15, 15, 15],
                    filename: 'PersonaForge_CoverLetter.pdf',
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2 },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                })
                .from(container)
                .save();
            document.body.removeChild(container);
            toast.success('PDF Downloaded!', { id: 'cl-pdf' });
        } catch {
            toast.error('PDF generation failed', { id: 'cl-pdf' });
        }
    };

    if (!isPremium) {
        return (
            <div className="max-w-2xl mx-auto animate-fade-in text-center py-16">
                <div className="glass-card p-8 sm:p-12">
                    <div className="w-16 h-16 rounded-2xl bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center mx-auto mb-6">
                        <Crown className="w-8 h-8 text-yellow-500" />
                    </div>
                    <h1 className="text-2xl font-display font-bold mb-3">Premium Feature</h1>
                    <p className="text-surface-500 mb-6">
                        The AI Cover Letter Generator is available on the <span className="font-semibold text-brand-500">Pro (₹199)</span> plan.
                        Generate tailored cover letters that perfectly complement your resume.
                    </p>
                    <div className="space-y-3 text-left max-w-sm mx-auto mb-8">
                        {['AI-powered cover letter generation', 'Multiple tone options', 'Job description tailoring', 'Instant download'].map((f, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                                <Lock className="w-4 h-4 text-surface-400" />
                                <span className="text-surface-600 dark:text-surface-400">{f}</span>
                            </div>
                        ))}
                    </div>
                    <Link href="/settings" className="btn-primary inline-flex items-center gap-2">
                        <Crown className="w-4 h-4" /> Upgrade to Premium
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
            <div>
                <h1 className="text-2xl font-display font-bold flex items-center gap-2">
                    <Mail className="w-6 h-6 text-purple-500" />
                    Cover Letter Generator
                </h1>
                <p className="text-sm text-surface-500 mt-1">Generate a tailored cover letter from your resume and job description</p>
            </div>

            <div className="glass-card p-6">
                <label className="block text-sm font-medium mb-2">Job Description</label>
                <div className="relative">
                    <textarea
                        value={jdText}
                        onChange={(e) => setJdText(e.target.value.slice(0, 5000))}
                        className="input-field min-h-[140px] text-sm resize-y pr-12"
                        placeholder="Paste the job description..."
                    />
                    <div className="absolute bottom-2 right-2 text-[10px] font-bold text-surface-400">
                        {jdText.length}/5000
                    </div>
                </div>
                <div className="flex items-center gap-3 mt-3">
                    <select value={tone} onChange={(e) => setTone(e.target.value)} className="input-field !w-auto !py-2 text-sm">
                        {TONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <button onClick={generateCoverLetter} disabled={loading} className="btn-primary text-sm flex items-center gap-2">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        Generate
                    </button>
                </div>
            </div>

            {coverLetter && (
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-display font-bold text-sm">Your Cover Letter</h2>
                        <div className="flex items-center gap-2">
                            <button onClick={downloadCoverLetterPDF} className="btn-primary text-sm flex items-center gap-1.5">
                                <Download className="w-4 h-4" /> PDF
                            </button>
                            <button onClick={downloadCoverLetter} className="btn-ghost text-sm flex items-center gap-1.5">
                                <Download className="w-4 h-4" /> TXT
                            </button>
                        </div>
                    </div>
                    <textarea
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        className="input-field min-h-[400px] text-sm resize-y leading-relaxed"
                    />
                </div>
            )}
        </div>
    );
}
