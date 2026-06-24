import { useState } from 'react';
import { supabase } from '@/platform/supabase/client';
import { toast } from 'sonner';
import { useAppError } from '@/hooks/useAppError';

interface UseRobokassaProps {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}

export function useRobokassa({ onSuccess, onError }: UseRobokassaProps = {}) {
    const [isLoading, setIsLoading] = useState(false);
    const { handleError } = useAppError();

    const buySubscription = async (plan: 'pro', period: 3 | 6 | 12) => {
        try {
            setIsLoading(true);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("Пожалуйста, войдите в систему");
                return;
            }

            const { data, error } = await supabase.functions.invoke('robokassa', {
                body: {
                    type: 'subscription',
                    plan,
                    period,
                    userId: user.id,
                },
            });

            if (error) throw error;
            if (!data?.url) throw new Error("No payment URL returned");

            window.location.href = data.url;
            onSuccess?.();
        } catch (error: unknown) {
            console.error('Payment init error:', error);
            handleError(error, "Ошибка при создании платежа");
            if (error instanceof Error) onError?.(error);
        } finally {
            setIsLoading(false);
        }
    };

    const initiatePayment = async (amount: number, description: string, relatedId?: string) => {
        try {
            setIsLoading(true);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("Пожалуйста, войдите в систему");
                return;
            }

            const { data, error } = await supabase.functions.invoke('robokassa', {
                body: {
                    type: 'payment',
                    amount,
                    description,
                    userId: user.id,
                    relatedId
                },
            });

            if (error) throw error;
            if (!data?.url) throw new Error("No payment URL returned");

            window.location.href = data.url;
            onSuccess?.();
        } catch (error: unknown) {
            console.error('Payment init error:', error);
            handleError(error, "Ошибка при создании платежа");
            if (error instanceof Error) onError?.(error);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        buySubscription,
        initiatePayment,
        isLoading
    };
}
