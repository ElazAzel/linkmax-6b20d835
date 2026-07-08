import { describe, expect, it } from 'vitest';
import {
  aggregateFrictionZones,
  detectRageClickCluster,
  pruneRecentClicks,
  readRageClickClusters,
  type HeatmapClickSample,
  type RageClickCluster,
} from '../heatmap-model';

function click(overrides: Partial<HeatmapClickSample> = {}): HeatmapClickSample {
  return {
    x: 100,
    y: 240,
    viewportWidth: 400,
    viewportHeight: 800,
    pageHeight: 1600,
    timestamp: 1_000,
    ...overrides,
  };
}

describe('heatmap friction model', () => {
  it('detects repeated nearby clicks as one rage-click cluster', () => {
    const current = click({ x: 108, y: 246, timestamp: 1_900 });

    const cluster = detectRageClickCluster([
      click({ x: 100, y: 240, timestamp: 1_000 }),
      click({ x: 112, y: 250, timestamp: 1_500 }),
    ], current);

    expect(cluster).toEqual({
      x: 320 / 3,
      y: 736 / 3,
      relX: (320 / 3) / 400,
      relY: (736 / 3) / 1600,
      count: 3,
      windowMs: 900,
      timestamp: 1_900,
    });
  });

  it('does not flag clicks outside the time window or radius', () => {
    expect(detectRageClickCluster([
      click({ timestamp: 1 }),
      click({ timestamp: 2 }),
    ], click({ timestamp: 4_000 }))).toBeNull();

    expect(detectRageClickCluster([
      click({ x: 10, y: 10, timestamp: 1_000 }),
      click({ x: 20, y: 20, timestamp: 1_100 }),
    ], click({ x: 300, y: 300, timestamp: 1_200 }))).toBeNull();
  });

  it('keeps only recent click samples', () => {
    const result = pruneRecentClicks([
      click({ timestamp: 100 }),
      click({ timestamp: 900 }),
      click({ timestamp: 1_500 }),
    ], 2_000, 1_000);

    expect(result.map(sample => sample.timestamp)).toEqual([1_500]);
  });

  it('reads valid clusters and drops invalid payload entries', () => {
    const result = readRageClickClusters({
      clusters: [
        { x: 50, y: 80, relX: 0.2, relY: 0.4, count: 3, windowMs: 500, timestamp: 1_000 },
        { x: 'bad', y: 80, relX: 0.2, relY: 0.4, count: 3, windowMs: 500, timestamp: 1_000 },
      ],
    });

    expect(result).toEqual([
      { x: 50, y: 80, relX: 0.2, relY: 0.4, count: 3, windowMs: 500, timestamp: 1_000 },
    ]);
  });

  it('aggregates rage-click clusters into ranked friction zones', () => {
    const clusters: RageClickCluster[] = [
      { x: 50, y: 80, relX: 0.24, relY: 0.21, count: 3, windowMs: 500, timestamp: 1_000 },
      { x: 52, y: 85, relX: 0.245, relY: 0.215, count: 5, windowMs: 700, timestamp: 2_000 },
      { x: 300, y: 900, relX: 0.8, relY: 0.7, count: 4, windowMs: 600, timestamp: 3_000 },
    ];

    expect(aggregateFrictionZones(clusters)).toEqual([
      {
        x: 20,
        y: 20,
        relX: 0.24,
        relY: 0.21,
        count: 8,
        bursts: 2,
        averageBurstClicks: 4,
      },
      {
        x: 80,
        y: 70,
        relX: 0.8,
        relY: 0.7,
        count: 4,
        bursts: 1,
        averageBurstClicks: 4,
      },
    ]);
  });
});
