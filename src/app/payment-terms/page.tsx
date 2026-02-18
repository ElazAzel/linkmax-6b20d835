import { Suspense } from 'react';
import { Metadata } from 'next';
import PaymentTerms from '@/components/screens/PaymentTerms';

export const metadata: Metadata = {
    title: 'Payment Terms - lnkmx.my',
    description: 'Read our payment terms.',
    alternates: {
        canonical: 'https://lnkmx.my/payment-terms',
    },
};

export default function PaymentTermsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PaymentTerms />
        </Suspense>
    );
}
