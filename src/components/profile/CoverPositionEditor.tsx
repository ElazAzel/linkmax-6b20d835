import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { coverHeightPixels } from '@/lib/profile-shapes';
import { getCoverPositionStyle, normalizeCoverPosition, type CoverPosition } from '@/lib/appearance/cover-position';

/** Keeps the original image intact; only its focal position is saved. */
export function CoverPositionEditor({ src, value, height, blockId, onChange }: {
  src: string;
  value?: CoverPosition;
  height?: 'small' | 'medium' | 'large' | 'xl';
  blockId?: string;
  onChange: (value: CoverPosition) => void;
}) {
  const { t } = useTranslation();
  const id = useId();
  const image = useRef<HTMLImageElement>(null);
  const drag = useRef<{ id: number; x: number; y: number; start: { x: number; y: number }; overflowX: number; overflowY: number } | null>(null);
  const [draft, setDraft] = useState<CoverPosition | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(400);
  useEffect(() => {
    const canvas = Array.from(document.querySelectorAll<HTMLElement>('[data-block-id]'))
      .find(element => element.dataset.blockId === blockId);
    const measure = () => setCanvasWidth(canvas?.getBoundingClientRect().width || Math.max(1, Math.min(400, window.innerWidth - 32)));
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    if (canvas) observer?.observe(canvas);
    window.addEventListener('resize', measure);
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure); };
  }, [blockId]);
  const position = normalizeCoverPosition(draft ?? value);
  const finish = (commit: boolean) => {
    if (!drag.current) return;
    drag.current = null;
    if (commit) onChange(position);
    setDraft(null);
  };

  return <div className="space-y-3">
    <p className="text-sm font-medium">{t('profile.coverPosition', 'Положение обложки')}</p>
    <div className="relative w-full overflow-hidden rounded-xl touch-none cursor-grab active:cursor-grabbing"
      style={{ aspectRatio: `${canvasWidth} / ${coverHeightPixels(height)}` }}
      onPointerDown={event => {
        if (event.button !== 0 || !image.current || drag.current) return;
        event.preventDefault();
        event.stopPropagation();
        const rect = event.currentTarget.getBoundingClientRect();
        const { naturalWidth, naturalHeight } = image.current;
        if (!naturalWidth || !naturalHeight) return;
        const scale = Math.max(rect.width / naturalWidth, rect.height / naturalHeight);
        drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, start: position,
          overflowX: Math.max(0, naturalWidth * scale - rect.width), overflowY: Math.max(0, naturalHeight * scale - rect.height) };
        setDraft(position);
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={event => {
        const d = drag.current;
        if (!d || d.id !== event.pointerId) return;
        setDraft(normalizeCoverPosition({
          x: d.overflowX > 0 ? d.start.x - (event.clientX - d.x) / d.overflowX * 100 : d.start.x,
          y: d.overflowY > 0 ? d.start.y - (event.clientY - d.y) / d.overflowY * 100 : d.start.y,
        }));
      }}
      onPointerUp={event => { if (drag.current?.id === event.pointerId) { finish(true); event.currentTarget.releasePointerCapture(event.pointerId); } }}
      onPointerCancel={() => finish(false)} onLostPointerCapture={() => finish(false)}>
      <img ref={image} src={src} alt={t('profile.coverPosition', 'Положение обложки')} draggable={false}
        className="absolute inset-0 h-full w-full select-none object-cover pointer-events-none" style={getCoverPositionStyle(position)} />
    </div>
    <p className="text-xs text-muted-foreground">{t('profile.coverPositionHint', 'Перетащите обложку или используйте ползунки ниже.')}</p>
    {(['x', 'y'] as const).map(axis => <div key={axis} className="space-y-1">
      <Label htmlFor={`${id}-${axis}`}>{t(`imagePlacement.${axis}`)}</Label>
      <Input id={`${id}-${axis}`} type="range" min={0} max={100} step={1} value={position[axis]}
        onChange={event => onChange({ ...position, [axis]: Number(event.target.value) })} className="h-11 px-0" />
    </div>)}
    <Button type="button" variant="ghost" onClick={() => onChange({ x: 50, y: 50 })}>{t('imagePlacement.reset')}</Button>
  </div>;
}
