import { useCallback, useEffect, useRef } from 'react';

// Web Vitals types
interface WebVitalsMetric {
  name: 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
}

// Thresholds for Web Vitals ratings
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

function getRating(name: WebVitalsMetric['name'], value: number): WebVitalsMetric['rating'] {
  const threshold = THRESHOLDS[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

export function useWebVitals(onReport?: (metric: WebVitalsMetric) => void) {
  const metricsRef = useRef<Map<string, WebVitalsMetric>>(new Map());
  
  const reportMetric = useCallback((metric: WebVitalsMetric) => {
    metricsRef.current.set(metric.name, metric);
    
    // Log in development
    if (import.meta.env.DEV) {
      const emoji = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
      console.log(`[WebVitals] ${emoji} ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`);
    }
    
    onReport?.(metric);
  }, [onReport]);

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
      if (lastEntry) {
        reportMetric({
          name: 'LCP',
          value: lastEntry.startTime,
          rating: getRating('LCP', lastEntry.startTime),
          delta: lastEntry.startTime,
        });
      }
    });
    
    try {
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      // Browser doesn't support this observer
    }

    // First Input Delay / Interaction to Next Paint
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const fidEntry = entry as PerformanceEntry & { processingStart: number; startTime: number };
        const value = fidEntry.processingStart - fidEntry.startTime;
        reportMetric({
          name: 'FID',
          value,
          rating: getRating('FID', value),
          delta: value,
        });
      });
    });
    
    try {
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch {
      // Browser doesn't support this observer
    }

    // Cumulative Layout Shift
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const layoutShiftEntry = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
        if (!layoutShiftEntry.hadRecentInput) {
          clsValue += layoutShiftEntry.value;
        }
      });
      reportMetric({
        name: 'CLS',
        value: clsValue,
        rating: getRating('CLS', clsValue),
        delta: clsValue,
      });
    });
    
    try {
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch {
      // Browser doesn't support this observer
    }

    // Time to First Byte
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (navEntry) {
      const ttfb = navEntry.responseStart - navEntry.requestStart;
      reportMetric({
        name: 'TTFB',
        value: ttfb,
        rating: getRating('TTFB', ttfb),
        delta: ttfb,
      });
    }

    return () => {
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
    };
  }, [reportMetric]);

  const getMetrics = useCallback(() => {
    return Object.fromEntries(metricsRef.current);
  }, []);

  return { getMetrics };
}
