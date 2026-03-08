import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/openai';
import { verifyAuth, isAuthError, requireSubscription } from '@/lib/auth-helpers';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
    // Auth check (includes admin + subscription lookup)
    const authResult = await verifyAuth(req);
    if (isAuthError(authResult)) return authResult;

    // AI Rebuild is premium-only: requires monthly/weekly tier (or admin)
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
        const { resumeText, jobDescription } = await req.json();

        if (!resumeText || !jobDescription) {
            return NextResponse.json({ error: 'Resume and job description are required' }, { status: 400 });
        }

        const systemPrompt = `You are an expert resume optimizer. Restructure and optimize the resume for the given job description. Return JSON with:
    - originalSections (object with section names as keys and original content as values)
    - optimizedSections (object with same keys and optimized content)
    - improvementScore (number 0-100, estimated improvement percentage)
    - changes (array of {section, type: "added"|"modified"|"removed"|"restructured", description})`;

        const userPrompt = `Optimize this resume for the job:\n\nResume:\n${resumeText}\n\nJob Description:\n${jobDescription}`;

        try {
            const result = await generateJSON(systemPrompt, userPrompt) as Record<string, unknown>;
            return NextResponse.json({ ...result, demoMode: false });
        } catch {
            // Smart fallback for Rebuild
            const lines = resumeText.split('\n').filter((l: string) => l.trim());
            const summary = lines.find((l: string) => l.length > 50) || lines[0] || 'Original Summary';
            const exp = lines.filter((l: string) => l.includes('•') || l.length > 30).slice(0, 5).join('\n') || 'Original Experience';

            return NextResponse.json({
                originalSections: {
                    'Professional Summary': summary,
                    'Experience': exp,
                    'Skills': resumeText.slice(-100),
                },
                optimizedSections: {
                    'Professional Summary': `[OPTIMIZED] ${summary}\n\n(Note: This is a demo optimization. Add GEMINI_API_KEY for full AI.)`,
                    'Experience': `[OPTIMIZED CONTRIBUTIONS]\n• Quantified impact: Increased project efficiency by 30%\n• Improved system reliability through automated testing\n• Optimized team workflows for faster delivery\n\n${exp}`,
                    'Skills': `Advanced Keywords: ${resumeText.slice(-50)}, Optimized Tech Stack, ATS Friendly Terms`,
                },
                improvementScore: 40,
                changes: [
                    { section: 'Summary', type: 'modified', description: 'Added impact-driven language' },
                    { section: 'Experience', type: 'restructured', description: 'Enhanced with quantifiable metrics' },
                    { section: 'Skills', type: 'modified', description: 'Reorganized for better ATS visibility' },
                ],
                demoMode: true,
            });
        }
    } catch (error) {
        console.error('AI Rebuild Error:', error);
        return NextResponse.json({ error: 'Failed to rebuild resume' }, { status: 500 });
    }
}
