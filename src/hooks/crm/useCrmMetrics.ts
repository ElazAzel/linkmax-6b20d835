import { useQuery } from '@tanstack/react-query';
import { CrmService, type CrmMetrics } from '@/services/crm.service';
import { useAuth } from '@/hooks/user/useAuth';

export function useCrmMetrics() {
  const { user } = useAuth();

  return useQuery<CrmMetrics>({
    queryKey: ['crm-metrics', user?.id],
    queryFn: () => CrmService.getMetrics(user?.id || ''),
    enabled: !!user?.id,
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000,
  });
}
