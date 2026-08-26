/**
 * SectionPickerSheet — Phase 1 redesign.
 *
 * Two tabs:
 *  READY    — context-aware recommendations (niche + what the page still lacks)
 *  SECTIONS — full SectionPattern catalog grouped by business intent
 *
 * Composition only: every pattern is built from existing block types.
 */
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LayoutTemplate from 'lucide-react/dist/esm/icons/layout-template';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils/utils';
import type { Block } from '@/types/blocks';
import {
  SECTION_PATTERNS,
  SECTION_CATEGORY_ORDER,
  SECTION_CATEGORY_LABELS,
  recommendPatterns,
  type SectionPattern,
} from '@/lib/sections/section-patterns';
import { SectionPatternPreview } from './SectionPatternPreview';

export interface SectionPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (blocks: Block[], presetId: string) => void;
  /** Block types already on the page — powers READY recommendations. */
  existingBlockTypes?: string[];
  /** Page niche, if known. */
  niche?: string | null;
}

const PatternCard = memo(function PatternCard({
  pattern,
  onPick,
}: {
  pattern: SectionPattern;
  onPick: (p: SectionPattern) => void;
}) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={() => onPick(pattern)}
      className={cn(
        'group flex flex-col gap-2.5 rounded-2xl border border-border/40 bg-card p-3 text-left transition-all',
        'hover:border-primary/50 hover:bg-accent/50 active:scale-[0.98] min-h-11',
      )}
    >
      <SectionPatternPreview preview={pattern.preview} />
      <div>
        <p className="text-sm font-semibold text-foreground">
          {t(pattern.labelKey, pattern.labelFallback)}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
          {t(pattern.descKey, pattern.descFallback)}
        </p>
      </div>
    </button>
  );
});

export const SectionPickerSheet = memo(function SectionPickerSheet({
  open,
  onOpenChange,
  onInsert,
  existingBlockTypes = [],
  niche = null,
}: SectionPickerSheetProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState('ready');

  const recommended = useMemo(
    () => (open ? recommendPatterns(existingBlockTypes, niche, 6) : []),
    [open, existingBlockTypes, niche],
  );

  const grouped = useMemo(
    () =>
      SECTION_CATEGORY_ORDER.map((category) => ({
        category,
        patterns: SECTION_PATTERNS.filter((p) => p.category === category),
      })).filter((g) => g.patterns.length > 0),
    [],
  );

  const handlePick = (pattern: SectionPattern) => {
    const blocks = pattern.build();
    if (blocks.length === 0) {
      onOpenChange(false);
      return;
    }
    onInsert(blocks, pattern.id);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[88vh] rounded-t-3xl border-0 flex flex-col">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-primary" />
            {t('editor.sections.picker.title', 'Добавить секцию')}
          </SheetTitle>
          <SheetDescription>
            {t(
              'editor.sections.picker.descV2',
              'Готовые секции с продуманной вёрсткой: герой, доказательства, запись, контакты. Добавятся в конец страницы.',
            )}
          </SheetDescription>
        </SheetHeader>

        <Tabs value={tab} onValueChange={setTab} className="mt-3 flex min-h-0 flex-1 flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ready" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              {t('editor.sections.picker.ready', 'Готовое')}
            </TabsTrigger>
            <TabsTrigger value="sections">
              {t('editor.sections.picker.sections', 'Секции')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ready" className="mt-3 min-h-0 flex-1 overflow-y-auto pb-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {recommended.map((p) => (
                <PatternCard key={p.id} pattern={p} onPick={handlePick} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sections" className="mt-3 min-h-0 flex-1 overflow-y-auto pb-6">
            <div className="space-y-5">
              {grouped.map(({ category, patterns }) => (
                <div key={category}>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t(SECTION_CATEGORY_LABELS[category].key, SECTION_CATEGORY_LABELS[category].fallback)}
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {patterns.map((p) => (
                      <PatternCard key={p.id} pattern={p} onPick={handlePick} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
});
