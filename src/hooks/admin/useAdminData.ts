import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminService, PartnerFormData } from '@/services/admin';
import { toast } from 'sonner';
import { useAppError } from '@/hooks/useAppError';
import { useTranslation } from 'react-i18next';

/**
 * Perf 2026-05-19: collapsed 6 parallel client-side aggregations
 * (each pulling raw rows from analytics/blocks/user_profiles) into
 * a single `get_admin_dashboard_aggregates` RPC. Results are cached
 * for 5 minutes to avoid re-fetch storms.
 */
export function useAdminStats(days = 14) {
    return useQuery({
        queryKey: ['admin-dashboard', days],
        queryFn: () => AdminService.getDashboardAggregates(days),
        staleTime: 5 * 60_000,
        gcTime: 10 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
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
