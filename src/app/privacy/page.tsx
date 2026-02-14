import { Suspense } from 'react';
import { Metadata } from 'next';
import Privacy from '@/components/screens/Privacy';

export const metadata: Metadata = {
    title: 'Privacy Policy - LinkMAX',
    description: 'Read our privacy policy.',
    alternates: {
        canonical: 'https://lnkmx.my/privacy',
    },
};

export default function PrivacyPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Privacy />
        </Suspense>
    );
}
