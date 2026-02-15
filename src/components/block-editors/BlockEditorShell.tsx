/**
 * BlockEditorShell - Unified shell for all block editors
 * Provides consistent structure with tabs, preview, and autosave
 */
import { memo, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    Check,
    X,
    Eye,
    EyeOff,
    Type,
    Palette,
    Settings,
    Loader2,
    Save,
    Clock,
    Grid2x2,
    RectangleHorizontal,
    RectangleVertical,
    Square,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Block } from '@/types/page';

// Tab configuration
export type EditorTab = 'content' | 'style' | 'advanced';

interface TabConfig {
    id: EditorTab;
    label: string;
    icon: ReactNode;
    badge?: number;
}

interface BlockEditorShellProps {
    /** Block being edited */
    block: Block;
    /** Block type display name */
    blockTypeName: string;
    /** Block icon component */
    blockIcon?: ReactNode;
    /** Content for each tab */
    contentTab?: ReactNode;
    styleTab?: ReactNode;
    advancedTab?: ReactNode;
    /** Single content (legacy mode - no tabs) */
    children?: ReactNode;
    /** Enable tab mode */
    useTabs?: boolean;
    /** Preview component */
    previewComponent?: ReactNode;
    /** Enable live preview */
    enablePreview?: boolean;
    /** Autosave state */
    isSaving?: boolean;
    lastSaved?: Date | null;
    hasUnsavedChanges?: boolean;
    /** Callbacks */
    onSave: () => void;
    onClose: () => void;
    /** Update block metadata directly */
    onBlockUpdate?: (updates: Partial<Block>) => void;
    /** Optional: custom footer actions */
    footerActions?: ReactNode;
}

// Autosave indicator component
const AutosaveIndicator = memo(function AutosaveIndicator({
    isSaving,
    lastSaved,
    hasUnsavedChanges,
}: {
    isSaving?: boolean;
    lastSaved?: Date | null;
    hasUnsavedChanges?: boolean;
}) {
    const { t } = useTranslation();

    if (isSaving) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>{t('editor.saving', 'Сохранение...')}</span>
            </motion.div>
        );
    }

    if (hasUnsavedChanges) {
        return (
            <div className="flex items-center gap-1.5 text-xs text-amber-500">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>{t('editor.unsaved', 'Не сохранено')}</span>
            </div>
        );
    }

    if (lastSaved) {
        return (
            <div className="flex items-center gap-1.5 text-xs text-emerald-500">
                <Check className="h-3 w-3" />
                <span>{t('editor.saved', 'Сохранено')}</span>
            </div>
        );
    }

    return null;
});

