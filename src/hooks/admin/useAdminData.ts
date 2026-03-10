import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminService, PartnerFormData } from '@/services/admin';
import { toast } from 'sonner';
import { useAppError } from '@/hooks/useAppError';
import { useTranslation } from 'react-i18next';

export function useAdminStats(days = 14) {
    return useQuery({
        queryKey: ['admin-stats', days],
        queryFn: async () => {
            const [
                dailyGrowth,
                userDistribution,
                eventDistribution,
                cumulativeUsers,
                socialStats,
                blockTypeStats
            ] = await Promise.all([
                AdminService.getDailyGrowth(days),
                AdminService.getUserStatusDistribution(),
                AdminService.getEventDistribution(),
                AdminService.getCumulativeUsers(30),
                AdminService.getSocialStats(),
                AdminService.getBlockTypeStats()
            ]);

            return {
                dailyGrowth,
                userDistribution,
                eventDistribution,
                cumulativeUsers,
                socialStats,
                blockTypeStats
            };
        }
    });
}

export function usePartners() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { handleError } = useAppError();

    const query = useQuery({
        queryKey: ['admin-partners'],
        queryFn: () => AdminService.getPartners()
    });

    const createMutation = useMutation({
        mutationFn: (data: PartnerFormData) => AdminService.createPartner(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
            queryClient.invalidateQueries({ queryKey: ['landing-partners'] });
            toast.success(t('admin.partners.created', 'Партнёр добавлен'));
        },
        onError: (error: Error) => {
            handleError(error);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: PartnerFormData }) =>
            AdminService.updatePartner(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
            queryClient.invalidateQueries({ queryKey: ['landing-partners'] });
            toast.success(t('admin.partners.updated', 'Партнёр обновлён'));
        },
        onError: (error: Error) => {
            handleError(error);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => AdminService.deletePartner(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
            queryClient.invalidateQueries({ queryKey: ['landing-partners'] });
            toast.success(t('admin.partners.deleted', 'Партнёр удалён'));
        },
        onError: (error: Error) => {
            handleError(error);
        }
    });

    return {
        partners: query.data,
        isLoading: query.isLoading,
        error: query.error,
        createPartner: createMutation.mutateAsync,
        updatePartner: updateMutation.mutateAsync,
        deletePartner: deleteMutation.mutateAsync,
        isPending: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
    };
}
