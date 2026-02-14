# UI Component Documentation - lnkmx

## Overview

lnkmx uses a component-based architecture built on:
- **React 18** with TypeScript
- **Tailwind CSS** with semantic design tokens
- **shadcn/ui** for base components
- **Radix UI** for accessible primitives

---

## Design System

### Color Tokens

All colors use HSL and are defined in `src/index.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --secondary: 240 4.8% 95.9%;
  --muted: 240 4.8% 95.9%;
  --accent: 240 4.8% 95.9%;
  --destructive: 0 84.2% 60.2%;
  /* ... */
}
```

### Usage

```tsx
// ✅ Correct - using design tokens
<div className="bg-background text-foreground border-border">

// ❌ Wrong - direct colors
<div className="bg-white text-black border-gray-200">
```

---

## Core Components

### Button

Location: `src/components/ui/button.tsx`

**Variants:**
- `default` - Primary action
- `destructive` - Danger/delete actions
- `outline` - Secondary action
- `secondary` - Tertiary action
- `ghost` - Minimal style
- `link` - Text link style

**Sizes:**
- `default` - Standard size
- `sm` - Small
- `lg` - Large
- `icon` - Icon-only button

**Usage:**
```tsx
import { Button } from "@/components/ui/button";

<Button variant="default" size="lg">
  Create Page
</Button>

<Button variant="ghost" size="icon">
  <Settings className="h-4 w-4" />
</Button>
```

---

### Card

Location: `src/components/ui/card.tsx`

**Components:**
- `Card` - Container
- `CardHeader` - Header section
- `CardTitle` - Title text
- `CardDescription` - Subtitle text
- `CardContent` - Main content
- `CardFooter` - Footer actions

**Usage:**
```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Block Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Content here</p>
  </CardContent>
</Card>
```

---

### Dialog / Sheet

**Dialog** - Center modal for confirmations
**Sheet** - Side panel for forms/editors

```tsx
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";

<Sheet open={isOpen} onOpenChange={setIsOpen}>
  <SheetContent side="bottom" className="h-[85vh]">
    <SheetHeader>
      <SheetTitle>Edit Block</SheetTitle>
    </SheetHeader>
    {/* Editor content */}
  </SheetContent>
</Sheet>
```

---

### Form Components

**Input:**
```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>
```

**Textarea:**
```tsx
import { Textarea } from "@/components/ui/textarea";

<Textarea 
  placeholder="Description..." 
  className="min-h-[100px]"
/>
```

**Select:**
```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

---

## Block Components

### Block Types

| Block | Component | Description |
|-------|-----------|-------------|
| Profile | `ProfileBlock` | Avatar, name, bio |
| Link | `LinkBlock` | External link button |
| Button | `ButtonBlock` | CTA button |
| Text | `TextBlock` | Rich text content |
| Image | `ImageBlock` | Image with optional link |
| Video | `VideoBlock` | YouTube/Vimeo embed |
| Socials | `SocialsBlock` | Social media icons |
| Form | `FormBlock` | Lead capture form |
| Booking | `BookingBlock` | Appointment booking |
| Messenger | `MessengerBlock` | Chat buttons |
| Catalog | `CatalogBlock` | Product grid |
| Product | `ProductBlock` | Single product card |
| FAQ | `FAQBlock` | Accordion Q&A |
| Testimonial | `TestimonialBlock` | Review cards |
| Countdown | `CountdownBlock` | Timer |
| Map | `MapBlock` | Google Maps embed |
| Carousel | `CarouselBlock` | Image slider |

### Block Structure

```tsx
// src/components/blocks/LinkBlock.tsx
interface LinkBlockContent {
  url: string;
  label: string;
  icon?: string;
  style?: 'default' | 'outline' | 'glass';
}

export function LinkBlock({ content, onClick }: BlockProps) {
  return (
    <a 
      href={content.url}
      className="block w-full p-4 rounded-xl bg-card hover:bg-accent"
      onClick={onClick}
    >
      {content.label}
    </a>
  );
}
```

---

## Block Editors

Location: `src/components/block-editors/`

Each block has a corresponding editor with tabs:
- **Content** - Main data fields
- **Style** - Visual customization
- **Actions** - Click behaviors
- **AI** - AI-assisted editing

```tsx
// src/components/block-editors/LinkBlockEditor.tsx
export function LinkBlockEditor({ block, onSave, onClose }) {
  const [content, setContent] = useState(block.content);
  
  return (
    <Sheet>
      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="style">Style</TabsTrigger>
        </TabsList>
        <TabsContent value="content">
          <Input 
            value={content.url}
            onChange={e => setContent({...content, url: e.target.value})}
          />
        </TabsContent>
      </Tabs>
    </Sheet>
  );
}
```

---

## Dashboard Components

### Tab Navigation

The dashboard uses a bottom tab bar on mobile:

```tsx
// src/components/layout/AppTabBar.tsx
const tabs = [
  { key: 'projects', icon: FolderOpen, label: t('tabs.projects') },
  { key: 'editor', icon: Layers, label: t('tabs.editor') },
  { key: 'crm', icon: Users, label: 'CRM' },
  { key: 'analytics', icon: BarChart3, label: t('tabs.analytics') },
  { key: 'gallery', icon: Grid3X3, label: t('tabs.gallery') },
  { key: 'settings', icon: Settings, label: t('tabs.settings') },
];
```

### Dashboard Tabs

| Tab | Component | Description |
|-----|-----------|-------------|
| Projects | `ProjectsTab` | Page overview, stats |
| Editor | `EditorTab` | Block editor canvas |
| CRM | `CRMTab` | Lead management |
| Analytics | `AnalyticsTab` | View/click stats |
| Gallery | `GalleryToggle` | Community pages |
| Settings | `SettingsTab` | Profile, theme |

---

## Responsive Design

### Mobile-First Approach

```tsx
// Mobile base, desktop overrides
<div className="p-4 md:p-6 lg:p-8">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* Cards */}
  </div>
</div>
```

### Safe Area Insets

```tsx
// For iOS notch/home indicator
<div className="pb-safe-area-inset-bottom">
  <TabBar />
</div>
```

---

## Icons

Using Lucide React icons:

```tsx
import { Settings, Plus, Trash2, Edit } from 'lucide-react';

<Button variant="ghost" size="icon">
  <Settings className="h-4 w-4" />
</Button>
```

---

## Animations

### CSS Transitions

```tsx
<div className="transition-all duration-200 hover:scale-105">
  {/* Animated content */}
</div>
```

### Framer Motion (optional)

```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
>
  {/* Animated content */}
</motion.div>
```

---

## Accessibility

### Keyboard Navigation

All interactive elements support:
- Tab navigation
- Enter/Space activation
- Escape to close modals

### ARIA Labels

```tsx
<Button aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>

<Dialog aria-describedby="dialog-description">
  <p id="dialog-description">Dialog content</p>
</Dialog>
```

### Focus Management

```tsx
// Auto-focus first input in dialogs
<Input autoFocus />

// Focus trap in modals (handled by Radix)
```

---

## Testing Components

```tsx
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

test('button renders with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByRole('button')).toHaveTextContent('Click me');
});
```

---

## Best Practices

1. **Use design tokens** - Never hardcode colors
2. **Mobile-first** - Start with mobile layout
3. **Semantic HTML** - Use proper elements
4. **Accessibility** - Include ARIA labels
5. **Loading states** - Show skeletons
6. **Error handling** - Display user-friendly errors
7. **Consistent spacing** - Use Tailwind spacing scale

---

*Last updated: 2026-01-15*