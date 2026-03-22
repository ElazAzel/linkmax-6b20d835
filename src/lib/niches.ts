// Full niche list used across onboarding, gallery, and experts
export const NICHES = [
  'expert',      // Coaches, consultants, freelancers (Primary)
  'education',   // Teachers, tutors, courses
  'business',    // Business, consulting, B2B services
  'fitness',     // Fitness, sports, health coaches
  'health',      // Psychology, wellness, therapy
  'beauty',      // Beauty experts, makeup artists
  'art',         // Digital creators, designers
  'food',        // Chefs, food bloggers
  'music',       // Musicians, DJs
  'tech',        // Tech experts, developers
  'fashion',     // Fashion, stylists
  'travel',      // Travel bloggers, guides
  'realestate',  // Real estate agents
  'events',      // Event planners
  'services',    // General services
  'other',       // Other / custom
] as const;

export type Niche = typeof NICHES[number];

// Niche icons mapping
export const NICHE_ICONS: Record<Niche, string> = {
  expert: '🚀',
  education: '📚',
  business: '💼',
  fitness: '💪',
  health: '🏥',
  beauty: '💄',
  art: '🎨',
  food: '🍳',
  music: '🎵',
  tech: '💻',
  fashion: '👗',
  travel: '✈️',
  realestate: '🏠',
  events: '🎉',
  services: '🔧',
  other: '⚡',
};

// Get translated niche label
export function getNicheLabel(niche: Niche, t: (key: string, fallback?: string) => string): string {
  return t(`niches.${niche}`, niche);
}
