import { useCallback, useEffect, useRef } from 'react';
import { onLCP, onCLS, onINP, onTTFB, type Metric } from 'web-vitals';
import { logger } from '@/lib/utils/logger';

// Web Vitals types (kept for backward compatibility)
export interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
}

const isDev = import.meta.env.DEV;

/**
 * Convert a web-vitals Metric to our internal format
 */
function toWebVitalsMetric(metric: Metric): WebVitalsMetric {
  return {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
  };
}

/**
 * Send a metric to Sentry as a custom measurement (lazy-loaded)
 */
function reportToSentry(metric: Metric): void {
  import('@/lib/utils/sentry').then(({ Sentry, isSentryEnabled }) => {
    if (!isSentryEnabled) return;
    const unit = metric.name === 'CLS' ? '' : 'millisecond';
    Sentry.setMeasurement(
      `web_vitals.${metric.name.toLowerCase()}`,
      metric.value,
      unit
    );
  });
}

/**
 * Hook to monitor Core Web Vitals using the official `web-vitals` library.
 * 
 * - In development: logs metrics to console with color-coded ratings
 * - In production (with Sentry): sends metrics to Sentry as custom measurements
 * 
 * @see https://web.dev/articles/vitals
 */
export function useWebVitals(onReport?: (metric: WebVitalsMetric) => void) {
  const metricsRef = useRef<Map<string, WebVitalsMetric>>(new Map());

  const handleMetric = useCallback((metric: Metric) => {
    const converted = toWebVitalsMetric(metric);
    metricsRef.current.set(converted.name, converted);

    // Log in development
    if (isDev) {
      const emoji = converted.rating === 'good' ? '🟢' : converted.rating === 'needs-improvement' ? '🟡' : '🔴';
      logger.debug(`[WebVitals] ${emoji} ${converted.name}: ${converted.value.toFixed(2)} (${converted.rating})`, {
        context: 'useWebVitals',
        data: converted,
      });
    }

    // Send to Sentry in production
    reportToSentry(metric);

    // Call external reporter if provided
    onReport?.(converted);
  }, [onReport]);

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Register all Core Web Vitals using the official library
    onLCP(handleMetric);
    onCLS(handleMetric);
    onINP(handleMetric);
    onTTFB(handleMetric);

    // web-vitals library manages its own observers, no manual cleanup needed
  }, [handleMetric]);

  const getMetrics = useCallback(() => {
    return Object.fromEntries(metricsRef.current);
  }, []);

  return { getMetrics };
}
