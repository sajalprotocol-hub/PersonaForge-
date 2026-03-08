import { NextRequest, NextResponse } from 'next/server';
import { generateJSON, generateCompletion } from '@/lib/openai';
import { verifyAuth, isAuthError, requireSubscription } from '@/lib/auth-helpers';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
    // Auth check (includes admin + subscription lookup)
    const authResult = await verifyAuth(req);
    if (isAuthError(authResult)) return authResult;

    // AI Generation is premium-only: requires monthly/weekly tier (or admin)
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
        const { section, tone, profileData } = await req.json();

        if (section === 'all') {
            const systemPrompt = `You are an expert resume writer. Generate professional resume content in a ${tone} tone. Return JSON matching this structure:
{
  "summary": "string",
  "experience": [{"id": "string", "title": "string", "company": "string", "location": "string", "startDate": "string", "endDate": "string", "current": boolean, "bullets": ["string"]}],
  "education": [{"id": "string", "degree": "string", "field": "string", "institution": "string", "year": "string", "gpa": "string"}],
  "projects": [{"id": "string", "name": "string", "description": "string", "technologies": ["string"], "year": "string", "bullets": ["string"]}],
  "skills": "string",
  "certifications": "string",
  "atsScore": number
}`;
            const userPrompt = `Generate resume content for all sections. Profile: ${JSON.stringify(profileData || {})}. Tone: ${tone}. Make it ATS-optimized. 
            For 'projects', provide at least 2 significant technical projects. 
            For 'skills', provide a highly structured string grouped by categories (e.g., 'Languages: Python, Java; Tools: Docker, Git').`;

            try {
                const result = await generateJSON<any>(systemPrompt, userPrompt);
                const atsScore = result.atsScore || 85;
                return NextResponse.json({ sections: result, atsScore, demoMode: false });
            } catch {
                // Structured Fallback
                return NextResponse.json({
                    sections: {
                        summary: `Results-driven professional with expertise in technical problem-solving...`,
                        experience: [
                            {
                                id: 'exp1',
                                title: 'Senior Developer',
                                company: 'TechCorp',
                                location: 'Remote',
                                startDate: '2021',
                                endDate: 'Present',
                                current: true,
                                bullets: ['Led cross-functional teams to deliver high-scale systems', 'Optimized performance by 35% using React/Node.js']
                            }
                        ],
                        projects: [
                            {
                                id: 'proj1',
                                name: 'Executive Dashboard',
                                description: 'Analytics platform for real-time tracking',
                                technologies: ['React', 'D3.js', 'PostgreSQL'],
                                year: '2024',
                                bullets: ['Integrated 5+ data sources', 'Reduced reporting time by 70%']
                            }
                        ],
                        education: [
                            {
                                id: 'edu1',
                                degree: 'Bachelor of Science',
                                field: 'Computer Science',
                                institution: 'State University',
                                year: '2020',
                                gpa: '3.8'
                            }
                        ],
                        skills: 'Languages: TypeScript, Python, SQL; Frameworks: Next.js, FastAPI; Tools: AWS, Docker',
                        certifications: 'AWS Certified Solutions Architect',
                    },
                    atsScore: 82,
                    demoMode: true,
                });
            }
        }

        // Single section
        const isStructured = ['experience', 'education', 'projects'].includes(section);
        const systemPrompt = isStructured
            ? `You are an expert resume writer. Generate the ${section} section as an ARRAY of objects. Return ONLY JSON.
            Structure for projects: [{id, name, description, technologies: [], year, bullets: []}].`
            : `You are an expert resume writer specializing in ${section} sections. Write in a ${tone} tone. Be concise, impactful, and ATS-optimized.`;

        const userPrompt = `Generate a resume ${section} section. ${profileData ? `Profile data: ${JSON.stringify(profileData)}` : 'Use sample professional data.'}`;

        try {
            if (isStructured) {
                const result = await generateJSON<any[]>(systemPrompt, userPrompt);
                return NextResponse.json({ content: result, demoMode: false });
            } else {
                const content = await generateCompletion(systemPrompt, userPrompt);
                return NextResponse.json({ content, demoMode: false });
            }
        } catch {
            // Fallback for single section
            let fallbackContent: any = 'Details here...';
            if (section === 'experience') {
                fallbackContent = [{ id: 'f1', title: 'Professional Role', company: 'Previous Company', location: 'City', startDate: '2020', endDate: '2023', current: false, bullets: ['Achievement 1', 'Achievement 2'] }];
            } else if (section === 'education') {
                fallbackContent = [{ id: 'f1', degree: 'Degree Name', field: 'Field', institution: 'Institution Name', year: '2020' }];
            } else if (section === 'projects') {
                fallbackContent = [{ id: 'f1', name: 'Key Project', description: 'Impactful description', technologies: ['Tool A', 'Tool B'], year: '2024', bullets: ['Result 1', 'Result 2'] }];
            }

            return NextResponse.json({
                content: fallbackContent,
                demoMode: true
            });
        }
    } catch (error) {
        console.error('AI Generate Error:', error);
        return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
    }
}
