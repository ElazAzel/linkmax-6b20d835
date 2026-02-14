import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import type { BlockStyle } from '@/types/page';

interface AnimationSettingsProps {
  style?: BlockStyle;
  onChange: (style: BlockStyle) => void;
}

export function AnimationSettings({ style = {}, onChange }: AnimationSettingsProps) {
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
        <h3 className="font-medium">Анимация появления</h3>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Тип анимации</Label>
          <Select
            value={style.animation || 'none'}
            onValueChange={handleAnimationChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Без анимации</SelectItem>
              <SelectItem value="fade-in">Появление (Fade In)</SelectItem>
              <SelectItem value="slide-up">Снизу вверх (Slide Up)</SelectItem>
              <SelectItem value="scale-in">Увеличение (Scale In)</SelectItem>
              <SelectItem value="bounce">Отскок (Bounce)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {style.animation && style.animation !== 'none' && (
          <>
            <div>
              <Label>Скорость анимации</Label>
              <Select
                value={style.animationSpeed || 'normal'}
                onValueChange={handleSpeedChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slow">Медленно (0.8s)</SelectItem>
                  <SelectItem value="normal">Нормально (0.5s)</SelectItem>
                  <SelectItem value="fast">Быстро (0.3s)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>
                Задержка: {style.animationDelay || 0}ms
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
                Время до начала анимации (0-2000ms)
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
