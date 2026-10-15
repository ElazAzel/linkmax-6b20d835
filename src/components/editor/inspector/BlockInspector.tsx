/**
 * BlockInspector — edits the selected block next to the canvas.
 *
 * Desktop (docked): a column to the right of the canvas; the page stays
 * visible and clickable, picking another block switches the inspector.
 * Phone (sheet): a non-modal bottom sheet; the selected block stays visible
 * above it. Changes reach the canvas right away; "Отменить изменения" returns
 * the block to how it was when it was opened.
 */
import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import MousePointerClick from 'lucide-react/dist/esm/icons/mouse-pointer-click';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Palette from 'lucide-react/dist/esm/icons/palette';
import Undo2 from 'lucide-react/dist/esm/icons/undo-2';
import Check from 'lucide-react/dist/esm/icons/check';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BlockEditorShell } from '@/components/block-editors/BlockEditorShell';
import { BlockStyleEditor } from '@/components/editor/BlockStyleEditor';
import { useLiveBlockDraft } from '@/hooks/editor/useLiveBlockDraft';
import { BLOCK_MANIFEST, getBlockIcon } from '@/lib/blocks/block-manifest';
import { getLucideIcon } from '@/lib/utils/icon-utils';
import { cn } from '@/lib/utils/utils';
import type { BlockType } from '@/types/blocks/base';
import type { Block } from '@/types/page';

export type BlockInspectorMode = 'docked' | 'sheet';

interface BlockInspectorProps {
  mode: BlockInspectorMode;
  /** The live block from the page, or null when nothing is being edited. */
  block: Block | null;
  onUpdateBlock: (id: string, updates: Partial<Block>) => void;
  onDeleteBlock?: (id: string) => void;
  onClose: () => void;
  /** Empty docked state actions. */
  onAddBlock?: () => void;
  onOpenTheme?: () => void;
}

const EditorFallback = () => (
  <div className="space-y-4">
    <Skeleton className="h-12 w-full rounded-control" />
    <Skeleton className="h-12 w-full rounded-control" />
    <Skeleton className="h-28 w-full rounded-control" />
  </div>
);

