import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { subDays } from 'date-fns';

export interface ClickPoint {
  x: number;
  y: number;
  relX: number;
  relY: number;
  count: number;
}

export interface ScrollDepthData {
  depth: number;
  count: number;
  percentage: number;
}

export interface HeatmapData {
  clicks: ClickPoint[];
  scrollDepths: ScrollDepthData[];
  totalSessions: number;
  avgScrollDepth: number;
  maxScrollDepth: number;
}

export function useHeatmapData(days: number = 30) {
  const { user } = useAuth();
  const [pageId, setPageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<HeatmapData | null>(null);

  // Fetch user's page ID
  useEffect(() => {
    async function fetchPageId() {
      if (!user) return;
      
      const { data } = await supabase
        .from('pages')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setPageId(data.id);
      }
    }
    
    fetchPageId();
  }, [user]);

  const fetchHeatmapData = useCallback(async () => {
    if (!user || !pageId) return;

    try {
      setLoading(true);
      const startDate = subDays(new Date(), days);

      // Fetch heatmap click events
      const { data: clickEvents } = await supabase
        .from('analytics')
        .select('metadata')
        .eq('page_id', pageId)
        .eq('event_type', 'heatmap_clicks')
        .gte('created_at', startDate.toISOString());

      // Fetch scroll depth events
      const { data: scrollEvents } = await supabase
        .from('analytics')
        .select('metadata')
        .eq('page_id', pageId)
        .eq('event_type', 'heatmap_scroll')
        .gte('created_at', startDate.toISOString());

      // Process click data - aggregate by grid cells
      const clickGrid = new Map<string, ClickPoint>();
      const gridSize = 50; // 50px grid cells

      (clickEvents || []).forEach(event => {
        const meta = event.metadata as Record<string, unknown>;
        const clicks = meta?.clicks as Array<{
          x: number;
          y: number;
          relX: number;
          relY: number;
        }> | undefined;
        
        clicks?.forEach(click => {
          // Normalize to grid cell
          const gridX = Math.floor((click.relX * 100) / (100 / 20)); // 20 columns
          const gridY = Math.floor((click.relY * 100) / (100 / 50)); // 50 rows
          const key = `${gridX},${gridY}`;
          
          const existing = clickGrid.get(key);
          if (existing) {
            existing.count++;
          } else {
            clickGrid.set(key, {
              x: gridX * 5, // Convert back to percentage (20 cols = 5% each)
              y: gridY * 2, // Convert back to percentage (50 rows = 2% each)
              relX: click.relX,
              relY: click.relY,
              count: 1,
            });
          }
        });
      });

      // Process scroll depth data - create histogram
      const scrollDepthCounts = new Map<number, number>();
      let totalScrollDepth = 0;
      let maxScrollDepth = 0;

      (scrollEvents || []).forEach(event => {
        const meta = event.metadata as Record<string, unknown>;
        const depth = (meta?.maxDepth as number) || 0;
        
        // Round to nearest 10%
        const bucket = Math.floor(depth / 10) * 10;
        scrollDepthCounts.set(bucket, (scrollDepthCounts.get(bucket) || 0) + 1);
        
        totalScrollDepth += depth;
        maxScrollDepth = Math.max(maxScrollDepth, depth);
      });

      const totalScrollSessions = scrollEvents?.length || 1;
      const scrollDepths: ScrollDepthData[] = [];
      
      // Build cumulative scroll depth data
      for (let depth = 0; depth <= 100; depth += 10) {
        // Count sessions that reached at least this depth
        let reachedCount = 0;
        scrollDepthCounts.forEach((count, d) => {
          if (d >= depth) reachedCount += count;
        });
        
        scrollDepths.push({
          depth,
          count: reachedCount,
          percentage: totalScrollSessions > 0 
            ? Math.round((reachedCount / totalScrollSessions) * 100) 
            : 0,
        });
      }

      setData({
        clicks: Array.from(clickGrid.values()).sort((a, b) => b.count - a.count),
        scrollDepths,
        totalSessions: totalScrollSessions,
        avgScrollDepth: totalScrollSessions > 0 
          ? Math.round(totalScrollDepth / totalScrollSessions) 
          : 0,
        maxScrollDepth,
      });
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, pageId, days]);

  useEffect(() => {
    if (pageId) {
      fetchHeatmapData();
    }
  }, [fetchHeatmapData, pageId]);

  return {
    data,
    loading,
    refresh: fetchHeatmapData,
  };
}
