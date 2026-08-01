/**
 * BlockStyleEditor — universal style customization panel for any block.
 * Edits formData.blockStyle. Drop-in for BlockEditorV2 styleTab.
 */
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils/utils';
import { AnimationSettings } from './AnimationSettings';
import type { Block } from '@/types/page';
import type { BlockStyle, BlockFontFamily } from '@/types/blocks/base';
import Palette from 'lucide-react/dist/esm/icons/palette';
import Type from 'lucide-react/dist/esm/icons/type';
import Frame from 'lucide-react/dist/esm/icons/frame';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Eraser from 'lucide-react/dist/esm/icons/eraser';

interface BlockStyleEditorProps {
  formData: Partial<Block>;
  onChange: (updates: Partial<Block>) => void;
}

const GRADIENT_PRESETS: { id: string; label: string; value: string }[] = [
  { id: 'sunset', label: 'Sunset', value: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)' },
  { id: 'aurora', label: 'Aurora', value: 'linear-gradient(135deg, #a78bfa 0%, #4ade80 100%)' },
  { id: 'ocean', label: 'Ocean', value: 'linear-gradient(135deg, #2e6b8a 0%, #5cbdb9 100%)' },
  { id: 'peach', label: 'Peach', value: 'linear-gradient(135deg, #fecaca 0%, #f9a8a8 100%)' },
  { id: 'noir', label: 'Noir', value: 'linear-gradient(135deg, #0d0d0d 0%, #2d2d2d 100%)' },
  { id: 'mint', label: 'Mint', value: 'linear-gradient(135deg, #0d1b2a 0%, #2dd4a8 100%)' },
  { id: 'gold', label: 'Gold', value: 'linear-gradient(135deg, #c9a84c 0%, #f0d78c 100%)' },
  { id: 'lavender', label: 'Lavender', value: 'linear-gradient(135deg, #c9a0dc 0%, #9b72cf 100%)' },
];

const SOLID_PRESETS = ['#ffffff', '#000000', '#0f172a', '#1e293b', '#f8fafc', '#fef3c7', '#dcfce7', '#dbeafe', '#fce7f3', '#fee2e2'];

const TEXT_COLOR_PRESETS = ['#ffffff', '#0f172a', '#1e293b', '#64748b', '#ef4444', '#22c55e', '#3b82f6', '#a855f7'];

