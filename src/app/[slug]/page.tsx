import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadPageBySlug } from '@/services/pages';
import PublicPageClient from './PublicPageClient';

// Force dynamic rendering for user pages to insure fresh content
export const dynamic = 'force-dynamic';

interface Props {
    params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    // Fetch data on server
    const { data: page } = await loadPageBySlug(params.slug);

    if (!page) {
        return {
            title: 'Page Not Found',
        };
    }

    const title = page.seo?.title || page.slug || 'User Page';
    const description = page.seo?.description || `Check out ${page.slug || 'this'}'s page on LinkMAX`;
    const image = (page.seo as any)?.image || 'https://lnkmx.my/og-image.png';

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [image],
            type: 'profile',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [image],
        },
        // AI Search Readiness: Structured Data
        other: {
            'ai:entity_type': 'Person',
            'ai:entity_name': title,
        }
    };
}

export default async function Page({ params }: Props) {
    const { data: page } = await loadPageBySlug(params.slug);

    if (!page) {
        notFound();
    }

    return <PublicPageClient initialPageData={page} />;
}
