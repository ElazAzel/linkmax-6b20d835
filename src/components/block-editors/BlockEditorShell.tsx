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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
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
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span>{t('editor.unsaved', 'Не сохранено')}</span>
            </div>
        );
    }

    if (lastSaved) {
        return (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Check className="h-3 w-3 text-green-500" />
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
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="shrink-0 border-b border-border/10 bg-background/50 backdrop-blur-xl">
                {/* Title row */}
                <div className="flex items-center gap-3 px-5 py-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-10 w-10 rounded-xl hover:bg-muted/50 active:scale-95 transition-all shrink-0"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>

                    {blockIcon && (
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            {blockIcon}
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold truncate">{blockTypeName}</h2>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <AutosaveIndicator
                                isSaving={isSaving}
                                lastSaved={lastSaved}
                                hasUnsavedChanges={hasUnsavedChanges}
                            />
                        </div>
                    </div>

                    {/* Block Size Selector */}
                    {onBlockUpdate && block && (
                        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg">
                            {/* 1x1 (Small) */}
                            <Button
                                variant={(!block.blockSize || block.blockSize === 'small' || block.blockSize === 'half') ? 'secondary' : 'ghost'}
                                size="icon"
                                className="h-7 w-7 rounded-md"
                                title="1x1"
                                onClick={() => onBlockUpdate({ blockSize: 'small' })}
                            >
                                <div className="w-2 h-2 border border-current" />
                            </Button>
                            {/* 2x1 (Wide) */}
                            <Button
                                variant={(block.blockSize === 'wide' || block.blockSize === 'full') ? 'secondary' : 'ghost'}
                                size="icon"
                                className="h-7 w-7 rounded-md"
                                title="2x1"
                                onClick={() => onBlockUpdate({ blockSize: 'wide' })}
                            >
                                <div className="w-4 h-2 border border-current" />
                            </Button>
                            {/* 1x2 (Tall) */}
                            <Button
                                variant={(block.blockSize === 'tall') ? 'secondary' : 'ghost'}
                                size="icon"
                                className="h-7 w-7 rounded-md"
                                title="1x2"
                                onClick={() => onBlockUpdate({ blockSize: 'tall' })}
                            >
                                <div className="h-4 w-2 border border-current" />
                            </Button>
                            {/* 2x2 (Large) */}
                            <Button
                                variant={(block.blockSize === 'large') ? 'secondary' : 'ghost'}
                                size="icon"
                                className="h-7 w-7 rounded-md"
                                title="2x2"
                                onClick={() => onBlockUpdate({ blockSize: 'large' })}
                            >
                                <div className="w-4 h-4 border border-current" />
                            </Button>
                        </div>
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
                    <div className="px-5 pb-2">
                        <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as EditorTab)}>
                            <TabsList className="w-full h-11 p-1 bg-muted/50 rounded-xl">
                                {tabs.map((tab) => (
                                    <TabsTrigger
                                        key={tab.id}
                                        value={tab.id}
                                        className={cn(
                                            "flex-1 h-9 gap-2 rounded-lg font-medium transition-all",
                                            "data-[state=active]:bg-background data-[state=active]:shadow-sm"
                                        )}
                                    >
                                        {tab.icon}
                                        <span className="hidden sm:inline">{tab.label}</span>
                                        {tab.badge !== undefined && tab.badge > 0 && (
                                            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
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
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="px-5 py-6 space-y-5"
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
                            className="overflow-hidden bg-muted/30"
                        >
                            <div className="h-full p-4 overflow-auto">
                                <div className="text-xs text-muted-foreground mb-2 font-medium">
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
            <div className="shrink-0 border-t border-border/10 bg-background/98 backdrop-blur-xl px-5 py-4 pb-safe">
                {footerActions || (
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 h-12 rounded-xl text-base font-semibold border-2 active:scale-[0.98] transition-all"
                        >
                            <X className="h-4 w-4 mr-2" />
                            {t('editor.cancel', 'Отмена')}
                        </Button>
                        <Button
                            onClick={onSave}
                            disabled={isSaving}
                            className="flex-[2] h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/25 active:scale-[0.98] transition-all"
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
