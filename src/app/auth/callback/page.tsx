import { Suspense } from 'react';
import AuthCallback from '@/pages/AuthCallback';

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={<div>Processing authentication...</div>}>
            <AuthCallback />
        </Suspense>
    );
}
