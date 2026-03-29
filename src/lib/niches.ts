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

export const ONBOARDING_GOALS = [
  'leads',   // Get more leads
  'sales',   // Sell products/services
  'brand',   // Personal brand/Business card
  'events',  // Events & Registration
] as const;

export type OnboardingGoal = typeof ONBOARDING_GOALS[number];

export const GOAL_ICONS: Record<OnboardingGoal, string> = {
  leads: '🎯',
  sales: '💰',
  brand: '👤',
  events: '🎫',
};

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
