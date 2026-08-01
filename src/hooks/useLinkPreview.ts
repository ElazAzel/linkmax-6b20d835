import { useCallback, useState } from 'react';
import { callExternalApi, type LinkPreviewData } from '@/lib/integrations/external-api';

/** Fetch OpenGraph metadata for an arbitrary URL (microlink.io via external-api gateway). */
export function useLinkPreview() {
  const [preview, setPreview] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreview = useCallback(async (url: string): Promise<LinkPreviewData | null> => {
    if (!url?.trim()) return null;
    setLoading(true);
    setError(null);
    try {
      const data = await callExternalApi<LinkPreviewData>('link_preview', { url: url.trim() });
      setPreview(data);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'preview_failed');
      setPreview(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setPreview(null);
    setError(null);
  }, []);

  return { preview, loading, error, fetchPreview, reset };
}
