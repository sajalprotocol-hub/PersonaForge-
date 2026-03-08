import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/openai';
import { verifyAuth, isAuthError, requireSubscription } from '@/lib/auth-helpers';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
    // Auth check (includes admin + subscription lookup)
    const authResult = await verifyAuth(req);
    if (isAuthError(authResult)) return authResult;

    // JD Match is premium-only: requires monthly/weekly tier (or admin)
    const subscriptionCheck = requireSubscription(authResult, ['monthly', 'weekly']);
    if (subscriptionCheck) return subscriptionCheck;

    // Rate limit: admins get 100/min, others get 10/min  
    const maxReq = authResult.isAdmin ? 100 : 10;
    const rateCheck = await checkRateLimit(`ai:${authResult.uid}`, { maxRequests: maxReq, windowSeconds: 60 });
    if (!rateCheck.allowed) {
        return NextResponse.json(
            { error: `Rate limited. Try again in ${rateCheck.retryAfterSeconds}s` },
            { status: 429 }
        );
    }

    try {
        const { jobDescription, resumeText } = await req.json();

        if (!jobDescription) {
            return NextResponse.json({ error: 'Job description is required' }, { status: 400 });
        }

        const systemPrompt = `You are an expert ATS and resume analyst. Analyze the match between a resume and job description. Return JSON with:
    - matchPercentage (number 0-100)
    - scoringBreakdown (object with keywordMatch: number 0-100, experienceRelevance: number 0-100, skillAlignment: number 0-100)
    - keywords (array of {keyword, status: "matched"|"missing"|"overused", importance: "high"|"medium"|"low"})
    - contextualMappings (array of {resumeSkill, jdRequirement, confidence: "high"|"medium"|"low", explanation: string} — show how resume skills map to JD requirements even when terms differ)
    - gapAnalysis (array of {keyword, suggestion, priority: "critical"|"important"|"nice-to-have"})
    - sectionComparisons (array of {sectionName, jdRequirement, currentContent, suggestedRewrite, matchLevel: "strong"|"partial"|"weak"|"missing"})
    - overallFeedback (string)`;

        // Use the user's actual resume if provided, otherwise note it's a generic analysis
        const resumeContext = resumeText
            ? `Resume:\n${resumeText}`
            : 'No resume provided — analyze the JD requirements and provide general guidance for a typical candidate.';

        const userPrompt = `Analyze this job description and provide match analysis:\n\nJob Description:\n${jobDescription}\n\n${resumeContext}`;

        try {
            const result = await generateJSON(systemPrompt, userPrompt) as Record<string, unknown>;
            return NextResponse.json({ ...result, demoMode: false });
        } catch {
            // Fallback demo
            return NextResponse.json({
                matchPercentage: 72,
                scoringBreakdown: {
                    keywordMatch: 68,
                    experienceRelevance: 75,
                    skillAlignment: 72,
                },
                keywords: [
                    { keyword: 'React', status: 'matched', importance: 'high' },
                    { keyword: 'TypeScript', status: 'matched', importance: 'high' },
                    { keyword: 'Node.js', status: 'matched', importance: 'medium' },
                    { keyword: 'AWS', status: 'missing', importance: 'high' },
                    { keyword: 'Docker', status: 'missing', importance: 'medium' },
                    { keyword: 'CI/CD', status: 'missing', importance: 'medium' },
                    { keyword: 'Python', status: 'matched', importance: 'medium' },
                    { keyword: 'Leadership', status: 'overused', importance: 'low' },
                    { keyword: 'Agile', status: 'matched', importance: 'medium' },
                    { keyword: 'REST API', status: 'matched', importance: 'high' },
                ],
                contextualMappings: [
                    { resumeSkill: 'React', jdRequirement: 'Frontend Development', confidence: 'high', explanation: 'React is the primary frontend framework requested' },
                    { resumeSkill: 'Node.js', jdRequirement: 'Backend Services', confidence: 'high', explanation: 'Node.js directly matches the backend stack requirement' },
                    { resumeSkill: 'Python', jdRequirement: 'Scripting & Automation', confidence: 'medium', explanation: 'Python can fulfill scripting needs though not explicitly requested for this role' },
                    { resumeSkill: 'REST API', jdRequirement: 'API Development', confidence: 'high', explanation: 'REST API experience directly maps to the API development requirement' },
                ],
                gapAnalysis: [
                    { keyword: 'AWS', suggestion: 'Add cloud experience with AWS services', priority: 'critical' },
                    { keyword: 'Docker', suggestion: 'Include containerization experience', priority: 'important' },
                    { keyword: 'CI/CD', suggestion: 'Mention CI/CD pipeline experience', priority: 'important' },
                ],
                sectionComparisons: [
                    {
                        sectionName: 'Technical Skills',
                        jdRequirement: 'AWS, Docker, CI/CD proficiency',
                        currentContent: 'React, TypeScript, Node.js',
                        suggestedRewrite: 'React, TypeScript, Node.js, Python, AWS (EC2, S3), Docker, GitHub Actions',
                        matchLevel: 'partial',
                    },
                ],
                overallFeedback: 'Good foundation with room for improvement in cloud and DevOps skills.',
                demoMode: true,
            });
        }
    } catch (error) {
        console.error('AI Match Error:', error);
        return NextResponse.json({ error: 'Failed to analyze match' }, { status: 500 });
    }
}
