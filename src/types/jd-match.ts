export interface JDMatchResult {
    matchPercentage: number;
    keywords: KeywordAnalysis[];
    gapAnalysis: GapItem[];
    sectionComparisons: SectionComparison[];
    overallFeedback: string;
}

export interface KeywordAnalysis {
    keyword: string;
    status: 'matched' | 'missing' | 'overused';
    frequency: number;
    importance: 'high' | 'medium' | 'low';
}

export interface GapItem {
    keyword: string;
    context: string;
    suggestion: string;
    priority: 'critical' | 'important' | 'nice-to-have';
}

export interface SectionComparison {
    sectionName: string;
    jdRequirement: string;
    currentContent: string;
    suggestedRewrite: string;
    matchLevel: 'strong' | 'partial' | 'weak' | 'missing';
}

export interface ResumeRebuildResult {
    originalSections: Record<string, string>;
    optimizedSections: Record<string, string>;
    changes: RebuildChange[];
    improvementScore: number;
}

export interface RebuildChange {
    section: string;
    type: 'added' | 'modified' | 'removed' | 'restructured';
    description: string;
}
