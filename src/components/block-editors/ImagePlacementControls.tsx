import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ImagePlacement } from '@/lib/appearance/image-placement';

export function ImagePlacementControls({ value = {}, onChange }: { value?: ImagePlacement; onChange: (value: ImagePlacement) => void }) {
  const { t } = useTranslation();
  const id = useId();
  const update = (patch: ImagePlacement) => onChange({ ...value, ...patch });
  return <div className="space-y-4">
    {(['x', 'y', 'zoom'] as const).map(key => <div key={key} className="space-y-2">
      <Label htmlFor={`${id}-${key}`}>{t(`imagePlacement.${key}`)}</Label>
      <Input id={`${id}-${key}`} type="range" min={key === 'zoom' ? 1 : 0} max={key === 'zoom' ? 3 : 100} step={key === 'zoom' ? 0.05 : 1} value={value[key] ?? (key === 'zoom' ? 1 : 50)} onChange={e => update({ [key]: Number(e.target.value) })} className="h-11 px-0" />
    </div>)}
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" onClick={() => update({ rotation: ((value.rotation ?? 0) + 90) % 360 })}>{t('imagePlacement.rotate')}</Button>
      <Button variant="secondary" aria-pressed={Boolean(value.flipX)} onClick={() => update({ flipX: !value.flipX })}>{t('imagePlacement.flipX')}</Button>
      <Button variant="secondary" aria-pressed={Boolean(value.flipY)} onClick={() => update({ flipY: !value.flipY })}>{t('imagePlacement.flipY')}</Button>
      <Button variant="ghost" onClick={() => onChange({})}>{t('imagePlacement.reset')}</Button>
    </div>
    <p className="text-xs text-muted-foreground">{t('imagePlacement.hint')}</p>
  </div>;
}
