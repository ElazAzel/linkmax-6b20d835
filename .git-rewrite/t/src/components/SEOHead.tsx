import { useEffect } from 'react';
import type { PageData, Block, ProfileBlock, AvatarBlock } from '@/types/page';

interface SEOHeadProps {
  pageData: PageData;
  pageUrl: string;
}

// Extract profile/avatar info from blocks
function getProfileInfo(blocks: Block[]): { name?: string; bio?: string; avatar?: string } {
  // Try profile block first
  const profileBlock = blocks.find(b => b.type === 'profile') as ProfileBlock | undefined;
  if (profileBlock) {
    const name = typeof profileBlock.name === 'string' ? profileBlock.name : profileBlock.name?.ru || profileBlock.name?.en;
    const bio = typeof profileBlock.bio === 'string' ? profileBlock.bio : profileBlock.bio?.ru || profileBlock.bio?.en;
    return {
      name,
      bio,
      avatar: profileBlock.avatar,
    };
  }

  // Try avatar block
  const avatarBlock = blocks.find(b => b.type === 'avatar') as AvatarBlock | undefined;
  if (avatarBlock) {
    const name = typeof avatarBlock.name === 'string' ? avatarBlock.name : avatarBlock.name?.ru || avatarBlock.name?.en;
    const subtitle = avatarBlock.subtitle ? (typeof avatarBlock.subtitle === 'string' ? avatarBlock.subtitle : avatarBlock.subtitle?.ru || avatarBlock.subtitle?.en) : undefined;
    return {
      name,
      bio: subtitle,
      avatar: avatarBlock.imageUrl,
    };
  }

  return {};
}

export function SEOHead({ pageData, pageUrl }: SEOHeadProps) {
  useEffect(() => {
    const profileInfo = getProfileInfo(pageData.blocks);
    const pageTitle = pageData.seo.title || profileInfo.name || 'LinkMAX Page';
    
    // Update document title
    document.title = pageTitle;

    // Helper to update or create meta tag
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

    // Basic meta tags
    const description = pageData.seo.description || profileInfo.bio || `Check out ${profileInfo.name || 'this page'} on LinkMAX`;
    setMetaTag('description', description);
    
    if (pageData.seo.keywords?.length) {
      setMetaTag('keywords', pageData.seo.keywords.join(', '));
    }

    // Open Graph tags
    setMetaTag('og:type', 'profile', true);
    setMetaTag('og:title', pageTitle, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:url', pageUrl, true);
    setMetaTag('og:site_name', 'LinkMAX', true);
    
    // Use avatar or a default image for OG
    const imageUrl = profileInfo.avatar || pageData.previewUrl || 'https://lnkmx.my/favicon.jpg';
    setMetaTag('og:image', imageUrl, true);
    setMetaTag('og:image:alt', `${profileInfo.name || 'User'} profile picture`, true);

    // Twitter Card tags
    setMetaTag('twitter:card', 'summary');
    setMetaTag('twitter:title', pageTitle);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', imageUrl);
    setMetaTag('twitter:site', '@LinkMAX');

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = pageUrl;

    // JSON-LD structured data for profile
    let jsonLd = document.querySelector('script[type="application/ld+json"]#page-schema');
    if (!jsonLd) {
      jsonLd = document.createElement('script');
      jsonLd.setAttribute('type', 'application/ld+json');
      jsonLd.id = 'page-schema';
      document.head.appendChild(jsonLd);
    }
    
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      name: pageTitle,
      description: description,
      url: pageUrl,
      mainEntity: {
        '@type': 'Person',
        name: profileInfo.name || pageTitle,
        description: profileInfo.bio || description,
        image: profileInfo.avatar || undefined,
        url: pageUrl,
      },
    };
    jsonLd.textContent = JSON.stringify(structuredData);

    // Cleanup on unmount - restore original meta tags
    return () => {
      // Reset to defaults
      document.title = 'LinkMAX - AI-Powered Link-in-Bio Platform';
      setMetaTag('description', 'Create a stunning bio page that brings together all your content, social media, and products. Powered by AI.');
      
      // Remove page-specific tags
      const tagsToRemove = [
        'meta[property="og:type"]',
        'meta[property="og:url"]',
        'meta[property="og:site_name"]',
        'meta[property="og:image:alt"]',
        'link[rel="canonical"]',
        'script#page-schema'
      ];
      
      tagsToRemove.forEach(selector => {
        const el = document.querySelector(selector);
        if (el) el.remove();
      });
    };
  }, [pageData, pageUrl]);

  return null; // This component only manages document head
}
