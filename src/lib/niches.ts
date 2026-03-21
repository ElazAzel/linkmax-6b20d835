// Narrowed niches for Expert-First GTM Strategy
export const NICHES = [
  'expert',      // Coaches, consultants, freelancers (Primary)
  'education',   // Teachers, tutors, courses
  'business',    // Business, consulting, B2B services
  'fitness',     // Fitness, sports, health coaches
  'health',      // Psychology, wellness, therapy
  'beauty',      // Beauty experts, makeup artists
  'art',         // Digital creators, designers
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
};

// Get translated niche label
export function getNicheLabel(niche: Niche, t: (key: string, fallback?: string) => string): string {
  return t(`niches.${niche}`, niche);
}
