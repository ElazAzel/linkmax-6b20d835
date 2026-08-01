import { useCallback, useState } from 'react';
import { callExternalApi, type StockPhoto } from '@/lib/integrations/external-api';

interface StockPhotoResponse {
  photos: StockPhoto[];
  providers: string[];
  unavailable?: boolean;
}

/** Free stock photo search (Unsplash + Pexels) through the external-api gateway. */
export function useStockPhotos() {
  const [photos, setPhotos] = useState<StockPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, page = 1) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setPhotos([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await callExternalApi<StockPhotoResponse>('stock_photos', {
        query: trimmed,
        page,
      });
      setUnavailable(Boolean(res.unavailable));
      setPhotos(res.photos ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'search_failed');
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { photos, loading, unavailable, error, search };
}
