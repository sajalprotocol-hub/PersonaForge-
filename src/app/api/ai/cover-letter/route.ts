import { NextRequest, NextResponse } from 'next/server';
import { generateCompletion } from '@/lib/openai';
import { verifyAuth, isAuthError, requireSubscription } from '@/lib/auth-helpers';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
    // Auth check (includes admin + subscription lookup)
    const authResult = await verifyAuth(req);
    if (isAuthError(authResult)) return authResult;

    // Cover letter is premium-only: requires monthly/weekly tier (or admin)
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
        const { jobDescription, tone, profileData } = await req.json();

        if (!jobDescription) {
            return NextResponse.json({ error: 'Job description is required' }, { status: 400 });
        }

        const name = profileData?.displayName || '[Your Name]';
        const skills = profileData?.skills ? ` My key skills include: ${profileData.skills}.` : '';
        const background = profileData?.experience ? ` My background: ${profileData.experience}.` : '';

        const systemPrompt = `You are an expert cover letter writer. Write a compelling, ${tone || 'formal'} cover letter tailored to the job description.
        User Name: ${name}
        User Context: ${background}${skills}
        
        CRITICAL RULES:
        - NEVER start with "I am writing to express my interest" or any similar cliché opener.
        - Lead with the candidate's strongest relevant metric or achievement.
        - Be specific to the JD — reference actual requirements from the posting.
        - Keep it under 400 words, concise and impactful.
        - If the tone is "data-driven", lead every paragraph with a quantifiable metric.
        - Sound human, not robotic. Vary sentence structure.`;

        const userPrompt = `Write a cover letter for this job:\n\n${jobDescription}`;

        try {
            const coverLetter = await generateCompletion(systemPrompt, userPrompt);
            return NextResponse.json({ coverLetter, demoMode: false });
        } catch {
            // Semi-dynamic fallback for demo mode
            const jobTitleMatch = jobDescription.match(/(?:for the|position of|as a)\s+([^,.\n]+)/i);
            const inferredTitle = jobTitleMatch ? jobTitleMatch[1].trim() : 'this position';

            return NextResponse.json({
                coverLetter: `Dear Hiring Manager,

Having delivered measurable results in ${profileData?.experience?.slice(0, 100) || 'my recent roles'}, I was excited to see the ${inferredTitle} opening — it aligns directly with my expertise in ${profileData?.skills?.split(',')[0] || 'this field'}.

Throughout my career, I have focused on driving outcomes through hands-on problem solving and technical excellence. Whether optimizing workflows, leading initiatives, or shipping under tight deadlines, I consistently deliver work that moves the needle.${profileData?.skills ? `\n\nSpecifically, my mastery of ${profileData.skills} has allowed me to solve complex challenges and improve project quality.` : ''}

(Note: This is a demo cover letter using your profile data. To unlock real AI-generated letters tailored exactly to this JD, please configure the GEMINI_API_KEY in the environment.)

Best regards,
${name}`,
                demoMode: true,
            });
        }
    } catch (error) {
        console.error('AI Cover Letter Error:', error);
        return NextResponse.json({ error: 'Failed to generate cover letter' }, { status: 500 });
    }
}
