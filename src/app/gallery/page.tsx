import { Suspense } from 'react';
import { Metadata } from 'next';
import Gallery from '@/components/screens/Gallery';

export const metadata: Metadata = {
    title: 'Gallery - LinkMAX',
    description: 'Explore what others are building with LinkMAX.',
    alternates: {
        canonical: 'https://lnkmx.my/gallery',
    },
};

export default function GalleryPage() {
    return (
        <Suspense fallback={<div>Loading gallery...</div>}>
            <Gallery />
        </Suspense>
    );
}
