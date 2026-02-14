import { memo } from 'react';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PageTheme } from '@/types/page';

interface ThemeSelectorProps {
  currentTheme: PageTheme;
  onThemeChange: (theme: Partial<PageTheme>) => void;
}

const THEMES = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Clean and minimal',
    theme: {
      backgroundColor: 'hsl(var(--background))',
      textColor: 'hsl(var(--foreground))',
      buttonStyle: 'rounded' as const,
      fontFamily: 'sans' as const,
    },
    preview: {
      bg: 'bg-background',
      text: 'text-foreground',
      button: 'bg-primary text-primary-foreground',
    }
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    description: 'Sleek dark design',
    theme: {
      backgroundColor: 'hsl(220 13% 9%)',
      textColor: 'hsl(210 40% 98%)',
      buttonStyle: 'rounded' as const,
      fontFamily: 'sans' as const,
    },
    preview: {
      bg: 'bg-slate-900',
      text: 'text-slate-50',
      button: 'bg-slate-700 text-slate-100',
    }
  },
  {
    id: 'gradient',
    name: 'Gradient',
    description: 'Colorful and vibrant',
    theme: {
      backgroundColor: 'linear-gradient(135deg, hsl(280 100% 70%) 0%, hsl(220 100% 75%) 100%)',
      textColor: 'hsl(0 0% 100%)',
      buttonStyle: 'rounded' as const,
      fontFamily: 'sans' as const,
    },
    preview: {
      bg: 'bg-gradient-to-br from-purple-400 to-blue-400',
      text: 'text-white',
      button: 'bg-white/20 text-white backdrop-blur-sm',
    }
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Ultra clean aesthetic',
    theme: {
      backgroundColor: 'hsl(0 0% 98%)',
      textColor: 'hsl(0 0% 13%)',
      buttonStyle: 'default' as const,
      fontFamily: 'mono' as const,
    },
    preview: {
      bg: 'bg-gray-50',
      text: 'text-gray-900',
      button: 'bg-gray-900 text-white',
    }
  },
  {
    id: 'neon',
    name: 'Neon',
    description: 'Bold and electric',
    theme: {
      backgroundColor: 'hsl(270 100% 5%)',
      textColor: 'hsl(180 100% 70%)',
      buttonStyle: 'pill' as const,
      fontFamily: 'sans' as const,
    },
    preview: {
      bg: 'bg-violet-950',
      text: 'text-cyan-400',
      button: 'bg-cyan-400 text-violet-950',
    }
  },
];

export const ThemeSelector = memo(function ThemeSelector({ 
  currentTheme, 
  onThemeChange 
}: ThemeSelectorProps) {
  // Simple theme matching based on backgroundColor
  const activeThemeId = THEMES.find(
    t => t.theme.backgroundColor === currentTheme.backgroundColor
  )?.id || 'classic';

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">Page Theme</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Choose a pre-designed theme for your page
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {THEMES.map((theme) => (
          <Card
            key={theme.id}
            onClick={() => onThemeChange(theme.theme)}
            className={cn(
              "relative cursor-pointer transition-all hover:scale-105 overflow-hidden",
              activeThemeId === theme.id 
                ? "ring-2 ring-primary shadow-lg" 
                : "hover:ring-1 hover:ring-border"
            )}
          >
            {/* Theme Preview */}
            <div className={cn("h-24 p-3 flex flex-col gap-1.5", theme.preview.bg)}>
              <div className={cn("text-xs font-medium", theme.preview.text)}>
                Aa
              </div>
              <div className={cn(
                "h-4 rounded-full w-full text-[8px] flex items-center justify-center font-medium",
                theme.preview.button
              )}>
                Button
              </div>
            </div>

            {/* Theme Info */}
            <div className="p-2 bg-card">
              <div className="flex items-center justify-between mb-0.5">
                <h4 className="text-sm font-semibold">{theme.name}</h4>
                {activeThemeId === theme.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{theme.description}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
});
