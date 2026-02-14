import { Suspense } from 'react';
import { Metadata } from 'next';
import Pricing from '@/components/screens/Pricing';

export const metadata: Metadata = {
    title: 'Pricing - LinkMAX',
    description: 'Choose the plan that fits your needs.',
    alternates: {
        canonical: 'https://lnkmx.my/pricing',
    },
};

export default function PricingPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Pricing />
        </Suspense>
    );
}
