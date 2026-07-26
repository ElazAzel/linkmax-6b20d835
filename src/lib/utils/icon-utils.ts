import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
import {
  ArrowLeftRight,
  Award,
  BadgeCheck,
  Bomb,
  Brain,
  Briefcase,
  Calendar,
  CalendarCheck,
  CalendarDays,
  Cherry,
  CheckCircle2,
  Circle,
  Clock,
  Code,
  Crown,
  Diamond,
  DollarSign,
  Download,
  FileText,
  Flame,
  Gamepad2,
  Gem,
  Gift,
  Globe,
  Grid,
  Heart,
  HelpCircle,
  Image,
  Images,
  Instagram,
  Link,
  Mail,
  Medal,
  Megaphone,
  MessageCircle,
  Minus,
  Percent,
  Quote,
  Receipt,
  RotateCw,
  Scale,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Smile,
  Sparkles,
  SquareMousePointer,
  Star,
  Timer,
  Trophy,
  Type,
  User,
  UserCircle,
  Users,
  Verified,
  Video,
  Vote,
  Watch,
  Youtube,
  Zap,
} from 'lucide-react';

const LUCIDE_ICON_MAP: Record<string, ComponentType<LucideProps>> = {
  ArrowLeftRight,
  Award,
  BadgeCheck,
  Bomb,
  Brain,
  Briefcase,
  Calendar,
  CalendarCheck,
  CalendarDays,
  Cherry,
  CheckCircle2,
  Circle,
  Clock,
  Code,
  Crown,
  Diamond,
  DollarSign,
  Download,
  FileText,
  Flame,
  Gamepad2,
  Gem,
  Gift,
  Globe,
  Grid,
  Heart,
  HelpCircle,
  Image,
  Images,
  Instagram,
  Link,
  Mail,
  Medal,
  Megaphone,
  MessageCircle,
  Minus,
  Percent,
  Quote,
  Receipt,
  RotateCw,
  Scale,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Smile,
  Sparkles,
  SquareMousePointer,
  Star,
  Timer,
  Trophy,
  Type,
  User,
  UserCircle,
  Users,
  Verified,
  Video,
  Vote,
  Watch,
  Youtube,
  Zap,
};

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

  const Icon = LUCIDE_ICON_MAP[pascalCase] || LUCIDE_ICON_MAP[iconName];
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
};
