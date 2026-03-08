'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
    Sparkles, RefreshCw, Download, FileText, Briefcase,
    GraduationCap, Code, User, ChevronDown, Loader2, Award,
    Save, Trash2, Plus, FolderOpen, Upload, ChevronRight, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { authFetch } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';
import { useAI } from '@/context/AIContext';
import { saveResumeData, getUserResumes, deleteResumeData, getOnboardingData } from '@/lib/firestore';
import type { ResumeTone, ResumeExperience, ResumeEducation, ResumeProject } from '@/types/resume';
import { WarpLoading } from '@/components/ui/WarpLoading';
import { useUsage } from '@/components/automation/UsageTracker';
import { extractTextFromFile } from '@/lib/file-parser';

/* â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const TONES: { value: ResumeTone; label: string; desc: string }[] = [
    { value: 'professional', label: 'Professional', desc: 'Corporate & formal' },
    { value: 'creative', label: 'Creative', desc: 'Engaging & unique' },
    { value: 'technical', label: 'Technical', desc: 'Detail-oriented' },
    { value: 'executive', label: 'Executive', desc: 'Leadership-focused' },
];

type ResumeLayout = 'modern' | 'executive' | 'minimal' | 'classic';

const LAYOUTS: { value: ResumeLayout; label: string; desc: string }[] = [
    { value: 'modern', label: 'Modern', desc: 'Clean sans-serif with accent colors' },
    { value: 'executive', label: 'Executive', desc: 'Bold serif with black borders' },
    { value: 'minimal', label: 'Minimal', desc: 'Ultra-clean with subtle lines' },
    { value: 'classic', label: 'Classic', desc: 'Traditional serif formatting' },
];

interface ContactInfo {
    fullName: string; email: string; phone: string;
    location: string; linkedin: string; github: string;
}

const DEFAULT_CONTACT: ContactInfo = {
    fullName: '', email: '', phone: '', location: '', linkedin: '', github: '',
};

interface SavedResume {
    id: string; title: string;
    updatedAt?: { seconds: number };
    contact?: ContactInfo;
    sections?: { summary: string; experience: ResumeExperience[]; education: ResumeEducation[]; skills: string; projects: ResumeProject[]; certifications: string; };
    tone?: ResumeTone; layout?: ResumeLayout; atsScore?: number;
}

const STEPS = [
    { id: 1, label: 'Profile', icon: User, section: 'contact' },
    { id: 2, label: 'Summary', icon: Sparkles, section: 'summary' },
    { id: 3, label: 'Experience', icon: Briefcase, section: 'experience' },
    { id: 4, label: 'Education', icon: GraduationCap, section: 'education' },
    { id: 5, label: 'Skills', icon: Code, section: 'skills' },
    { id: 6, label: 'Projects', icon: Award, section: 'projects' },
    { id: 7, label: 'Finalize', icon: FileText, section: 'finalize' },
];

/* â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const Field = ({ label, children, span }: { label: string; children: React.ReactNode; span?: boolean }) => (
    <div className={`space-y-1.5 ${span ? 'col-span-2' : ''}`}>
        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">{label}</label>
        {children}
    </div>
);

const inputCls = "w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-gray-600 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 focus:bg-white/[0.06] outline-none transition-all";
const textareaCls = `${inputCls} min-h-[180px] leading-relaxed resize-none`;

const SectionHeader = ({ title, icon: Icon, sub, onGenerate, loading }: {
    title: string; icon: React.ElementType; sub?: string;
    onGenerate?: () => void; loading?: boolean;
}) => (
    <div className="flex items-center justify-between mb-1">
        <div>
            <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <Icon className="w-5 h-5 text-purple-400" /> {title}
            </h3>
            {sub && <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">{sub}</p>}
        </div>
        {onGenerate && (
            <button onClick={onGenerate} disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-purple-400 hover:bg-purple-500/10 border border-purple-500/20 transition-all disabled:opacity-40">
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                AI Generate
            </button>
        )}
    </div>
);

const ItemControls = ({ onUp, onDown, onDelete }: { onUp: () => void; onDown: () => void; onDelete: () => void }) => (
    <div className="absolute top-3 right-3 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onUp} className="p-1.5 text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all"><ChevronDown className="w-3.5 h-3.5 rotate-180" /></button>
        <button onClick={onDown} className="p-1.5 text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all"><ChevronDown className="w-3.5 h-3.5" /></button>
        <div className="w-px h-3 bg-white/10 mx-0.5" />
        <button onClick={onDelete} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
    </div>
);

/* â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export default function ResumeBuilderPage() {
    const { user, profile } = useAuth();
    const { startProcessing, stopProcessing } = useAI();
    const { trackUsage, canUseFeature } = useUsage();

    // Core resume state
    const [tone, setTone] = useState<ResumeTone>('professional');
    const [layout, setLayout] = useState<ResumeLayout>('executive');
    const [atsScore, setAtsScore] = useState(0);
    const [contact, setContact] = useState<ContactInfo>(DEFAULT_CONTACT);
    const [summary, setSummary] = useState('');
    const [experience, setExperience] = useState<ResumeExperience[]>([]);
    const [education, setEducation] = useState<ResumeEducation[]>([]);
    const [skills, setSkills] = useState('');
    const [projects, setProjects] = useState<ResumeProject[]>([]);
    const [certifications, setCertifications] = useState('');

    // UI state
    const [resumeTitle, setResumeTitle] = useState('Untitled Resume');
    const [currentResumeId, setCurrentResumeId] = useState('');
    const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
    const [showResumeList, setShowResumeList] = useState(false);
    const [loadingResumes, setLoadingResumes] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [loadingSection, setLoadingSection] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [focusedSection, setFocusedSection] = useState<string | null>(null);

    const previewRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Contact line for preview
    const contactLine = useMemo(() =>
        [contact.phone, contact.email, contact.location, contact.linkedin, contact.github].filter(Boolean).join(' Â· '),
        [contact]
    );

    const scoreColor = atsScore >= 80 ? 'text-green-400' : atsScore >= 60 ? 'text-yellow-400' : 'text-red-400';
    const scoreBg = atsScore >= 80 ? 'stroke-green-400' : atsScore >= 60 ? 'stroke-yellow-400' : 'stroke-red-400';

    // â”€â”€ Load saved resumes & prefill contact â”€â”€
    useEffect(() => {
        if (user?.uid) {
            setLoadingResumes(true);
            getUserResumes(user.uid).then(r => setSavedResumes(r as SavedResume[])).catch(() => { }).finally(() => setLoadingResumes(false));
        }
        if (profile) {
            setContact(prev => ({ ...prev, fullName: prev.fullName || profile.displayName || '', email: prev.email || profile.email || '' }));
        }
    }, [user?.uid, profile]);

    const getProfileData = useCallback(async () => {
        if (!user?.uid) return {};
        try { return (await getOnboardingData(user.uid)) || {}; } catch { return {}; }
    }, [user?.uid]);

    // â”€â”€ Auto-save every 30s â”€â”€
    useEffect(() => {
        if (!user?.uid || !currentResumeId) return;
        const timer = setTimeout(async () => {
            try {
                await saveResumeData(user.uid, currentResumeId, {
                    title: resumeTitle, contact,
                    sections: { summary, experience, education, skills, projects, certifications },
                    tone, layout, atsScore,
                });
                toast.success('Auto-saved', { id: 'autosave', duration: 1500 });
            } catch { /* silent */ }
        }, 30000);
        return () => clearTimeout(timer);
    }, [user?.uid, currentResumeId, summary, experience, education, skills, projects, certifications, contact, resumeTitle, tone, layout, atsScore]);

    // â”€â”€ Actions â”€â”€
    const updateContact = (field: keyof ContactInfo, value: string) => setContact(prev => ({ ...prev, [field]: value }));

    const handleFileUpload = async (file: File) => {
        setUploadingFile(true);
        try {
            const text = await extractTextFromFile(file);
            if (text.trim()) { setSummary(text.slice(0, 2000)); toast.success(`Extracted ${text.length} chars`); }
        } catch (err: any) { toast.error(err.message || 'Failed to extract text'); }
        finally { setUploadingFile(false); }
    };

    const generateSection = async (sectionId: string) => {
        const allowed = await trackUsage('aiGenerations');
        if (!allowed) return;
        setLoadingSection(sectionId);
        startProcessing(`Optimizing ${sectionId}...`);
        try {
            const profileData = await getProfileData();
            const res = await authFetch('/api/ai/generate', { method: 'POST', body: JSON.stringify({ section: sectionId, tone, profileData }) });
            const data = await res.json();
            if (data.error) { toast.error(data.error); return; }
            if (data.content) {
                const setters: Record<string, (v: any) => void> = { summary: setSummary, experience: setExperience, education: setEducation, skills: setSkills, projects: setProjects, certifications: setCertifications };
                setters[sectionId]?.(data.content);
                if (data.atsScore) setAtsScore(data.atsScore);
                toast.success(`${sectionId} updated!`);
                if (data.demoMode) toast('ðŸ“‹ Demo mode active', { icon: 'â„¹ï¸' });
            }
        } catch { toast.error('Generation failed'); }
        finally { setLoadingSection(null); stopProcessing(); }
    };

    const generateAll = async () => {
        const allowed = await trackUsage('aiGenerations');
        if (!allowed) return;
        setGenerating(true);
        startProcessing('Synthesizing Full Profile...');
        try {
            const profileData = await getProfileData();
            const res = await authFetch('/api/ai/generate', { method: 'POST', body: JSON.stringify({ section: 'all', tone, profileData }) });
            const data = await res.json();
            if (data.error) { toast.error(data.error); return; }
            if (data.sections) {
                const s = data.sections;
                if (s.summary) setSummary(s.summary); if (s.experience) setExperience(s.experience);
                if (s.education) setEducation(s.education); if (s.skills) setSkills(s.skills);
                if (s.projects) setProjects(s.projects); if (s.certifications) setCertifications(s.certifications);
                if (data.atsScore) setAtsScore(data.atsScore);
                toast.success('All sections generated!');
                if (data.demoMode) toast('ðŸ“‹ Demo mode active', { icon: 'â„¹ï¸' });
            }
        } catch { toast.error('Failed to generate all'); }
        finally { setGenerating(false); stopProcessing(); }
    };

    const saveResume = async () => {
        if (!user?.uid) { toast.error('Please sign in'); return; }
        setSaving(true);
        const id = currentResumeId || `res_${crypto.randomUUID().slice(0, 8)}`;
        try {
            await saveResumeData(user.uid, id, { title: resumeTitle, contact, sections: { summary, experience, education, skills, projects, certifications }, tone, layout, atsScore });
            setCurrentResumeId(id);
            toast.success('Resume saved!');
            setSavedResumes(await getUserResumes(user.uid) as SavedResume[]);
        } catch { toast.error('Failed to save'); }
        finally { setSaving(false); }
    };

    const loadResume = (r: SavedResume) => {
        setCurrentResumeId(r.id); setResumeTitle(r.title || 'Untitled Resume');
        if (r.contact) setContact(r.contact); if (r.tone) setTone(r.tone);
        if (r.layout) setLayout(r.layout); if (r.atsScore) setAtsScore(r.atsScore);
        if (r.sections) { const s = r.sections; setSummary(s.summary || ''); setExperience(s.experience || []); setEducation(s.education || []); setSkills(s.skills || ''); setProjects(s.projects || []); setCertifications(s.certifications || ''); }
        setShowResumeList(false);
    };

    const newResume = async () => {
        if (!canUseFeature('resumes')) { await trackUsage('resumes'); return; }
        setCurrentResumeId(''); setResumeTitle('Untitled Resume');
        setContact({ ...DEFAULT_CONTACT, fullName: profile?.displayName || '', email: profile?.email || '' });
        setSummary(''); setExperience([]); setEducation([]); setSkills(''); setProjects([]); setCertifications('');
        setAtsScore(0); setLayout('executive'); setShowResumeList(false);
    };

    const deleteResume = async (id: string) => {
        if (!user?.uid || !confirm('Delete this resume?')) return;
        try { await deleteResumeData(user.uid, id); setSavedResumes(prev => prev.filter(r => r.id !== id)); if (currentResumeId === id) newResume(); toast.success('Deleted'); }
        catch { toast.error('Failed to delete'); }
    };

    const downloadPDF = async () => {
        if (!previewRef.current) return;
        toast.loading('Generating PDF...', { id: 'pdf' });
        try {
            const html2pdf = (await import('html2pdf.js')).default;
            await html2pdf().set({ margin: 0, filename: `${resumeTitle.replace(/\s+/g, '_')}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true, logging: false }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }).from(previewRef.current).save();
            toast.success('Downloaded!', { id: 'pdf' });
        } catch { toast.error('PDF Error', { id: 'pdf' }); }
    };

    // â”€â”€ List helpers â”€â”€
    const addExperience = () => setExperience([...experience, { id: crypto.randomUUID(), title: '', company: '', location: '', startDate: '', endDate: '', current: false, bullets: [''] }]);
    const updateExperience = (id: string, field: keyof ResumeExperience, value: any) => setExperience(experience.map(e => e.id === id ? { ...e, [field]: value } : e));
    const removeExperience = (id: string) => setExperience(experience.filter(e => e.id !== id));
    const addEducation = () => setEducation([...education, { id: crypto.randomUUID(), degree: '', field: '', institution: '', year: '', gpa: '' }]);
    const updateEducation = (id: string, field: keyof ResumeEducation, value: any) => setEducation(education.map(e => e.id === id ? { ...e, [field]: value } : e));
    const removeEducation = (id: string) => setEducation(education.filter(e => e.id !== id));

    const moveItem = <T extends { id: string }>(list: T[], setList: React.Dispatch<React.SetStateAction<T[]>>, id: string, dir: 'up' | 'down') => {
        const idx = list.findIndex(i => i.id === id); if (idx < 0) return;
        if (dir === 'up' && idx === 0) return; if (dir === 'down' && idx === list.length - 1) return;
        const next = [...list]; const t = dir === 'up' ? idx - 1 : idx + 1;
        [next[idx], next[t]] = [next[t], next[idx]]; setList(next);
    };

    /* â”€â”€â”€ Preview section heading helper â”€â”€â”€ */
    const previewHeading = (text: string) => ({
        fontSize: '11px', fontWeight: 'bold' as const, textTransform: 'uppercase' as const,
        borderBottom: layout === 'classic' ? '1.5px solid black' : layout === 'minimal' ? 'none' : '1.5px solid #eee',
        color: layout === 'modern' ? '#7c3aed' : '#000',
        marginBottom: '8px', paddingBottom: layout === 'classic' ? '4px' : '0',
        letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px',
    });

    const previewFont = layout === 'modern' || layout === 'minimal' ? 'Inter, ui-sans-serif, system-ui' : 'Georgia, serif';

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   â–ˆâ–ˆ  R E N D E R
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-[1440px] mx-auto relative flex flex-col h-[calc(100vh-120px)]">

        <AnimatePresence>
            {(generating || loadingSection) && <WarpLoading message="Synthesizing Career Matrix..." />}
        </AnimatePresence>

        {/* â”€â”€ Header â”€â”€ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <FileText className="w-5 h-5 text-white" />
                </div>
                <input value={resumeTitle} onChange={e => setResumeTitle(e.target.value)}
                    className="text-2xl font-display font-black bg-transparent border-none outline-none focus:ring-0 w-auto nebula-text" placeholder="Resume Title" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setShowResumeList(!showResumeList)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 border border-white/5 transition-all">
                    <FolderOpen className="w-4 h-4" /> My Resumes
                </button>
                <button onClick={newResume}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 border border-white/5 transition-all">
                    <Plus className="w-4 h-4" /> New
                </button>
                <button onClick={generateAll} disabled={generating}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50">
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Generate All
                </button>
                <button onClick={downloadPDF}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all">
                    <Download className="w-4 h-4" /> PDF
                </button>
            </div>
        </div>

        {/* â”€â”€ Saved Resumes Dropdown â”€â”€ */}
        <AnimatePresence>
            {showResumeList && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="glass-card p-4 mb-4 overflow-hidden">
                    <h3 className="font-display font-bold text-sm mb-3 text-gray-300">Saved Resumes</h3>
                    {loadingResumes ? (
                        <div className="flex justify-center p-6"><Loader2 className="w-6 h-6 animate-spin text-purple-500" /></div>
                    ) : savedResumes.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No saved resumes yet. Create your first one!</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {savedResumes.map(r => (
                                <div key={r.id} className="p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] flex items-center justify-between transition-all group">
                                    <button onClick={() => loadResume(r)} className="text-left flex-1">
                                        <p className="font-medium text-sm text-white">{r.title || 'Untitled'}</p>
                                        {r.updatedAt && <p className="text-[10px] text-gray-500 mt-0.5">{new Date(r.updatedAt.seconds * 1000).toLocaleDateString()}</p>}
                                    </button>
                                    <button onClick={() => deleteResume(r.id)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>

        {/* â•â•â•â• MAIN SPLIT PANE â•â•â•â• */}
        <div className="grid lg:grid-cols-2 gap-6 items-start flex-1 min-h-0 relative overflow-hidden">

            {/* â”€â”€ PREVIEW (LEFT) â”€â”€ */}
            <div className="space-y-3 order-2 lg:order-1 h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-purple-400" />
                        <h2 className="font-display font-bold text-xs uppercase tracking-[0.2em] text-purple-400">Live Preview</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg width="28" height="28" viewBox="0 0 44 44">
                            <circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/5" />
                            {atsScore > 0 && <motion.circle cx="22" cy="22" r="18" fill="none" strokeWidth="4" strokeLinecap="round" className={scoreBg}
                                initial={{ strokeDasharray: "0 113" }} animate={{ strokeDasharray: `${(atsScore / 100) * 113} 113` }} transition={{ duration: 1.5 }} />}
                        </svg>
                        <span className={`text-xs font-black ${scoreColor}`}>{atsScore || 'â€”'}</span>
                        <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wider">ATS</span>
                    </div>
                </div>

                <div className="glass-card flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-4 md:p-8 flex justify-center">
                    <div className="origin-top scale-[0.45] sm:scale-[0.55] md:scale-[0.6] lg:scale-[0.55] xl:scale-[0.7] transition-all duration-300 w-[210mm] flex justify-center h-fit pb-32">
                        <div ref={previewRef} style={{ fontFamily: previewFont, fontSize: layout === 'minimal' ? '10px' : '11px', width: '210mm', minHeight: '297mm', color: layout === 'minimal' ? '#333' : '#111', lineHeight: layout === 'modern' ? '1.4' : '1.5', position: 'relative' }}
                            className="bg-white text-black p-[20mm] shadow-2xl transition-all duration-500">

                            {/* Contact header */}
                            <div className={`p-4 rounded-lg transition-all ${focusedSection === 'contact' ? 'bg-purple-50 ring-2 ring-purple-200' : ''}`}
                                style={{ textAlign: 'center', borderBottom: layout === 'modern' ? '4px solid #7c3aed' : layout === 'executive' ? '2.5px solid #000' : 'none', paddingBottom: '12px', marginBottom: '20px' }}>
                                <h1 style={{ fontSize: layout === 'classic' ? '32px' : layout === 'modern' ? '28px' : '24px', fontWeight: 900, margin: '0 0 5px 0', letterSpacing: '-0.03em', textTransform: 'uppercase', color: '#000' }}>
                                    {contact.fullName || 'YOUR NAME'}
                                </h1>
                                <p style={{ fontSize: '10px', color: layout === 'modern' ? '#7c3aed' : '#444', fontWeight: 600, letterSpacing: layout === 'minimal' ? '0.1em' : 'normal' }}>{contactLine}</p>
                            </div>

                            {/* Summary */}
                            {summary && (
                                <div className={`p-4 rounded-lg transition-all mb-4 ${focusedSection === 'summary' ? 'bg-purple-50 ring-2 ring-purple-200' : ''}`}>
                                    <h2 style={previewHeading('Summary')}>Professional Summary{layout === 'minimal' && <div className="flex-1 h-[1px] bg-gray-100" />}</h2>
                                    <p style={{ whiteSpace: 'pre-wrap', fontSize: layout === 'minimal' ? '10.5px' : '11px' }}>{summary}</p>
                                </div>
                            )}

                            {/* Experience */}
                            {experience.length > 0 && (
                                <div className={`p-4 rounded-lg transition-all mb-4 ${focusedSection === 'experience' ? 'bg-purple-50 ring-2 ring-purple-200' : ''}`}>
                                    <h2 style={previewHeading('Experience')}>Work Experience{layout === 'minimal' && <div className="flex-1 h-[1px] bg-gray-100" />}</h2>
                                    {experience.map(exp => (
                                        <div key={exp.id} style={{ marginBottom: '15px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '13px', color: '#000' }}>
                                                <span>{exp.title}</span><span style={{ fontSize: '11px', fontWeight: 'bold' }}>{exp.startDate} â€“ {exp.endDate}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontStyle: 'italic', marginBottom: '6px', fontSize: '11px', color: '#333' }}>
                                                <span>{exp.company}</span><span>{exp.location}</span>
                                            </div>
                                            <ul style={{ paddingLeft: '18px', margin: 0, listStyleType: layout === 'modern' ? 'square' : 'disc' }}>
                                                {exp.bullets.map((b, i) => b && <li key={i} style={{ marginBottom: '4px', fontSize: '10.5px' }}>{b}</li>)}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Projects */}
                            {projects.length > 0 && (
                                <div className={`p-4 rounded-lg transition-all mb-4 ${focusedSection === 'projects' ? 'bg-purple-50 ring-2 ring-purple-200' : ''}`}>
                                    <h2 style={previewHeading('Projects')}>Key Projects{layout === 'minimal' && <div className="flex-1 h-[1px] bg-gray-100" />}</h2>
                                    {projects.map(proj => (
                                        <div key={proj.id} style={{ marginBottom: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '13px', color: '#000' }}>
                                                <span>{proj.name} <span style={{ fontWeight: 400, color: '#666', fontStyle: 'italic', fontSize: '11px' }}>| {proj.technologies.join(', ')}</span></span>
                                                <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{proj.year}</span>
                                            </div>
                                            <ul style={{ paddingLeft: '18px', margin: '4px 0 0', listStyleType: 'disc' }}>
                                                {proj.bullets?.map((b, i) => b?.trim() && <li key={i} style={{ marginBottom: '2px', fontSize: '10.5px' }}>{b}</li>)}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Education */}
                            {education.length > 0 && (
                                <div className={`p-4 rounded-lg transition-all mb-4 ${focusedSection === 'education' ? 'bg-purple-50 ring-2 ring-purple-200' : ''}`}>
                                    <h2 style={previewHeading('Education')}>Education{layout === 'minimal' && <div className="flex-1 h-[1px] bg-gray-100" />}</h2>
                                    {education.map(edu => (
                                        <div key={edu.id} style={{ marginBottom: '10px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '13px', color: '#000' }}>
                                                <span>{edu.institution}</span><span style={{ fontSize: '11px', fontWeight: 'bold' }}>{edu.year}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontStyle: 'italic', fontSize: '11px', color: '#333' }}>
                                                <span>{edu.degree} {edu.field && `in ${edu.field}`}</span>{edu.gpa && <span>GPA: {edu.gpa}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Skills & Certifications */}
                            <div style={{ display: 'grid', gridTemplateColumns: layout === 'classic' || layout === 'minimal' ? '1fr' : '1fr 1fr', gap: '20px' }}>
                                {skills && (
                                    <div className={`p-4 rounded-lg transition-all ${focusedSection === 'skills' ? 'bg-purple-50 ring-2 ring-purple-200' : ''}`}>
                                        <h2 style={previewHeading('Skills')}>{layout === 'classic' ? 'Technical Skills' : 'Skills'}{layout === 'minimal' && <div className="flex-1 h-[1px] bg-gray-100" />}</h2>
                                        {layout === 'classic' ? (
                                            <div style={{ fontSize: '11px' }}>
                                                {skills.split(';').map((cat, idx) => {
                                                    const parts = cat.split(':');
                                                    if (parts.length < 2) return <p key={idx} style={{ marginBottom: '4px' }}>{cat}</p>;
                                                    return <p key={idx} style={{ marginBottom: '4px' }}><strong style={{ color: '#000' }}>{parts[0].trim()}:</strong> {parts.slice(1).join(':').trim()}</p>;
                                                })}
                                            </div>
                                        ) : (
                                            <p style={{ fontSize: '10.5px', lineHeight: 1.8, color: '#444' }}>{skills}</p>
                                        )}
                                    </div>
                                )}
                                {certifications && (
                                    <div className={`p-4 rounded-lg transition-all ${focusedSection === 'certifications' ? 'bg-purple-50 ring-2 ring-purple-200' : ''}`}>
                                        <h2 style={previewHeading('Certs')}>{layout === 'classic' ? 'Certifications & Achievements' : 'Certifications'}{layout === 'minimal' && <div className="flex-1 h-[1px] bg-gray-100" />}</h2>
                                        {layout === 'classic' ? (
                                            <div style={{ fontSize: '11px' }}>{certifications.split('\n').map((c, i) => <p key={i} style={{ marginBottom: '4px' }}>{c}</p>)}</div>
                                        ) : (
                                            <p style={{ fontSize: '10.5px', lineHeight: 1.8, color: '#444' }}>{certifications}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* â”€â”€ EDITOR (RIGHT) â”€â”€ */}
            <div className="flex flex-col h-full overflow-hidden order-1 lg:order-2">
                {/* Progress Stepper */}
                <div className="relative mb-5 px-1">
                    <div className="flex items-center justify-between overflow-x-auto no-scrollbar pb-2">
                        {STEPS.map((step, idx) => {
                            const Icon = step.icon;
                            const isActive = currentStep === step.id;
                            const isCompleted = currentStep > step.id;
                            return (
                                <React.Fragment key={step.id}>
                                    <button onClick={() => setCurrentStep(step.id)}
                                        className={`flex flex-col items-center gap-1.5 min-w-[60px] transition-all relative ${isActive ? 'opacity-100 scale-105' : 'opacity-40 hover:opacity-80'}`}>
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : isCompleted ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-gray-500 border border-white/5'}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-tight whitespace-nowrap ${isActive ? 'text-purple-400' : 'text-gray-600'}`}>{step.label}</span>
                                    </button>
                                    {idx < STEPS.length - 1 && (
                                        <div className="flex-1 h-[2px] min-w-[12px] mx-1 bg-white/5 self-center mb-5 relative overflow-hidden">
                                            <motion.div initial={{ width: "0%" }} animate={{ width: isCompleted ? "100%" : "0%" }}
                                                className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-500" />
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {/* Editor Steps */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                    <AnimatePresence mode="wait">
                        <motion.div key={currentStep} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.3 }} className="space-y-4 pb-24">

                            {/* Step 1: Profile */}
                            {currentStep === 1 && (
                                <div className="glass-card p-5 space-y-5">
                                    <SectionHeader title="Professional Persona" icon={User} sub="Upload an existing resume or fill in your details" />
                                    <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${dragOver ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-purple-500/40 hover:bg-purple-500/5'}`}
                                        onClick={() => fileInputRef.current?.click()}
                                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                        onDragLeave={() => setDragOver(false)}
                                        onDrop={async e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) await handleFileUpload(f); }}>
                                        <input ref={fileInputRef} type="file" accept=".pdf,.txt,.text" className="hidden"
                                            onChange={async e => { const f = e.target.files?.[0]; if (f) await handleFileUpload(f); e.target.value = ''; }} />
                                        {uploadingFile ? (
                                            <div className="flex flex-col items-center gap-2"><Loader2 className="w-7 h-7 text-purple-400 animate-spin" /><p className="text-sm font-bold text-purple-400">Extracting text...</p></div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2"><Upload className="w-7 h-7 text-gray-500" /><p className="text-sm font-bold text-gray-400">Drop your resume here or click to browse</p><p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">PDF & TXT</p></div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4" onFocus={() => setFocusedSection('contact')} onBlur={() => setFocusedSection(null)}>
                                        <Field label="Full Name" span><input className={inputCls} placeholder="Alex Rivera" value={contact.fullName} onChange={e => updateContact('fullName', e.target.value)} /></Field>
                                        <Field label="Email"><input className={inputCls} placeholder="alex@example.com" value={contact.email} onChange={e => updateContact('email', e.target.value)} /></Field>
                                        <Field label="Phone"><input className={inputCls} placeholder="+1 234 567 890" value={contact.phone} onChange={e => updateContact('phone', e.target.value)} /></Field>
                                        <Field label="Location"><input className={inputCls} placeholder="City, Country" value={contact.location} onChange={e => updateContact('location', e.target.value)} /></Field>
                                        <Field label="LinkedIn (optional)"><input className={inputCls} placeholder="linkedin.com/in/..." value={contact.linkedin} onChange={e => updateContact('linkedin', e.target.value)} /></Field>
                                        <Field label="GitHub / Portfolio" span><input className={inputCls} placeholder="github.com/..." value={contact.github} onChange={e => updateContact('github', e.target.value)} /></Field>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Summary */}
                            {currentStep === 2 && (
                                <div className="glass-card p-5">
                                    <SectionHeader title="Career Summary" icon={Sparkles} sub="Your elevator pitch for recruiters" onGenerate={() => generateSection('summary')} loading={loadingSection === 'summary'} />
                                    <div className="relative mt-4">
                                        <textarea className={textareaCls} value={summary} onChange={e => setSummary(e.target.value.slice(0, 1000))}
                                            onFocus={() => setFocusedSection('summary')} onBlur={() => setFocusedSection(null)}
                                            placeholder="Highly motivated software engineer with 5+ years of experience..." />
                                        <span className={`absolute bottom-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/40 ${summary.length > 900 ? 'text-red-400' : 'text-gray-500'}`}>{summary.length}/1000</span>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Experience */}
                            {currentStep === 3 && (
                                <div className="space-y-4">
                                    <div className="glass-card p-5 sticky top-0 z-20 backdrop-blur-xl">
                                        <SectionHeader title="Work History" icon={Briefcase} sub="Reverse chronological order" onGenerate={() => generateSection('experience')} loading={loadingSection === 'experience'} />
                                    </div>
                                    {experience.map(exp => (
                                        <div key={exp.id} className="glass-card p-5 space-y-4 relative group hover:border-purple-500/20 transition-all"
                                            onFocus={() => setFocusedSection('experience')} onBlur={() => setFocusedSection(null)}>
                                            <ItemControls onUp={() => moveItem(experience, setExperience, exp.id, 'up')} onDown={() => moveItem(experience, setExperience, exp.id, 'down')} onDelete={() => removeExperience(exp.id)} />
                                            <div className="grid grid-cols-2 gap-4">
                                                <Field label="Job Title"><input className={inputCls} placeholder="Senior Frontend Engineer" value={exp.title} onChange={e => updateExperience(exp.id, 'title', e.target.value)} /></Field>
                                                <Field label="Company"><input className={inputCls} placeholder="Google" value={exp.company} onChange={e => updateExperience(exp.id, 'company', e.target.value)} /></Field>
                                                <Field label="Location"><input className={inputCls} placeholder="Mountain View, CA" value={exp.location} onChange={e => updateExperience(exp.id, 'location', e.target.value)} /></Field>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Field label="Start"><input className={`${inputCls} text-center text-xs`} placeholder="Jan 2020" value={exp.startDate} onChange={e => updateExperience(exp.id, 'startDate', e.target.value)} /></Field>
                                                    <Field label="End"><input className={`${inputCls} text-center text-xs`} placeholder="Present" value={exp.endDate} onChange={e => updateExperience(exp.id, 'endDate', e.target.value)} /></Field>
                                                </div>
                                            </div>
                                            <Field label="Achievements & Responsibilities">
                                                <textarea className={`${inputCls} min-h-[120px] leading-relaxed resize-none`} placeholder="â€¢ Developed scalable UI components using React..."
                                                    value={exp.bullets.join('\n')} onChange={e => updateExperience(exp.id, 'bullets', e.target.value.split('\n'))} />
                                            </Field>
                                        </div>
                                    ))}
                                    <button onClick={addExperience} className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-sm font-bold text-gray-500 hover:border-purple-500 hover:text-purple-400 hover:bg-purple-500/5 transition-all flex items-center justify-center gap-2">
                                        <Plus className="w-4 h-4" /> Add Experience
                                    </button>
                                </div>
                            )}

                            {/* Step 4: Education */}
                            {currentStep === 4 && (
                                <div className="space-y-4">
                                    <div className="glass-card p-5">
                                        <SectionHeader title="Education" icon={GraduationCap} sub="Degrees and certifications" onGenerate={() => generateSection('education')} loading={loadingSection === 'education'} />
                                    </div>
                                    {education.map(edu => (
                                        <div key={edu.id} className="glass-card p-5 space-y-4 relative group hover:border-purple-500/20 transition-all"
                                            onFocus={() => setFocusedSection('education')} onBlur={() => setFocusedSection(null)}>
                                            <ItemControls onUp={() => moveItem(education, setEducation, edu.id, 'up')} onDown={() => moveItem(education, setEducation, edu.id, 'down')} onDelete={() => removeEducation(edu.id)} />
                                            <div className="grid grid-cols-2 gap-4">
                                                <Field label="Degree"><input className={inputCls} placeholder="Master of Computer Science" value={edu.degree} onChange={e => updateEducation(edu.id, 'degree', e.target.value)} /></Field>
                                                <Field label="Institution"><input className={inputCls} placeholder="Stanford University" value={edu.institution} onChange={e => updateEducation(edu.id, 'institution', e.target.value)} /></Field>
                                                <Field label="Field of Study"><input className={inputCls} placeholder="Artificial Intelligence" value={edu.field} onChange={e => updateEducation(edu.id, 'field', e.target.value)} /></Field>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Field label="Year"><input className={`${inputCls} text-center text-xs`} placeholder="2022" value={edu.year} onChange={e => updateEducation(edu.id, 'year', e.target.value)} /></Field>
                                                    <Field label="GPA"><input className={`${inputCls} text-center text-xs`} placeholder="3.9/4.0" value={edu.gpa || ''} onChange={e => updateEducation(edu.id, 'gpa', e.target.value)} /></Field>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={addEducation} className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-sm font-bold text-gray-500 hover:border-purple-500 hover:text-purple-400 hover:bg-purple-500/5 transition-all flex items-center justify-center gap-2">
                                        <Plus className="w-4 h-4" /> Add Education
                                    </button>
                                </div>
                            )}

                            {/* Step 5: Skills & Certs */}
                            {currentStep === 5 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="glass-card p-5 space-y-3">
                                        <SectionHeader title="Technical Skills" icon={Code} sub="Group by category" onGenerate={() => generateSection('skills')} loading={loadingSection === 'skills'} />
                                        <textarea className={textareaCls} value={skills} onChange={e => setSkills(e.target.value)} onFocus={() => setFocusedSection('skills')} onBlur={() => setFocusedSection(null)}
                                            placeholder="Languages: JavaScript, TypeScript, Python; Frameworks: React, Next.js" />
                                        <p className="text-[9px] text-gray-600 italic">Format: "Category: Skill 1, Skill 2; Category 2: ..."</p>
                                    </div>
                                    <div className="glass-card p-5 space-y-3">
                                        <SectionHeader title="Certifications" icon={Award} sub="Awards and credentials" onGenerate={() => generateSection('certifications')} loading={loadingSection === 'certifications'} />
                                        <textarea className={textareaCls} value={certifications} onChange={e => setCertifications(e.target.value)} onFocus={() => setFocusedSection('certifications')} onBlur={() => setFocusedSection(null)}
                                            placeholder={"AWS Solutions Architect (2023)\nGoogle Cloud Developer (2022)"} />
                                    </div>
                                </div>
                            )}

                            {/* Step 6: Projects */}
                            {currentStep === 6 && (
                                <div className="space-y-4">
                                    <div className="glass-card p-5">
                                        <SectionHeader title="Portfolio Projects" icon={Code} sub="Showcase engineering feats" onGenerate={() => generateSection('projects')} loading={loadingSection === 'projects'} />
                                    </div>
                                    {projects.map((proj, idx) => (
                                        <div key={proj.id || idx} className="glass-card p-5 space-y-4 relative group hover:border-purple-500/20 transition-all">
                                            <ItemControls onUp={() => moveItem(projects, setProjects, proj.id, 'up')} onDown={() => moveItem(projects, setProjects, proj.id, 'down')}
                                                onDelete={() => setProjects(projects.filter((_, i) => i !== idx))} />
                                            <div className="grid grid-cols-2 gap-4">
                                                <Field label="Project Name"><input className={inputCls} placeholder="AI-Powered CRM" value={proj.name} onChange={e => { const p = [...projects]; p[idx].name = e.target.value; setProjects(p); }} /></Field>
                                                <Field label="Year"><input className={inputCls} placeholder="2023" value={proj.year} onChange={e => { const p = [...projects]; p[idx].year = e.target.value; setProjects(p); }} /></Field>
                                                <Field label="Technologies (comma separated)" span><input className={inputCls} placeholder="React, Node.js, TensorFlow" value={proj.technologies.join(', ')} onChange={e => { const p = [...projects]; p[idx].technologies = e.target.value.split(',').map(s => s.trim()); setProjects(p); }} /></Field>
                                            </div>
                                            <Field label="Key Features & Metrics">
                                                <textarea className={`${inputCls} min-h-[100px] leading-relaxed resize-none`} placeholder="â€¢ Optimized database queries by 40%..."
                                                    value={proj.bullets?.join('\n') || ''} onChange={e => { const p = [...projects]; p[idx].bullets = e.target.value.split('\n'); setProjects(p); }} />
                                            </Field>
                                        </div>
                                    ))}
                                    <button onClick={() => setProjects([...projects, { id: Date.now().toString(), name: '', description: '', technologies: [], year: '', bullets: [] }])}
                                        className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-sm font-bold text-gray-500 hover:border-purple-500 hover:text-purple-400 hover:bg-purple-500/5 transition-all flex items-center justify-center gap-2">
                                        <Plus className="w-4 h-4" /> Add Project
                                    </button>
                                </div>
                            )}

                            {/* Step 7: Finalize */}
                            {currentStep === 7 && (
                                <div className="space-y-5">
                                    <div className="glass-card p-6 space-y-6">
                                        <SectionHeader title="Final Polish" icon={Sparkles} sub="Fine-tune your presentation" />
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Tone</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {TONES.map(t => (
                                                    <button key={t.value} onClick={() => setTone(t.value as ResumeTone)}
                                                        className={`p-4 rounded-xl border-2 text-left transition-all ${tone === t.value ? 'border-purple-500 bg-purple-500/5' : 'border-white/5 hover:border-white/15'}`}>
                                                        <p className={`font-bold text-sm ${tone === t.value ? 'text-purple-400' : 'text-gray-300'}`}>{t.label}</p>
                                                        <p className="text-[10px] text-gray-500 mt-0.5">{t.desc}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Layout</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {LAYOUTS.map(l => (
                                                    <button key={l.value} onClick={() => setLayout(l.value)}
                                                        className={`p-4 rounded-xl border-2 text-left transition-all ${layout === l.value ? 'border-purple-500 bg-purple-500/5' : 'border-white/5 hover:border-white/15'}`}>
                                                        <p className={`font-bold text-sm ${layout === l.value ? 'text-purple-400' : 'text-gray-300'}`}>{l.label}</p>
                                                        <p className="text-[10px] text-gray-500 mt-0.5">{l.desc}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="glass-card p-6 border-purple-500/20 bg-purple-500/5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-full border-2 border-white/10 flex items-center justify-center relative shrink-0">
                                                <svg width="56" height="56" viewBox="0 0 44 44">
                                                    <circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/5" />
                                                    <motion.circle cx="22" cy="22" r="18" fill="none" strokeWidth="3" strokeLinecap="round" className={scoreBg}
                                                        initial={{ strokeDasharray: "0 113" }} animate={{ strokeDasharray: `${(atsScore / 100) * 113} 113` }} transition={{ duration: 1.5 }} />
                                                </svg>
                                                <span className={`absolute font-display font-black text-lg ${scoreColor}`}>{atsScore || '0'}</span>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-display font-bold text-purple-400">ATS Success Score</h4>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {atsScore >= 80 ? 'ðŸ”¥ Exceptional! Your resume is enterprise-ready.' :
                                                        atsScore >= 60 ? 'âš¡ Solid, aim for 80+ for maximum visibility.' :
                                                            'ðŸš¨ Needs optimization. Use AI Generate for keywords.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>

        {/* â”€â”€ Floating Navigation â”€â”€ */}
        <div className="fixed bottom-8 left-1/2 md:left-[60%] lg:left-[70%] -translate-x-1/2 z-50 pointer-events-none w-max">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="glass-card flex items-center gap-2 p-2.5 !rounded-2xl shadow-2xl shadow-purple-500/10 border-purple-500/20 backdrop-blur-3xl pointer-events-auto">
                <button onClick={() => setCurrentStep(Math.max(1, currentStep - 1))} disabled={currentStep === 1}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'text-gray-300 hover:text-white hover:bg-white/5 border border-white/5'}`}>
                    <ChevronDown className="w-3.5 h-3.5 rotate-90" /> Back
                </button>
                <div className="flex items-center px-4 h-10 border-l border-r border-white/5 mx-1">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider whitespace-nowrap">{currentStep} <span className="text-white/10 mx-1">/</span> {STEPS.length}</span>
                </div>
                {currentStep < STEPS.length ? (
                    <button onClick={() => setCurrentStep(currentStep + 1)}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-lg shadow-purple-500/20 group">
                        Continue <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                ) : (
                    <button onClick={saveResume} disabled={saving}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-lg shadow-purple-500/20">
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Resume
                    </button>
                )}
            </motion.div>
        </div>
    </motion.div>
);
}
