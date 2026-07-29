import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';

// Granular imports keep the bundle tree-shakable — DO NOT import
// `{ icons }` from the lucide-react barrel here; that pulls the
// entire ~1400-icon library into every chunk that uses this helper.
import Award from 'lucide-react/dist/esm/icons/award';
import BadgeCheck from 'lucide-react/dist/esm/icons/badge-check';
import Box from 'lucide-react/dist/esm/icons/box';
import Briefcase from 'lucide-react/dist/esm/icons/briefcase';
import BriefcaseBusiness from 'lucide-react/dist/esm/icons/briefcase-business';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days';
import Camera from 'lucide-react/dist/esm/icons/camera';
import ChefHat from 'lucide-react/dist/esm/icons/chef-hat';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import Circle from 'lucide-react/dist/esm/icons/circle';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Code from 'lucide-react/dist/esm/icons/code';
import Code2 from 'lucide-react/dist/esm/icons/code-2';
import Crown from 'lucide-react/dist/esm/icons/crown';
import Diamond from 'lucide-react/dist/esm/icons/diamond';
import DollarSign from 'lucide-react/dist/esm/icons/dollar-sign';
import Download from 'lucide-react/dist/esm/icons/download';
import Dumbbell from 'lucide-react/dist/esm/icons/dumbbell';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Flame from 'lucide-react/dist/esm/icons/flame';
import Gamepad2 from 'lucide-react/dist/esm/icons/gamepad-2';
import Gem from 'lucide-react/dist/esm/icons/gem';
import Gift from 'lucide-react/dist/esm/icons/gift';
import GraduationCap from 'lucide-react/dist/esm/icons/graduation-cap';
import Grid from 'lucide-react/dist/esm/icons/grid';
import Heart from 'lucide-react/dist/esm/icons/heart';
import HeartPulse from 'lucide-react/dist/esm/icons/heart-pulse';
import HelpCircle from 'lucide-react/dist/esm/icons/help-circle';
import Home from 'lucide-react/dist/esm/icons/home';
import Image from 'lucide-react/dist/esm/icons/image';
import Images from 'lucide-react/dist/esm/icons/images';
import Instagram from 'lucide-react/dist/esm/icons/instagram';
import Link from 'lucide-react/dist/esm/icons/link';
import Mail from 'lucide-react/dist/esm/icons/mail';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Medal from 'lucide-react/dist/esm/icons/medal';
import Megaphone from 'lucide-react/dist/esm/icons/megaphone';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import Mic from 'lucide-react/dist/esm/icons/mic';
import Minus from 'lucide-react/dist/esm/icons/minus';
import MousePointer2 from 'lucide-react/dist/esm/icons/mouse-pointer-2';
import Music from 'lucide-react/dist/esm/icons/music';
import Palette from 'lucide-react/dist/esm/icons/palette';
import PenTool from 'lucide-react/dist/esm/icons/pen-tool';
import Plane from 'lucide-react/dist/esm/icons/plane';
import Quote from 'lucide-react/dist/esm/icons/quote';
import Rocket from 'lucide-react/dist/esm/icons/rocket';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import Shirt from 'lucide-react/dist/esm/icons/shirt';
import ShoppingBag from 'lucide-react/dist/esm/icons/shopping-bag';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import SquareMousePointer from 'lucide-react/dist/esm/icons/square-mouse-pointer';
import Star from 'lucide-react/dist/esm/icons/star';
import Stethoscope from 'lucide-react/dist/esm/icons/stethoscope';
import Trophy from 'lucide-react/dist/esm/icons/trophy';
import Twitch from 'lucide-react/dist/esm/icons/twitch';
import Type from 'lucide-react/dist/esm/icons/type';
import User from 'lucide-react/dist/esm/icons/user';
import UserCircle from 'lucide-react/dist/esm/icons/user-circle';
import Users from 'lucide-react/dist/esm/icons/users';
import Utensils from 'lucide-react/dist/esm/icons/utensils';
import Verified from 'lucide-react/dist/esm/icons/verified';
import Video from 'lucide-react/dist/esm/icons/video';
import Wrench from 'lucide-react/dist/esm/icons/wrench';
import Youtube from 'lucide-react/dist/esm/icons/youtube';
import Zap from 'lucide-react/dist/esm/icons/zap';
import ArrowLeftRight from 'lucide-react/dist/esm/icons/arrow-left-right';
import Share2 from 'lucide-react/dist/esm/icons/share-2';
import Grid3X3 from 'lucide-react/dist/esm/icons/grid-3x3';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import Search from 'lucide-react/dist/esm/icons/search';

// Curated icon registry. Only icons listed here are bundled — this
// preserves tree-shaking. Users picking icons from AVATAR_ICON_OPTIONS,
// VERIFICATION_ICON_OPTIONS, the onboarding builder, block manifest,
// and block manager should all resolve here.
const ICON_MAP: Record<string, ComponentType<LucideProps>> = {
  ArrowLeftRight,
  Award,
  CreditCard,
  Grid3X3,
  Search,
  Share2,
  BadgeCheck,
  Box,
  Briefcase,
  BriefcaseBusiness,
  Calendar,
  CalendarDays,
  Camera,
  ChefHat,
  CheckCircle,
  CheckCircle2,
  Circle,
  Clock,
  Code,
  Code2,
  Crown,
  Diamond,
  DollarSign,
  Download,
  Dumbbell,
  FileText,
  Flame,
  Gamepad2,
  Gem,
  Gift,
  GraduationCap,
  Grid,
  Heart,
  HeartPulse,
  HelpCircle,
  Home,
  Image,
  Images,
  Instagram,
  Link,
  Mail,
  MapPin,
  Medal,
  Megaphone,
  MessageCircle,
  Mic,
  Minus,
  MousePointer2,
  Music,
  Palette,
  PenTool,
  Plane,
  Quote,
  Rocket,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Sparkles,
  SquareMousePointer,
  Star,
  Stethoscope,
  Trophy,
  Twitch,
  Type,
  User,
  UserCircle,
  Users,
  Utensils,
  Verified,
  Video,
  Wrench,
  Youtube,
  Zap,
};

/**
 * Get a Lucide icon component by name (synchronous).
 * Accepts PascalCase ("MapPin"), kebab-case ("map-pin"), or camelCase.
 * Unknown names return the provided fallback (Circle by default).
 */
export function getLucideIcon(
  iconName: string | undefined,
  fallback: ComponentType<LucideProps> = Circle,
): ComponentType<LucideProps> {
  if (!iconName) return fallback;
  if (ICON_MAP[iconName]) return ICON_MAP[iconName];

  const pascalFromKebab = iconName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  if (ICON_MAP[pascalFromKebab]) return ICON_MAP[pascalFromKebab];

  const pascalFromCamel = iconName.charAt(0).toUpperCase() + iconName.slice(1);
  if (ICON_MAP[pascalFromCamel]) return ICON_MAP[pascalFromCamel];

  return fallback;
}

/**
 * Check if a Lucide icon exists by name in the curated registry.
 */
export function hasLucideIcon(iconName: string): boolean {
  if (!iconName) return false;
  const pascalFromKebab = iconName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  const pascalFromCamel = iconName.charAt(0).toUpperCase() + iconName.slice(1);
  return !!(ICON_MAP[iconName] || ICON_MAP[pascalFromKebab] || ICON_MAP[pascalFromCamel]);
}

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
