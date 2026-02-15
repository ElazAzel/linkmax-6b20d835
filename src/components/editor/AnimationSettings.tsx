import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Zap } from 'lucide-react';
import type { BlockStyle } from '@/types/page';
import { useTranslation } from 'react-i18next';

interface AnimationSettingsProps {
  style?: BlockStyle;
  onChange: (style: BlockStyle) => void;
}

export function AnimationSettings({ style = {}, onChange }: AnimationSettingsProps) {
  const { t } = useTranslation();
  const handleAnimationChange = (animation: string) => {
    onChange({ ...style, animation: animation as BlockStyle['animation'] });
  };

  const handleSpeedChange = (speed: string) => {
    onChange({ ...style, animationSpeed: speed as BlockStyle['animationSpeed'] });
  };

  const handleDelayChange = (value: number[]) => {
    onChange({ ...style, animationDelay: value[0] });
  };

  const hasAnimation = style.animation && style.animation !== 'none';

  return (
    <div className="rounded-2xl border border-border/30 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/20">
        <Zap className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">{t('animationSettings.title', 'Анимация появления')}</span>
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground font-medium">{t('animationSettings.type', 'Тип анимации')}</Label>
          <Select
            value={style.animation || 'none'}
            onValueChange={handleAnimationChange}
            modal={false}
          >
            <SelectTrigger className="h-10 rounded-xl bg-muted/30 border-border/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('animationSettings.none', 'Без анимации')}</SelectItem>
              <SelectItem value="fade-in">{t('animationSettings.fadeIn', 'Появление (Fade In)')}</SelectItem>
              <SelectItem value="slide-up">{t('animationSettings.slideUp', 'Снизу вверх (Slide Up)')}</SelectItem>
              <SelectItem value="scale-in">{t('animationSettings.scaleIn', 'Увеличение (Scale In)')}</SelectItem>
              <SelectItem value="bounce">{t('animationSettings.bounce', 'Отскок (Bounce)')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasAnimation && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-medium">{t('animationSettings.speed', 'Скорость')}</Label>
              <Select
                value={style.animationSpeed || 'normal'}
                onValueChange={handleSpeedChange}
                modal={false}
              >
                <SelectTrigger className="h-10 rounded-xl bg-muted/30 border-border/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slow">{t('animationSettings.speedSlow', 'Медленно (0.8s)')}</SelectItem>
                  <SelectItem value="normal">{t('animationSettings.speedNormal', 'Нормально (0.5s)')}</SelectItem>
                  <SelectItem value="fast">{t('animationSettings.speedFast', 'Быстро (0.3s)')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground font-medium">
                {t('animationSettings.delay', 'Задержка: {{value}}мс', { value: style.animationDelay || 0 })}
              </Label>
              <Slider
                value={[style.animationDelay || 0]}
                onValueChange={handleDelayChange}
                min={0}
                max={2000}
                step={100}
                className="mt-1"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
