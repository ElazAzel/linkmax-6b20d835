// 15 generalized niches for page categorization
export const NICHES = [
  'beauty',      // Beauty, cosmetics, skincare
  'fitness',     // Fitness, sports, health
  'food',        // Restaurants, cafes, chefs, food
  'education',   // Teachers, tutors, courses
  'art',         // Artists, designers, photographers
  'music',       // Musicians, DJs, producers
  'tech',        // IT, developers, tech services
  'business',    // Business, consulting, coaching
  'health',      // Medicine, psychology, wellness
  'fashion',     // Fashion, style, clothing
  'travel',      // Travel, tourism, guides
  'realestate',  // Real estate, property
  'events',      // Events, weddings, entertainment
  'services',    // General services, handyman
  'other',       // Other / uncategorized
] as const;

export type Niche = typeof NICHES[number];

// Niche icons mapping (using emoji for simplicity)
export const NICHE_ICONS: Record<Niche, string> = {
  beauty: '💄',
  fitness: '💪',
  food: '🍽️',
  education: '📚',
  art: '🎨',
  music: '🎵',
  tech: '💻',
  business: '💼',
  health: '🏥',
  fashion: '👗',
  travel: '✈️',
  realestate: '🏠',
  events: '🎉',
  services: '🔧',
  other: '📌',
};

// Get translated niche label
export function getNicheLabel(niche: Niche, t: (key: string, fallback?: string) => string): string {
  return t(`niches.${niche}`, niche);
}
