import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PublicPageClient from '@/app/[slug]/PublicPageClient';
import { decompressPageData } from '@/lib/compression';

// Force dynamic rendering as params change
export const dynamic = 'force-dynamic';

interface Props {
    params: { compressed: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    // Decode on server to get title
    const decodedString = decodeURIComponent(params.compressed);
    const page = decompressPageData(decodedString);

    if (!page) {
        return {
            title: 'Page Not Found',
        };
    }

    const title = page.seo?.title || 'Shared Page';
    const description = page.seo?.description || 'Check out this page on lnkmx.my';
    const image = (page.seo as any)?.image || 'https://lnkmx.my/og-image.png';

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [image],
            type: 'website',
        },
        robots: {
            index: false, // Don't index compressed temporary pages usually
            follow: false,
        }
    };
}

export default async function CompressedPage({ params }: Props) {
    const decodedString = decodeURIComponent(params.compressed);
    const page = decompressPageData(decodedString);

    if (!page) {
        notFound();
    }

    return <PublicPageClient initialPageData={page} />;
}
