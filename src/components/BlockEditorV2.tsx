/**
 * BlockEditorV2 - Enhanced block editor with new shell, autosave, and preview
 * Mobile-first design with improved UX
 */
import { useState, useEffect, lazy, Suspense, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import {
    Drawer,
    DrawerContent,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { getLucideIcon } from '@/lib/icon-utils';
import { cn } from '@/lib/utils';
import { BlockEditorShell } from './block-editors/BlockEditorShell';
import type { Block } from '@/types/page';

// Lazy load all block editors for code splitting
const ProfileEditorWizard = lazy(() => import('./block-editors/ProfileEditorWizard').then(m => ({ default: m.ProfileEditorWizard })));
const TextBlockEditor = lazy(() => import('./block-editors/TextBlockEditor').then(m => ({ default: m.TextBlockEditor })));
const LinkBlockEditor = lazy(() => import('./block-editors/LinkBlockEditor').then(m => ({ default: m.LinkBlockEditor })));
const ProductBlockEditor = lazy(() => import('./block-editors/ProductBlockEditor').then(m => ({ default: m.ProductBlockEditor })));
const VideoBlockEditor = lazy(() => import('./block-editors/VideoBlockEditor').then(m => ({ default: m.VideoBlockEditor })));
const CarouselBlockEditor = lazy(() => import('./block-editors/CarouselBlockEditor').then(m => ({ default: m.CarouselBlockEditor })));
const ButtonBlockEditor = lazy(() => import('./block-editors/ButtonBlockEditor').then(m => ({ default: m.ButtonBlockEditor })));
const SocialsBlockEditor = lazy(() => import('./block-editors/SocialsBlockEditor').then(m => ({ default: m.SocialsBlockEditor })));
const ImageBlockEditor = lazy(() => import('./block-editors/ImageBlockEditor').then(m => ({ default: m.ImageBlockEditor })));
const CustomCodeBlockEditor = lazy(() => import('./block-editors/CustomCodeBlockEditor').then(m => ({ default: m.CustomCodeBlockEditor })));
const MessengerBlockEditor = lazy(() => import('./block-editors/MessengerBlockEditor').then(m => ({ default: m.MessengerBlockEditor })));
const FormBlockEditor = lazy(() => import('./block-editors/FormBlockEditor').then(m => ({ default: m.FormBlockEditor })));
const DownloadBlockEditor = lazy(() => import('./block-editors/DownloadBlockEditor').then(m => ({ default: m.DownloadBlockEditor })));
const NewsletterBlockEditor = lazy(() => import('./block-editors/NewsletterBlockEditor').then(m => ({ default: m.NewsletterBlockEditor })));
const TestimonialBlockEditor = lazy(() => import('./block-editors/TestimonialBlockEditor').then(m => ({ default: m.TestimonialBlockEditor })));
const ScratchBlockEditor = lazy(() => import('./block-editors/ScratchBlockEditor').then(m => ({ default: m.ScratchBlockEditor })));
const MapBlockEditor = lazy(() => import('./block-editors/MapBlockEditor').then(m => ({ default: m.MapBlockEditor })));
const AvatarBlockEditor = lazy(() => import('./block-editors/AvatarBlockEditor').then(m => ({ default: m.AvatarBlockEditor })));
const SeparatorBlockEditor = lazy(() => import('./block-editors/SeparatorBlockEditor').then(m => ({ default: m.SeparatorBlockEditor })));
const CatalogBlockEditor = lazy(() => import('./block-editors/CatalogBlockEditor').then(m => ({ default: m.CatalogBlockEditor })));
const BeforeAfterBlockEditor = lazy(() => import('./block-editors/BeforeAfterBlockEditor').then(m => ({ default: m.BeforeAfterBlockEditor })));
const FAQBlockEditor = lazy(() => import('./block-editors/FAQBlockEditor').then(m => ({ default: m.FAQBlockEditor })));
const CountdownBlockEditor = lazy(() => import('./block-editors/CountdownBlockEditor').then(m => ({ default: m.CountdownBlockEditor })));
const PricingBlockEditor = lazy(() => import('./block-editors/PricingBlockEditor').then(m => ({ default: m.PricingBlockEditor })));
const ShoutoutBlockEditor = lazy(() => import('./block-editors/ShoutoutBlockEditor').then(m => ({ default: m.ShoutoutBlockEditor })));
const BookingBlockEditor = lazy(() => import('./block-editors/BookingBlockEditor').then(m => ({ default: m.BookingBlockEditor })));
const CommunityBlockEditor = lazy(() => import('./block-editors/CommunityBlockEditor').then(m => ({ default: m.CommunityBlockEditor })));
const EventBlockEditor = lazy(() => import('./block-editors/EventBlockEditor').then(m => ({ default: m.EventBlockEditor })));

// Lazy load BlockRenderer for Preview
const BlockRenderer = lazy(() => import('./BlockRenderer').then(m => ({ default: m.BlockRenderer })));

// Block type to icon mapping
const BLOCK_ICONS: Record<string, string> = {
    profile: 'User',
    link: 'Link',
    button: 'SquareMousePointer',
    text: 'Type',
    image: 'Image',
    video: 'Video',
    carousel: 'Images',
    socials: 'Share2',
    messenger: 'MessageCircle',
    form: 'FileText',
    product: 'ShoppingBag',
    catalog: 'Grid',
    pricing: 'DollarSign',
    testimonial: 'Quote',
    faq: 'HelpCircle',
    countdown: 'Clock',
    map: 'MapPin',
    download: 'Download',
    newsletter: 'Mail',
    custom_code: 'Code',
    before_after: 'ArrowLeftRight',
    community: 'Users',
    shoutout: 'Megaphone',
    scratch: 'Gift',
    event: 'CalendarDays',
    avatar: 'UserCircle',
    separator: 'Minus',
    booking: 'Calendar',
};

interface BlockEditorV2Props {
    block: Block | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (updates: Partial<Block>) => void;
    /** Enable autosave (optional, default: true) */
    enableAutosave?: boolean;
    /** Autosave delay in ms (default: 2000) */
    autosaveDelay?: number;
}

// Loading fallback
const EditorFallback = () => (
    <div className="space-y-5 p-5">
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
}: BlockEditorV2Props) {
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const [formData, setFormData] = useState<any>(() => block ? { ...block } : {});
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const originalDataRef = useRef<any>(null);

    // Update formData when block changes
    useEffect(() => {
        if (block) {
            setFormData({ ...block });
            originalDataRef.current = JSON.stringify(block);
            setHasUnsavedChanges(false);
            setLastSaved(null);
        }
    }, [block]);

    // Check for unsaved changes
    const handleFormChange = useCallback((updates: any) => {
        setFormData(updates);
        const hasChanges = JSON.stringify(updates) !== originalDataRef.current;
        setHasUnsavedChanges(hasChanges);

        // Autosave if enabled
        if (enableAutosave && hasChanges) {
            if (autosaveTimerRef.current) {
                clearTimeout(autosaveTimerRef.current);
            }
            autosaveTimerRef.current = setTimeout(() => {
                performSave(updates, false);
            }, autosaveDelay);
        }
    }, [enableAutosave, autosaveDelay]);

    // Perform save
    const performSave = useCallback(async (data: any, closeAfter: boolean = true) => {
        setIsSaving(true);
        try {
            await onSave(data);
            setLastSaved(new Date());
            setHasUnsavedChanges(false);
            originalDataRef.current = JSON.stringify(data);
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

    // Intercept close attempt
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

    const handleCloseAttempt = useCallback(() => {
        if (hasUnsavedChanges) {
            setShowUnsavedDialog(true);
        } else {
            onClose();
        }
    }, [hasUnsavedChanges, onClose]);

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

    if (!block) return null;

    const commonProps = {
        formData,
        onChange: handleFormChange,
    };

    const BlockIcon = getLucideIcon(BLOCK_ICONS[block.type] || 'Box');
    const blockTypeName = t(`blockEditor.${block.type}`, block.type);

    const renderEditor = () => {
        switch (block.type) {
            case 'profile':
                return <Suspense fallback={<EditorFallback />}><ProfileEditorWizard {...commonProps} onComplete={() => performSave(formData, true)} /></Suspense>;
            case 'text':
                return <Suspense fallback={<EditorFallback />}><TextBlockEditor {...commonProps} /></Suspense>;
            case 'link':
                return <Suspense fallback={<EditorFallback />}><LinkBlockEditor {...commonProps} /></Suspense>;
            case 'product':
                return <Suspense fallback={<EditorFallback />}><ProductBlockEditor {...commonProps} /></Suspense>;
            case 'video':
                return <Suspense fallback={<EditorFallback />}><VideoBlockEditor {...commonProps} /></Suspense>;
            case 'carousel':
                return <Suspense fallback={<EditorFallback />}><CarouselBlockEditor {...commonProps} /></Suspense>;
            case 'button':
                return <Suspense fallback={<EditorFallback />}><ButtonBlockEditor {...commonProps} /></Suspense>;
            case 'socials':
                return <Suspense fallback={<EditorFallback />}><SocialsBlockEditor {...commonProps} /></Suspense>;
            case 'image':
                return <Suspense fallback={<EditorFallback />}><ImageBlockEditor {...commonProps} /></Suspense>;
            case 'custom_code':
                return <Suspense fallback={<EditorFallback />}><CustomCodeBlockEditor {...commonProps} /></Suspense>;
            case 'messenger':
                return <Suspense fallback={<EditorFallback />}><MessengerBlockEditor {...commonProps} /></Suspense>;
            case 'form':
                return <Suspense fallback={<EditorFallback />}><FormBlockEditor {...commonProps} /></Suspense>;
            case 'download':
                return <Suspense fallback={<EditorFallback />}><DownloadBlockEditor {...commonProps} /></Suspense>;
            case 'newsletter':
                return <Suspense fallback={<EditorFallback />}><NewsletterBlockEditor {...commonProps} /></Suspense>;
            case 'testimonial':
                return <Suspense fallback={<EditorFallback />}><TestimonialBlockEditor {...commonProps} /></Suspense>;
            case 'scratch':
                return <Suspense fallback={<EditorFallback />}><ScratchBlockEditor {...commonProps} /></Suspense>;
            case 'map':
                return <Suspense fallback={<EditorFallback />}><MapBlockEditor {...commonProps} /></Suspense>;
            case 'avatar':
                return <Suspense fallback={<EditorFallback />}><AvatarBlockEditor {...commonProps} /></Suspense>;
            case 'separator':
                return <Suspense fallback={<EditorFallback />}><SeparatorBlockEditor {...commonProps} /></Suspense>;
            case 'catalog':
                return <Suspense fallback={<EditorFallback />}><CatalogBlockEditor {...commonProps} /></Suspense>;
            case 'before_after':
                return <Suspense fallback={<EditorFallback />}><BeforeAfterBlockEditor {...commonProps} /></Suspense>;
            case 'faq':
                return <Suspense fallback={<EditorFallback />}><FAQBlockEditor {...commonProps} /></Suspense>;
            case 'countdown':
                return <Suspense fallback={<EditorFallback />}><CountdownBlockEditor {...commonProps} /></Suspense>;
            case 'pricing':
                return <Suspense fallback={<EditorFallback />}><PricingBlockEditor {...commonProps} /></Suspense>;
            case 'shoutout':
                return <Suspense fallback={<EditorFallback />}><ShoutoutBlockEditor {...commonProps} /></Suspense>;
            case 'booking':
                return <Suspense fallback={<EditorFallback />}><BookingBlockEditor {...commonProps} /></Suspense>;
            case 'community':
                return <Suspense fallback={<EditorFallback />}><CommunityBlockEditor {...commonProps} /></Suspense>;
            case 'event':
                return <Suspense fallback={<EditorFallback />}><EventBlockEditor {...commonProps} /></Suspense>;
            default:
                return (
                    <p className="text-base text-muted-foreground p-4">
                        {t('blockEditor.notAvailable')}
                    </p>
                );
        }
    };

    // Live Preview Component
    const previewComponent = (
        <div className="flex flex-col h-full bg-muted/10">
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-[320px] bg-background rounded-[2rem] shadow-xl overflow-hidden border border-border/10">
                    <div className="p-4">
                        <Suspense fallback={<div className="h-20 bg-muted animate-pulse rounded-xl" />}>
                            <BlockRenderer
                                block={formData}
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
            blockIcon={<BlockIcon className="h-5 w-5 text-primary" />}
            useTabs={false}
            isSaving={isSaving}
            lastSaved={lastSaved}
            hasUnsavedChanges={hasUnsavedChanges}
            onSave={handleSave}
            onClose={handleCloseAttempt}
            // Pass block update handler for size changes (merge partial updates into formData)
            onBlockUpdate={(updates) => handleFormChange({ ...formData, ...updates })}
            enablePreview={block.type !== 'profile'} // Profile often has its own preview or is complex
            previewComponent={previewComponent}
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
                        <p className="text-muted-foreground text-sm">
                            {t('editor.unsavedDescription', 'У вас есть изменения, которые еще не были сохранены. Что вы хотите сделать?')}
                        </p>
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
            </>
        );
    }

    // Desktop: Dialog with larger width for preview
    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && handleCloseAttempt()}>
                <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden bg-card/95 backdrop-blur-2xl border border-border/20 shadow-2xl rounded-3xl" aria-describedby={undefined}>
                    <VisuallyHidden>
                        <DialogTitle>{t('blockEditor.title', 'Edit Block')}</DialogTitle>
                    </VisuallyHidden>
                    {shellContent}
                </DialogContent>
            </Dialog>
            {unsavedDialog}
        </>
    );
}

export default BlockEditorV2;
