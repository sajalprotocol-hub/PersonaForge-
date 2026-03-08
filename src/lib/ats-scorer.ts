/**
 * Real ATS Scoring Engine
 * 
 * Evaluates resumes across 5 dimensions that mirror what actual
 * Applicant Tracking Systems (Taleo, Workday, Greenhouse) care about:
 * 
 * 1. Section Completeness  (20 pts)
 * 2. Contact Completeness  (10 pts)
 * 3. Formatting Quality    (20 pts) — action verbs, metrics, bullets
 * 4. Content Depth         (20 pts) — sufficient length per section
 * 5. Keyword Match         (30 pts) — JD keyword coverage (optional)
 *
 * When no JD is provided, the 30 keyword pts are redistributed
 * proportionally across the other 4 categories.
 */

// ─── Types ───────────────────────────────────────────────────────────

export interface ATSCategoryScore {
    name: string;
    score: number;
    maxScore: number;
    details: string;
}

export interface ATSSuggestion {
    priority: 'critical' | 'important' | 'nice-to-have';
    message: string;
}

export interface ATSResult {
    totalScore: number;
    categories: ATSCategoryScore[];
    suggestions: ATSSuggestion[];
    /** Keywords found / missing (only populated when JD is provided) */
    keywordAnalysis?: {
        matched: string[];
        missing: string[];
        matchRate: number;
    };
}

export interface ContactInfo {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    github: string;
}

export interface SectionMap {
    [sectionId: string]: string;
}

// ─── Stopwords ───────────────────────────────────────────────────────

const STOPWORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'need',
    'must', 'it', 'its', 'you', 'your', 'we', 'our', 'they', 'their',
    'he', 'she', 'him', 'her', 'this', 'that', 'these', 'those', 'which',
    'who', 'whom', 'what', 'where', 'when', 'how', 'why', 'all', 'each',
    'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
    'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
    'about', 'above', 'after', 'again', 'also', 'any', 'because', 'before',
    'between', 'below', 'during', 'into', 'out', 'over', 'under', 'up',
    'then', 'there', 'here', 'if', 'etc', 'able', 'well', 'will', 'using',
    'work', 'working', 'including', 'experience', 'required', 'preferred',
    'strong', 'excellent', 'good', 'ability', 'skills', 'team', 'role',
    'position', 'company', 'years', 'year', 'looking', 'join', 'apply',
    'responsibilities', 'requirements', 'qualifications', 'job', 'candidate',
]);

// ─── Action Verbs ────────────────────────────────────────────────────

const ACTION_VERBS = new Set([
    // Leadership
    'led', 'managed', 'directed', 'supervised', 'coordinated', 'oversaw',
    'spearheaded', 'orchestrated', 'mentored', 'championed',
    // Achievement
    'achieved', 'delivered', 'exceeded', 'improved', 'increased', 'reduced',
    'optimized', 'streamlined', 'accelerated', 'maximized', 'minimized',
    // Technical
    'developed', 'built', 'designed', 'engineered', 'implemented',
    'architected', 'deployed', 'automated', 'integrated', 'migrated',
    'configured', 'debugged', 'refactored', 'scaled', 'maintained',
    // Analysis
    'analyzed', 'evaluated', 'assessed', 'researched', 'identified',
    'investigated', 'diagnosed', 'measured', 'monitored', 'tested',
    // Communication
    'presented', 'documented', 'authored', 'reported', 'communicated',
    'collaborated', 'negotiated', 'facilitated', 'trained', 'advised',
    // Creation
    'created', 'launched', 'established', 'initiated', 'introduced',
    'pioneered', 'founded', 'invented', 'formulated', 'devised',
]);

// ─── Helpers ─────────────────────────────────────────────────────────

