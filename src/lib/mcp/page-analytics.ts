import { textIn } from "./languages";

/**
 * Page analytics computed the same way as the dashboard
 * (src/hooks/analytics/usePageAnalytics.ts): page views exclude block
 * impressions, clicks match a block by DB id or by content id.
 */
export interface AnalyticsRow {
  event_type: string;
  block_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface BlockRow {
  id: string;
  type: string;
  content: Record<string, unknown> | null;
}

export interface BlockPerformance {
  block_id: string;
  type: string;
  label: string;
  clicks: number;
  impressions: number;
  ctr_percent: number | null;
}

export interface PageAnalytics {
  window_days: number;
  views: number;
  unique_visitors: number;
  clicks: number;
  shares: number;
  leads: number;
  click_through_percent: number;
  lead_conversion_percent: number;
  change_vs_previous: { views_percent: number | null; clicks_percent: number | null };
  blocks: BlockPerformance[];
  sources: Array<{ source: string; views: number }>;
  devices: Record<string, number>;
  countries: Array<{ country: string; views: number }>;
  daily: Array<{ date: string; views: number; clicks: number }>;
  sampled: boolean;
}

function meta(row: AnalyticsRow, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = row.metadata?.[key];
    if (typeof value === "string" && value) return value;
  }
  return undefined;
}

const isImpression = (row: AnalyticsRow) => row.metadata?.isBlockImpression === true || row.metadata?.isBlockImpression === "true";
const isPageView = (row: AnalyticsRow) => row.event_type === "view" && !isImpression(row);

function percent(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0;
}

function change(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function top(map: Map<string, number>, limit: number): Array<[string, number]> {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

function blockLabel(block: BlockRow): string {
  const c = block.content ?? {};
  const raw = c.title ?? c.name ?? c.content ?? c.buttonText;
  const text = textIn(raw, "ru").replace(/\s+/g, " ").trim();
  return text ? text.slice(0, 60) : block.type;
}

export function summarizePageAnalytics(input: {
  days: number;
  events: AnalyticsRow[];
  previous: AnalyticsRow[];
  blocks: BlockRow[];
  leads: number;
  sampled: boolean;
}): PageAnalytics {
  const { events, previous, blocks, days } = input;
  const views = events.filter(isPageView);
  const clicks = events.filter((e) => e.event_type === "click");
  const visitors = new Set(views.map((e) => meta(e, "visitorId", "visitor_id")).filter(Boolean));

  const perBlock = new Map<string, BlockPerformance>();
  const stats: BlockPerformance[] = blocks.map((block) => {
    const entry: BlockPerformance = { block_id: String(block.content?.id ?? block.id), type: block.type, label: blockLabel(block), clicks: 0, impressions: 0, ctr_percent: null };
    perBlock.set(block.id, entry);
    if (typeof block.content?.id === "string") perBlock.set(block.content.id, entry);
    return entry;
  });
  for (const row of clicks) {
    const ref = row.block_id ?? meta(row, "blockId", "block_id");
    const entry = ref ? perBlock.get(ref) : undefined;
    if (entry) entry.clicks += 1;
  }
  for (const row of events.filter(isImpression)) {
    const ref = row.block_id ?? meta(row, "blockId", "block_id");
    const entry = ref ? perBlock.get(ref) : undefined;
    if (entry) entry.impressions += 1;
  }
  for (const entry of stats) entry.ctr_percent = entry.impressions > 0 ? percent(entry.clicks, entry.impressions) : null;

  const sources = new Map<string, number>();
  const devices = new Map<string, number>();
  const countries = new Map<string, number>();
  for (const row of views) {
    const source = meta(row, "source", "referrer_source") ?? "direct";
    sources.set(source, (sources.get(source) ?? 0) + 1);
    const device = meta(row, "device", "device_type") ?? "unknown";
    devices.set(device, (devices.get(device) ?? 0) + 1);
    const country = meta(row, "countryName", "country_name", "country", "country_code") ?? "unknown";
    countries.set(country, (countries.get(country) ?? 0) + 1);
  }

  const daily = new Map<string, { views: number; clicks: number }>();
  for (let i = days - 1; i >= 0; i -= 1) {
    daily.set(new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10), { views: 0, clicks: 0 });
  }
  for (const row of events) {
    const day = daily.get(row.created_at.slice(0, 10));
    if (!day) continue;
    if (isPageView(row)) day.views += 1;
    else if (row.event_type === "click") day.clicks += 1;
  }

  return {
    window_days: days,
    views: views.length,
    unique_visitors: visitors.size,
    clicks: clicks.length,
    shares: events.filter((e) => e.event_type === "share").length,
    leads: input.leads,
    click_through_percent: percent(clicks.length, views.length),
    lead_conversion_percent: percent(input.leads, visitors.size || views.length),
    change_vs_previous: {
      views_percent: change(views.length, previous.filter(isPageView).length),
      clicks_percent: change(clicks.length, previous.filter((e) => e.event_type === "click").length),
    },
    blocks: stats.sort((a, b) => b.clicks - a.clicks),
    sources: top(sources, 8).map(([source, count]) => ({ source, views: count })),
    devices: Object.fromEntries(devices),
    countries: top(countries, 8).map(([country, count]) => ({ country, views: count })),
    daily: [...daily.entries()].map(([date, v]) => ({ date, ...v })),
    sampled: input.sampled,
  };
}
