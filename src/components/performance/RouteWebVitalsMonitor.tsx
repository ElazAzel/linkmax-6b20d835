import { useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { logger } from '@/lib/utils/logger';

interface MetricEnvelope {
  metric: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  route: string;
  ts: number;
  [key: string]: unknown;
}

const STORAGE_KEY = 'lnkmx_route_vitals';
const ALERT_COOLDOWN_MS = 60_000;

function readHistory(): MetricEnvelope[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MetricEnvelope[];
  } catch {
    return [];
  }
}

function pushHistory(next: MetricEnvelope): MetricEnvelope[] {
  const history = [...readHistory(), next].slice(-120);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return history;
}

function isDegraded(history: MetricEnvelope[], sample: MetricEnvelope): boolean {
  const recent = history
    .filter((item) => item.route === sample.route && item.metric === sample.metric)
    .slice(-4);

  if (recent.length < 3) return false;
  return recent.filter((item) => item.rating === 'poor').length >= 3;
}

export function RouteWebVitalsMonitor() {
  const location = useLocation();
  const routeRef = useRef(`${location.pathname}${location.search}`);
  const lastAlertRef = useRef<Record<string, number>>({});

  const routeKey = useMemo(() => `${location.pathname}${location.search}`, [location.pathname, location.search]);

  useEffect(() => {
    routeRef.current = routeKey;
  }, [routeKey]);

  useEffect(() => {
    let cancelled = false;

    void import('web-vitals').then(({ onCLS, onINP, onLCP, onTTFB }) => {
      if (cancelled) return;

      const handler = (metric: { name: string; value: number; rating: 'good' | 'needs-improvement' | 'poor'; delta: number }) => {
        const sample: MetricEnvelope = {
          metric: metric.name,
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          route: routeRef.current,
          ts: Date.now(),
        };

        const history = pushHistory(sample);

        logger.debug(`[RouteVitals] ${sample.metric}=${sample.value.toFixed(2)} (${sample.rating})`, {
          context: 'RouteWebVitalsMonitor',
          data: sample,
        });

        if (!isDegraded(history, sample)) return;

        const alertKey = `${sample.route}:${sample.metric}`;
        const now = Date.now();
        if (now - (lastAlertRef.current[alertKey] ?? 0) < ALERT_COOLDOWN_MS) {
          return;
        }

        lastAlertRef.current[alertKey] = now;

        logger.warn(`[RouteVitals][DEGRADATION] ${sample.metric} degraded on ${sample.route}`, {
          context: 'RouteWebVitalsMonitor',
          data: sample,
        });

        void import('@/lib/utils/sentry').then(({ Sentry, isSentryEnabled }) => {
          if (!isSentryEnabled) return;
          Sentry.captureMessage(`Route vitals degradation: ${sample.metric} on ${sample.route}`, {
            level: 'warning',
            tags: {
              route: sample.route,
              metric: sample.metric,
            },
            extra: sample,
          });
        });
      };

      onLCP(handler);
      onCLS(handler);
      onINP(handler);
      onTTFB(handler);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
