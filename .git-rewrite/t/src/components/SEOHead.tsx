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
    const pageTitle = pageData.seo.title || profileInfo.name || 'lnkmx Page';
    
    // Update document title - include name + role for clear OG
    const fullTitle = profileInfo.name 
      ? `${profileInfo.name}${profileInfo.bio ? ` - ${profileInfo.bio.slice(0, 50)}` : ''}`
      : pageTitle;
    document.title = fullTitle;

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

    const removeMetaTag = (name: string, property = false) => {
      const attr = property ? 'property' : 'name';
      const meta = document.querySelector(`meta[${attr}="${name}"]`);
      if (meta) meta.remove();
    };

    const setLinkTag = (rel: string, href: string, hreflang?: string) => {
      const selector = hreflang
        ? `link[rel="${rel}"][hreflang="${hreflang}"]`
        : `link[rel="${rel}"]:not([hreflang])`;
      let link = document.querySelector(selector) as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        if (hreflang) link.hreflang = hreflang;
        document.head.appendChild(link);
      }
      link.href = href;
    };

    // Basic meta tags
    const description = pageData.seo.description || profileInfo.bio || `${profileInfo.name || 'This page'} on lnkmx`;
    setMetaTag('description', description);
    setMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setMetaTag('googlebot', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    
    if (pageData.seo.keywords?.length) {
      setMetaTag('keywords', pageData.seo.keywords.join(', '));
    } else {
      removeMetaTag('keywords');
    }

    // Open Graph tags - optimized for social sharing
    setMetaTag('og:type', 'profile', true);
    setMetaTag('og:title', fullTitle, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:url', pageUrl, true);
    setMetaTag('og:site_name', 'lnkmx', true);
    
    // Use avatar or a default image for OG
    const imageUrl = profileInfo.avatar || pageData.previewUrl || 'https://lnkmx.my/favicon.jpg';
    setMetaTag('og:image', imageUrl, true);
    setMetaTag('og:image:alt', `${profileInfo.name || 'User'} profile`, true);

    // Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', fullTitle);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', imageUrl);
    setMetaTag('twitter:site', '@lnkmx_app');

    // Canonical URL
    setLinkTag('canonical', pageUrl);

    // Hreflang for translated versions
    setLinkTag('alternate', `${pageUrl}?lang=ru`, 'ru');
    setLinkTag('alternate', `${pageUrl}?lang=en`, 'en');
    setLinkTag('alternate', `${pageUrl}?lang=kk`, 'kk');
    setLinkTag('alternate', pageUrl, 'x-default');

    // JSON-LD structured data for Person profile
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
      name: fullTitle,
      description: description,
      url: pageUrl,
      dateModified: new Date().toISOString(),
      mainEntity: {
        '@type': 'Person',
        name: profileInfo.name || pageTitle,
        description: profileInfo.bio || description,
        image: profileInfo.avatar || undefined,
        url: pageUrl,
        sameAs: [], // Could be populated from social blocks
      },
      isPartOf: {
        '@type': 'WebSite',
        name: 'lnkmx',
        url: 'https://lnkmx.my',
      },
    };
    jsonLd.textContent = JSON.stringify(structuredData);

    // Cleanup on unmount - restore original meta tags
    return () => {
      // Reset to defaults
      document.title = 'lnkmx - AI Bio Page Builder';
      setMetaTag('description', 'Create your bio page in 2 minutes with AI. For experts, freelancers and small business.');
      
      // Remove page-specific tags
      const tagsToRemove = [
        'meta[property="og:type"]',
        'meta[property="og:url"]',
        'meta[property="og:site_name"]',
        'meta[property="og:image:alt"]',
        'meta[name="keywords"]',
        'link[rel="canonical"]',
        'link[rel="alternate"]',
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
