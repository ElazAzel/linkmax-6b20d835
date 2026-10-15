import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/user/useAuth';
import { loadOfficeBookings } from '@/services/digital-office';

export function useDigitalOffice() {
  const { user } = useAuth();
  return useQuery({
    // Existing lifecycle mutations invalidate the bookings prefix.
    queryKey: ['bookings', 'digital-office', user?.id ?? ''],
    enabled: Boolean(user?.id),
    queryFn: ({ signal }) => loadOfficeBookings(user!.id, signal),
    staleTime: 30_000,
    refetchInterval: (query) => query.state.error?.message === 'feature_unavailable' ? false : 60_000,
    retry: (attempt, error) => error.message !== 'feature_unavailable' && attempt < 1,
  });
}