/** Tokenize text into lowercase words, keeping compound tech terms */
function tokenize(text: string): string[] {
    // Preserve compound terms like "CI/CD", "Node.js", "REST API"
    const normalized = text
        .replace(/[(),;:!?]/g, ' ')
        .replace(/\n/g, ' ')
        .toLowerCase();
    return normalized
        .split(/\s+/)
        .map(w => w.replace(/^[^a-z0-9]+|[^a-z0-9/.+#]+$/g, ''))
        .filter(w => w.length > 1);
}

/** Extract meaningful keywords from job description text */
function extractJDKeywords(jdText: string): string[] {
    const tokens = tokenize(jdText);
    const freq = new Map<string, number>();

    for (const token of tokens) {
        if (!STOPWORDS.has(token) && token.length > 1) {
            freq.set(token, (freq.get(token) || 0) + 1);
        }
    }

    // Sort by frequency descending, take top keywords
    return Array.from(freq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 40)
        .map(([word]) => word);
}

/** Check if resume text contains a keyword (fuzzy: checks substrings) */
function resumeContainsKeyword(resumeText: string, keyword: string): boolean {
    const lower = resumeText.toLowerCase();
    // Direct match
    if (lower.includes(keyword)) return true;
    // Handle plurals/variants: e.g. "api" matches "apis"
    if (keyword.length > 3 && lower.includes(keyword.slice(0, -1))) return true;
    return false;
}

// ─── Scoring Functions ───────────────────────────────────────────────

const EXPECTED_SECTIONS = ['summary', 'experience', 'education', 'skills'];
const BONUS_SECTIONS = ['certifications', 'projects', 'awards'];

function scoreSectionCompleteness(sections: SectionMap): ATSCategoryScore {
    let score = 0;
    const maxScore = 20;
    const missing: string[] = [];

    // 4 pts each for the 4 core sections (16 pts)
    for (const key of EXPECTED_SECTIONS) {
        if (sections[key]?.trim()) {
            score += 4;
        } else {
            missing.push(key);
        }
    }

    // 2 pts each for bonus sections, max 4 pts
    let bonusPts = 0;
    for (const key of BONUS_SECTIONS) {
        if (sections[key]?.trim() && bonusPts < 4) {
            bonusPts += 2;
        }
    }
    score += bonusPts;

    const details = missing.length === 0
        ? 'All core sections present'
        : `Missing: ${missing.join(', ')}`;

    return { name: 'Section Completeness', score: Math.min(score, maxScore), maxScore, details };
}

function scoreContactCompleteness(contact: ContactInfo): ATSCategoryScore {
    let score = 0;
    const maxScore = 10;
    const missing: string[] = [];

    // Name: 3pts, Email: 3pts, Phone: 2pts, Location: 1pt, LinkedIn: 1pt
    if (contact.fullName?.trim()) score += 3; else missing.push('name');
    if (contact.email?.trim()) score += 3; else missing.push('email');
    if (contact.phone?.trim()) score += 2; else missing.push('phone');
    if (contact.location?.trim()) score += 1; else missing.push('location');
    if (contact.linkedin?.trim()) score += 1; else missing.push('LinkedIn');

    const details = missing.length === 0
        ? 'All contact fields filled'
        : `Missing: ${missing.join(', ')}`;

    return { name: 'Contact Info', score: Math.min(score, maxScore), maxScore, details };
}

function scoreFormattingQuality(sections: SectionMap): ATSCategoryScore {
    const maxScore = 20;
    let score = 0;
    const allText = Object.values(sections).join('\n');
    const words = tokenize(allText);

    // Action verbs (0-8 pts): Count unique action verbs used
    const usedVerbs = new Set<string>();
    for (const word of words) {
        if (ACTION_VERBS.has(word)) usedVerbs.add(word);
    }
    const verbScore = Math.min(8, usedVerbs.size);   // 1pt per unique verb, max 8
    score += verbScore;

    // Quantified metrics (0-6 pts): Look for numbers, percentages, dollar signs
    const metricPatterns = allText.match(/\d+[%+]|\$[\d,.]+|\d{2,}[+]?/g) || [];
    const metricScore = Math.min(6, metricPatterns.length * 1.5);
    score += metricScore;

    // Bullet points (0-4 pts): Resume should use bullet formatting
    const bulletLines = allText.split('\n').filter(l =>
        /^\s*[•\-*▸▪●]/.test(l.trim())
    );
    const bulletScore = Math.min(4, bulletLines.length >= 5 ? 4 : bulletLines.length >= 3 ? 3 : bulletLines.length >= 1 ? 1 : 0);
    score += bulletScore;

    // Consistency bonus (0-2 pts): If experience uses consistent bullet format
    const expText = sections['experience'] || '';
    const expBullets = expText.split('\n').filter(l => /^\s*[•\-*▸▪●]/.test(l.trim()));
    if (expBullets.length >= 3) score += 2;

    const details = `${usedVerbs.size} action verbs, ${metricPatterns.length} metrics, ${bulletLines.length} bullet points`;

    return { name: 'Formatting Quality', score: Math.min(Math.round(score), maxScore), maxScore, details };
}

function scoreContentDepth(sections: SectionMap): ATSCategoryScore {
    const maxScore = 20;
    let score = 0;

    // Ideal word counts per section
    const idealRanges: Record<string, [number, number]> = {
        summary: [30, 80],
        experience: [80, 400],
        education: [20, 100],
        skills: [15, 100],
        certifications: [10, 80],
    };

    const feedback: string[] = [];

    for (const [section, [min, max]] of Object.entries(idealRanges)) {
        const text = sections[section] || '';
        const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
        const sectionWeight = section === 'experience' ? 6 : section === 'summary' ? 5 : 3;

        if (wordCount === 0) {
            // No content — 0 pts
        } else if (wordCount < min) {
            score += sectionWeight * 0.5;
            feedback.push(`${section}: too brief (${wordCount} words)`);
        } else if (wordCount > max) {
            score += sectionWeight * 0.7;
            feedback.push(`${section}: may be too long (${wordCount} words)`);
        } else {
            score += sectionWeight;
        }
    }

    const details = feedback.length > 0
        ? feedback.join('; ')
        : 'Good content depth across sections';

    return { name: 'Content Depth', score: Math.min(Math.round(score), maxScore), maxScore, details };
}

function scoreKeywordMatch(
    sections: SectionMap,
    jobDescription: string
): ATSCategoryScore & { matched: string[]; missing: string[] } {
    const maxScore = 30;
    const resumeText = Object.values(sections).join('\n');
    const jdKeywords = extractJDKeywords(jobDescription);

    if (jdKeywords.length === 0) {
        return {
            name: 'Keyword Match',
            score: 0,
            maxScore,
            details: 'No keywords extracted from JD',
            matched: [],
            missing: [],
        };
    }

    const matched: string[] = [];
    const missing: string[] = [];

    for (const keyword of jdKeywords) {
        if (resumeContainsKeyword(resumeText, keyword)) {
            matched.push(keyword);
        } else {
            missing.push(keyword);
        }
    }

    const matchRate = matched.length / jdKeywords.length;
    const score = Math.round(maxScore * matchRate);

    const details = `${matched.length}/${jdKeywords.length} keywords matched (${Math.round(matchRate * 100)}%)`;

    return { name: 'Keyword Match', score: Math.min(score, maxScore), maxScore, details, matched, missing };
}

// ─── Suggestions Generator ──────────────────────────────────────────

function generateSuggestions(
    categories: ATSCategoryScore[],
    keywordAnalysis?: { matched: string[]; missing: string[] }
): ATSSuggestion[] {
    const suggestions: ATSSuggestion[] = [];

    for (const cat of categories) {
        const pct = cat.score / cat.maxScore;

        if (cat.name === 'Section Completeness' && pct < 0.8) {
            suggestions.push({
                priority: 'critical',
                message: `Add missing sections: ${cat.details.replace('Missing: ', '')}. ATS systems penalize incomplete resumes.`,
            });
        }

        if (cat.name === 'Contact Info' && pct < 0.8) {
            suggestions.push({
                priority: 'important',
                message: `Complete your contact info (${cat.details.replace('Missing: ', '')}). Recruiters need easy ways to reach you.`,
            });
        }

        if (cat.name === 'Formatting Quality' && pct < 0.5) {
            suggestions.push({
                priority: 'important',
                message: 'Use more action verbs (e.g., "Developed", "Led", "Optimized") and quantify achievements with numbers and percentages.',
            });
        }

        if (cat.name === 'Content Depth' && pct < 0.6) {
            suggestions.push({
                priority: 'important',
                message: 'Some sections are too brief. Expand your experience with detailed bullet points showing impact.',
            });
        }
    }

    // Keyword-specific suggestions
    if (keywordAnalysis && keywordAnalysis.missing.length > 0) {
        const topMissing = keywordAnalysis.missing.slice(0, 5);
        suggestions.push({
            priority: 'critical',
            message: `Add these JD keywords to your resume: ${topMissing.join(', ')}`,
        });
    }

    // Sort by priority
    const priorityOrder = { critical: 0, important: 1, 'nice-to-have': 2 };
    suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return suggestions.slice(0, 5);
}

// ─── Main Entry Point ────────────────────────────────────────────────

/**
 * Calculate a real ATS score based on multiple evaluation dimensions.
 *
 * @param sections  - Record of sectionId → content string
 * @param contact   - Contact information object
 * @param jobDescription - Optional job description for keyword matching
 */
export function calculateATSScore(
    sections: SectionMap,
    contact: ContactInfo,
    jobDescription?: string
): ATSResult {
    const hasJD = !!(jobDescription?.trim());

    // Calculate individual category scores
    const sectionScore = scoreSectionCompleteness(sections);
    const contactScore = scoreContactCompleteness(contact);
    const formattingScore = scoreFormattingQuality(sections);
    const depthScore = scoreContentDepth(sections);

    const categories: ATSCategoryScore[] = [
        sectionScore,
        contactScore,
        formattingScore,
        depthScore,
    ];

    let keywordAnalysis: ATSResult['keywordAnalysis'] = undefined;

    if (hasJD) {
        const kwResult = scoreKeywordMatch(sections, jobDescription!);
        categories.push({
            name: kwResult.name,
            score: kwResult.score,
            maxScore: kwResult.maxScore,
            details: kwResult.details,
        });
        keywordAnalysis = {
            matched: kwResult.matched,
            missing: kwResult.missing,
            matchRate: kwResult.matched.length / (kwResult.matched.length + kwResult.missing.length) || 0,
        };
    }

    // Calculate total
    const rawTotal = categories.reduce((sum, c) => sum + c.score, 0);
    const rawMax = categories.reduce((sum, c) => sum + c.maxScore, 0);

    // Normalize to 0-100 scale
    const totalScore = rawMax > 0 ? Math.round((rawTotal / rawMax) * 100) : 0;

    // Generate improvement suggestions
    const suggestions = generateSuggestions(categories, keywordAnalysis);

    return {
        totalScore,
        categories,
        suggestions,
        keywordAnalysis,
    };
}
