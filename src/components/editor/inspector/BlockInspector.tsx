/**
 * BlockInspector — edits the selected block next to the canvas.
 *
 * Desktop (docked): a column to the right of the canvas; the page stays
 * visible and clickable, picking another block switches the inspector.
 * Phone (sheet): a full-screen form with a fixed header and actions.
 * Changes reach the canvas right away; "Отменить изменения" returns
 * the block to how it was when it was opened.
 */
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
import { InspectorPanel } from './InspectorPanel';

import { useLiveBlockDraft } from '@/hooks/editor/useLiveBlockDraft';
import { BLOCK_MANIFEST } from '@/lib/blocks/block-manifest';
import type { BlockType } from '@/types/blocks/base';
import type { Block } from '@/types/page';
import { withUrlSchemes } from '@/lib/blocks/safe-href';

export type BlockInspectorMode = 'docked' | 'sheet';

interface BlockInspectorProps {
  mode: BlockInspectorMode;
  /** The live block from the page, or null when nothing is being edited. */
  block: Block | null;
  onUpdateBlock: (id: string, updates: Partial<Block>) => void;
  onDeleteBlock?: (id: string) => void;
  onClose: () => void;
  /** Open the block picker right below the edited block. */
  onAddBelow?: (blockId: string) => void;
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

export function BlockInspector(props: BlockInspectorProps) {
  // The draft and the selected input language belong to one block editing session.
  // Keyed by type too: after «Преобразовать в…» the old draft (with the old
  // type) won over the new block and the next edit reverted the transform.
  return <BlockInspectorSession key={props.block ? `${props.block.id}:${props.block.type}` : undefined} {...props} />;
}

function BlockInspectorSession({
  mode,
  block,
  onUpdateBlock,
  onDeleteBlock,
  onClose,
  onAddBelow,
  onAddBlock,
  onOpenTheme,
}: BlockInspectorProps) {
  const { t } = useTranslation();
  const { draft, dirty, change, flush, discard, cancelPending } = useLiveBlockDraft(block, onUpdateBlock);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const sheetRef = useRef<HTMLElement>(null);
  const blockId = block?.id;

  // Mobile browsers keep the layout viewport tall when the keyboard opens.
  // Follow the visible viewport so the scroll area and Done remain reachable.
  useEffect(() => {
    if (mode !== 'sheet' || !blockId) return;
    const viewport = window.visualViewport;
    const syncViewport = () => {
      if (!viewport || !sheetRef.current) return;
      sheetRef.current.style.height = `${viewport.height}px`;
      sheetRef.current.style.top = `${viewport.offsetTop}px`;
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    syncViewport();
    viewport?.addEventListener('resize', syncViewport);
    viewport?.addEventListener('scroll', syncViewport);
    return () => {
      document.body.style.overflow = previousOverflow;
      viewport?.removeEventListener('resize', syncViewport);
      viewport?.removeEventListener('scroll', syncViewport);
    };
  }, [mode, blockId]);

  useEffect(() => {
    if (!block) return;
    const handleSave = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        flush();
      }
    };
    window.addEventListener('keydown', handleSave);
    return () => window.removeEventListener('keydown', handleSave);
  }, [block, flush]);

  const handleDone = useCallback(() => {
    flush();
    if (block) {
      const schemes = withUrlSchemes({ ...block, ...draft } as Record<string, unknown>);
      if (Object.keys(schemes).length > 0) onUpdateBlock(block.id, schemes as Partial<Block>);
    }
    onClose();
  }, [block, draft, flush, onClose, onUpdateBlock]);

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
    <InspectorPanel block={shellBlock} mobile={mode === 'sheet'} title={t(manifest?.labelKey ?? `blockTypes.${block.type}`, block.type)}
      editorBody={editorBody} onChange={change} onClose={handleDone} footer={footer}
      // The profile header cannot be removed; offering Delete did nothing.
      onDelete={onDeleteBlock && block.type !== 'profile' ? () => setConfirmDelete(true) : undefined}
      onAddBelow={onAddBelow && block.type !== 'profile' ? () => { handleDone(); onAddBelow(block.id); } : undefined} />
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
              cancelPending();
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
        ref={sheetRef}
        data-editor-inspector
        role="dialog"
        aria-modal="false"
        aria-label={t('editor.inspector.title', 'Настройки блока')}
        className="fixed inset-x-0 top-0 z-[60] flex h-dvh flex-col overflow-hidden overscroll-none bg-card pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] shadow-lg"
      >
        <div className="min-h-0 flex-1">{shell}</div>
      </section>
      {deleteDialog}
    </>,
    document.body,
  );
}
