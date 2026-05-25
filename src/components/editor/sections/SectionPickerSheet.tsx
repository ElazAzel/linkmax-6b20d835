/**
 * SectionPickerSheet — Sprint 2.
 * Lets the user append a ready-made section (a group of blocks) to the
 * current page. Composition only — no new block types.
 */
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import LayoutTemplate from 'lucide-react/dist/esm/icons/layout-template';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { SECTION_PRESETS, type SectionPreset } from '@/lib/sections/section-presets';
import { cn } from '@/lib/utils/utils';
import type { Block } from '@/types/blocks';

export interface SectionPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (blocks: Block[], presetId: string) => void;
}

export const SectionPickerSheet = memo(function SectionPickerSheet({
  open,
  onOpenChange,
  onInsert,
}: SectionPickerSheetProps) {
  const { t } = useTranslation();
  const presets = useMemo(() => SECTION_PRESETS.filter((p) => p.id !== 'blank'), []);

  const handlePick = (preset: SectionPreset) => {
    const blocks = preset.build();
    if (blocks.length === 0) {
      onOpenChange(false);
      return;
    }
    onInsert(blocks, preset.id);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-3xl border-0">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-primary" />
            {t('editor.sections.picker.title', 'Добавить секцию')}
          </SheetTitle>
          <SheetDescription>
            {t(
              'editor.sections.picker.desc',
              'Готовые блоки-шаблоны: Hero, цены, FAQ, контакты. Добавятся в конец страницы — потом отредактируете.',
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pb-6 overflow-y-auto">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePick(preset)}
              className={cn(
                'group text-left rounded-2xl border border-border/40 bg-card p-4 transition-all',
                'hover:border-primary/50 hover:bg-accent active:scale-[0.98]',
              )}
            >
              <p className="text-sm font-semibold text-foreground">
                {t(preset.labelKey, preset.labelFallback)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {t(preset.descKey, preset.descFallback)}
              </p>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
});
