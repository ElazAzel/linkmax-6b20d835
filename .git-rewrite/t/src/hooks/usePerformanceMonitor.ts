import { useCallback, useRef } from 'react';

interface PerformanceEntry {
  name: string;
  duration: number;
  timestamp: number;
  type: 'query' | 'render' | 'action';
}

interface PerformanceStats {
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
  count: number;
}

const MAX_ENTRIES = 100;
const SLOW_THRESHOLD_MS = 500;

export function usePerformanceMonitor() {
  const entriesRef = useRef<PerformanceEntry[]>([]);

  const logEntry = useCallback((entry: PerformanceEntry) => {
    entriesRef.current.push(entry);
    
    // Keep only last MAX_ENTRIES
    if (entriesRef.current.length > MAX_ENTRIES) {
      entriesRef.current = entriesRef.current.slice(-MAX_ENTRIES);
    }

    // Log slow operations in development
    if (entry.duration > SLOW_THRESHOLD_MS) {
      console.warn(`[PERF] Slow ${entry.type}: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
    }
  }, []);

  const measureAsync = useCallback(async <T>(
    name: string,
    type: PerformanceEntry['type'],
    fn: () => Promise<T>
  ): Promise<T> => {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      logEntry({
        name,
        duration,
        timestamp: Date.now(),
        type
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      logEntry({
        name: `${name} (error)`,
        duration,
        timestamp: Date.now(),
        type
      });
      throw error;
    }
  }, [logEntry]);

  const measureSync = useCallback(<T>(
    name: string,
    type: PerformanceEntry['type'],
    fn: () => T
  ): T => {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      
      logEntry({
        name,
        duration,
        timestamp: Date.now(),
        type
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      logEntry({
        name: `${name} (error)`,
        duration,
        timestamp: Date.now(),
        type
      });
      throw error;
    }
  }, [logEntry]);

  const getStats = useCallback((filterType?: PerformanceEntry['type']): PerformanceStats => {
    const filtered = filterType 
      ? entriesRef.current.filter(e => e.type === filterType)
      : entriesRef.current;

    if (filtered.length === 0) {
      return { avgDuration: 0, maxDuration: 0, minDuration: 0, count: 0 };
    }

    const durations = filtered.map(e => e.duration);
    return {
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations),
      count: filtered.length
    };
  }, []);

  const getSlowOperations = useCallback((threshold = SLOW_THRESHOLD_MS): PerformanceEntry[] => {
    return entriesRef.current.filter(e => e.duration > threshold);
  }, []);

  const getRecentEntries = useCallback((count = 20): PerformanceEntry[] => {
    return entriesRef.current.slice(-count);
  }, []);

  const clearEntries = useCallback(() => {
    entriesRef.current = [];
  }, []);

  const toggleMonitoring = useCallback((enabled: boolean) => {
    localStorage.setItem('linkmax_perf_monitor', String(enabled));
  }, []);

  return {
    measureAsync,
    measureSync,
    getStats,
    getSlowOperations,
    getRecentEntries,
    clearEntries,
    toggleMonitoring,
    isEnabled: () => localStorage.getItem('linkmax_perf_monitor') === 'true'
  };
}

// Standalone utility for non-hook contexts
export const perfMonitor = {
  start: (name: string) => {
    const start = performance.now();
    return {
      end: () => {
        const duration = performance.now() - start;
        if (duration > SLOW_THRESHOLD_MS) {
          console.warn(`[PERF] Slow operation: ${name} took ${duration.toFixed(2)}ms`);
        }
        return duration;
      }
    };
  },
  
  wrap: async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    const timer = perfMonitor.start(name);
    try {
      return await fn();
    } finally {
      timer.end();
    }
  }
};
