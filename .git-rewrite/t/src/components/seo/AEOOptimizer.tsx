import { useEffect } from 'react';

interface FAQItem {
    question: string;
    answer: string;
}

interface HowToStep {
    name: string;
    text: string;
    image?: string;
    url?: string;
}

interface AEOOptimizerProps {
    pageUrl: string;
    type?: 'faq' | 'howto' | 'qa';
    faqItems?: FAQItem[];
    howToSteps?: HowToStep[];
    howToName?: string;
    howToDescription?: string;
    speakableSections?: string[];
}

/**
 * Answer Engine Optimization (AEO) Component
 * Adds structured data for voice search, featured snippets, and AI assistants
 */
export function AEOOptimizer({
    pageUrl,
    type = 'faq',
    faqItems = [],
    howToSteps = [],
    howToName,
    howToDescription,
    speakableSections = [],
}: AEOOptimizerProps) {
    useEffect(() => {
        // Remove existing AEO schemas
        const existingSchemas = document.querySelectorAll('script.aeo-schema');
        existingSchemas.forEach(schema => schema.remove());

        const schemas: any[] = [];

        // FAQ Schema
        if (type === 'faq' && faqItems.length > 0) {
            schemas.push({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: faqItems.map(item => ({
                    '@type': 'Question',
                    name: item.question,
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: item.answer,
                    },
                })),
            });
        }

        // HowTo Schema
        if (type === 'howto' && howToSteps.length > 0) {
            schemas.push({
                '@context': 'https://schema.org',
                '@type': 'HowTo',
                name: howToName || 'How to use lnkmx',
                description: howToDescription || 'Step-by-step guide',
                step: howToSteps.map((step, index) => ({
                    '@type': 'HowToStep',
                    position: index + 1,
                    name: step.name,
                    text: step.text,
                    image: step.image,
                    url: step.url || pageUrl,
                })),
            });
        }

        // Q&A Schema
        if (type === 'qa' && faqItems.length > 0) {
            faqItems.forEach(item => {
                schemas.push({
                    '@context': 'https://schema.org',
                    '@type': 'QAPage',
                    mainEntity: {
                        '@type': 'Question',
                        name: item.question,
                        text: item.question,
                        answerCount: 1,
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: item.answer,
                        },
                    },
                });
            });
        }

        // Speakable Schema for voice search
        if (speakableSections.length > 0) {
            const speakableSchema = {
                '@context': 'https://schema.org',
                '@type': 'WebPage',
                url: pageUrl,
                speakable: {
                    '@type': 'SpeakableSpecification',
                    cssSelector: speakableSections,
                },
            };
            schemas.push(speakableSchema);
        }

        // Inject all schemas
        schemas.forEach(schema => {
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.className = 'aeo-schema';
            script.textContent = JSON.stringify(schema);
            document.head.appendChild(script);
        });

        return () => {
            const schemasToRemove = document.querySelectorAll('script.aeo-schema');
            schemasToRemove.forEach(schema => schema.remove());
        };
    }, [pageUrl, type, faqItems, howToSteps, howToName, howToDescription, speakableSections]);

    return null;
}
