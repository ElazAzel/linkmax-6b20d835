/**
 * ThemePanel v2 - richer theme & appearance customization.
 * Backward-compatible with the previous panel: same open/close, currentTheme/onThemeChange contract.
 *
 * Tabs: Themes • Background • Style • Blocks
 */
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Check from 'lucide-react/dist/esm/icons/check';
import Palette from 'lucide-react/dist/esm/icons/palette';
import Lock from 'lucide-react/dist/esm/icons/lock';
import Crown from 'lucide-react/dist/esm/icons/crown';
import ImageIcon from 'lucide-react/dist/esm/icons/image';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Type from 'lucide-react/dist/esm/icons/type';
import Square from 'lucide-react/dist/esm/icons/square';
import WandSparkles from 'lucide-react/dist/esm/icons/wand-sparkles';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MediaUpload } from '@/components/form-fields/MediaUpload';
import { cn } from '@/lib/utils/utils';
import type { PageTheme, PageBackground, BlockShape, BlockShadow, BlockHover, DividerStyle } from '@/types/page';
import {
  THEME_PRESETS,
  GRADIENT_PRESETS,
  PATTERN_PRESETS,
  FONT_PAIR_PRESETS,
  BLOCK_SHAPE_PRESETS,
  BLOCK_SHADOW_PRESETS,
  BLOCK_HOVER_PRESETS,
  DIVIDER_PRESETS,
  type ThemePreset,
} from '@/lib/appearance/presets';

