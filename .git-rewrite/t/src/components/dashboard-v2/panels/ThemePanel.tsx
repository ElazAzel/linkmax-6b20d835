/**
 * ThemePanel - Theme and color customization panel
 * Opens as a sheet/panel for theme selection and background settings
 */
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Palette, Lock, Crown, Image, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MediaUpload } from '@/components/form-fields/MediaUpload';
import { cn } from '@/lib/utils';
import type { PageTheme, PageBackground } from '@/types/page';

interface ThemePanelProps {
  open: boolean;
  onClose: () => void;
  currentTheme: Partial<PageTheme>;
  onThemeChange: (theme: Partial<PageTheme>) => void;
  isPremium: boolean;
  onUpgrade?: () => void;
}

const THEMES = [
  {
    id: 'classic',
    nameKey: 'themes.classic',
    descKey: 'themes.classicDesc',
    isPremium: false,
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
    nameKey: 'themes.darkMode',
    descKey: 'themes.darkModeDesc',
    isPremium: false,
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
    nameKey: 'themes.gradientTheme',
    descKey: 'themes.gradientThemeDesc',
    isPremium: true,
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
    nameKey: 'themes.minimal',
    descKey: 'themes.minimalDesc',
    isPremium: false,
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
    nameKey: 'themes.neon',
    descKey: 'themes.neonDesc',
    isPremium: true,
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
  {
    id: 'sunset',
    nameKey: 'themes.sunset',
    descKey: 'themes.sunsetDesc',
    isPremium: true,
    theme: {
      backgroundColor: 'linear-gradient(135deg, hsl(30 100% 60%) 0%, hsl(350 100% 65%) 100%)',
      textColor: 'hsl(0 0% 100%)',
      buttonStyle: 'pill' as const,
      fontFamily: 'sans' as const,
    },
    preview: {
      bg: 'bg-gradient-to-br from-orange-400 to-rose-500',
      text: 'text-white',
      button: 'bg-white/25 text-white backdrop-blur-sm',
    }
  },
  {
    id: 'ocean',
    nameKey: 'themes.ocean',
    descKey: 'themes.oceanDesc',
    isPremium: true,
    theme: {
      backgroundColor: 'linear-gradient(180deg, hsl(200 80% 50%) 0%, hsl(220 70% 35%) 100%)',
      textColor: 'hsl(0 0% 100%)',
      buttonStyle: 'rounded' as const,
      fontFamily: 'sans' as const,
    },
    preview: {
      bg: 'bg-gradient-to-b from-sky-500 to-blue-700',
      text: 'text-white',
      button: 'bg-white/20 text-white backdrop-blur-sm',
    }
  },
  {
    id: 'forest',
    nameKey: 'themes.forest',
    descKey: 'themes.forestDesc',
    isPremium: true,
    theme: {
      backgroundColor: 'hsl(150 30% 12%)',
      textColor: 'hsl(120 40% 80%)',
      buttonStyle: 'rounded' as const,
      fontFamily: 'sans' as const,
    },
    preview: {
      bg: 'bg-emerald-950',
      text: 'text-emerald-300',
      button: 'bg-emerald-600 text-white',
    }
  },
];

export const ThemePanel = memo(function ThemePanel({
  open,
  onClose,
  currentTheme,
  onThemeChange,
  isPremium,
  onUpgrade,
}: ThemePanelProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('themes');

  // Simple theme matching based on backgroundColor
  const activeThemeId = THEMES.find(
    thm => thm.theme.backgroundColor === currentTheme.backgroundColor
  )?.id || 'classic';

  const handleSelectTheme = (theme: typeof THEMES[0]) => {
    if (theme.isPremium && !isPremium) {
      onUpgrade?.();
      return;
    }
    onThemeChange(theme.theme);
  };

  // Background settings
  const customBackground = currentTheme.customBackground;
  const currentBgType = customBackground?.type || 'none';
  const currentBgValue = customBackground?.value || '';
  const gradientAngle = customBackground?.gradientAngle || 135;

  const handleBackgroundTypeChange = (type: 'none' | 'solid' | 'gradient' | 'image') => {
    if (type === 'none') {
      onThemeChange({ ...currentTheme, customBackground: undefined });
      return;
    }
    
    if (!isPremium) {
      onUpgrade?.();
      return;
    }

    const newBackground: PageBackground = {
      type,
      value: type === 'solid' ? '#1a1a2e' : type === 'gradient' ? '#667eea,#764ba2' : '',
      gradientAngle: type === 'gradient' ? 135 : undefined,
    };
    onThemeChange({ ...currentTheme, customBackground: newBackground });
  };

  const handleBackgroundValueChange = (value: string) => {
    if (!customBackground) return;
    onThemeChange({ 
      ...currentTheme, 
      customBackground: { ...customBackground, value } 
    });
  };

  const handleGradientAngleChange = (angle: number) => {
    if (!customBackground) return;
    onThemeChange({ 
      ...currentTheme, 
      customBackground: { ...customBackground, gradientAngle: angle } 
    });
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-y-auto">
        <SheetHeader className="p-5 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur-xl z-10">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              {t('themes.pageTheme', 'Theme & Colors')}
            </SheetTitle>
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 m-4 mx-5" style={{ width: 'calc(100% - 40px)' }}>
            <TabsTrigger value="themes" className="gap-2">
              <Palette className="h-4 w-4" />
              {t('themes.themes', 'Темы')}
            </TabsTrigger>
            <TabsTrigger value="background" className="gap-2">
              <Image className="h-4 w-4" />
              {t('themes.background', 'Фон')}
            </TabsTrigger>
          </TabsList>

          {/* Themes Tab */}
          <TabsContent value="themes" className="p-5 pt-0 space-y-6">
            {/* Free Themes */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {t('themes.freeThemes', 'Free Themes')}
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {THEMES.filter(t => !t.isPremium).map((theme) => (
                  <ThemeCard
                    key={theme.id}
                    theme={theme}
                    isActive={activeThemeId === theme.id}
                    isLocked={false}
                    onSelect={() => handleSelectTheme(theme)}
                  />
                ))}
              </div>
            </div>

            {/* Premium Themes */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                {t('themes.premiumThemes', 'Premium Themes')}
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {THEMES.filter(t => t.isPremium).map((theme) => (
                  <ThemeCard
                    key={theme.id}
                    theme={theme}
                    isActive={activeThemeId === theme.id}
                    isLocked={!isPremium}
                    onSelect={() => handleSelectTheme(theme)}
                  />
                ))}
              </div>
            </div>

            {/* Upgrade CTA for non-premium users */}
            {!isPremium && (
              <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Crown className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{t('themes.unlockPremium', 'Unlock Premium Themes')}</h4>
                    <p className="text-xs text-muted-foreground">
                      {t('themes.unlockPremiumDesc', 'Get access to all themes with PRO')}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={onUpgrade}
                  className="w-full h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold"
                >
                  {t('common.upgrade', 'Upgrade to PRO')}
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* Background Tab */}
          <TabsContent value="background" className="p-5 pt-0 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Image className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">{t('settings.pageBackground', 'Фон страницы')}</h3>
                {!isPremium && currentBgType !== 'none' && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Crown className="h-3 w-3" />
                    PRO
                  </Badge>
                )}
              </div>

              {/* Background Type Selector */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t('settings.backgroundType', 'Тип фона')}</Label>
                <Select 
                  value={currentBgType} 
                  onValueChange={(v) => handleBackgroundTypeChange(v as any)}
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span>{t('common.none', 'Нет')}</span>
                    </SelectItem>
                    <SelectItem value="solid">
                      <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        {t('settings.solidColor', 'Сплошной цвет')}
                        {!isPremium && <Lock className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    </SelectItem>
                    <SelectItem value="gradient">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        {t('settings.gradient', 'Градиент')}
                        {!isPremium && <Lock className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    </SelectItem>
                    <SelectItem value="image">
                      <div className="flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        {t('settings.imageOrGif', 'Изображение / GIF')}
                        {!isPremium && <Lock className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Solid Color Settings */}
              {currentBgType === 'solid' && isPremium && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t('settings.backgroundColor', 'Цвет фона')}</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={currentBgValue || '#1a1a2e'}
                      onChange={(e) => handleBackgroundValueChange(e.target.value)}
                      className="w-14 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={currentBgValue || '#1a1a2e'}
                      onChange={(e) => handleBackgroundValueChange(e.target.value)}
                      placeholder="#1a1a2e"
                      className="flex-1 bg-background/50"
                    />
                  </div>
                </div>
              )}

              {/* Gradient Settings */}
              {currentBgType === 'gradient' && isPremium && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">{t('settings.gradientColors', 'Цвета градиента (через запятую)')}</Label>
                    <Input
                      type="text"
                      value={currentBgValue || '#667eea,#764ba2'}
                      onChange={(e) => handleBackgroundValueChange(e.target.value)}
                      placeholder="#667eea,#764ba2"
                      className="bg-background/50"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('settings.gradientHint', 'Укажите 2-3 цвета через запятую')}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">{t('settings.gradientAngle', 'Угол градиента')}: {gradientAngle}°</Label>
                    <Input
                      type="range"
                      min="0"
                      max="360"
                      value={gradientAngle}
                      onChange={(e) => handleGradientAngleChange(parseInt(e.target.value))}
                    />
                  </div>
                </>
              )}

              {/* Image Settings */}
              {currentBgType === 'image' && isPremium && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t('settings.backgroundImage', 'Изображение или GIF')}</Label>
                  <MediaUpload
                    value={currentBgValue}
                    onChange={(url) => handleBackgroundValueChange(url || '')}
                    allowGif={true}
                  />
                </div>
              )}

              {/* Preview */}
              {customBackground && isPremium && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t('settings.preview', 'Превью')}</Label>
                  <div 
                    className="h-24 rounded-xl border border-border/30"
                    style={getBackgroundPreviewStyle(customBackground)}
                  />
                </div>
              )}

              {/* Premium CTA */}
              {!isPremium && currentBgType !== 'none' && (
                <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <Crown className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{t('themes.unlockBackground', 'Свой фон страницы')}</h4>
                      <p className="text-xs text-muted-foreground">
                        {t('themes.unlockBackgroundDesc', 'Установите цвет, градиент или изображение')}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={onUpgrade}
                    className="w-full h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold"
                  >
                    {t('common.upgrade', 'Upgrade to PRO')}
                  </Button>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
});

