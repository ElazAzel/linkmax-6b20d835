import { Suspense } from 'react';
import { Metadata } from 'next';
import Auth from '@/pages/Auth';

export const metadata: Metadata = {
    title: 'Sign In - LinkMAX',
    description: 'Sign in to access your dashboard.',
};

export default function AuthPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Auth />
        </Suspense>
    );
}