export function BlockInspector({
  mode,
  block,
  onUpdateBlock,
  onDeleteBlock,
  onClose,
  onAddBlock,
  onOpenTheme,
}: BlockInspectorProps) {
  const { t } = useTranslation();
  const { draft, dirty, change, flush, discard } = useLiveBlockDraft(block, onUpdateBlock);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // A new block starts in the compact sheet so it stays visible above it.
  useEffect(() => {
    setExpanded(false);
  }, [block?.id]);

  const handleDone = useCallback(() => {
    flush();
    onClose();
  }, [flush, onClose]);

  const shellBlock = useMemo(() => (block ? ({ ...block, ...draft } as Block) : null), [block, draft]);

  if (!block || !shellBlock) {
    if (mode === 'sheet') return null;
    return (
      <aside
        data-editor-inspector
        aria-label={t('editor.inspector.title', 'Настройки блока')}
        className="sticky top-20 flex flex-col items-center rounded-card border border-border bg-card px-6 py-10 text-center"
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <MousePointerClick className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="text-base font-semibold text-foreground">
          {t('editor.inspector.emptyTitle', 'Выберите блок')}
        </h2>
        <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
          {t('editor.inspector.emptyHint', 'Нажмите на блок на странице — его настройки откроются здесь, а изменения будут видны сразу.')}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {onAddBlock ? (
            <Button onClick={onAddBlock}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              {t('editor.inspector.addBlock', 'Добавить блок')}
            </Button>
          ) : null}
          {onOpenTheme ? (
            <Button variant="outline" onClick={onOpenTheme}>
              <Palette className="mr-2 h-4 w-4" aria-hidden="true" />
              {t('editor.inspector.theme', 'Оформление')}
            </Button>
          ) : null}
        </div>
      </aside>
    );
  }

  const manifest = BLOCK_MANIFEST[block.type as BlockType];
  const EditorComponent = manifest?.editor;
  const BlockIcon = getLucideIcon(getBlockIcon(block.type as BlockType));

  const editorBody: ReactNode = EditorComponent ? (
    <Suspense fallback={<EditorFallback />}>
      <EditorComponent
        formData={draft}
        onChange={change}
        {...(block.type === 'profile' ? { onComplete: handleDone } : {})}
      />
    </Suspense>
  ) : (
    <p className="text-sm text-muted-foreground">{t('blockEditor.notAvailable')}</p>
  );

  const styleTab = block.type !== 'profile' ? <BlockStyleEditor formData={draft} onChange={change} /> : undefined;

  const footer = (
    <div className="flex gap-2">
      <Button
        variant="outline"
        className="min-w-0 flex-1"
        onClick={discard}
        disabled={!dirty}
        aria-label={t('editor.inspector.discard', 'Отменить изменения')}
        title={t('editor.inspector.discard', 'Отменить изменения')}
      >
        <Undo2 className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{t('editor.inspector.discardShort', 'Отменить')}</span>
      </Button>
      <Button className="min-w-0 flex-1" onClick={handleDone}>
        <Check className="mr-2 h-4 w-4" aria-hidden="true" />
        {t('editor.inspector.done', 'Готово')}
      </Button>
    </div>
  );

  const shell = (
    <BlockEditorShell
      block={shellBlock}
      blockTypeName={t(manifest?.labelKey ?? `blockTypes.${block.type}`, block.type)}
      blockIcon={
        <Suspense fallback={<span className="h-5 w-5 rounded-full bg-muted" />}>
          <BlockIcon className="h-5 w-5 text-primary" />
        </Suspense>
      }
      useTabs={!!styleTab}
      contentTab={styleTab ? editorBody : undefined}
      styleTab={styleTab}
      onSave={flush}
      onClose={handleDone}
      onBlockUpdate={change}
      enablePreview={false}
      footerActions={footer}
      sizeSelectorOnOwnRow
      onDelete={onDeleteBlock ? () => setConfirmDelete(true) : undefined}
    >
      {!styleTab && editorBody}
    </BlockEditorShell>
  );

  const deleteDialog = onDeleteBlock ? (
    <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('common.deleteConfirmTitle', 'Удалить блок?')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('common.deleteConfirm', 'Вы уверены, что хотите удалить этот блок?')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel', 'Отмена')}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => {
              onDeleteBlock(block.id);
              onClose();
            }}
          >
            {t('common.delete', 'Удалить')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ) : null;

  if (mode === 'docked') {
    return (
      <aside
        data-editor-inspector
        aria-label={t('editor.inspector.title', 'Настройки блока')}
        className="sticky top-20 h-[calc(100dvh-7rem)] min-h-[420px] overflow-hidden rounded-card border border-border bg-card shadow-sm"
      >
        {shell}
        {deleteDialog}
      </aside>
    );
  }

  // Portal: a transformed ancestor (page transitions, translate-z-0 on the
  // dashboard layout) would make `fixed` relative to it and push the footer
  // below the screen.
  return createPortal(
    <>
      <section
        data-editor-inspector
        role="dialog"
        aria-modal="false"
        aria-label={t('editor.inspector.title', 'Настройки блока')}
        className={cn(
          'fixed inset-x-0 bottom-0 z-[60] flex flex-col overflow-hidden rounded-t-sheet border-t border-border bg-card shadow-lg',
          'pb-[env(safe-area-inset-bottom)] transition-[height] duration-200 ease-out motion-reduce:transition-none',
          expanded ? 'h-[88dvh]' : 'h-[55dvh]',
        )}
      >
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex h-6 w-full shrink-0 items-center justify-center text-muted-foreground"
          aria-label={expanded
            ? t('editor.inspector.collapse', 'Свернуть настройки')
            : t('editor.inspector.expand', 'Развернуть настройки')}
          aria-expanded={expanded}
        >
          <span className="h-1.5 w-10 rounded-full bg-border" aria-hidden="true" />
        </button>
        <div className="min-h-0 flex-1">{shell}</div>
      </section>
      {deleteDialog}
    </>,
    document.body,
  );
}
