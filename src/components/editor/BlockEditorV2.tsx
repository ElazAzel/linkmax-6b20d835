/**
 * BlockEditorV2 - Enhanced block editor with new shell, autosave, and preview
 * Mobile-first design with improved UX
 * 
 * Now manifest-driven: lazy imports, icons, and editor routing come from BLOCK_MANIFEST.
 */
import { useState, useEffect, lazy, Suspense, useCallback, useRef, useMemo, useDeferredValue } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
    Drawer,
    DrawerContent,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/ui/use-mobile';
import { getLucideIcon } from '@/lib/utils/icon-utils';
import { cn } from '@/lib/utils/utils';
import { BlockEditorShell } from '../block-editors/BlockEditorShell';
import { BlockStyleEditor } from './BlockStyleEditor';
import type { Block } from '@/types/page';
import { BLOCK_MANIFEST, getBlockIcon } from '@/lib/blocks/block-manifest';
import type { BlockType } from '@/types/blocks/base';

// Lazy load BlockRenderer for Preview
const BlockRenderer = lazy(() => import('./BlockRenderer').then(m => ({ default: m.BlockRenderer })));

interface BlockEditorV2Props {
    block: Block | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (updates: Partial<Block>) => void;
    /** Enable autosave (optional, default: true) */
    enableAutosave?: boolean;
    /** Autosave delay in ms (default: 2000) */
    autosaveDelay?: number;
    /** Delete handler */
    onDelete?: (id: string) => void;
}

// Loading fallback
const EditorFallback = () => (
    <div className="space-y-5 p-5 outline-none" tabIndex={-1} autoFocus>
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
    </div>
);