interface ThemePanelProps {
  open: boolean;
  onClose: () => void;
  currentTheme: Partial<PageTheme>;
  onThemeChange: (theme: Partial<PageTheme>) => void;
  isPremium: boolean;
  onUpgrade?: () => void;
}

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

  const activeThemeId = currentTheme.themePreset
    ?? THEME_PRESETS.find(p => p.theme.backgroundColor === currentTheme.backgroundColor)?.id
    ?? 'warm-paper';

  const handleSelectTheme = (preset: ThemePreset) => {
    if (preset.isPremium && !isPremium) {
      onUpgrade?.();
      return;
    }
    onThemeChange({ ...currentTheme, ...preset.theme });
  };

  // Background handling
  const customBackground = currentTheme.customBackground;
  const currentBgType = customBackground?.type ?? 'none';
  const currentBgValue = customBackground?.value ?? '';
  const gradientAngle = customBackground?.gradientAngle ?? 135;

  const handleBackgroundTypeChange = (type: 'none' | 'solid' | 'gradient' | 'image' | 'pattern') => {
    if (type === 'none') {
      onThemeChange({ ...currentTheme, customBackground: undefined });
      return;
    }
    if (!isPremium && (type === 'image' || type === 'pattern')) {
      onUpgrade?.();
      return;
    }
    const newBackground: PageBackground = {
      type,
      value:
        type === 'solid' ? '#1a1a2e' :
        type === 'gradient' ? '#667eea,#764ba2' :
        type === 'pattern' ? 'dots' : '',
      gradientAngle: type === 'gradient' ? 135 : undefined,
    };
    onThemeChange({ ...currentTheme, customBackground: newBackground });
  };

  const patchBg = (patch: Partial<PageBackground>) => {
    if (!customBackground) return;
    onThemeChange({ ...currentTheme, customBackground: { ...customBackground, ...patch } });
  };

  const setBlockField = <K extends keyof PageTheme>(key: K, value: PageTheme[K]) => {
    onThemeChange({ ...currentTheme, [key]: value });
  };

  const requirePremium = (isPremiumOption: boolean, next: () => void) => {
    if (isPremiumOption && !isPremium) {
      onUpgrade?.();
      return;
    }
    next();
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-y-auto">
        <SheetHeader className="p-5 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur-xl z-10">
          <SheetTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            {t('themes.pageTheme', 'Тема и оформление')}
          </SheetTitle>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 m-4 mx-5" style={{ width: 'calc(100% - 40px)' }}>
            <TabsTrigger value="themes" className="gap-1.5 text-xs"><Palette className="h-3.5 w-3.5" />{t('themes.themes', 'Темы')}</TabsTrigger>
            <TabsTrigger value="background" className="gap-1.5 text-xs"><ImageIcon className="h-3.5 w-3.5" />{t('themes.background', 'Фон')}</TabsTrigger>
            <TabsTrigger value="style" className="gap-1.5 text-xs"><Type className="h-3.5 w-3.5" />{t('themes.style', 'Стиль')}</TabsTrigger>
            <TabsTrigger value="blocks" className="gap-1.5 text-xs"><Square className="h-3.5 w-3.5" />{t('themes.blocks', 'Блоки')}</TabsTrigger>
          </TabsList>

          {/* ============ Themes tab ============ */}
          <TabsContent value="themes" className="p-5 pt-0 space-y-6">
            <SectionLabel>{t('themes.freeThemes', 'Бесплатные темы')}</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              {THEME_PRESETS.filter(p => !p.isPremium).map(theme => (
                <ThemeCard key={theme.id} theme={theme} isActive={activeThemeId === theme.id} isLocked={false} onSelect={() => handleSelectTheme(theme)} />
              ))}
            </div>

            <SectionLabel icon={<Crown className="h-3.5 w-3.5 text-amber-500" />}>{t('themes.premiumThemes', 'Premium темы')}</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              {THEME_PRESETS.filter(p => p.isPremium).map(theme => (
                <ThemeCard key={theme.id} theme={theme} isActive={activeThemeId === theme.id} isLocked={!isPremium} onSelect={() => handleSelectTheme(theme)} />
              ))}
            </div>

            {!isPremium && <UpgradeCard onUpgrade={onUpgrade} title={t('themes.unlockPremium', 'Все Premium темы')} desc={t('themes.unlockPremiumDesc', 'Больше вариантов, эффектов и анимаций')} />}
          </TabsContent>

          {/* ============ Background tab ============ */}
          <TabsContent value="background" className="p-5 pt-0 space-y-6">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t('settings.backgroundType', 'Тип фона')}</Label>
              <Select value={currentBgType} onValueChange={(v: string) => handleBackgroundTypeChange(v as 'none' | 'solid' | 'gradient' | 'image' | 'pattern')}>
                <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('common.none', 'Нет')}</SelectItem>
                  <SelectItem value="solid">{t('settings.solidColor', 'Сплошной цвет')}</SelectItem>
                  <SelectItem value="gradient">{t('settings.gradient', 'Градиент')}</SelectItem>
                  <SelectItem value="pattern">{t('settings.pattern', 'Паттерн')} {!isPremium && '🔒'}</SelectItem>
                  <SelectItem value="image">{t('settings.imageOrGif', 'Изображение / GIF')} {!isPremium && '🔒'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Solid */}
            {currentBgType === 'solid' && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t('settings.backgroundColor', 'Цвет фона')}</Label>
                <div className="flex gap-2">
                  <Input type="color" value={currentBgValue || '#1a1a2e'} onChange={(e) => patchBg({ value: e.target.value })} className="w-14 h-10 p-1 cursor-pointer" />
                  <Input type="text" value={currentBgValue || '#1a1a2e'} onChange={(e) => patchBg({ value: e.target.value })} placeholder="#1a1a2e" className="flex-1 bg-background/50" />
                </div>
              </div>
            )}

            {/* Gradient with presets */}
            {currentBgType === 'gradient' && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t('settings.gradientPresets', 'Готовые градиенты')}</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {GRADIENT_PRESETS.map(g => {
                      const locked = g.isPremium && !isPremium;
                      const isActive = currentBgValue === g.colors.join(',');
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => requirePremium(g.isPremium, () => patchBg({ value: g.colors.join(','), gradientAngle: g.angle }))}
                          className={cn('h-12 rounded-lg border transition relative overflow-hidden', isActive ? 'ring-2 ring-primary' : 'border-border/40 hover:border-border', locked && 'opacity-60')}
                          style={{ background: g.css }}
                          title={g.name}
                          aria-label={g.name}
                        >
                          {locked && <Lock className="absolute inset-0 m-auto h-3.5 w-3.5 text-white drop-shadow" />}
                          {isActive && <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t('settings.gradientColors', 'Цвета (через запятую)')}</Label>
                  <Input value={currentBgValue} onChange={(e) => patchBg({ value: e.target.value })} placeholder="#667eea,#764ba2" className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t('settings.gradientAngle', 'Угол')}: {gradientAngle}°</Label>
                  <Input type="range" min={0} max={360} value={gradientAngle} onChange={(e) => patchBg({ gradientAngle: parseInt(e.target.value) })} />
                </div>
              </>
            )}

            {/* Pattern */}
            {currentBgType === 'pattern' && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t('settings.pattern', 'Паттерн')}</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {PATTERN_PRESETS.map(p => {
                      const locked = p.isPremium && !isPremium;
                      const isActive = currentBgValue === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => requirePremium(p.isPremium, () => patchBg({ value: p.id }))}
                          className={cn('h-16 rounded-lg border relative overflow-hidden bg-muted', p.cssClass, isActive ? 'ring-2 ring-primary' : 'border-border/40 hover:border-border', locked && 'opacity-60')}
                          title={p.name}
                          aria-label={p.name}
                        >
                          <span className="absolute bottom-1 left-1 text-[10px] font-medium bg-background/80 rounded px-1">{p.name}</span>
                          {locked && <Lock className="absolute top-1 right-1 h-3 w-3 text-muted-foreground" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t('settings.patternColor', 'Цвет паттерна')}</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={customBackground?.patternColor ?? '#101318'} onChange={(e) => patchBg({ patternColor: e.target.value })} className="w-14 h-10 p-1 cursor-pointer" />
                    <Input type="text" value={customBackground?.patternColor ?? ''} onChange={(e) => patchBg({ patternColor: e.target.value })} placeholder="auto" className="flex-1 bg-background/50" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t('settings.patternScale', 'Масштаб')}: {customBackground?.patternScale ?? 1}x</Label>
                  <Input type="range" min={0.5} max={3} step={0.1} value={customBackground?.patternScale ?? 1} onChange={(e) => patchBg({ patternScale: parseFloat(e.target.value) })} />
                </div>
              </>
            )}

            {/* Image */}
            {currentBgType === 'image' && isPremium && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t('settings.backgroundImage', 'Изображение или GIF')}</Label>
                  <MediaUpload value={currentBgValue} onChange={(url) => patchBg({ value: url || '' })} allowGif={true} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t('settings.behavior', 'Поведение')}</Label>
                  <Select value={customBackground?.behavior ?? 'scroll'} onValueChange={(v: string) => patchBg({ behavior: v as 'scroll' | 'fixed' })}>
                    <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scroll">{t('settings.behaviorScroll', 'Прокручивается')}</SelectItem>
                      <SelectItem value="fixed">{t('settings.behaviorFixed', 'Закреплён (parallax)')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t('settings.blur', 'Размытие')}: {customBackground?.blur ?? 0}px</Label>
                  <Input type="range" min={0} max={20} value={customBackground?.blur ?? 0} onChange={(e) => patchBg({ blur: parseInt(e.target.value) })} />
                </div>
              </>
            )}

            {/* Overlay (all bg types) */}
            {currentBgType !== 'none' && (
              <div className="space-y-2 pt-2 border-t border-border/30">
                <Label className="text-xs text-muted-foreground">{t('settings.overlay', 'Затемнение / оверлей')}: {customBackground?.overlayOpacity ?? 0}%</Label>
                <div className="flex gap-2 items-center">
                  <Input type="color" value={customBackground?.overlay ?? '#000000'} onChange={(e) => patchBg({ overlay: e.target.value })} className="w-14 h-10 p-1 cursor-pointer" />
                  <Input type="range" min={0} max={80} value={customBackground?.overlayOpacity ?? 0} onChange={(e) => patchBg({ overlayOpacity: parseInt(e.target.value) })} className="flex-1" />
                </div>
              </div>
            )}
          </TabsContent>

          {/* ============ Style tab ============ */}
          <TabsContent value="style" className="p-5 pt-0 space-y-6">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t('themes.fontPair', 'Шрифтовая пара')}</Label>
              <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-1">
                {FONT_PAIR_PRESETS.map(fp => {
                  const locked = fp.isPremium && !isPremium;
                  const isActive = (currentTheme.fontPair ?? 'manrope-inter') === fp.id;
                  return (
                    <button
                      key={fp.id}
                      type="button"
                      onClick={() => requirePremium(fp.isPremium, () => setBlockField('fontPair', fp.id))}
                      className={cn('flex items-center justify-between gap-2 p-3 rounded-xl border text-left transition', isActive ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-border/50 hover:bg-muted/40', locked && 'opacity-60')}
                    >
                      <div className="min-w-0">
                        <div className="text-sm truncate" style={{ fontFamily: fp.heading }}>{fp.name}</div>
                        <div className="text-xs text-muted-foreground truncate" style={{ fontFamily: fp.body }}>Быстрая коричневая лисица • The quick brown fox</div>
                      </div>
                      {locked ? <Lock className="h-4 w-4 text-muted-foreground shrink-0" /> : isActive ? <Check className="h-4 w-4 text-primary shrink-0" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t('themes.accentColor', 'Акцентный цвет')}</Label>
              <div className="flex gap-2 items-center">
                <Input type="color" value={currentTheme.accentColor ?? '#ff5701'} onChange={(e) => requirePremium(true, () => setBlockField('accentColor', e.target.value))} className="w-14 h-10 p-1 cursor-pointer" disabled={!isPremium} />
                <Input type="text" value={currentTheme.accentColor ?? ''} onChange={(e) => requirePremium(true, () => setBlockField('accentColor', e.target.value))} placeholder={isPremium ? '#ff5701' : t('themes.premiumOnly', 'Только Premium')} className="flex-1 bg-background/50" disabled={!isPremium} />
                {!isPremium && <Badge variant="secondary" className="gap-1"><Crown className="h-3 w-3" />PRO</Badge>}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t('themes.animationStyle', 'Анимации')}</Label>
              <Select value={currentTheme.animationStyle ?? 'gentle'} onValueChange={(v: string) => setBlockField('animationStyle', v as 'none' | 'gentle' | 'energetic')}>
                <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('themes.animationNone', 'Без анимации')}</SelectItem>
                  <SelectItem value="gentle">{t('themes.animationGentle', 'Плавные')}</SelectItem>
                  <SelectItem value="energetic">{t('themes.animationEnergetic', 'Активные')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* ============ Blocks tab ============ */}
          <TabsContent value="blocks" className="p-5 pt-0 space-y-6">
            <PresetGrid
              label={t('themes.blockShape', 'Форма блоков')}
              items={BLOCK_SHAPE_PRESETS}
              current={currentTheme.blockShape ?? 'rounded'}
              isPremium={isPremium}
              onSelect={(v) => setBlockField('blockShape', v as BlockShape)}
              onUpgrade={onUpgrade}
              renderPreview={(v) => (
                <div className="w-full h-8 bg-primary/80" style={{ borderRadius: shapeRadius[v as BlockShape] }} />
              )}
            />

            <PresetGrid
              label={t('themes.blockShadow', 'Тени')}
              items={BLOCK_SHADOW_PRESETS}
              current={currentTheme.blockShadow ?? 'sm'}
              isPremium={isPremium}
              onSelect={(v) => setBlockField('blockShadow', v as BlockShadow)}
              onUpgrade={onUpgrade}
              renderPreview={(v) => (
                <div className="w-full h-8 rounded-lg bg-background border border-border/50" style={{ boxShadow: shadowCss[v as BlockShadow] }} />
              )}
            />

            <PresetGrid
              label={t('themes.blockHover', 'Ховер-эффект')}
              items={BLOCK_HOVER_PRESETS}
              current={currentTheme.blockHover ?? 'lift'}
              isPremium={isPremium}
              onSelect={(v) => setBlockField('blockHover', v as BlockHover)}
              onUpgrade={onUpgrade}
              renderPreview={(v) => (
                <div className="w-full h-8 rounded-lg bg-primary/80 text-primary-foreground text-[10px] flex items-center justify-center">{v}</div>
              )}
            />

            <PresetGrid
              label={t('themes.divider', 'Разделители')}
              items={DIVIDER_PRESETS}
              current={currentTheme.divider ?? 'none'}
              isPremium={isPremium}
              onSelect={(v) => setBlockField('divider', v as DividerStyle)}
              onUpgrade={onUpgrade}
              renderPreview={(v) => (
                <div className="w-full h-8 flex items-center justify-center">
                  <DividerPreview id={v as DividerStyle} />
                </div>
              )}
            />

            <Card className="p-4 bg-muted/20 border-border/50">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <WandSparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">{t('themes.styleApplied', 'Применяется ко всей публичной странице')}</h4>
                  <p className="text-xs text-muted-foreground">{t('themes.styleAppliedDesc', 'Форма, тени, разделители и анимации сразу видны посетителям.')}</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
});

// ============= Helpers =============

const shapeRadius: Record<BlockShape, string> = {
  sharp: '0px', soft: '8px', rounded: '16px', pill: '9999px', ticket: '20px 20px 4px 4px', squircle: '28px',
};
const shadowCss: Record<BlockShadow, string> = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0,0,0,.06), 0 1px 3px 0 rgba(0,0,0,.08)',
  md: '0 4px 6px -1px rgba(0,0,0,.08), 0 2px 4px -1px rgba(0,0,0,.05)',
  lg: '0 20px 25px -5px rgba(0,0,0,.12), 0 10px 10px -5px rgba(0,0,0,.06)',
  glow: '0 0 24px hsl(var(--primary) / 0.35)',
  inner: 'inset 0 2px 4px 0 rgba(0,0,0,.08)',
};

