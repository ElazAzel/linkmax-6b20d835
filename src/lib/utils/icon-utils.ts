import type { ComponentType } from 'react';
import { icons as lucideIcons, type LucideProps } from 'lucide-react';
import {
  Award,
  BadgeCheck,
  CheckCircle2,
  Circle,
  Crown,
  Diamond,
  Flame,
  Gem,
  Heart,
  Medal,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Verified,
  Zap,
} from 'lucide-react';

/**
 * Get a Lucide icon component by name (Synchronous)
 * Accepts PascalCase ("MapPin"), kebab-case ("map-pin"), or camelCase.
 * Returns the icon component or a fallback.
 */
export function getLucideIcon(
  iconName: string | undefined,
  fallback: ComponentType<LucideProps> = Circle
): ComponentType<LucideProps> {
  if (!iconName) return fallback;

  const map = lucideIcons as unknown as Record<string, ComponentType<LucideProps>>;

  // Direct hit (already PascalCase like "MapPin")
  if (map[iconName]) return map[iconName];

  // kebab-case → PascalCase ("map-pin" → "MapPin", "code-2" → "Code2")
  const pascalFromKebab = iconName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  if (map[pascalFromKebab]) return map[pascalFromKebab];

  // camelCase → PascalCase ("mapPin" → "MapPin")
  const pascalFromCamel = iconName.charAt(0).toUpperCase() + iconName.slice(1);
  if (map[pascalFromCamel]) return map[pascalFromCamel];

  return fallback;
}

/**
 * Check if a Lucide icon exists by name
 */
export function hasLucideIcon(iconName: string): boolean {
  if (!iconName) return false;
  const map = lucideIcons as unknown as Record<string, unknown>;
  const pascalFromKebab = iconName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  const pascalFromCamel = iconName.charAt(0).toUpperCase() + iconName.slice(1);
  return !!(map[iconName] || map[pascalFromKebab] || map[pascalFromCamel]);
}

// Re-export common icons for convenience
export {
  CheckCircle2,
  BadgeCheck,
  ShieldCheck,
  Verified,
  Star,
  Crown,
  Award,
  Medal,
  Trophy,
  Gem,
  Diamond,
  Sparkles,
  Heart,
  Flame,
  Zap,
  Circle,
};
