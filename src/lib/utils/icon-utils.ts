import { lazy, type LazyExoticComponent, type ComponentType } from 'react';
import { Circle } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

/**
 * Get a Lucide icon component by name (Lazy Loaded)
 * Returns the icon component or a fallback
 */
export function getLucideIcon(
  iconName: string | undefined,
  fallback: ComponentType<LucideProps> = Circle
): LazyExoticComponent<ComponentType<LucideProps>> | ComponentType<LucideProps> {
  if (!iconName) return fallback;

  return lazy(async () => {
    try {
      const module = await import('lucide-react');

      // Convert kebab-case to PascalCase
      const pascalCase = iconName
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');

      const Icon = (module as any)[pascalCase] || (module as any)[iconName];

      if (Icon) {
        return { default: Icon };
      }
    } catch (error) {
      console.error(`Failed to load icon: ${iconName}`, error);
    }

    // Return fallback if not found
    return { default: fallback as ComponentType<any> };
  });
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
