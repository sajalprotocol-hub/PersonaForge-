export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    createdAt: string;
    onboardingComplete: boolean;
    subscription: SubscriptionTier;
    subscriptionExpiry?: string;
    isAdmin?: boolean;
    lastPaymentId?: string;
    lastPaymentDate?: string;
}

export interface BasicInfo {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    portfolio?: string;
}

export interface Education {
    id: string;
    degree: string;
    field: string;
    institution: string;
    startYear: string;
    endYear: string;
    gpa?: string;
    achievements?: string[];
}

export interface Experience {
    id: string;
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    bullets: string[];
}

export interface Skill {
    name: string;
    category: 'technical' | 'soft' | 'tools';
}

export interface CareerGoal {
    targetRole: string;
    targetIndustry: string;
    preferredLocation: string;
    workType: 'remote' | 'hybrid' | 'onsite' | 'any';
    salaryExpectation?: string;
    additionalNotes?: string;
}

export interface OnboardingData {
    basicInfo: BasicInfo;
    education: Education[];
    experience: Experience[];
    skills: Skill[];
    careerGoal: CareerGoal;
}

export type SubscriptionTier = 'free' | 'pdf_unlock' | 'weekly' | 'monthly' | 'lifetime';

export interface SubscriptionInfo {
    tier: SubscriptionTier;
    expiryDate?: string;
    paymentId?: string;
    features: string[];
}