export const BlockStyleEditor = memo(function BlockStyleEditor({ formData, onChange }: BlockStyleEditorProps) {
  const { t } = useTranslation();
  const style: BlockStyle = (formData.blockStyle as BlockStyle) || {};

  const update = useCallback(
    (patch: Partial<BlockStyle>) => {
      onChange({ ...formData, blockStyle: { ...style, ...patch } } as Partial<Block>);
    },
    [formData, onChange, style]
  );

  const resetSection = useCallback(
    (keys: (keyof BlockStyle)[]) => {
      const next: BlockStyle = { ...style };
      keys.forEach((k) => delete next[k]);
      onChange({ ...formData, blockStyle: next } as Partial<Block>);
    },
    [formData, onChange, style]
  );

  return (
    <div className="space-y-4">
      {/* Background */}
      <Section
        icon={<Palette className="h-4 w-4 text-primary" />}
        title={t('blockStyle.background', 'Фон')}
        onReset={() => resetSection(['backgroundColor', 'backgroundGradient'])}
      >
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground font-medium">
              {t('blockStyle.gradients', 'Градиенты')}
            </Label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {GRADIENT_PRESETS.map((g) => {
                const active = style.backgroundGradient === g.value;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => update({ backgroundGradient: g.value, backgroundColor: undefined })}
                    className={cn(
                      'aspect-square rounded-xl border-2 transition-all active:scale-95',
                      active ? 'border-primary ring-2 ring-primary/30' : 'border-border/40 hover:border-border'
                    )}
                    style={{ backgroundImage: g.value }}
                    aria-label={g.label}
                    title={g.label}
                  />
                );
              })}
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground font-medium">
              {t('blockStyle.solidColor', 'Однотонный')}
            </Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {SOLID_PRESETS.map((c) => {
                const active = style.backgroundColor === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => update({ backgroundColor: c, backgroundGradient: undefined })}
                    className={cn(
                      'h-8 w-8 rounded-lg border-2 transition-all active:scale-95',
                      active ? 'border-primary ring-2 ring-primary/30' : 'border-border/40'
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={c}
                  />
                );
              })}
              <ColorPicker
                value={style.backgroundColor || '#ffffff'}
                onChange={(v) => update({ backgroundColor: v, backgroundGradient: undefined })}
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Text */}
      <Section
        icon={<Type className="h-4 w-4 text-primary" />}
        title={t('blockStyle.text', 'Текст')}
        onReset={() => resetSection(['textColor', 'fontFamily', 'textEffect'])}
      >
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground font-medium">
              {t('blockStyle.textColor', 'Цвет текста')}
            </Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {TEXT_COLOR_PRESETS.map((c) => {
                const active = style.textColor === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => update({ textColor: c })}
                    className={cn(
                      'h-8 w-8 rounded-lg border-2 transition-all active:scale-95',
                      active ? 'border-primary ring-2 ring-primary/30' : 'border-border/40'
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={c}
                  />
                );
              })}
              <ColorPicker
                value={style.textColor || '#000000'}
                onChange={(v) => update({ textColor: v })}
              />
            </div>
          </div>

          <Field label={t('blockStyle.font', 'Шрифт')}>
            <Select
              value={style.fontFamily || 'sans'}
              onValueChange={(v: string) => update({ fontFamily: v as BlockFontFamily })}
            >
              <SelectTrigger className="h-10 rounded-xl bg-muted/30 border-border/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sans">Sans (Inter)</SelectItem>
                <SelectItem value="serif">Serif (Georgia)</SelectItem>
                <SelectItem value="mono">Mono</SelectItem>
                <SelectItem value="display">Display</SelectItem>
                <SelectItem value="rounded">Rounded</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label={t('blockStyle.textEffect', 'Эффект текста')}>
            <Select
              value={style.textEffect || 'none'}
              onValueChange={(v: string) => update({ textEffect: v as BlockStyle['textEffect'] })}
            >
              <SelectTrigger className="h-10 rounded-xl bg-muted/30 border-border/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('blockStyle.none', 'Нет')}</SelectItem>
                <SelectItem value="shimmer">Shimmer</SelectItem>
                <SelectItem value="glow">Glow</SelectItem>
                <SelectItem value="pulse">Pulse</SelectItem>
                <SelectItem value="blink">Blink</SelectItem>
                <SelectItem value="rainbow">Rainbow</SelectItem>
                <SelectItem value="neon">Neon</SelectItem>
                <SelectItem value="typewriter">Typewriter</SelectItem>
                <SelectItem value="gradient-flow">Gradient Flow</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Section>

      {/* Frame */}
      <Section
        icon={<Frame className="h-4 w-4 text-primary" />}
        title={t('blockStyle.frame', 'Рамка и форма')}
        onReset={() =>
          resetSection(['borderRadius', 'borderWidth', 'borderColor', 'shadow', 'padding', 'contentAlignment'])
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('blockStyle.radius', 'Скругление')}>
            <Select
              value={style.borderRadius || 'lg'}
              onValueChange={(v: string) => update({ borderRadius: v as BlockStyle['borderRadius'] })}
            >
              <SelectTrigger className="h-10 rounded-xl bg-muted/30 border-border/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">0</SelectItem>
                <SelectItem value="sm">S</SelectItem>
                <SelectItem value="md">M</SelectItem>
                <SelectItem value="lg">L</SelectItem>
                <SelectItem value="full">{t('blockStyle.pill', 'Капсула')}</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label={t('blockStyle.shadow', 'Тень')}>
            <Select
              value={style.shadow || 'none'}
              onValueChange={(v: string) => update({ shadow: v as BlockStyle['shadow'] })}
            >
              <SelectTrigger className="h-10 rounded-xl bg-muted/30 border-border/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('blockStyle.none', 'Нет')}</SelectItem>
                <SelectItem value="sm">S</SelectItem>
                <SelectItem value="md">M</SelectItem>
                <SelectItem value="lg">L</SelectItem>
                <SelectItem value="xl">XL</SelectItem>
                <SelectItem value="glow">Glow</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label={t('blockStyle.borderWidth', 'Толщина рамки')}>
            <Select
              value={style.borderWidth || 'none'}
              onValueChange={(v: string) => update({ borderWidth: v as BlockStyle['borderWidth'] })}
            >
              <SelectTrigger className="h-10 rounded-xl bg-muted/30 border-border/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('blockStyle.none', 'Нет')}</SelectItem>
                <SelectItem value="thin">1px</SelectItem>
                <SelectItem value="medium">2px</SelectItem>
                <SelectItem value="thick">3px</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label={t('blockStyle.borderColor', 'Цвет рамки')}>
            <ColorPicker
              value={style.borderColor || '#e5e7eb'}
              onChange={(v) => update({ borderColor: v })}
              full
            />
          </Field>

          <Field label={t('blockStyle.padding', 'Отступы')}>
            <Select
              value={style.padding || 'md'}
              onValueChange={(v: string) => update({ padding: v as BlockStyle['padding'] })}
            >
              <SelectTrigger className="h-10 rounded-xl bg-muted/30 border-border/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">0</SelectItem>
                <SelectItem value="sm">S</SelectItem>
                <SelectItem value="md">M</SelectItem>
                <SelectItem value="lg">L</SelectItem>
                <SelectItem value="xl">XL</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label={t('blockStyle.contentAlign', 'Контент')}>
            <Select
              value={style.contentAlignment || 'center'}
              onValueChange={(v: string) => update({ contentAlignment: v as BlockStyle['contentAlignment'] })}
            >
              <SelectTrigger className="h-10 rounded-xl bg-muted/30 border-border/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top">{t('blockStyle.top', 'Сверху')}</SelectItem>
                <SelectItem value="center">{t('blockStyle.center', 'По центру')}</SelectItem>
                <SelectItem value="bottom">{t('blockStyle.bottom', 'Снизу')}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Section>

      {/* Interaction */}
      <Section
        icon={<Sparkles className="h-4 w-4 text-primary" />}
        title={t('blockStyle.interaction', 'Взаимодействие')}
        onReset={() => resetSection(['hoverEffect'])}
      >
        <Field label={t('blockStyle.hover', 'Hover-эффект')}>
          <Select
            value={style.hoverEffect || 'none'}
            onValueChange={(v: string) => update({ hoverEffect: v as BlockStyle['hoverEffect'] })}
          >
            <SelectTrigger className="h-10 rounded-xl bg-muted/30 border-border/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('blockStyle.none', 'Нет')}</SelectItem>
              <SelectItem value="scale">Scale</SelectItem>
              <SelectItem value="lift">Lift</SelectItem>
              <SelectItem value="glow">Glow</SelectItem>
              <SelectItem value="fade">Fade</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </Section>

      {/* Typography fine-tuning */}
      <Section
        icon={<Type className="h-4 w-4 text-primary" />}
        title={t('blockStyle.typography', 'Типографика (точно)')}
        onReset={() =>
          resetSection(['fontScale', 'fontWeight', 'letterSpacing', 'lineHeight', 'textAlign', 'textTransform'])
        }
      >
        <div className="space-y-3">
          <NumberSlider
            label={t('blockStyle.fontScale', 'Размер текста')}
            value={style.fontScale}
            fallback={1}
            min={0.75}
            max={2}
            step={0.05}
            suffix="×"
            onChange={(v) => update({ fontScale: v })}
          />
          <NumberSlider
            label={t('blockStyle.letterSpacing', 'Межбуквенный интервал')}
            value={style.letterSpacing}
            fallback={0}
            min={-0.05}
            max={0.3}
            step={0.01}
            suffix="em"
            onChange={(v) => update({ letterSpacing: v })}
          />
          <NumberSlider
            label={t('blockStyle.lineHeight', 'Межстрочный интервал')}
            value={style.lineHeight}
            fallback={1.5}
            min={1}
            max={2.2}
            step={0.05}
            onChange={(v) => update({ lineHeight: v })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('blockStyle.fontWeight', 'Насыщенность')}>
              <Select
                value={String(style.fontWeight ?? 'auto')}
                onValueChange={(v: string) =>
                  update({ fontWeight: v === 'auto' ? undefined : (Number(v) as NonNullable<BlockStyle['fontWeight']>) })
                }
              >
                <SelectTrigger className="h-10 rounded-xl bg-muted/30 border-border/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">{t('blockStyle.auto', 'Авто')}</SelectItem>
                  <SelectItem value="300">300</SelectItem>
                  <SelectItem value="400">400</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                  <SelectItem value="600">600</SelectItem>
                  <SelectItem value="700">700</SelectItem>
                  <SelectItem value="800">800</SelectItem>
                  <SelectItem value="900">900</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={t('blockStyle.textAlign', 'Выравнивание')}>
              <Select
                value={style.textAlign ?? 'auto'}
                onValueChange={(v: string) =>
                  update({ textAlign: v === 'auto' ? undefined : (v as BlockStyle['textAlign']) })
                }
              >
                <SelectTrigger className="h-10 rounded-xl bg-muted/30 border-border/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">{t('blockStyle.auto', 'Авто')}</SelectItem>
                  <SelectItem value="left">{t('blockStyle.left', 'Слева')}</SelectItem>
                  <SelectItem value="center">{t('blockStyle.center', 'По центру')}</SelectItem>
                  <SelectItem value="right">{t('blockStyle.right', 'Справа')}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={t('blockStyle.textTransform', 'Регистр')}>
              <Select
                value={style.textTransform ?? 'none'}
                onValueChange={(v: string) => update({ textTransform: v as BlockStyle['textTransform'] })}
              >
                <SelectTrigger className="h-10 rounded-xl bg-muted/30 border-border/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('blockStyle.none', 'Нет')}</SelectItem>
                  <SelectItem value="uppercase">ABC</SelectItem>
                  <SelectItem value="lowercase">abc</SelectItem>
                  <SelectItem value="capitalize">Abc</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>
      </Section>

      {/* Advanced / precise container controls */}
      <Section
        icon={<SlidersHorizontal className="h-4 w-4 text-primary" />}
        title={t('blockStyle.advanced', 'Точная настройка блока')}
        onReset={() =>
          resetSection(['radiusPx', 'paddingPx', 'borderWidthPx', 'borderStyle', 'shadowColor', 'backdropBlur', 'opacity', 'rotate'])
        }
      >
        <div className="space-y-3">
          <NumberSlider
            label={t('blockStyle.radiusPx', 'Скругление, px')}
            value={style.radiusPx}
            fallback={16}
            min={0}
            max={64}
            step={1}
            suffix="px"
            onChange={(v) => update({ radiusPx: v })}
          />
          <NumberSlider
            label={t('blockStyle.paddingPx', 'Внутренние отступы, px')}
            value={style.paddingPx}
            fallback={16}
            min={0}
            max={64}
            step={1}
            suffix="px"
            onChange={(v) => update({ paddingPx: v })}
          />
          <NumberSlider
            label={t('blockStyle.borderWidthPx', 'Толщина рамки, px')}
            value={style.borderWidthPx}
            fallback={0}
            min={0}
            max={12}
            step={1}
            suffix="px"
            onChange={(v) => update({ borderWidthPx: v })}
          />
          <NumberSlider
            label={t('blockStyle.backdropBlur', 'Стекло (blur)')}
            value={style.backdropBlur}
            fallback={0}
            min={0}
            max={24}
            step={1}
            suffix="px"
            onChange={(v) => update({ backdropBlur: v })}
          />
          <NumberSlider
            label={t('blockStyle.opacity', 'Прозрачность')}
            value={style.opacity}
            fallback={100}
            min={20}
            max={100}
            step={1}
            suffix="%"
            onChange={(v) => update({ opacity: v })}
          />
          <NumberSlider
            label={t('blockStyle.rotate', 'Наклон')}
            value={style.rotate}
            fallback={0}
            min={-15}
            max={15}
            step={1}
            suffix="°"
            onChange={(v) => update({ rotate: v })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('blockStyle.borderStyle', 'Стиль рамки')}>
              <Select
                value={style.borderStyle ?? 'solid'}
                onValueChange={(v: string) => update({ borderStyle: v as BlockStyle['borderStyle'] })}
              >
                <SelectTrigger className="h-10 rounded-xl bg-muted/30 border-border/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">{t('blockStyle.solid', 'Сплошная')}</SelectItem>
                  <SelectItem value="dashed">{t('blockStyle.dashed', 'Пунктир')}</SelectItem>
                  <SelectItem value="dotted">{t('blockStyle.dotted', 'Точки')}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={t('blockStyle.shadowColor', 'Цвет тени')}>
              <ColorPicker
                value={style.shadowColor || '#00000022'}
                onChange={(v) => update({ shadowColor: v })}
                full
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* Animation reused */}
      <AnimationSettings
        style={style}
        onChange={(next) => onChange({ ...formData, blockStyle: next } as Partial<Block>)}
      />
    </div>
  );
});

/* ---------- helpers ---------- */

function Section({
  icon,
  title,
  onReset,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  onReset?: () => void;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border border-border/30 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3 bg-muted/20">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold">{title}</span>
        </div>
        {onReset && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-7 px-2 rounded-lg text-xs text-muted-foreground hover:text-foreground"
          >
            <Eraser className="h-3 w-3 mr-1" />
            {t('blockStyle.reset', 'Сброс')}
          </Button>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground font-medium">{label}</Label>
      {children}
    </div>
  );
}

function ColorPicker({
  value,
  onChange,
  full,
}: {
  value: string;
  onChange: (v: string) => void;
  full?: boolean;
}) {
  return (
    <label
      className={cn(
        'relative inline-flex items-center gap-2 h-10 px-2.5 rounded-xl bg-muted/30 border border-border/30 cursor-pointer',
        full && 'w-full'
      )}
    >
      <span
        className="h-6 w-6 rounded-md border border-border/40 shrink-0"
        style={{ backgroundColor: value }}
      />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 px-1.5 text-xs bg-transparent border-0 focus-visible:ring-0"
      />
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer"
        aria-label="color"
      />
    </label>
  );
}
