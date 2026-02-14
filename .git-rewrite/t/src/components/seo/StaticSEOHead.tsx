import { useEffect } from 'react';

const DEFAULT_OG_IMAGE =
  'https://storage.googleapis.com/gpt-engineer-file-uploads/rsd687zRxRaxAP6X1wwlUq9nqwo1/social-images/social-1764234683859-Generated Image November 27, 2025 - 11_54AM.jpeg';

type AlternateLink = {
  hreflang: string;
  href: string;
};

interface StaticSEOHeadProps {
  title: string;
  description: string;
  canonical: string;
  currentLanguage: string;
  indexable?: boolean;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile';
  alternates?: AlternateLink[];
}

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

export function StaticSEOHead({
  title,
  description,
  canonical,
  currentLanguage,
  indexable = true,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  alternates = [],
}: StaticSEOHeadProps) {
  useEffect(() => {
    document.title = title;

    setMetaTag('description', description);
    setMetaTag('robots', indexable ? 'index, follow' : 'noindex, nofollow');
    setMetaTag('googlebot', indexable ? 'index, follow' : 'noindex, nofollow');

    setLinkTag('canonical', canonical);

    alternates.forEach((alternate) => {
      setLinkTag('alternate', alternate.href, alternate.hreflang);
    });

    document.documentElement.lang =
      currentLanguage === 'kk' ? 'kk' : currentLanguage === 'en' ? 'en' : 'ru';

    setMetaTag('og:type', ogType, true);
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:url', canonical, true);
    setMetaTag('og:site_name', 'lnkmx', true);
    setMetaTag('og:image', ogImage, true);

    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', ogImage);
    setMetaTag('twitter:site', '@lnkmx_app');
  }, [title, description, canonical, currentLanguage, indexable, ogImage, ogType, alternates]);

  return null;
}
