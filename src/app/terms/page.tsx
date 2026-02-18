import { Suspense } from 'react';
import { Metadata } from 'next';
import Terms from '@/components/screens/Terms';

export const metadata: Metadata = {
    title: 'Terms of Service - lnkmx.my',
    description: 'Read our terms of service.',
    alternates: {
        canonical: 'https://lnkmx.my/terms',
    },
};

export default function TermsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Terms />
        </Suspense>
    );
}
