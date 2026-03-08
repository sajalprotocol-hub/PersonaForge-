import OpenAI from 'openai';
import { generateGeminiCompletion, generateGeminiJSON } from './gemini';

// M-7 FIX: Lazy-initialize OpenAI client to avoid unnecessary allocation
let _openai: OpenAI | null = null;
function getOpenAIClient(): OpenAI {
    if (!_openai) {
        _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return _openai;
}

export async function generateCompletion(
    systemPrompt: string,
    userPrompt: string,
    options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
    // 1. Try Gemini if key is provided
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'sk-demo') {
        try {
            return await generateGeminiCompletion(systemPrompt, userPrompt, options);
        } catch (err) {
            console.error('Gemini error, falling back to OpenAI:', err);
        }
    }

    // 2. Try OpenAI
    try {
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-demo') {
            throw new Error('No valid OpenAI API key');
        }

        const openai = getOpenAIClient();
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: options?.temperature ?? 0.7,
            max_tokens: options?.maxTokens ?? 2000,
        });

        return response.choices[0]?.message?.content || '';
    } catch (error) {
        console.error('OpenAI API Error:', error);
        throw new Error('Failed to generate AI content. Please check API keys.');
    }
}

export async function generateJSON<T>(
    systemPrompt: string,
    userPrompt: string,
    options?: { temperature?: number; maxTokens?: number }
): Promise<T> {
    // 1. Try Gemini if key is provided
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'sk-demo') {
        try {
            return await generateGeminiJSON<T>(systemPrompt, userPrompt, options);
        } catch (err) {
            console.error('Gemini JSON error, falling back to OpenAI:', err);
        }
    }

    // 2. Try OpenAI
    try {
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-demo') {
            throw new Error('No valid OpenAI API key');
        }

        const openai = getOpenAIClient();
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt + '\n\nRespond ONLY with valid JSON. No markdown, no code blocks, no explanations.' },
                { role: 'user', content: userPrompt },
            ],
            temperature: options?.temperature ?? 0.5,
            max_tokens: options?.maxTokens ?? 3000,
            response_format: { type: 'json_object' },
        });

        const content = response.choices[0]?.message?.content || '{}';
        return JSON.parse(content) as T;
    } catch (error) {
        console.error('OpenAI API Error:', error);
        throw new Error('Failed to generate AI JSON content. Please check API keys.');
    }
}

export default getOpenAIClient;
