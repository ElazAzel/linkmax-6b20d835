import type { ComponentType } from 'react';
import { icons } from 'lucide-react';
import Circle from 'lucide-react/dist/esm/icons/circle';
import type { LucideProps } from 'lucide-react';

/**
 * Get a Lucide icon component by name (Synchronous)
 * Returns the icon component or a fallback
 */
export function getLucideIcon(
  iconName: string | undefined,
  fallback: ComponentType<LucideProps> = Circle
): ComponentType<LucideProps> {
  if (!iconName) return fallback;

  // Convert kebab-case to PascalCase
  const pascalCase = iconName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  const Icon = (icons as any)[pascalCase] || (icons as any)[iconName];
  return Icon || fallback;
}

/**
 * Check if a Lucide icon exists by name
 * @deprecated Cannot synchronously check existence with lazy loading
 */
export function hasLucideIcon(iconName: string): boolean {
  return !!iconName;
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
} from 'lucide-react';
