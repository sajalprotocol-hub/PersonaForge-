'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';

/**
 * JSON-LD Structured Data for SEO.
 * Renders invisible structured data for search engines.
 * Completely free — improves Google Search appearance.
 */
export function JsonLdSchema() {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'PersonaForge',
        url: 'https://personaforge.ai',
        description: 'AI-powered resume builder with ATS optimization, JD matching, and cover letter generation. Built for Indian job seekers.',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: [
            {
                '@type': 'Offer',
                name: 'Free Plan',
                price: '0',
                priceCurrency: 'INR',
                description: '1 Basic Resume, AI Optimization, Manual JD Matching',
            },
            {
                '@type': 'Offer',
                name: 'Growth Plan',
                price: '109',
                priceCurrency: 'INR',
                priceSpecification: {
                    '@type': 'UnitPriceSpecification',
                    billingDuration: 'P1M',
                },
                description: '3 Premium Resumes, Advanced AI Rebuild, Unlimited JD Matching',
            },
            {
                '@type': 'Offer',
                name: 'Pro Plan',
                price: '199',
                priceCurrency: 'INR',
                priceSpecification: {
                    '@type': 'UnitPriceSpecification',
                    billingDuration: 'P1M',
                },
                description: 'Unlimited Resumes, Priority AI Support, Cover Letter Generator',
            },
            {
                '@type': 'Offer',
                name: 'Lifetime Plan',
                price: '499',
                priceCurrency: 'INR',
                description: 'One-time payment for lifetime access to all features',
            },
        ],
        creator: {
            '@type': 'Organization',
            name: 'PersonaForge',
            url: 'https://personaforge.ai',
        },
        featureList: [
            'AI-Powered Resume Builder',
            'ATS Score Checker',
            'Job Description Matching',
            'Cover Letter Generator',
            'AI Resume Rebuild',
            'Multiple Professional Templates',
            'PDF Export',
        ],
    };

    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: 'How does the AI resume optimization work?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Our AI analyzes your experience, skills, and target job description to generate tailored bullet points, professional summaries, and skill highlights that pass ATS systems and impress recruiters.',
                },
            },
            {
                '@type': 'Question',
                name: 'Is my data secure?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Absolutely. We use Firebase with enterprise-grade security, encrypted data storage, and never share your personal information with third parties.',
                },
            },
            {
                '@type': 'Question',
                name: 'Can I use PersonaForge for free?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes! Our free tier includes basic resume building and ATS score checking. Upgrade anytime for unlimited AI generations.',
                },
            },
            {
                '@type': 'Question',
                name: 'What is ATS scoring?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'ATS (Applicant Tracking System) scoring evaluates how well your resume matches the format and keywords that automated hiring systems look for.',
                },
            },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
        </>
    );
}

/**
 * Google Analytics 4 — completely free.
 * Add your GA4 measurement ID in the environment variable.
 */
export function GoogleAnalytics() {
    const gaId = process.env.NEXT_PUBLIC_GA_ID;

    if (!gaId) return null;

    return (
        <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
            <script
                dangerouslySetInnerHTML={{
                    __html: `
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', '${gaId}', {
                            page_title: document.title,
                            send_page_view: true,
                        });
                    `,
                }}
            />
        </>
    );
}

/**
 * Auto-track events to GA4 — call from anywhere in the app.
 * Free: uses gtag built into the browser.
 */
export function trackEvent(eventName: string, params?: Record<string, string | number | boolean>) {
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', eventName, params);
    }
}

/**
 * Auto-track conversions for key actions.
 */
export const ANALYTICS_EVENTS = {
    SIGNUP_START: 'signup_start',
    SIGNUP_COMPLETE: 'signup_complete',
    RESUME_CREATED: 'resume_created',
    RESUME_EXPORTED: 'resume_exported',
    ATS_SCORE_CHECKED: 'ats_score_checked',
    JD_MATCHED: 'jd_matched',
    COVER_LETTER_GENERATED: 'cover_letter_generated',
    UPGRADE_PROMPT_SHOWN: 'upgrade_prompt_shown',
    UPGRADE_CLICKED: 'upgrade_clicked',
    PAYMENT_SUCCESS: 'payment_success',
    REFERRAL_SHARED: 'referral_shared',
    EMAIL_CAPTURED: 'email_captured',
    FEEDBACK_SUBMITTED: 'feedback_submitted',
} as const;