// Preview toggle button
const PreviewToggle = memo(function PreviewToggle({
    isOpen,
    onToggle,
}: {
    isOpen: boolean;
    onToggle: () => void;
}) {
    const { t } = useTranslation();

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={cn(
                "h-9 gap-2 rounded-xl transition-all",
                isOpen && "bg-primary/10 text-primary"
            )}
        >
            {isOpen ? (
                <EyeOff className="h-4 w-4" />
            ) : (
                <Eye className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
                {t('editor.preview', 'Превью')}
            </span>
        </Button>
    );
});

// Block size selector component
const BlockSizeSelector = memo(function BlockSizeSelector({
    block,
    onBlockUpdate,
}: {
    block: Block;
    onBlockUpdate: (updates: Partial<Block>) => void;
}) {
    const { t } = useTranslation();
    const sizes = [
        { value: 'small', icon: <Square className="h-3.5 w-3.5" />, label: '1×1' },
        { value: 'wide', icon: <RectangleHorizontal className="h-3.5 w-3.5" />, label: '2×1' },
        { value: 'tall', icon: <RectangleVertical className="h-3.5 w-3.5" />, label: '1×2' },
        { value: 'large', icon: <Grid2x2 className="h-3.5 w-3.5" />, label: '2×2' },
    ];

    const currentSize = block.blockSize || 'small';
    const isActive = (value: string) => {
        if (value === 'small') return !block.blockSize || block.blockSize === 'small' || block.blockSize === 'half';
        if (value === 'wide') return block.blockSize === 'wide' || block.blockSize === 'full';
        return block.blockSize === value;
    };

    return (
        <TooltipProvider delayDuration={300}>
            <div className="flex items-center gap-0.5 p-1 rounded-xl bg-muted/50 border border-border/30">
                {sizes.map((size) => (
                    <Tooltip key={size.value}>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                onClick={() => onBlockUpdate({ blockSize: size.value as any })}
                                className={cn(
                                    "relative h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200",
                                    "hover:bg-muted active:scale-95",
                                    isActive(size.value)
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground"
                                )}
                            >
                                {size.icon}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                            {size.label}
                        </TooltipContent>
                    </Tooltip>
                ))}
            </div>
        </TooltipProvider>
    );
});

export const BlockEditorShell = memo(function BlockEditorShell({
    block,
    blockTypeName,
    blockIcon,
    contentTab,
    styleTab,
    advancedTab,
    children,
    useTabs = true,
    previewComponent,
    enablePreview = false,
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    onSave,
    onClose,
    onBlockUpdate,
    footerActions,
}: BlockEditorShellProps) {
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const [activeTab, setActiveTab] = useState<EditorTab>('content');
    const [showPreview, setShowPreview] = useState(false);

    // Tab configuration
    const tabs: TabConfig[] = useMemo(() => {
        const result: TabConfig[] = [];

        if (contentTab) {
            result.push({
                id: 'content',
                label: t('editor.tabs.content', 'Контент'),
                icon: <Type className="h-4 w-4" />,
            });
        }

        if (styleTab) {
            result.push({
                id: 'style',
                label: t('editor.tabs.style', 'Стиль'),
                icon: <Palette className="h-4 w-4" />,
            });
        }

        if (advancedTab) {
            result.push({
                id: 'advanced',
                label: t('editor.tabs.advanced', 'Доп.'),
                icon: <Settings className="h-4 w-4" />,
            });
        }

        return result;
    }, [contentTab, styleTab, advancedTab, t]);

    // Show tabs only if we have multiple tabs and useTabs is true
    const shouldShowTabs = useTabs && tabs.length > 1;

    // Keyboard shortcut for save (Cmd/Ctrl + S)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                onSave();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onSave]);

    // Render tab content
    const renderTabContent = useCallback(() => {
        if (!shouldShowTabs && children) {
            return children;
        }

        switch (activeTab) {
            case 'content':
                return contentTab;
            case 'style':
                return styleTab;
            case 'advanced':
                return advancedTab;
            default:
                return contentTab || children;
        }
    }, [activeTab, shouldShowTabs, children, contentTab, styleTab, advancedTab]);

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="shrink-0 bg-background/80 backdrop-blur-2xl border-b border-border/10">
                {/* Title row */}
                <div className="flex items-center gap-3 px-4 py-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-9 w-9 rounded-xl hover:bg-muted/60 active:scale-95 transition-all shrink-0"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>

                    {blockIcon && (
                        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            {blockIcon}
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <h2 className="text-base font-bold truncate leading-tight">{blockTypeName}</h2>
                        <AutosaveIndicator
                            isSaving={isSaving}
                            lastSaved={lastSaved}
                            hasUnsavedChanges={hasUnsavedChanges}
                        />
                    </div>

                    {/* Block Size Selector */}
                    {onBlockUpdate && block && (
                        <BlockSizeSelector block={block} onBlockUpdate={onBlockUpdate} />
                    )}

                    {/* Preview toggle (desktop only) */}
                    {enablePreview && !isMobile && previewComponent && (
                        <PreviewToggle
                            isOpen={showPreview}
                            onToggle={() => setShowPreview(!showPreview)}
                        />
                    )}
                </div>

                {/* Tabs */}
                {shouldShowTabs && (
                    <div className="px-4 pb-2">
                        <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as EditorTab)}>
                            <TabsList className="w-full h-10 p-0.5 bg-muted/40 rounded-xl gap-0.5">
                                {tabs.map((tab) => (
                                    <TabsTrigger
                                        key={tab.id}
                                        value={tab.id}
                                        className={cn(
                                            "flex-1 h-9 gap-1.5 rounded-[10px] font-semibold text-sm transition-all",
                                            "data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground",
                                            "data-[state=inactive]:text-muted-foreground"
                                        )}
                                    >
                                        {tab.icon}
                                        <span>{tab.label}</span>
                                        {tab.badge !== undefined && tab.badge > 0 && (
                                            <Badge variant="secondary" className="h-4 px-1 text-[10px] rounded-full">
                                                {tab.badge}
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                    </div>
                )}
            </div>

            {/* Content area with optional preview */}
            <div className="flex-1 flex overflow-hidden">
                {/* Editor content */}
                <div className={cn(
                    "flex-1 overflow-hidden",
                    showPreview && !isMobile && "border-r border-border/10"
                )}>
                    <ScrollArea className="h-full">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            className="px-4 py-5 space-y-4"
                        >
                            {renderTabContent()}
                        </motion.div>
                    </ScrollArea>
                </div>

                {/* Preview panel (desktop only) */}
                <AnimatePresence>
                    {showPreview && !isMobile && previewComponent && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: '40%', opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden bg-muted/20"
                        >
                            <div className="h-full p-4 overflow-auto">
                                <div className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider">
                                    {t('editor.livePreview', 'Live Preview')}
                                </div>
                                <div className="bg-background rounded-2xl p-4 shadow-sm border border-border/10">
                                    {previewComponent}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-border/10 bg-background/95 backdrop-blur-2xl px-4 py-3 pb-safe">
                {footerActions || (
                    <div className="flex gap-2.5">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 h-11 rounded-xl font-semibold border-border/50 active:scale-[0.98] transition-all"
                        >
                            {t('editor.cancel', 'Отмена')}
                        </Button>
                        <Button
                            onClick={onSave}
                            disabled={isSaving}
                            className="flex-[2] h-11 rounded-xl font-semibold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
                        >
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Check className="h-4 w-4 mr-2" />
                            )}
                            {t('editor.save', 'Сохранить')}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
});

export default BlockEditorShell;
