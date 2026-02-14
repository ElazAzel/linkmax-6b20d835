import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface SEOMetaEnhancerProps {
    pageUrl: string;
    pageTitle: string;
    pageDescription: string;
    imageUrl?: string;
    imageAlt?: string;
    type?: 'website' | 'article' | 'profile' | 'product';
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
}

/**
 * Enhanced SEO Meta Tags Component
 * Adds comprehensive Open Graph, Twitter Card, and extended meta tags
 */
export function SEOMetaEnhancer({
    pageUrl,
    pageTitle,
    pageDescription,
    imageUrl,
    imageAlt,
    type = 'website',
    publishedTime,
    modifiedTime,
    author,
    section,
    tags,
}: SEOMetaEnhancerProps) {
    const { i18n } = useTranslation();

    useEffect(() => {
        const setMetaTag = (name: string, content: string, property = false) => {
            const attr = property ? 'property' : 'name';
            let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;

            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute(attr, name);
                document.head.appendChild(meta);
            }
            meta.content = content;
        };

        // Enhanced Open Graph tags
        setMetaTag('og:type', type, true);
        setMetaTag('og:url', pageUrl, true);
        setMetaTag('og:title', pageTitle, true);
        setMetaTag('og:description', pageDescription, true);
        setMetaTag('og:site_name', 'lnkmx', true);
        setMetaTag('og:locale', i18n.language === 'ru' ? 'ru_RU' : i18n.language === 'kk' ? 'kk_KZ' : 'en_US', true);

        // Alternate locales
        const alternateLocales = ['ru_RU', 'en_US', 'kk_KZ'].filter(
            locale => locale !== (i18n.language === 'ru' ? 'ru_RU' : i18n.language === 'kk' ? 'kk_KZ' : 'en_US')
        );
        alternateLocales.forEach((locale, index) => {
            setMetaTag(`og:locale:alternate${index}`, locale, true);
        });

        // Image tags
        if (imageUrl) {
            setMetaTag('og:image', imageUrl, true);
            setMetaTag('og:image:secure_url', imageUrl.replace('http://', 'https://'), true);
            setMetaTag('og:image:type', 'image/jpeg', true);
            setMetaTag('og:image:width', '1200', true);
            setMetaTag('og:image:height', '630', true);
            if (imageAlt) {
                setMetaTag('og:image:alt', imageAlt, true);
            }
        }

        // Article-specific tags
        if (type === 'article') {
            if (publishedTime) setMetaTag('article:published_time', publishedTime, true);
            if (modifiedTime) setMetaTag('article:modified_time', modifiedTime, true);
            if (author) setMetaTag('article:author', author, true);
            if (section) setMetaTag('article:section', section, true);
            if (tags) {
                tags.forEach((tag, index) => {
                    setMetaTag(`article:tag${index}`, tag, true);
                });
            }
        }

        // Enhanced Twitter Card tags
        setMetaTag('twitter:card', imageUrl ? 'summary_large_image' : 'summary');
        setMetaTag('twitter:site', '@lnkmx_app');
        setMetaTag('twitter:creator', '@lnkmx_app');
        setMetaTag('twitter:title', pageTitle);
        setMetaTag('twitter:description', pageDescription);
        if (imageUrl) {
            setMetaTag('twitter:image', imageUrl);
            if (imageAlt) {
                setMetaTag('twitter:image:alt', imageAlt);
            }
        }

        // Additional meta tags for better SEO
        setMetaTag('theme-color', '#8b5cf6'); // Primary color
        setMetaTag('mobile-web-app-capable', 'yes');
        setMetaTag('apple-mobile-web-app-capable', 'yes');
        setMetaTag('apple-mobile-web-app-status-bar-style', 'default');
        setMetaTag('apple-mobile-web-app-title', 'lnkmx');

        // Dublin Core metadata
        setMetaTag('DC.title', pageTitle);
        setMetaTag('DC.description', pageDescription);
        setMetaTag('DC.language', i18n.language);
        setMetaTag('DC.publisher', 'lnkmx');

    }, [pageUrl, pageTitle, pageDescription, imageUrl, imageAlt, type, publishedTime, modifiedTime, author, section, tags, i18n.language]);

    return null;
}
