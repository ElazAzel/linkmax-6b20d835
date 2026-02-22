import { useState } from 'react';
import { supabase } from '@/platform/supabase/client';
import { toast } from 'sonner';

export type DomainStatus = 'pending' | 'active' | 'failed' | 'configuring';

interface VerificationResult {
    success: boolean;
    status: DomainStatus;
    isConfigured: boolean;
    error?: string;
    timestamp?: string;
}

/**
 * useDomainVerification - Hook for triggering and monitoring domain verification
 */
export function useDomainVerification(hostname?: string | null) {
    const [isVerifying, setIsVerifying] = useState(false);
    const [currentStatus, setCurrentStatus] = useState<DomainStatus | null>(null);

    const verifyDomain = async (targetHostname?: string): Promise<VerificationResult> => {
        const domainToVerify = targetHostname || hostname;

        if (!domainToVerify) {
            return { success: false, status: 'pending', isConfigured: false, error: 'No hostname provided' };
        }

        setIsVerifying(true);
        try {
            const { data, error } = await supabase.functions.invoke('verify-domain', {
                body: { hostname: domainToVerify },
            });

            if (error) throw error;

            const result = data as VerificationResult;
            setCurrentStatus(result.status);

            if (result.isConfigured) {
                toast.success('Домен успешно подтвержден!');
            } else {
                toast.error('Запись CNAME не найдена. Обновление DNS может занять до 24 часов.');
            }

            return result;
        } catch (err) {
            console.error('Domain verification error:', err);
            toast.error('Ошибка при проверке домена. Попробуйте позже.');
            return {
                success: false,
                status: 'failed',
                isConfigured: false,
                error: err instanceof Error ? err.message : 'Unknown error'
            };
        } finally {
            setIsVerifying(false);
        }
    };

    return {
        verifyDomain,
        isVerifying,
        status: currentStatus,
    };
}
