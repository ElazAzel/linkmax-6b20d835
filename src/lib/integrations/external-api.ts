import { supabase } from '@/platform/supabase/client';

export type ExternalApiAction =
  | 'stock_photos'
  | 'link_preview'
  | 'screenshot'
  | 'holidays'
  | 'countries'
  | 'geo_ip';

/**
 * Calls the `external-api` edge gateway (proxy for curated free public APIs).
 * Never call third-party APIs directly from the browser — keys live server-side.
 */
export async function callExternalApi<T>(
  action: ExternalApiAction,
  payload: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await supabase.functions.invoke('external-api', {
    body: { action, ...payload },
  });

  if (error) {
    let details = error.message;
    const ctx = (error as { context?: { text?: () => Promise<string> } }).context;
    if (ctx?.text) {
      try {
        details = await ctx.text();
      } catch {
        /* keep original message */
      }
    }
    throw new Error(details);
  }

  return data as T;
}

export interface StockPhoto {
  id: string;
  url: string;
  thumb: string;
  width: number;
  height: number;
  author: string;
  authorUrl: string;
  provider: 'unsplash' | 'pexels';
}

export interface LinkPreviewData {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  logo: string | null;
  publisher: string | null;
  color: string | null;
}
