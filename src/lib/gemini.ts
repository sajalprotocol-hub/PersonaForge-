import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateGeminiCompletion(
    systemPrompt: string,
    userPrompt: string,
    options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: systemPrompt,
        });

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: {
                temperature: options?.temperature ?? 0.7,
                maxOutputTokens: options?.maxTokens ?? 2000,
            },
        });

        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw new Error('Failed to generate AI content with Gemini.');
    }
}

export async function generateGeminiJSON<T>(
    systemPrompt: string,
    userPrompt: string,
    options?: { temperature?: number; maxTokens?: number }
): Promise<T> {
    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: systemPrompt + '\n\nRespond ONLY with valid JSON. No markdown, no code blocks, no explanations.',
        });

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: {
                temperature: options?.temperature ?? 0.5,
                maxOutputTokens: options?.maxTokens ?? 3000,
                responseMimeType: 'application/json',
            },
        });

        const response = await result.response;
        const text = response.text();
        return JSON.parse(text) as T;
    } catch (error) {
        console.error('Gemini JSON API Error:', error);
        throw new Error('Failed to generate JSON content with Gemini.');
    }
}
