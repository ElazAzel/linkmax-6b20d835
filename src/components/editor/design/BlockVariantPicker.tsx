/**
 * Phase 4 — per-block art direction control.
 * Lets the user pick a named BlockVariant (designVariant) for the current block.
 * No new engine: it only writes `designVariant` which the renderer already resolves.
 */
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils/utils';
import { getVariantsForType } from '@/lib/design/block-variants';
import type { Block } from '@/types/page';
import Wand2 from 'lucide-react/dist/esm/icons/wand-2';

interface BlockVariantPickerProps {
  formData: Partial<Block>;
  onChange: (updates: Partial<Block>) => void;
}

export const BlockVariantPicker = memo(function BlockVariantPicker({
  formData,
  onChange,
}: BlockVariantPickerProps) {
  const { t } = useTranslation();
  const type = String(formData.type || '');
  const variants = useMemo(() => getVariantsForType(type), [type]);
  const active = (formData as any).designVariant as string | undefined;

  if (!type || variants.length === 0) return null;

  const select = (id?: string) => {
    onChange({ ...formData, designVariant: id } as Partial<Block>);
  };

  return (
    <div className="rounded-2xl border-0 bg-muted/25 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Wand2 className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">
          {t('editor.design.variantTitle', 'Стиль оформления')}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        {t('editor.design.variantHint', 'Готовые художественные пресеты для этого блока.')}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => select(undefined)}
          className={cn(
            'h-8 rounded-full px-3 text-xs font-medium transition-colors',
            !active
              ? 'bg-primary text-primary-foreground'
              : 'bg-background text-muted-foreground hover:text-foreground',
          )}
        >
          {t('editor.design.variantNone', 'Обычный')}
        </button>
        {variants.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => select(v.id)}
            className={cn(
              'h-8 rounded-full px-3 text-xs font-medium transition-colors',
              active === v.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:text-foreground',
            )}
          >
            {t(v.labelKey, v.labelFallback)}
          </button>
        ))}
      </div>
    </div>
  );
});