export function BlockEditorV2({
    block,
    isOpen,
    onClose,
    onSave,
    enableAutosave = true,
    autosaveDelay = 2000,
    onDelete,
}: BlockEditorV2Props) {
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const [formData, setFormData] = useState<Partial<Block>>(() => block ? { ...block } : {});
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const deferredFormData = useDeferredValue(formData);
    const currentBlockIdRef = useRef<string | null>(block ? block.id : null);

    // Update formData when block changes (only if it's a completely new block)
    useEffect(() => {
        if (block && block.id !== currentBlockIdRef.current) {
            setFormData({ ...block });
            currentBlockIdRef.current = block.id;
            setHasUnsavedChanges(false);
            setLastSaved(null);
        }
    }, [block]);

    // Check for unsaved changes
    const handleFormChange = useCallback((updates: Partial<Block>) => {
        setFormData(updates);
        setHasUnsavedChanges(true);

        // Autosave if enabled
        if (enableAutosave) {
            if (autosaveTimerRef.current) {
                clearTimeout(autosaveTimerRef.current);
            }
            autosaveTimerRef.current = setTimeout(() => {
                performSave(updates, false);
            }, autosaveDelay);
        }
    }, [enableAutosave, autosaveDelay]);

    // Perform save
    const performSave = useCallback(async (data: Partial<Block>, closeAfter: boolean = true) => {
        setIsSaving(true);
        try {
            await onSave(data);
            setLastSaved(new Date());
            setHasUnsavedChanges(false);
            if (closeAfter) {
                onClose();
            }
        } finally {
            setIsSaving(false);
        }
    }, [onSave, onClose]);

    // Manual save
    const handleSave = useCallback(() => {
        if (autosaveTimerRef.current) {
            clearTimeout(autosaveTimerRef.current);
        }
        performSave(formData, true);
    }, [formData, performSave]);

    // Cleanup autosave timer
    useEffect(() => {
        return () => {
            if (autosaveTimerRef.current) {
                clearTimeout(autosaveTimerRef.current);
            }
        };
    }, []);

    // Ensure editor state is synchronized whenever the sheet/dialog is reopened.
    useEffect(() => {
        if (!isOpen || !block) return;
        setFormData({ ...block });
        setHasUnsavedChanges(false);
        setLastSaved(null);
    }, [isOpen, block]);

    // Intercept close attempt
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

    const handleCloseAttempt = useCallback(() => {
        if (isSaving) return;

        if (hasUnsavedChanges && enableAutosave) {
            if (autosaveTimerRef.current) {
                clearTimeout(autosaveTimerRef.current);
            }
            performSave(formData, true);
        } else if (hasUnsavedChanges) {
            setShowUnsavedDialog(true);
        } else {
            onClose();
        }
    }, [hasUnsavedChanges, enableAutosave, performSave, formData, onClose, isSaving]);

    const handleDiscard = useCallback(() => {
        setShowUnsavedDialog(false);
        onClose();
    }, [onClose]);

    const handleSaveAndClose = useCallback(() => {
        if (autosaveTimerRef.current) {
            clearTimeout(autosaveTimerRef.current);
        }
        performSave(formData, true);
        setShowUnsavedDialog(false);
    }, [performSave, formData]);

    // Manifest-driven icon lookup
    const BlockIcon = useMemo(() => {
        if (!block) return getLucideIcon('Box');
        return getLucideIcon(getBlockIcon(block.type as BlockType));
    }, [block?.type]);

    if (!block) return null;

    const commonProps = {
        formData,
        onChange: handleFormChange,
    };

    const blockTypeName = t(`blockEditor.${block.type}`, block.type);

    // Manifest-driven editor rendering
    const renderEditor = () => {
        const manifest = BLOCK_MANIFEST[block.type as BlockType];
        if (!manifest) {
            return (
                <p className="text-base text-muted-foreground p-4">
                    {t('blockEditor.notAvailable')}
                </p>
            );
        }

        const EditorComponent = manifest.editor;
        const editorProps: Record<string, unknown> = { ...commonProps };

        // Special case: profile editor gets onComplete
        if (block.type === 'profile') {
            editorProps.onComplete = () => performSave(formData, true);
        }

        return (
            <Suspense fallback={<EditorFallback />}>
                <EditorComponent {...editorProps} />
            </Suspense>
        );
    };

    // Live Preview Component
    const previewComponent = (
        <div className="flex flex-col h-full bg-muted/10">
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-[320px] bg-background rounded-[2rem] shadow-xl overflow-hidden border border-border/10">
                    <div className="p-4">
                        <Suspense fallback={<div className="h-20 bg-muted animate-pulse rounded-xl" />}>
                            <BlockRenderer
                                block={deferredFormData as Block}
                                isPreview={true}
                            />
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    );

    // Shell content
    const shellContent = (
        <BlockEditorShell
            block={block}
            blockTypeName={blockTypeName}
            blockIcon={
                <Suspense fallback={<div className="h-5 w-5 bg-muted rounded-full" />}>
                    <BlockIcon className="h-5 w-5 text-primary" />
                </Suspense>
            }
            useTabs={false}
            isSaving={isSaving}
            lastSaved={lastSaved}
            hasUnsavedChanges={hasUnsavedChanges}
            onSave={handleSave}
            onClose={handleCloseAttempt}
            onBlockUpdate={(updates) => handleFormChange({ ...formData, ...updates } as Partial<Block>)}
            enablePreview={block.type !== 'profile'}
            previewComponent={previewComponent}
            onDelete={onDelete ? () => setShowDeleteDialog(true) : undefined}
        >

            {renderEditor()}
        </BlockEditorShell>
    );

    const unsavedDialog = (
        <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
            <DialogContent className="sm:max-w-[425px] rounded-2xl">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2 text-center sm:text-left">
                        <DialogTitle className="text-lg font-bold">{t('editor.unsavedChanges', 'Несохраненные изменения')}</DialogTitle>
                        <DialogDescription className="text-muted-foreground text-sm">
                            {t('editor.unsavedDescription', 'У вас есть изменения, которые еще не были сохранены. Что вы хотите сделать?')}
                        </DialogDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 mt-2">
                        <Button
                            variant="destructive"
                            onClick={handleDiscard}
                            className="flex-1 rounded-xl"
                        >
                            {t('editor.discard', 'Сбросить')}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setShowUnsavedDialog(false)}
                            className="flex-1 rounded-xl"
                        >
                            {t('editor.cancel', 'Отмена')}
                        </Button>
                        <Button
                            onClick={handleSaveAndClose}
                            className="flex-1 rounded-xl shadow-lg shadow-primary/25"
                        >
                            {t('editor.saveAndClose', 'Сохранить')}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );

    const deleteDialog = onDelete && block ? (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
                            onDelete(block.id);
                            onClose();
                        }}
                    >
                        {t('common.delete', 'Удалить')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    ) : null;

    // Mobile: Full-screen drawer
    if (isMobile) {
        return (
            <>
                <Drawer open={isOpen} onOpenChange={(open) => !open && handleCloseAttempt()}>
                    <DrawerContent className="h-[96vh] max-h-[96vh] bg-background border-t-0 rounded-t-[32px]">
                        {shellContent}
                    </DrawerContent>
                </Drawer>
                {unsavedDialog}
                {deleteDialog}
            </>
        );
    }

    // Desktop: Dialog with larger width for preview
    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && handleCloseAttempt()}>
                <DialogContent className="max-w-3xl h-[85vh] p-0 flex flex-col overflow-hidden bg-card/95 backdrop-blur-2xl border border-border/20 shadow-2xl rounded-3xl" aria-describedby={undefined}>
                    <DialogTitle className="sr-only">{t('blockEditor.title', 'Edit Block')}</DialogTitle>
                    <DialogDescription className="sr-only">
                        {t('blockEditor.description', 'Редактируйте параметры и контент блока')}
                    </DialogDescription>
                    <div className="flex-1 h-full min-h-0">
                        {shellContent}
                    </div>
                </DialogContent>
            </Dialog>
            {unsavedDialog}
            {deleteDialog}
        </>
    );
}

export default BlockEditorV2;