function SectionLabel({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
      {icon}{children}
    </Label>
  );
}

function DividerPreview({ id }: { id: DividerStyle }) {
  switch (id) {
    case 'none': return <span className="text-xs text-muted-foreground">—</span>;
    case 'hairline': return <div className="w-full h-px bg-border" />;
    case 'dotted': return <div className="w-full border-t border-dotted border-border" />;
    case 'gradient': return <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />;
    case 'ornament': return <div className="text-sm text-primary/70">✦</div>;
  }
}

interface PresetGridProps<T extends { id: string; name: string; isPremium: boolean }> {
  label: string;
  items: T[];
  current: string;
  isPremium: boolean;
  onSelect: (id: string) => void;
  onUpgrade?: () => void;
  renderPreview: (id: string) => React.ReactNode;
}

function PresetGrid<T extends { id: string; name: string; isPremium: boolean }>({ label, items, current, isPremium, onSelect, onUpgrade, renderPreview }: PresetGridProps<T>) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="grid grid-cols-3 gap-2">
        {items.map(item => {
          const locked = item.isPremium && !isPremium;
          const isActive = current === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => (locked ? onUpgrade?.() : onSelect(item.id))}
              className={cn('p-2 rounded-lg border transition text-left space-y-1.5', isActive ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-border/40 hover:bg-muted/40', locked && 'opacity-60')}
            >
              {renderPreview(item.id)}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium capitalize truncate">{item.name}</span>
                {locked ? <Lock className="h-3 w-3 text-muted-foreground shrink-0" /> : isActive ? <Check className="h-3 w-3 text-primary shrink-0" /> : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function UpgradeCard({ t, onUpgrade, title, desc }: { t: (k: string, d?: string) => string; onUpgrade?: () => void; title: string; desc: string }) {
  return (
    <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
          <Crown className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h4 className="font-semibold text-sm">{title}</h4>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <Button onClick={onUpgrade} className="w-full h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold">
        {t('common.upgrade', 'Оформить PRO')}
      </Button>
    </Card>
  );
}

interface ThemeCardProps {
  theme: ThemePreset;
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
        'relative cursor-pointer transition-all hover:scale-[1.02] overflow-hidden',
        isActive ? 'ring-2 ring-primary shadow-lg' : 'hover:ring-1 hover:ring-border',
        isLocked && 'opacity-75'
      )}
    >
      <div className={cn('h-20 p-3 flex flex-col gap-1.5', theme.preview.bg)}>
        <div className={cn('text-xs font-medium', theme.preview.text)}>Aa</div>
        <div className={cn('h-4 rounded-full w-full text-[8px] flex items-center justify-center font-medium', theme.preview.button)}>
          {t('fields.buttonText', 'Кнопка')}
        </div>
      </div>
      <div className="p-2 bg-card">
        <div className="flex items-center justify-between mb-0.5">
          <h4 className="text-sm font-semibold truncate">{t(theme.nameKey, theme.id)}</h4>
          {isActive && <Check className="h-4 w-4 text-primary shrink-0" />}
          {isLocked && !isActive && <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground truncate">{t(theme.descKey, '')}</p>
      </div>
      {isLocked && <div className="absolute inset-0 bg-background/20 backdrop-blur-[1px]" />}
    </Card>
  );
}
