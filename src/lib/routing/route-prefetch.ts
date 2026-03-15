const routeImporters = {
  dashboard: () => import('@/pages/DashboardV2'),
  editor: () => import('@/components/dashboard-v2/screens/EditorScreen'),
  publicPage: () => import('@/pages/PublicPage'),
  auth: () => import('@/pages/Auth'),
  pricing: () => import('@/pages/Pricing'),
  gallery: () => import('@/pages/Gallery'),
} as const;

export type RouteChunkKey = keyof typeof routeImporters;

const prefetched = new Set<RouteChunkKey>();

export function prefetchRouteChunk(key: RouteChunkKey): void {
  if (prefetched.has(key)) return;
  prefetched.add(key);

  void routeImporters[key]().catch(() => {
    prefetched.delete(key);
  });
}

export function prefetchRouteChunks(keys: RouteChunkKey[]): void {
  keys.forEach(prefetchRouteChunk);
}
