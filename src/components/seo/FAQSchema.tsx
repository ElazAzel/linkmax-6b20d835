import { useEffect } from 'react';

interface FAQItem {
    question: string;
    answer: string;
}

interface FAQSchemaProps {
    id?: string;
    faqItems: FAQItem[];
}

/**
 * FAQSchema Component
 * Injects Schema.org FAQPage JSON-LD to help capture "People Also Ask" blocks 
 * and provide structured Q&A for AI answer engines.
 */
export function FAQSchema({ id = 'faq-schema', faqItems }: FAQSchemaProps) {
    useEffect(() => {
        if (!faqItems || faqItems.length === 0) return;

        let script = document.querySelector(`script#${id}`) as HTMLScriptElement;

        if (!script) {
            script = document.createElement('script');
            script.type = 'application/ld+json';
            script.id = id;
            document.head.appendChild(script);
        }

        const schema = {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            'mainEntity': faqItems.map(item => ({
                '@type': 'Question',
                'name': item.question,
                'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': item.answer
                }
            }))
        };

        script.textContent = JSON.stringify(schema);

        return () => {
            const el = document.querySelector(`script#${id}`);
            if (el) el.remove();
        };
    }, [id, faqItems]);

    return null;
}

export default FAQSchema;
