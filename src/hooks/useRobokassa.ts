import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseRobokassaProps {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}

export function useRobokassa({ onSuccess, onError }: UseRobokassaProps = {}) {
    const [isLoading, setIsLoading] = useState(false);

    const buySubscription = async (plan: 'pro', period: 3 | 6 | 12) => {
        try {
            setIsLoading(true);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("Пожалуйста, войдите в систему");
                return;
            }

            console.log('Initiating RoboKassa payment:', { plan, period, userId: user.id });

            const { data, error } = await supabase.functions.invoke('robokassa', {
                body: {
                    plan,
                    period,
                    userId: user.id,
                },
            });

            if (error) throw error;
            if (!data?.url) throw new Error("No payment URL returned");

            console.log('Redirecting to:', data.url);
            window.location.href = data.url;

            onSuccess?.();
        } catch (error: any) {
            console.error('Payment init error:', error);
            toast.error("Ошибка при создании платежа: " + error.message);
            onError?.(error);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        buySubscription,
        isLoading
    };
}