function getBackgroundPreviewStyle(background?: PageBackground): React.CSSProperties {
  if (!background) return {};
  
  switch (background.type) {
    case 'solid':
      return { backgroundColor: background.value };
    case 'gradient': {
      const colors = background.value.split(',').map(c => c.trim());
      return { 
        background: `linear-gradient(${background.gradientAngle || 135}deg, ${colors.join(', ')})` 
      };
    }
    case 'image':
      return { 
        backgroundImage: `url(${background.value})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    default:
      return {};
  }
}

interface ThemeCardProps {
  theme: typeof THEMES[0];
  isActive: boolean;
  isLocked: boolean;
  onSelect: () => void;
}

function ThemeCard({ theme, isActive, isLocked, onSelect }: ThemeCardProps) {
  const { t } = useTranslation();

  return (
    <Card
      onClick={onSelect}
      className={cn(
        "relative cursor-pointer transition-all hover:scale-[1.02] overflow-hidden",
        isActive 
          ? "ring-2 ring-primary shadow-lg" 
          : "hover:ring-1 hover:ring-border",
        isLocked && "opacity-75"
      )}
    >
      {/* Theme Preview */}
      <div className={cn("h-20 p-3 flex flex-col gap-1.5", theme.preview.bg)}>
        <div className={cn("text-xs font-medium", theme.preview.text)}>
          Aa
        </div>
        <div className={cn(
          "h-4 rounded-full w-full text-[8px] flex items-center justify-center font-medium",
          theme.preview.button
        )}>
          {t('fields.buttonText', 'Button')}
        </div>
      </div>

      {/* Theme Info */}
      <div className="p-2 bg-card">
        <div className="flex items-center justify-between mb-0.5">
          <h4 className="text-sm font-semibold truncate">{t(theme.nameKey)}</h4>
          {isActive && <Check className="h-4 w-4 text-primary shrink-0" />}
          {isLocked && !isActive && <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground truncate">{t(theme.descKey)}</p>
      </div>

      {/* Locked Overlay */}
      {isLocked && (
        <div className="absolute inset-0 bg-background/20 backdrop-blur-[1px]" />
      )}
    </Card>
  );
}
