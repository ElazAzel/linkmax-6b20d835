# LinkMAX Design System

## Visual Theme & Atmosphere
- **Name:** Liquid Glass / Aurora
- **Vibe:** Professional, modern, premium, trustworthy
- **Inspiration:** Apple HIG, Linear, Supabase
- **Canvas:** Clean white (`#fafbfc`) in light mode; deep charcoal (`hsl(225 25% 6%)`) in dark mode
- **Surface Treatment:** Frosted glass with blur, subtle hairline borders, elevated shadows

## Color Palette & Roles

### Light Mode
| Role | HSL Value | Description |
|------|-----------|-------------|
| Background | `210 20% 98%` | Clean off-white |
| Foreground | `220 14% 10%` | Near-black text |
| Card | `0 0% 100%` | Pure white |
| Primary | `211 100% 50%` | Apple-style blue |
| Secondary | `210 20% 96%` | Subtle gray |
| Muted | `220 10% 45%` | Secondary text |
| Destructive | `0 72% 51%` | Soft red |
| Chart-1 | `211 100% 50%` | Blue |
| Chart-2 | `262 83% 58%` | Purple |
| Chart-3 | `339 76% 59%` | Pink |
| Chart-4 | `142 71% 45%` | Green |
| Chart-5 | `45 93% 47%` | Amber |

### Dark Mode
| Role | HSL Value |
|------|-----------|
| Background | `225 25% 6%` |
| Foreground | `210 20% 96%` |
| Card | `225 20% 10%` |
| Primary | `211 100% 55%` |

## Typography

### Primary Font Stack
```
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif
--font-heading: 'Manrope', 'Inter', system-ui, sans-serif
```

### Type Scale
| Role | Size (clamp) | Weight | Letter-spacing |
|------|-------------|--------|----------------|
| Display | `clamp(2.5rem, 8vw, 4.5rem)` | 800 | -0.04em |
| Hero | `clamp(1.75rem, 5vw, 3rem)` | 700 | -0.025em |
| Section Title | `clamp(1.5rem, 4vw, 1.875rem)` | 700 | -0.015em |
| Card Title | `1.125rem` (→1.25rem on md) | 600 | normal |
| Body | `1rem` | 400 | normal |
| Label | `0.875rem` | 500 | 0.01em |
| Caption | `0.75rem` | 400 | 0.02em |

## Components

### Cards
- `glass-card`: Frosted glass with blur, hairline border, subtle shadow
- `qb-card`: Opaque alternative with border + shadow (for editor blocks)
- Border radius: `var(--radius) = 1.5rem` (1.75rem organic)
- Hover: translateY(-2px), elevated shadow

### Buttons
- Radius: `0.75rem` (rounded-xl)
- Variants: default, destructive, outline, secondary, ghost, link, glass, premium
- All buttons have hover (translateY(-0.5px)), active (scale 0.98), and focus-visible states
- Loading state with `Loader2` spinner
- Min touch target: 44x44px

### Inputs
- Glass input with translucent background
- Focus: blue ring + border highlight
- Min touch target: 44px height

### Navigation (Dynamic Island)
- Desktop: fixed top-center pill, glass with blur, dark background
- Mobile: bottom tab bar

## Layout Principles
- **Bento Grid**: 2-col mobile, 4-col desktop, auto-row-height
- **Container**: max-w-6xl, centered, responsive padding
- **Spacing**: `clamp()` based fluid spacing system
- **Safe areas**: env(safe-area-inset-*) for notched devices

## Depth & Elevation
- `shadow-glass`: Multi-layered shadow with colored tint
- `shadow-glass-lg`: Elevated state with purple tint
- Hover states elevate cards and buttons

## Motion
- **Duration**: 300-700ms
- **Easing**: cubic-bezier(0.4, 0, 0.2, 1) — smooth ease-out
- **Spring**: cubic-bezier(0.34, 1.56, 0.64, 1) — bouncy
- **Scroll-driven**: smooth scroll, section reveal animations
- **Reduced motion**: `prefers-reduced-motion: reduce` disables all animation

## Do's and Don'ts
- ✅ Use semantic HTML and proper heading hierarchy
- ✅ Implement loading, empty, and error states for all data
- ✅ Use CSS variables for consistent theming
- ✅ Support dark mode everywhere
- ✅ Touch-friendly targets (min 44px)
- ❌ No lorem ipsum or placeholder content
- ❌ No AI-purple-blue dominant gradients on hero sections
- ❌ No 3-column equal card layouts
- ❌ No `!important` outside editor-block overrides

## Responsive Behavior
- **Mobile-first** CSS with `min-width` breakpoints
- Fluid typography via `clamp()`
- Backdrop blur reduced on mobile for GPU perf
- Bento grid: 2col → 4col at md breakpoint
- Scrollbar hidden but functional on all views

## Agent Prompt Guide
When generating new pages or components:
1. Reference this DESIGN.md for token values
2. Use `glass-card`, `glass-button`, `glass-input` utilities
3. Follow the bento grid layout pattern
4. Use the semantic text roles (text-display, text-hero, etc.)
5. Always include loading/empty/error states
6. Respect reduced-motion preferences
7. Apply dark mode equivalent colors
