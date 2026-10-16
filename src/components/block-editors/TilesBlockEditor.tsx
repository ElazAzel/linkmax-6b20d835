import { useTranslation } from 'react-i18next';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { MediaUpload } from '@/components/form-fields/MediaUpload';
import { migrateToMultilingual } from '@/lib/i18n-helpers';
import { validateTilesBlock } from '@/lib/blocks/block-validators';
import { cn } from '@/lib/utils/utils';
import type { TileItem } from '@/types/page';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { EditorField } from './EditorSection';

const MAX_TILES = 12;

function newTileId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function TilesBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t } = useTranslation();
  const items: TileItem[] = Array.isArray(formData.items) ? formData.items : [];
  const set = (patch: Record<string, unknown>) => onChange({ ...formData, ...patch });
  const setItems = (next: TileItem[]) => set({ items: next });
  const updateItem = (index: number, patch: Partial<TileItem>) =>
    setItems(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
  };

  const choice = <T extends string | number>(value: T, current: T, label: string, apply: () => void) => (
    <button
      key={String(value)}
      type="button"
      aria-pressed={current === value}
      onClick={apply}
      className={cn('h-10 flex-1 rounded-xl text-sm font-medium transition-colors',
        current === value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-5">
      <MultilingualInput
        label={t('tilesBlock.heading', 'Заголовок над плитками')}
        value={migrateToMultilingual(formData.title)}
        onChange={(title) => set({ title })}
      />
      <div className="grid grid-cols-2 gap-3">
        <EditorField label={t('tilesBlock.columns', 'Колонки')}>
          <div className="flex gap-1 rounded-2xl bg-muted/60 p-1">
            {choice(2, formData.columns === 3 ? 3 : 2, '2', () => set({ columns: 2 }))}
            {choice(3, formData.columns === 3 ? 3 : 2, '3', () => set({ columns: 3 }))}
          </div>
        </EditorField>
        <EditorField label={t('tilesBlock.shape', 'Форма')}>
          <div className="flex gap-1 rounded-2xl bg-muted/60 p-1">
            {choice('square', formData.aspect === 'portrait' ? 'portrait' : 'square', '1:1', () => set({ aspect: 'square' }))}
            {choice('portrait', formData.aspect === 'portrait' ? 'portrait' : 'square', '4:5', () => set({ aspect: 'portrait' }))}
          </div>
        </EditorField>
      </div>

      <ol className="space-y-3">
        {items.map((item, index) => (
          <li key={item.id} className="space-y-3 rounded-2xl border border-border/70 bg-card p-3">
            <div className="flex items-center gap-1">
              <span className="flex-1 text-sm font-semibold">{t('tilesBlock.tile', 'Плитка')} {index + 1}</span>
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full" disabled={index === 0}
                onClick={() => move(index, -1)} aria-label={t('common.moveUp', 'Выше')}>
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full" disabled={index === items.length - 1}
                onClick={() => move(index, 1)} aria-label={t('common.moveDown', 'Ниже')}>
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full text-destructive hover:text-destructive"
                onClick={() => setItems(items.filter((_, i) => i !== index))} aria-label={t('common.delete', 'Удалить')}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <MediaUpload value={item.image || ''} onChange={(image) => updateItem(index, { image })} accept="image/*" />
            <MultilingualInput
              label={t('tilesBlock.caption', 'Подпись')}
              value={migrateToMultilingual(item.title)}
              onChange={(title) => updateItem(index, { title })}
            />
            <Input
              type="url"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              aria-label={t('fields.url', 'Ссылка')}
              value={item.url || ''}
              onChange={(event) => updateItem(index, { url: event.target.value })}
              placeholder="https://"
              className="h-12 rounded-xl"
            />
          </li>
        ))}
      </ol>

      {items.length < MAX_TILES && (
        <Button type="button" variant="outline" className="h-12 w-full rounded-2xl"
          onClick={() => setItems([...items, { id: newTileId(), title: '', image: '', url: '' }])}>
          <Plus className="mr-2 h-4 w-4" />
          {t('tilesBlock.add', 'Добавить плитку')}
        </Button>
      )}
    </div>
  );
}

export const TilesBlockEditor = withBlockEditor(TilesBlockEditorComponent, { validate: validateTilesBlock });
