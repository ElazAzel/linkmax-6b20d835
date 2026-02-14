import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
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

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-card/50">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        <h3 className="font-medium">{t('animationSettings.title', 'Анимация появления')}</h3>
      </div>

      <div className="space-y-4">
        <div>
          <Label>{t('animationSettings.type', 'Тип анимации')}</Label>
          <Select
            value={style.animation || 'none'}
            onValueChange={handleAnimationChange}
          >
            <SelectTrigger>
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

        {style.animation && style.animation !== 'none' && (
          <>
            <div>
              <Label>{t('animationSettings.speed', 'Скорость анимации')}</Label>
              <Select
                value={style.animationSpeed || 'normal'}
                onValueChange={handleSpeedChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slow">{t('animationSettings.speedSlow', 'Медленно (0.8s)')}</SelectItem>
                  <SelectItem value="normal">{t('animationSettings.speedNormal', 'Нормально (0.5s)')}</SelectItem>
                  <SelectItem value="fast">{t('animationSettings.speedFast', 'Быстро (0.3s)')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>
                {t('animationSettings.delay', 'Задержка: {{value}}мс', { value: style.animationDelay || 0 })}
              </Label>
              <Slider
                value={[style.animationDelay || 0]}
                onValueChange={handleDelayChange}
                min={0}
                max={2000}
                step={100}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('animationSettings.delayHint', 'Время до начала анимации (0-2000мс)')}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
