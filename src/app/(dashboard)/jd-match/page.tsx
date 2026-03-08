'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Target, Search, Loader2, CheckCircle2, XCircle, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { authFetch } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';
import { useAI } from '@/context/AIContext';
import { saveResumeData, saveMatchResult } from '@/lib/firestore';
import { WarpLoading } from '@/components/ui/WarpLoading';
import { RadarChart } from '@/components/ui/RadarChart';
import { useUsage } from '@/components/automation/UsageTracker';

interface KeywordResult {
    keyword: string;
    status: 'matched' | 'missing' | 'overused';
    importance: 'high' | 'medium' | 'low';
}

interface GapItem {
    keyword: string;
    suggestion: string;
    priority: 'critical' | 'important' | 'nice-to-have';
}

interface ComparisonItem {
    sectionName: string;
    jdRequirement: string;
    currentContent: string;
    suggestedRewrite: string;
    matchLevel: 'strong' | 'partial' | 'weak' | 'missing';
}

interface ContextualMapping {
    resumeSkill: string;
    jdRequirement: string;
    confidence: 'high' | 'medium' | 'low';
    explanation: string;
}

interface ScoringBreakdown {
    keywordMatch: number;
    experienceRelevance: number;
    skillAlignment: number;
}

export default function JDMatchPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { startProcessing, stopProcessing } = useAI();
    const { trackUsage } = useUsage();
    const [jdText, setJdText] = useState('');
    const [resumeText, setResumeText] = useState('');
    const [loading, setLoading] = useState(false);
    const [applyingSuggestion, setApplyingSuggestion] = useState<number | null>(null);
    const [matchScore, setMatchScore] = useState<number | null>(null);
    const [keywords, setKeywords] = useState<KeywordResult[]>([]);
    const [gaps, setGaps] = useState<GapItem[]>([]);
    const [comparisons, setComparisons] = useState<ComparisonItem[]>([]);
    const [contextualMappings, setContextualMappings] = useState<ContextualMapping[]>([]);
    const [scoringBreakdown, setScoringBreakdown] = useState<ScoringBreakdown | null>(null);
    const [showScanSweep, setShowScanSweep] = useState(false);

    const analyzeMatch = async () => {
        if (!jdText.trim()) { toast.error('Please paste a job description'); return; }

        // Enforce free-tier JD match limit
        const allowed = await trackUsage('jdMatches');
        if (!allowed) return;
        setLoading(true);
        startProcessing('Analyzing Dimensional Fit...');
        try {
            const res = await authFetch('/api/ai/match', {
                method: 'POST',
                body: JSON.stringify({ jobDescription: jdText, resumeText: resumeText.trim() || undefined }),
            });
            const data = await res.json();
            if (data.error) { toast.error(data.error); stopProcessing(); setLoading(false); return; }
            const score = data.matchPercentage ?? 72;
            setMatchScore(score);
            setKeywords(data.keywords ?? []);
            setGaps(data.gapAnalysis ?? []);
            setComparisons(data.sectionComparisons ?? []);
            setContextualMappings(data.contextualMappings ?? []);
            setScoringBreakdown(data.scoringBreakdown ?? null);

            // Save match result to Firestore for dashboard stats
            if (user?.uid) {
                const kws = data.keywords ?? [];
                saveMatchResult(user.uid, {
                    jobTitle: jdText.slice(0, 80),
                    matchPercentage: score,
                    keywordsMatched: kws.filter((k: KeywordResult) => k.status === 'matched').length,
                    keywordsTotal: kws.length,
                    timestamp: new Date().toISOString(),
                }).catch(() => { /* silent */ });
            }

            toast.success('Analysis complete!');
            if (data.demoMode) toast('📋 Demo mode — connect OpenAI key for real AI analysis', { icon: 'ℹ️' });

            // Trigger scan sweep effect
            setShowScanSweep(true);
            setTimeout(() => setShowScanSweep(false), 2000);
        } catch {
            toast.error('Analysis failed. Please try again.');
        } finally {
            setLoading(false);
            stopProcessing();
        }
    };

    const statusIcon = (status: string) => {
        switch (status) {
            case 'matched': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'missing': return <XCircle className="w-4 h-4 text-red-500" />;
            case 'overused': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
        }
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'matched': return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
            case 'missing': return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
            case 'overused': return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
            default: return '';
        }
    };

    const matchLevelColor = (level: string) => {
        switch (level) {
            case 'strong': return 'bg-green-500';
            case 'partial': return 'bg-yellow-500';
            case 'weak': return 'bg-orange-500';
            case 'missing': return 'bg-red-500';
            default: return 'bg-surface-400';
        }
    };

    const priorityBadge = (priority: string) => {
        switch (priority) {
            case 'critical': return 'bg-red-100 dark:bg-red-900/20 text-red-600';
            case 'important': return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600';
            default: return 'bg-surface-100 dark:bg-surface-800 text-surface-600';
        }
    };

    // Apply a suggestion to a new resume and redirect to Builder
    const applySuggestion = async (index: number, comp: ComparisonItem) => {
        if (!user?.uid) { toast.error('Please sign in first'); return; }
        setApplyingSuggestion(index);
        try {
            const resumeId = `match_${crypto.randomUUID().slice(0, 8)}`;
            const sectionKeyMap: Record<string, string> = {
                'Technical Skills': 'skills', 'Skills': 'skills',
                'Experience': 'experience', 'Summary': 'summary',
                'Professional Summary': 'summary', 'Education': 'education',
            };
            const sections: Record<string, string> = {};
            comparisons.forEach(c => {
                const key = sectionKeyMap[c.sectionName] || c.sectionName.toLowerCase();
                sections[key] = c.suggestedRewrite;
            });
            await saveResumeData(user.uid, resumeId, {
                title: 'JD-Matched Resume',
                sections,
                tone: 'professional',
            });
            toast.success('Saved! Redirecting to Resume Builder...');
            router.push('/resume-builder');
        } catch {
            toast.error('Failed to apply suggestion');
        } finally {
            setApplyingSuggestion(null);
        }
    };

    return (
        <div className="max-w-6xl mx-auto animate-fade-in space-y-6">
            <AnimatePresence>
                {loading && <WarpLoading message="Analyzing Dimensional Fit..." />}
            </AnimatePresence>
            <div>
                <h1 className="text-3xl font-display font-black flex items-center gap-3 nebula-text">
                    <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-purple-glow">
                        <Target className="w-6 h-6 text-white" />
                    </div>
                    Job Description Match
                </h1>
                <p className="text-sm font-medium text-gray-500 mt-2 uppercase tracking-widest pl-1">See how your reality aligns with the job dimension</p>
            </div>

            {/* Input */}
            <div className="glass-card p-6">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Paste Job Description</label>
                        <div className="relative">
                            <textarea
                                value={jdText}
                                onChange={(e) => setJdText(e.target.value.slice(0, 5000))}
                                className="input-field min-h-[160px] text-sm resize-y pr-12"
                                placeholder="Paste the full job description here..."
                            />
                            <div className="absolute bottom-2 right-2 text-[10px] font-bold text-surface-400">
                                {jdText.length}/5000
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Your Resume Text <span className="text-surface-400 font-normal">(optional — improves accuracy)</span>
                        </label>
                        <div className="relative">
                            <textarea
                                value={resumeText}
                                onChange={(e) => setResumeText(e.target.value.slice(0, 8000))}
                                className="input-field min-h-[160px] text-sm resize-y pr-12"
                                placeholder="Paste your resume content here for a personalized analysis..."
                            />
                            <div className="absolute bottom-2 right-2 text-[10px] font-bold text-surface-400">
                                {resumeText.length}/8000
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end">
                    <button onClick={analyzeMatch} disabled={loading || !jdText.trim()} className="btn-primary text-sm flex items-center gap-2">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        Analyze Match
                    </button>
                </div>
            </div>

            {/* Results */}
            <AnimatePresence>
                {matchScore !== null && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Match Score & Scan Effect */}
                        <div className="relative overflow-hidden group">
                            <AnimatePresence>
                                {showScanSweep && (
                                    <motion.div
                                        initial={{ top: '-10%' }}
                                        animate={{ top: '110%' }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 1.5, ease: "easeInOut" }}
                                        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent z-10 shadow-[0_0_20px_rgba(168,85,247,0.8)]"
                                    />
                                )}
                            </AnimatePresence>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="glass-card p-6 text-center flex flex-col items-center justify-center">
                                    <h2 className="font-display font-bold text-sm mb-4 uppercase tracking-widest text-purple-400">Atmospheric Fit</h2>
                                    <div className="ats-ring inline-flex relative items-center justify-center">
                                        <svg width="160" height="160" viewBox="0 0 120 120">
                                            <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/5" />
                                            <motion.circle
                                                cx="60" cy="60" r="50" fill="none" strokeWidth="6" strokeLinecap="round"
                                                initial={{ strokeDasharray: "0 314" }}
                                                animate={{ strokeDasharray: `${(matchScore / 100) * 314} 314` }}
                                                transition={{ duration: 2, delay: 0.5 }}
                                                className={matchScore >= 80 ? 'stroke-purple-500' : matchScore >= 60 ? 'stroke-violet-500' : 'stroke-rose-500'}
                                            />
                                        </svg>
                                        <div className="absolute flex flex-col items-center">
                                            <motion.span
                                                initial={{ opacity: 0, scale: 0.5 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className={`text-4xl font-display font-black ${matchScore >= 80 ? 'text-white' : 'text-gray-200'}`}
                                            >
                                                {matchScore}%
                                            </motion.span>
                                            <span className="text-[10px] font-bold text-purple-400/60 uppercase tracking-tighter">Match Core</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-400 mt-4 max-w-[200px] leading-relaxed">
                                        {matchScore >= 80 ? 'Dimensional alignment detected. Proceed to forge.' :
                                            matchScore >= 60 ? 'Close orbit. Some manual steering required.' :
                                                'Weak signal. Recalibrate resume matrix.'}
                                    </p>
                                </div>

                                {scoringBreakdown && (
                                    <div className="glass-card p-6 flex flex-col items-center justify-center">
                                        <h2 className="font-display font-bold text-sm mb-4 uppercase tracking-widest text-purple-400">Neural breakdown</h2>
                                        <RadarChart
                                            size={200}
                                            data={[
                                                { label: 'Keywords', value: scoringBreakdown.keywordMatch },
                                                { label: 'Experience', value: scoringBreakdown.experienceRelevance },
                                                { label: 'Alignment', value: scoringBreakdown.skillAlignment },
                                            ]}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Analysis Sections with Staggered Fade */}
                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Contextual Mappings */}
                            {contextualMappings.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="glass-card p-6"
                                >
                                    <h2 className="font-display font-bold text-sm mb-4 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-purple-500" />
                                        Semantic Bridge
                                    </h2>
                                    <div className="space-y-3">
                                        {contextualMappings.map((m, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-purple-500/20 transition-colors">
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-bold text-white uppercase">{m.resumeSkill}</span>
                                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${m.confidence === 'high' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{m.confidence}</span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-500">→ {m.jdRequirement}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Keyword Heatmap */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="glass-card p-6"
                            >
                                <h2 className="font-display font-bold text-sm mb-4 flex items-center gap-2">
                                    <Search className="w-4 h-4 text-purple-500" />
                                    Frequency Matrix
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {keywords.map((kw, i) => (
                                        <span key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-all hover:scale-105 border ${statusColor(kw.status)}`}>
                                            {kw.keyword}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>
                        </div>

                        {/* Gap Analysis */}
                        <div className="grid lg:grid-cols-3 gap-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="glass-card p-6 lg:col-span-2"
                            >
                                <h2 className="font-display font-bold text-sm mb-4">Critical Gaps</h2>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {gaps.map((gap, i) => (
                                        <div key={i} className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex items-start gap-3 group hover:border-red-500/30 transition-all">
                                            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                                                <XCircle className="w-4 h-4 text-red-500" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-black text-xs uppercase text-white">{gap.keyword}</span>
                                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${priorityBadge(gap.priority)}`}>
                                                        {gap.priority}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 leading-relaxed">{gap.suggestion}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.45 }}
                                className="glass-card p-6 border-purple-500/20 bg-purple-500/5"
                            >
                                <h2 className="font-display font-bold text-sm mb-4 flex items-center gap-2 text-purple-400">
                                    <Sparkles className="w-4 h-4" />
                                    Strategy Boosters
                                </h2>
                                <div className="space-y-4">
                                    {matchScore < 60 && (
                                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-gray-400 leading-relaxed">
                                            <strong className="text-white block mb-1 uppercase tracking-tighter">1. Recalibrate Authority</strong>
                                            This JD indicates a higher seniority level than your current resume matrix. Use the "Executive" tone in the builder to bridge the authority gap.
                                        </div>
                                    )}
                                    {keywords.filter(k => k.status === 'missing').length > 5 && (
                                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-gray-400 leading-relaxed">
                                            <strong className="text-white block mb-1 uppercase tracking-tighter">2. Keyword Injection</strong>
                                            You are missing 5+ mandatory industry terms. Sync the "Forge Output" suggestions below to your skills section immediately.
                                        </div>
                                    )}
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-gray-400 leading-relaxed">
                                        <strong className="text-white block mb-1 uppercase tracking-tighter">3. Semantic Bridging</strong>
                                        Hiring managers in this sector look for {keywords[0]?.keyword || 'specific skills'}. Ensure your summary leads with this impact.
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Side-by-side comparison */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="glass-card p-6"
                        >
                            <h2 className="font-display font-bold text-sm mb-6 uppercase tracking-widest text-purple-400 text-center">Optimization Directives</h2>
                            <div className="space-y-6">
                                {comparisons.map((comp, i) => (
                                    <div key={i} className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] space-y-4 group hover:bg-white/[0.02] transition-colors relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/20" />
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full animate-pulse ${matchLevelColor(comp.matchLevel)}`} />
                                                <h3 className="font-display font-black text-sm uppercase text-white">{comp.sectionName}</h3>
                                            </div>
                                            <span className="text-[10px] font-black uppercase text-gray-500">{comp.matchLevel} Integrity</span>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                                                <span className="text-[9px] font-black text-gray-600 block mb-2 uppercase tracking-tighter">Source Requirement</span>
                                                <p className="text-xs text-gray-400 italic line-clamp-3">{comp.jdRequirement}</p>
                                            </div>
                                            <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                                                <span className="text-[9px] font-black text-gray-600 block mb-2 uppercase tracking-tighter">Current Signal</span>
                                                <p className="text-xs text-gray-400 line-clamp-3">{comp.currentContent}</p>
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Sparkles className="w-3 h-3 text-purple-500" />
                                                <span className="text-[10px] font-black text-purple-400 uppercase">Forge Output</span>
                                            </div>
                                            <p className="text-sm text-gray-200 leading-relaxed font-medium">{comp.suggestedRewrite}</p>
                                            <button
                                                onClick={() => applySuggestion(i, comp)}
                                                disabled={applyingSuggestion === i}
                                                className="mt-4 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 rounded-lg text-[10px] font-black uppercase text-purple-300 transition-all flex items-center gap-2">
                                                {applyingSuggestion === i ? 'Synthesizing...' : 'Sync to Resume'} <ArrowRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
