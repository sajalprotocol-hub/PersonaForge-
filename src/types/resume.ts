export interface ResumeData {
    id: string;
    userId: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    sections: ResumeSections;
    atsScore?: number;
    tone: ResumeTone;
}

export interface ResumeSections {
    summary: string;
    experience: ResumeExperience[];
    education: ResumeEducation[];
    skills: ResumeSkillCategory[];
    projects?: ResumeProject[];
    certifications?: string[];
}

export interface ResumeExperience {
    id: string;
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    bullets: string[];
}

export interface ResumeEducation {
    id: string;
    degree: string;
    field: string;
    institution: string;
    year: string;
    gpa?: string;
}

export interface ResumeSkillCategory {
    category: string;
    skills: string[];
}

export interface ResumeProject {
    id: string;
    name: string;
    description: string;
    technologies: string[];
    link?: string;
    year: string;
    bullets?: string[];
}

export type ResumeTone = 'professional' | 'creative' | 'technical' | 'executive';

export interface AIGenerationRequest {
    section: keyof ResumeSections;
    tone: ResumeTone;
    profileData: Record<string, unknown>;
    jobDescription?: string;
}

export interface AIGenerationResponse {
    content: string | Record<string, unknown>;
    atsScore?: number;
    suggestions?: string[];
}
