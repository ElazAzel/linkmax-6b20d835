export interface HeatmapClickSample {
  x: number;
  y: number;
  viewportWidth: number;
  viewportHeight: number;
  pageHeight: number;
  timestamp: number;
}

export interface RageClickCluster {
  x: number;
  y: number;
  relX: number;
  relY: number;
  count: number;
  windowMs: number;
  timestamp: number;
}

export interface FrictionZone {
  x: number;
  y: number;
  relX: number;
  relY: number;
  count: number;
  bursts: number;
  averageBurstClicks: number;
}

export interface RageClickDetectionOptions {
  radiusPx?: number;
  windowMs?: number;
  minClicks?: number;
}

const DEFAULT_RAGE_RADIUS_PX = 48;
const DEFAULT_RAGE_WINDOW_MS = 2200;
const DEFAULT_RAGE_MIN_CLICKS = 3;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function clampRatio(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function distancePx(a: Pick<HeatmapClickSample, 'x' | 'y'>, b: Pick<HeatmapClickSample, 'x' | 'y'>): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function pruneRecentClicks(
  clicks: HeatmapClickSample[],
  now: number,
  windowMs: number = DEFAULT_RAGE_WINDOW_MS
): HeatmapClickSample[] {
  return clicks.filter((click) => now - click.timestamp <= windowMs);
}

export function detectRageClickCluster(
  recentClicks: HeatmapClickSample[],
  currentClick: HeatmapClickSample,
  options: RageClickDetectionOptions = {}
): RageClickCluster | null {
  const radiusPx = options.radiusPx ?? DEFAULT_RAGE_RADIUS_PX;
  const windowMs = options.windowMs ?? DEFAULT_RAGE_WINDOW_MS;
  const minClicks = options.minClicks ?? DEFAULT_RAGE_MIN_CLICKS;

  const candidates = pruneRecentClicks([...recentClicks, currentClick], currentClick.timestamp, windowMs)
    .filter((click) => distancePx(click, currentClick) <= radiusPx);

  if (candidates.length < minClicks) {
    return null;
  }

  const count = candidates.length;
  const sum = candidates.reduce(
    (acc, click) => ({
      x: acc.x + click.x,
      y: acc.y + click.y,
      timestampMin: Math.min(acc.timestampMin, click.timestamp),
      timestampMax: Math.max(acc.timestampMax, click.timestamp),
    }),
    {
      x: 0,
      y: 0,
      timestampMin: currentClick.timestamp,
      timestampMax: currentClick.timestamp,
    }
  );

  const x = sum.x / count;
  const y = sum.y / count;

  return {
    x,
    y,
    relX: currentClick.viewportWidth > 0 ? clampRatio(x / currentClick.viewportWidth) : 0,
    relY: currentClick.pageHeight > 0 ? clampRatio(y / currentClick.pageHeight) : 0,
    count,
    windowMs: sum.timestampMax - sum.timestampMin,
    timestamp: currentClick.timestamp,
  };
}

export function readRageClickClusters(metadata: unknown): RageClickCluster[] {
  if (!metadata || typeof metadata !== 'object') {
    return [];
  }

  const clusters = (metadata as { clusters?: unknown }).clusters;
  if (!Array.isArray(clusters)) {
    return [];
  }

  return clusters.flatMap((cluster) => {
    if (!cluster || typeof cluster !== 'object') {
      return [];
    }

    const value = cluster as Record<string, unknown>;
    const x = value.x;
    const y = value.y;
    const relX = value.relX;
    const relY = value.relY;
    const count = value.count;
    const windowMs = value.windowMs;
    const timestamp = value.timestamp;

    if (
      !isFiniteNumber(x) ||
      !isFiniteNumber(y) ||
      !isFiniteNumber(relX) ||
      !isFiniteNumber(relY) ||
      !isFiniteNumber(count) ||
      !isFiniteNumber(windowMs) ||
      !isFiniteNumber(timestamp)
    ) {
      return [];
    }

    return [{
      x,
      y,
      relX: clampRatio(relX),
      relY: clampRatio(relY),
      count,
      windowMs,
      timestamp,
    }];
  });
}

export function aggregateFrictionZones(clusters: RageClickCluster[]): FrictionZone[] {
  const zones = new Map<string, FrictionZone>();

  for (const cluster of clusters) {
    const gridX = Math.floor(cluster.relX * 20);
    const gridY = Math.floor(cluster.relY * 50);
    const key = `${gridX},${gridY}`;
    const existing = zones.get(key);

    if (existing) {
      const nextBursts = existing.bursts + 1;
      const nextCount = existing.count + cluster.count;
      zones.set(key, {
        ...existing,
        count: nextCount,
        bursts: nextBursts,
        averageBurstClicks: Math.round((nextCount / nextBursts) * 10) / 10,
      });
    } else {
      zones.set(key, {
        x: gridX * 5,
        y: gridY * 2,
        relX: cluster.relX,
        relY: cluster.relY,
        count: cluster.count,
        bursts: 1,
        averageBurstClicks: cluster.count,
      });
    }
  }

  return Array.from(zones.values()).sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return b.bursts - a.bursts;
  });
}
