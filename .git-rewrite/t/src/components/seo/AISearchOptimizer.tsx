import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface AISearchOptimizerProps {
    pageType: 'homepage' | 'product' | 'gallery' | 'profile' | 'article' | 'pricing';
    primaryQuestion?: string;
    primaryAnswer?: string;
    entityName?: string;
    entityCategory?: string;
    useCases?: string[];
    targetAudience?: string[];
    problemStatement?: string;
    solutionStatement?: string;
    keyFeatures?: string[];
}

/**
 * AI Search Engine Optimizer Component
 * Optimizes pages for AI-powered search engines (ChatGPT, Perplexity, Claude, Google SGE, Bing AI)
 */
export function AISearchOptimizer({
    pageType,
    primaryQuestion,
    primaryAnswer,
    entityName = 'lnkmx',
    entityCategory = 'Business Tools, Page Builder, CRM, Link in Bio',
    useCases = [],
    targetAudience = [],
    problemStatement,
    solutionStatement,
    keyFeatures = [],
}: AISearchOptimizerProps) {
    const { i18n } = useTranslation();

    useEffect(() => {
        const setMetaTag = (name: string, content: string) => {
            if (!content) return;

            let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;

            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute('name', name);
                document.head.appendChild(meta);
            }
            meta.content = content;
        };

        // AI Crawler Permissions
        setMetaTag('robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
        setMetaTag('googlebot', 'index, follow, max-snippet:-1, max-image-preview:large');
        setMetaTag('googlebot-news', 'index, follow');
        setMetaTag('bingbot', 'index, follow, max-snippet:-1, max-image-preview:large');

        // AI-specific bot permissions
        setMetaTag('GPTBot', 'index, follow');
        setMetaTag('ChatGPT-User', 'index, follow');
        setMetaTag('Google-Extended', 'index, follow');
        setMetaTag('PerplexityBot', 'index, follow');
        setMetaTag('ClaudeBot', 'index, follow');
        setMetaTag('anthropic-ai', 'index, follow');

        // Natural Language Q&A for AI
        if (primaryQuestion && primaryAnswer) {
            setMetaTag('ai:primary_question', primaryQuestion);
            setMetaTag('ai:primary_answer', primaryAnswer);
        }

        // Entity Declaration
        setMetaTag('ai:entity_type', pageType === 'homepage' ? 'SoftwareApplication' : pageType === 'profile' ? 'Person' : 'WebPage');
        setMetaTag('ai:entity_name', entityName);
        setMetaTag('ai:entity_category', entityCategory);

        // Use Cases
        if (useCases.length > 0) {
            setMetaTag('ai:use_cases', useCases.join(', '));
        }

        // Target Audience
        if (targetAudience.length > 0) {
            setMetaTag('ai:target_audience', targetAudience.join(', '));
        }

        // Problem-Solution Framework
        if (problemStatement) {
            setMetaTag('ai:problem', problemStatement);
        }
        if (solutionStatement) {
            setMetaTag('ai:solution', solutionStatement);
        }

        // Key Features (for citation)
        if (keyFeatures.length > 0) {
            setMetaTag('ai:key_features', keyFeatures.join(' | '));
        }

        // Citation metadata
        setMetaTag('citation_title', entityName);
        setMetaTag('citation_author', 'lnkmx Team');
        setMetaTag('citation_publication_date', new Date().toISOString().split('T')[0]);
        setMetaTag('citation_language', i18n.language);

        // AI Context Tags
        setMetaTag('ai:content_type', pageType);
        setMetaTag('ai:language', i18n.language);
        setMetaTag('ai:region', 'KZ');

        // Defined Term Schema for Entity Recognition
        let definedTermSchema = document.querySelector('script#ai-defined-term-schema');
        if (!definedTermSchema) {
            definedTermSchema = document.createElement('script');
            definedTermSchema.setAttribute('type', 'application/ld+json');
            definedTermSchema.id = 'ai-defined-term-schema';
            document.head.appendChild(definedTermSchema);
        }

        const definedTerm = {
            '@context': 'https://schema.org',
            '@type': 'DefinedTerm',
            name: entityName,
            description: primaryAnswer || solutionStatement || 'AI-powered platform for micro-businesses',
            inDefinedTermSet: 'Business Software',
            termCode: entityName.toLowerCase().replace(/\s+/g, '-'),
        };

        definedTermSchema.textContent = JSON.stringify(definedTerm);

        // Enhanced Entity Graph for AI Understanding
        let entityGraphSchema = document.querySelector('script#ai-entity-graph');
        if (!entityGraphSchema) {
            entityGraphSchema = document.createElement('script');
            entityGraphSchema.setAttribute('type', 'application/ld+json');
            entityGraphSchema.id = 'ai-entity-graph';
            document.head.appendChild(entityGraphSchema);
        }

        const entityGraph = {
            '@context': 'https://schema.org',
            '@graph': [
                {
                    '@type': 'Thing',
                    '@id': `https://lnkmx.my/#${pageType}`,
                    name: entityName,
                    description: primaryAnswer || solutionStatement,
                    url: window.location.href,
                    identifier: entityName,
                    category: entityCategory.split(',').map(c => c.trim()),
                },
                ...(useCases.length > 0 ? [{
                    '@type': 'ItemList',
                    '@id': 'https://lnkmx.my/#use-cases',
                    name: `${entityName} Use Cases`,
                    itemListElement: useCases.map((useCase, index) => ({
                        '@type': 'ListItem',
                        position: index + 1,
                        name: useCase,
                    })),
                }] : []),
                ...(keyFeatures.length > 0 ? [{
                    '@type': 'ItemList',
                    '@id': 'https://lnkmx.my/#features',
                    name: `${entityName} Features`,
                    itemListElement: keyFeatures.map((feature, index) => ({
                        '@type': 'ListItem',
                        position: index + 1,
                        name: feature,
                    })),
                }] : []),
            ],
        };

        entityGraphSchema.textContent = JSON.stringify(entityGraph);

        // Cleanup
        return () => {
            const schemasToRemove = document.querySelectorAll('script#ai-defined-term-schema, script#ai-entity-graph');
            schemasToRemove.forEach(schema => schema.remove());
        };
    }, [pageType, primaryQuestion, primaryAnswer, entityName, entityCategory, useCases, targetAudience, problemStatement, solutionStatement, keyFeatures, i18n.language]);

    return null;
}
