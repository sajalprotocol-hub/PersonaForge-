'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { saveOnboardingData } from '@/lib/firestore';
import type { OnboardingData, BasicInfo, Education, Experience, Skill, CareerGoal } from '@/types/user';
import {
    User, GraduationCap, Briefcase, Code, Rocket,
    ArrowRight, ArrowLeft, Plus, Trash2, Check, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

const STEPS = [
    { icon: User, label: 'Basic Info' },
    { icon: GraduationCap, label: 'Education' },
    { icon: Briefcase, label: 'Experience' },
    { icon: Code, label: 'Skills' },
    { icon: Rocket, label: 'Career Goal' },
];

const INITIAL_BASIC: BasicInfo = { fullName: '', email: '', phone: '', location: '', linkedin: '', portfolio: '' };
const INITIAL_EDU: Education = { id: '', degree: '', field: '', institution: '', startYear: '', endYear: '', gpa: '' };
const INITIAL_EXP: Experience = { id: '', title: '', company: '', location: '', startDate: '', endDate: '', current: false, bullets: [''] };
const INITIAL_GOAL: CareerGoal = { targetRole: '', targetIndustry: '', preferredLocation: '', workType: 'any', salaryExpectation: '', additionalNotes: '' };

export default function OnboardingPage() {
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [basicInfo, setBasicInfo] = useState<BasicInfo>(INITIAL_BASIC);
    const [education, setEducation] = useState<Education[]>([{ ...INITIAL_EDU, id: '1' }]);
    const [experience, setExperience] = useState<Experience[]>([{ ...INITIAL_EXP, id: '1' }]);
    const [skills, setSkills] = useState<Skill[]>([]);
    const [skillInput, setSkillInput] = useState('');
    const [skillCategory, setSkillCategory] = useState<'technical' | 'soft' | 'tools'>('technical');
    const [careerGoal, setCareerGoal] = useState<CareerGoal>(INITIAL_GOAL);
    const { user, profile, refreshProfile } = useAuth();
    const router = useRouter();

    // Redirect to dashboard if onboarding is already complete
    useEffect(() => {
        if (profile?.onboardingComplete) {
            router.push('/dashboard');
        }
    }, [profile, router]);

    const validateStep = (): boolean => {
        switch (step) {
            case 0:
                if (!basicInfo.fullName.trim()) { toast.error('Full name is required'); return false; }
                return true;
            case 1:
                if (!education.some(e => e.degree.trim() && e.institution.trim())) {
                    toast.error('Add at least one education entry with degree and institution'); return false;
                }
                return true;
            case 2:
                if (!experience.some(e => e.title.trim() && e.company.trim())) {
                    toast.error('Add at least one experience entry with title and company'); return false;
                }
                return true;
            case 3:
                if (skills.length === 0) { toast.error('Add at least one skill'); return false; }
                return true;
            case 4:
                if (!careerGoal.targetRole.trim()) { toast.error('Target role is required'); return false; }
                return true;
            default: return true;
        }
    };

    const addSkill = () => {
        if (skillInput.trim()) {
            setSkills([...skills, { name: skillInput.trim(), category: skillCategory }]);
            setSkillInput('');
        }
    };

    const removeSkill = (index: number) => setSkills(skills.filter((_, i) => i !== index));

    const addEducation = () => setEducation([...education, { ...INITIAL_EDU, id: Date.now().toString() }]);
    const removeEducation = (id: string) => setEducation(education.filter(e => e.id !== id));

    const addExperience = () => setExperience([...experience, { ...INITIAL_EXP, id: Date.now().toString(), bullets: [''] }]);
    const removeExperience = (id: string) => setExperience(experience.filter(e => e.id !== id));

    const handleSubmit = async () => {
        if (!user) return;
        setLoading(true);
        const data: OnboardingData = { basicInfo, education, experience, skills, careerGoal };

        try {
            // Trigger save
            const savePromise = saveOnboardingData(user.uid, data);

            // Show optimistic success and navigate immediately
            toast.success('Profile complete! Welcome to PersonaForge.');

            // Refresh profile in context so dashboard updates
            refreshProfile({ onboardingComplete: true });

            router.push('/dashboard');

            // Wait for save in background (if needed)
            await savePromise;
        } catch (err) {
            console.error('Onboarding save failed:', err);
            setLoading(false);
            toast.error('Failed to save profile. Please try again.');
        }
    };

    return (
        <div className="max-w-3xl mx-auto animate-fade-in">
            {/* Step indicator */}
            <div className="mb-8">
                <h1 className="text-2xl font-display font-bold mb-6 text-center">
                    <Sparkles className="inline w-6 h-6 text-brand-500 mr-2" />
                    Set Up Your Profile
                </h1>
                <div className="flex items-center justify-between gap-2">
                    {STEPS.map((s, i) => (
                        <React.Fragment key={i}>
                            <div className="flex flex-col items-center gap-1.5">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${i < step ? 'bg-green-500 text-white' :
                                    i === step ? 'gradient-bg text-white scale-110' :
                                        'bg-surface-100 dark:bg-surface-800 text-surface-400'
                                    }`}>
                                    {i < step ? <Check className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                                </div>
                                <span className={`text-xs font-medium ${i === step ? 'text-brand-600 dark:text-brand-400' : 'text-surface-400'}`}>
                                    {s.label}
                                </span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className={`hidden sm:block flex-1 h-0.5 rounded-full ${i < step ? 'bg-green-500' : 'bg-surface-200 dark:bg-surface-700'}`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
                <div className="w-full bg-surface-200 dark:bg-surface-800 rounded-full h-1.5 mt-4">
                    <div className="h-1.5 rounded-full gradient-bg transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
                </div>
            </div>

            <div className="glass-card p-6 sm:p-8">
                {/* Step 0: Basic Info */}
                {step === 0 && (
                    <div className="space-y-4 animate-fade-in">
                        <h2 className="font-display font-bold text-lg mb-4">Basic Information</h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Full Name *</label>
                                <input className="input-field" value={basicInfo.fullName} onChange={e => setBasicInfo({ ...basicInfo, fullName: e.target.value })} placeholder="John Doe" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Email *</label>
                                <input className="input-field" type="email" value={basicInfo.email} onChange={e => setBasicInfo({ ...basicInfo, email: e.target.value })} placeholder="you@email.com" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Phone</label>
                                <input className="input-field" value={basicInfo.phone} onChange={e => setBasicInfo({ ...basicInfo, phone: e.target.value })} placeholder="+91 98765 43210" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Location</label>
                                <input className="input-field" value={basicInfo.location} onChange={e => setBasicInfo({ ...basicInfo, location: e.target.value })} placeholder="Mumbai, India" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">LinkedIn URL</label>
                                <input className="input-field" value={basicInfo.linkedin} onChange={e => setBasicInfo({ ...basicInfo, linkedin: e.target.value })} placeholder="linkedin.com/in/yourname" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Portfolio URL</label>
                                <input className="input-field" value={basicInfo.portfolio || ''} onChange={e => setBasicInfo({ ...basicInfo, portfolio: e.target.value })} placeholder="yourportfolio.com" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 1: Education */}
                {step === 1 && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex items-center justify-between">
                            <h2 className="font-display font-bold text-lg">Education</h2>
                            <button onClick={addEducation} className="btn-ghost text-sm flex items-center gap-1.5 text-brand-500">
                                <Plus className="w-4 h-4" /> Add
                            </button>
                        </div>
                        {education.map((edu, idx) => (
                            <div key={edu.id} className="p-4 rounded-xl border border-surface-200 dark:border-surface-700 space-y-3 relative">
                                {education.length > 1 && (
                                    <button onClick={() => removeEducation(edu.id)} className="absolute top-3 right-3 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-500">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                                <div className="grid sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Degree *</label>
                                        <input className="input-field !py-2 text-sm" value={edu.degree} placeholder="B.Tech" onChange={e => { const n = [...education]; n[idx] = { ...edu, degree: e.target.value }; setEducation(n); }} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Field of Study *</label>
                                        <input className="input-field !py-2 text-sm" value={edu.field} placeholder="Computer Science" onChange={e => { const n = [...education]; n[idx] = { ...edu, field: e.target.value }; setEducation(n); }} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Institution *</label>
                                        <input className="input-field !py-2 text-sm" value={edu.institution} placeholder="IIT Delhi" onChange={e => { const n = [...education]; n[idx] = { ...edu, institution: e.target.value }; setEducation(n); }} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">GPA</label>
                                        <input className="input-field !py-2 text-sm" value={edu.gpa || ''} placeholder="8.5/10" onChange={e => { const n = [...education]; n[idx] = { ...edu, gpa: e.target.value }; setEducation(n); }} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Start Year</label>
                                        <input className="input-field !py-2 text-sm" value={edu.startYear} placeholder="2020" onChange={e => { const n = [...education]; n[idx] = { ...edu, startYear: e.target.value }; setEducation(n); }} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">End Year</label>
                                        <input className="input-field !py-2 text-sm" value={edu.endYear} placeholder="2024" onChange={e => { const n = [...education]; n[idx] = { ...edu, endYear: e.target.value }; setEducation(n); }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Step 2: Experience */}
                {step === 2 && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex items-center justify-between">
                            <h2 className="font-display font-bold text-lg">Experience</h2>
                            <button onClick={addExperience} className="btn-ghost text-sm flex items-center gap-1.5 text-brand-500">
                                <Plus className="w-4 h-4" /> Add
                            </button>
                        </div>
                        {experience.map((exp, idx) => (
                            <div key={exp.id} className="p-4 rounded-xl border border-surface-200 dark:border-surface-700 space-y-3 relative">
                                {experience.length > 1 && (
                                    <button onClick={() => removeExperience(exp.id)} className="absolute top-3 right-3 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-500">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                                <div className="grid sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Title *</label>
                                        <input className="input-field !py-2 text-sm" value={exp.title} placeholder="Software Developer Intern" onChange={e => { const n = [...experience]; n[idx] = { ...exp, title: e.target.value }; setExperience(n); }} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Company *</label>
                                        <input className="input-field !py-2 text-sm" value={exp.company} placeholder="Google" onChange={e => { const n = [...experience]; n[idx] = { ...exp, company: e.target.value }; setExperience(n); }} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Start Date</label>
                                        <input className="input-field !py-2 text-sm" type="month" value={exp.startDate} onChange={e => { const n = [...experience]; n[idx] = { ...exp, startDate: e.target.value }; setExperience(n); }} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">End Date</label>
                                        <input className="input-field !py-2 text-sm" type="month" value={exp.endDate} disabled={exp.current}
                                            onChange={e => { const n = [...experience]; n[idx] = { ...exp, endDate: e.target.value }; setExperience(n); }} />
                                        <label className="flex items-center gap-1.5 mt-1">
                                            <input type="checkbox" checked={exp.current} onChange={e => { const n = [...experience]; n[idx] = { ...exp, current: e.target.checked }; setExperience(n); }}
                                                className="rounded text-brand-500" />
                                            <span className="text-xs text-surface-500">Currently working here</span>
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Key Responsibilities (one per line)</label>
                                    <textarea
                                        className="input-field !py-2 text-sm min-h-[80px]"
                                        value={exp.bullets.join('\n')}
                                        placeholder="Developed REST APIs using Node.js&#10;Led a team of 3 engineers on the payments module"
                                        onChange={e => { const n = [...experience]; n[idx] = { ...exp, bullets: e.target.value.split('\n') }; setExperience(n); }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Step 3: Skills */}
                {step === 3 && (
                    <div className="space-y-6 animate-fade-in">
                        <h2 className="font-display font-bold text-lg">Skills</h2>
                        <div className="flex gap-3 flex-wrap sm:flex-nowrap">
                            <input
                                className="input-field flex-1 !py-2 text-sm" value={skillInput}
                                onChange={e => setSkillInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                placeholder="Add a skill..."
                            />
                            <select className="input-field !w-auto !py-2 text-sm" value={skillCategory} onChange={e => setSkillCategory(e.target.value as typeof skillCategory)}>
                                <option value="technical">Technical</option>
                                <option value="soft">Soft Skill</option>
                                <option value="tools">Tools</option>
                            </select>
                            <button onClick={addSkill} className="btn-primary !py-2 !px-4 text-sm">Add</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {skills.map((skill, i) => (
                                <span key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${skill.category === 'technical' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
                                    skill.category === 'soft' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
                                        'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                                    }`}>
                                    {skill.name}
                                    <button onClick={() => removeSkill(i)} className="hover:text-red-500">
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                            {skills.length === 0 && <p className="text-sm text-surface-400">No skills added yet. Type and press Enter or click Add.</p>}
                        </div>
                    </div>
                )}

                {/* Step 4: Career Goal */}
                {step === 4 && (
                    <div className="space-y-4 animate-fade-in">
                        <h2 className="font-display font-bold text-lg mb-4">Career Goal</h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Target Role *</label>
                                <input className="input-field" value={careerGoal.targetRole} onChange={e => setCareerGoal({ ...careerGoal, targetRole: e.target.value })} placeholder="Frontend Developer" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Target Industry</label>
                                <input className="input-field" value={careerGoal.targetIndustry} onChange={e => setCareerGoal({ ...careerGoal, targetIndustry: e.target.value })} placeholder="Technology" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Preferred Location</label>
                                <input className="input-field" value={careerGoal.preferredLocation} onChange={e => setCareerGoal({ ...careerGoal, preferredLocation: e.target.value })} placeholder="Bangalore, India" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Work Type</label>
                                <select className="input-field" value={careerGoal.workType} onChange={e => setCareerGoal({ ...careerGoal, workType: e.target.value as CareerGoal['workType'] })}>
                                    <option value="any">Any</option>
                                    <option value="remote">Remote</option>
                                    <option value="hybrid">Hybrid</option>
                                    <option value="onsite">On-site</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Additional Notes</label>
                            <textarea className="input-field min-h-[80px]" value={careerGoal.additionalNotes || ''}
                                onChange={e => setCareerGoal({ ...careerGoal, additionalNotes: e.target.value })}
                                placeholder="Any specific preferences, constraints, or goals..." />
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-surface-200 dark:border-surface-700">
                    <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
                        className="btn-ghost flex items-center gap-2 disabled:opacity-30">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    {step < STEPS.length - 1 ? (
                        <button onClick={() => { if (validateStep()) setStep(step + 1); }} className="btn-primary flex items-center gap-2">
                            Next <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button onClick={handleSubmit} disabled={loading} className="btn-primary flex items-center gap-2">
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Complete <Check className="w-4 h-4" /></>}
                        </button>
                    )}
                </div>
            </div>

            <p className="text-center text-sm text-surface-500 mt-4">
                <button onClick={() => router.push('/dashboard')} className="text-brand-500 hover:text-brand-600 font-medium">
                    Skip for now →
                </button>
            </p>
        </div>
    );
}
