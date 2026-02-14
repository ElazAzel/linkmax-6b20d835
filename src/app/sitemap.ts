import { MetadataRoute } from 'next';
import { getPublicPages } from '@/services/pages';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://lnkmx.my';

    // Static routes
    const staticRoutes = [
        '',
        '/pricing',
        '/auth',
        '/terms',
        '/privacy',
        '/payment-terms',
        '/gallery',
        '/experts',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // Dynamic routes (user pages)
    const pages = await getPublicPages();

    const dynamicRoutes = pages.map((page) => ({
        url: `${baseUrl}/${page.slug}`,
        lastModified: new Date(page.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
    }));

    return [...staticRoutes, ...dynamicRoutes];
}
