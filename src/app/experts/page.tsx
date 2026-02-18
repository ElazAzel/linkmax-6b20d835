import { Suspense } from 'react';
import { Metadata } from 'next';
import Experts from '@/components/screens/Experts';

export const metadata: Metadata = {
    title: 'Experts - lnkmx.my',
    description: 'Find experts to help you build your page.',
    alternates: {
        canonical: 'https://lnkmx.my/experts',
    },
};

export default function ExpertsPage() {
    return (
        <Suspense fallback={<div>Loading experts...</div>}>
            <Experts />
        </Suspense>
    );
}
