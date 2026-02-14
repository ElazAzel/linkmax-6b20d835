/**
 * Utility for type-safe dynamic Lucide icon access
 * Eliminates the need for `as any` when accessing icons dynamically
 */

import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Map of icon names to components
type LucideIconMap = typeof LucideIcons;

/**
 * Get a Lucide icon component by name
 * Returns the icon component or a fallback
 */
export function getLucideIcon(
  iconName: string | undefined,
  fallback: LucideIcon = LucideIcons.Circle
): LucideIcon {
  if (!iconName) return fallback;
  
  // Convert kebab-case to PascalCase
  const pascalCase = iconName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  
  // Try to get the icon from the map
  const icon = (LucideIcons as unknown as Record<string, LucideIcon>)[pascalCase];
  
  if (icon && typeof icon === 'function') {
    return icon;
  }
  
  // Try original case
  const directIcon = (LucideIcons as unknown as Record<string, LucideIcon>)[iconName];
  if (directIcon && typeof directIcon === 'function') {
    return directIcon;
  }
  
  return fallback;
}

/**
 * Check if a Lucide icon exists by name
 */
export function hasLucideIcon(iconName: string): boolean {
  const pascalCase = iconName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  
  return pascalCase in LucideIcons || iconName in LucideIcons;
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
