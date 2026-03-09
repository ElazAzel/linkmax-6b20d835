/**
 * Canonical service resolution layer.
 * 
 * ALL service child page resolution MUST go through this module.
 * Resolution flow: routeSlug → service_slugs[itemId].slug → itemId → pricing item
 * 
 * Title-derived slugification is NEVER used for lookup.
 */

/** Shape of a single entry in the id-keyed service_slugs JSONB */
export interface ServiceSlugEntry {
  slug: string;
  state: 'active' | 'thin' | 'removed';
  title: string;
}

/** The service_slugs JSONB: { [itemId: string]: ServiceSlugEntry } */
export type ServiceSlugsMap = Record<string, ServiceSlugEntry>;

export interface ServiceResolution {
  found: boolean;
  itemId?: string;
  slug?: string;
  state?: 'active' | 'thin' | 'removed';
  title?: string;
  pricingItem?: {
    name: string;
    description?: string;
    price?: number;
    currency?: string;
    duration?: number;
    serviceType?: string;
  };
  notFoundReason?: 'no_mapping' | 'item_missing' | 'removed' | 'parent_unpublished';
}

/**
 * Find the service_slugs entry that matches a given route slug.
 * Returns [itemId, entry] or null.
 */
function findEntryBySlug(
  serviceSlugs: ServiceSlugsMap,
  routeSlug: string
): [string, ServiceSlugEntry] | null {
  for (const [itemId, entry] of Object.entries(serviceSlugs)) {
    if (entry && typeof entry === 'object' && entry.slug === routeSlug) {
      return [itemId, entry];
    }
  }
  return null;
}

/**
 * Extract the i18n name from a pricing item.
 * Handles both string and multilingual { ru, en, kk } shapes.
 */
function extractName(nameField: unknown): string {
  if (!nameField) return '';
  if (typeof nameField === 'string') return nameField;
  if (typeof nameField === 'object') {
    const obj = nameField as Record<string, string>;
    return obj.ru || obj.en || obj.kk || Object.values(obj).find(v => typeof v === 'string' && v.length > 0) || '';
  }
  return String(nameField);
}

function extractDescription(descField: unknown): string | undefined {
  if (!descField) return undefined;
  if (typeof descField === 'string') return descField || undefined;
  if (typeof descField === 'object') {
    const obj = descField as Record<string, string>;
    return obj.ru || obj.en || obj.kk || undefined;
  }
  return undefined;
}

/**
 * Primary resolution: resolve a service child page by route slug.
 * 
 * @param serviceSlugs - The page's service_slugs JSONB (id-keyed format)
 * @param pricingItems - Array of pricing items from blocks
 * @param routeSlug - The slug from the URL path
 */
export function resolveServiceBySlug(
  serviceSlugs: ServiceSlugsMap | null | undefined,
  pricingItems: Array<Record<string, unknown>>,
  routeSlug: string
): ServiceResolution {
  // 1. Try canonical id-keyed resolution
  if (serviceSlugs && typeof serviceSlugs === 'object') {
    const match = findEntryBySlug(serviceSlugs, routeSlug);
    if (match) {
      const [itemId, entry] = match;

      // Handle removed state
      if (entry.state === 'removed') {
        return { found: false, itemId, slug: entry.slug, state: 'removed', title: entry.title, notFoundReason: 'removed' };
      }

      // Find the pricing item by id
      const item = pricingItems.find(i => i.id === itemId);
      if (item) {
        return {
          found: true,
          itemId,
          slug: entry.slug,
          state: entry.state,
          title: extractName(item.name),
          pricingItem: {
            name: extractName(item.name),
            description: extractDescription(item.description),
            price: item.price != null ? Number(item.price) : undefined,
            currency: item.currency ? String(item.currency) : 'KZT',
            duration: item.duration != null ? Number(item.duration) : undefined,
            serviceType: item.serviceType ? String(item.serviceType) : undefined,
          },
        };
      }

      // P2.8: Orphan — mapping exists but item is gone. This is a broken state, NOT a valid page.
      return {
        found: false,
        itemId,
        slug: entry.slug,
        state: entry.state,
        title: entry.title,
        notFoundReason: 'item_missing',
      };
    }
  }

  // 2. Legacy fallback: for pages not yet re-saved after P2.6 migration.
  //    Try matching by slugifying item names (TEMPORARY — remove after batch backfill).
  for (const item of pricingItems) {
    const name = extractName(item.name);
    if (!name) continue;
    const itemSlug = name
      .toLowerCase()
      .replace(/[^a-zа-яёәіңғүұқөһ0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 60);
    if (itemSlug === routeSlug) {
      console.warn(`[service-resolver] Legacy fallback used for slug "${routeSlug}". Page needs re-save.`);
      return {
        found: true,
        itemId: item.id ? String(item.id) : undefined,
        slug: routeSlug,
        state: 'active', // assume active for legacy
        title: name,
        pricingItem: {
          name,
          description: extractDescription(item.description),
          price: item.price != null ? Number(item.price) : undefined,
          currency: item.currency ? String(item.currency) : 'KZT',
        },
      };
    }
  }

  // 3. Not found
  return { found: false, notFoundReason: 'no_mapping' };
}

/**
 * Get all active service slugs for sitemap/link generation.
 */
export function getActiveServiceSlugs(serviceSlugs: ServiceSlugsMap | null | undefined): Array<{ itemId: string; slug: string; title: string }> {
  if (!serviceSlugs || typeof serviceSlugs !== 'object') return [];
  return Object.entries(serviceSlugs)
    .filter(([, entry]) => entry && typeof entry === 'object' && entry.state === 'active')
    .map(([itemId, entry]) => ({ itemId, slug: entry.slug, title: entry.title }));
}
