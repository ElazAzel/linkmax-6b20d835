import { useState, useEffect, useCallback } from 'react';
import { getLeaderboardPages, type GalleryPage, type LeaderboardPeriod } from '@/services/gallery';

export function useLeaderboard(initialPeriod: LeaderboardPeriod = 'week') {
  const [pages, setPages] = useState<GalleryPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<LeaderboardPeriod>(initialPeriod);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLeaderboardPages(period);
      setPages(data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return { pages, loading, period, setPeriod, refetch: fetchLeaderboard };
}
