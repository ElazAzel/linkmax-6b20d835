/**
 * Phase 4 — per-section composition control inside the editor canvas.
 * Writes `composition` on the FIRST block of the section run; the renderer
 * already groups contiguous blocks by sectionId into that composition.
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils/utils';
import { COMPOSITIONS, COMPOSITION_IDS, getComposition } from '@/lib/design/composition';
import LayoutTemplate from 'lucide-react/dist/esm/icons/layout-template';
import Check from 'lucide-react/dist/esm/icons/check';

interface SectionCompositionPickerProps {
  compositionId?: string;
  onSelect: (id?: string) => void;
}

export const SectionCompositionPicker = memo(function SectionCompositionPicker({
  compositionId,
  onSelect,
}: SectionCompositionPickerProps) {
  const { t } = useTranslation();
  const current = getComposition(compositionId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-1.5 h-7 rounded-full px-2.5 text-[11px] font-medium transition-colors max-w-[52%]',
            current
              ? 'bg-primary/10 text-primary'
              : 'bg-background text-muted-foreground hover:text-foreground',
          )}
        >
          <LayoutTemplate className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {current
              ? t(current.labelKey, current.labelFallback)
              : t('editor.design.compositionPick', 'Композиция')}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs">
          {t('editor.design.compositionTitle', 'Ритм секции')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onSelect(undefined)} className="text-xs">
          <span className="flex-1">{t('editor.design.compositionNone', 'Сетка по умолчанию')}</span>
          {!current && <Check className="h-3.5 w-3.5 text-primary" />}
        </DropdownMenuItem>
        {COMPOSITION_IDS.map((id) => {
          const def = COMPOSITIONS[id];
          return (
            <DropdownMenuItem key={id} onClick={() => onSelect(id)} className="text-xs">
              <span className="flex-1">{t(def.labelKey, def.labelFallback)}</span>
              {current?.id === id && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
