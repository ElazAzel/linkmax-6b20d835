/**
 * EditorScreen - Page editor with block management
 * Mobile-first design with GridEditor and block editing capabilities
 * P5: Structure view, review modes, friction recovery, sections wired
 */
import { memo, useCallback, useState, useMemo, lazy, Suspense } from 'react';
import { RenderContextProvider } from '@/contexts/RenderContext';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Eye from 'lucide-react/dist/esm/icons/eye';
import Share2 from 'lucide-react/dist/esm/icons/share-2';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import LayoutTemplate from 'lucide-react/dist/esm/icons/layout-template';
import Undo2 from 'lucide-react/dist/esm/icons/undo-2';
import Redo2 from 'lucide-react/dist/esm/icons/redo-2';
import History from 'lucide-react/dist/esm/icons/history';
import Lightbulb from 'lucide-react/dist/esm/icons/lightbulb';
import Layers from 'lucide-react/dist/esm/icons/layers';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import MousePointerClick from 'lucide-react/dist/esm/icons/mouse-pointer-click';
import X from 'lucide-react/dist/esm/icons/x';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardHeader } from '../layout/DashboardHeader';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { cn } from '@/lib/utils/utils';
import { storage } from '@/lib/storage';
import { usePageIntelligence } from '@/hooks/editor/usePageIntelligence';
import { useFrictionRecovery } from '@/hooks/editor/useFrictionRecovery';
import { useEditorStore } from '@/store/useEditorStore';
import { useAuth } from '@/hooks/user/useAuth';
import { useActivationChecklist } from '@/hooks/onboarding/useActivationChecklist';
import { ActivationChecklist, ActivationCelebration } from '@/components/onboarding/ActivationChecklist';
import { dissolveSection, deleteSection, duplicateSection } from '@/lib/editor/section-engine';
import { trackEditorAction } from '@/lib/editor/editor-analytics';
import type { PageData, Block, ProfileBlock } from '@/types/page';
import type { FreeTier } from '@/hooks/user/useFreemiumLimits';
import type { PremiumTier } from '@/hooks/user/usePremiumStatus';

const GridEditor = lazy(() => import('@/components/editor/GridEditor').then(m => ({ default: m.GridEditor })));
const StructureView = lazy(() => import('@/components/editor/StructureView').then(m => ({ default: m.StructureView })));

const EditorCanvasSkeleton = () => (
  <div className="space-y-4 p-4 animate-pulse">
    <div className="h-10 w-1/3 rounded-xl bg-muted" />
    <div className="h-24 rounded-2xl bg-muted/80" />
    <div className="h-24 rounded-2xl bg-muted/70" />
    <div className="h-24 rounded-2xl bg-muted/60" />
  </div>
);

interface EditorScreenProps {
  pageData: PageData | null;
  loading: boolean;
  isPremium: boolean;
  currentTier?: FreeTier;
  premiumTier?: PremiumTier;
  onInsertBlock: (blockType: string, position: number) => { success: boolean; blockId?: string; error?: string };
  onEditBlock: (block: Block) => void;
  onDeleteBlock: (blockId: string) => void;
  onUpdateBlock: (id: string, updates: Partial<Block>) => void;
  onReorderBlocks: (blocks: Block[]) => void;
  onDuplicateBlock?: (id: string) => void;
  onInsertPreset?: (preset: import('@/lib/editor/editor-presets').BlockPreset, position: number) => { success: boolean; blockId?: string; error?: string };
  onPreview: () => void;
  onShare: () => void;
  onOpenTemplates: () => void;
  onOpenAI: () => void;
  // Undo/Redo
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  // Versions
  onOpenVersions?: () => void;
  deepLinkAction?: string | null;
}

export const EditorScreen = memo(function EditorScreen({
  pageData,
  loading,
  isPremium,
  currentTier = 'identity',
  premiumTier,
  onInsertBlock,
  onEditBlock,
  onDeleteBlock,
  onUpdateBlock,
  onReorderBlocks,
  onDuplicateBlock,
  onInsertPreset,
  onPreview,
  onShare,
  onOpenTemplates,
  onOpenAI,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onOpenVersions,
  deepLinkAction,
}: EditorScreenProps) {
  const { t } = useTranslation();
  const [dismissedHint, setDismissedHint] = useState<string | null>(null);
  const [dismissedOnboardingHints, setDismissedOnboardingHints] = useState<string[]>(() => storage.get<string[]>('editor_onboarding_hints_dismissed') || []);
  const [structureOpen, setStructureOpen] = useState(false);
  const [disabledTips, setDisabledTips] = useState<string[]>(() => storage.get<string[]>('editor_context_tips_disabled') || []);

  const { user } = useAuth();

  // P5: Store state for sections & review
  const {
    sectionMeta,
    collapsedSections,
    toggleSectionCollapse,
    setSectionMeta,
    removeSectionMeta,
    reviewMode,
    setReviewMode,
  } = useEditorStore();

  // Intelligence layer — pure computation, <1ms
  const intelligence = usePageIntelligence(pageData, pageData?.niche);

  // P5: Friction recovery
  const { signal: frictionSignal, pushEvent: pushFrictionEvent, dismiss: dismissFriction, accept: acceptFriction } = useFrictionRecovery();

  // P5: Wrapped handlers that feed friction detector
  const handleInsertBlockWithFriction = useCallback((blockType: string, position: number) => {
    const result = onInsertBlock(blockType, position);
    pushFrictionEvent('block_added', blockType);
    return result;
  }, [onInsertBlock, pushFrictionEvent]);

  const handleInsertPresetWithFriction = useCallback((preset: import('@/lib/editor/editor-presets').BlockPreset, position: number) => {
    const result = onInsertPreset ? onInsertPreset(preset, position) : { success: false, error: 'Preset handler missing' };
    pushFrictionEvent('block_added', preset.blockType);
    return result;
  }, [onInsertPreset, pushFrictionEvent]);

  const handleDeleteBlockWithFriction = useCallback((blockId: string) => {
    const block = pageData?.blocks.find(b => b.id === blockId);
    onDeleteBlock(blockId);
    pushFrictionEvent('block_deleted', block?.type);
  }, [onDeleteBlock, pushFrictionEvent, pageData]);

  const handleUndoWithFriction = useCallback(() => {
    onUndo?.();
    pushFrictionEvent('undo');
  }, [onUndo, pushFrictionEvent]);

  const handleRedoWithFriction = useCallback(() => {
    onRedo?.();
    pushFrictionEvent('redo');
  }, [onRedo, pushFrictionEvent]);

  // P5: Block move handlers for StructureView
  const handleBlockMoveUp = useCallback((blockId: string) => {
    if (!pageData) return;
    const idx = pageData.blocks.findIndex(b => b.id === blockId);
    if (idx <= 0) return;
    // Don't swap past profile block
    if (pageData.blocks[idx - 1].type === 'profile') return;
    const newBlocks = [...pageData.blocks];
    [newBlocks[idx - 1], newBlocks[idx]] = [newBlocks[idx], newBlocks[idx - 1]];
    onReorderBlocks(newBlocks);
  }, [pageData, onReorderBlocks]);

  const handleBlockMoveDown = useCallback((blockId: string) => {
    if (!pageData) return;
    const idx = pageData.blocks.findIndex(b => b.id === blockId);
    if (idx < 0 || idx >= pageData.blocks.length - 1) return;
    const newBlocks = [...pageData.blocks];
    [newBlocks[idx], newBlocks[idx + 1]] = [newBlocks[idx + 1], newBlocks[idx]];
    onReorderBlocks(newBlocks);
  }, [pageData, onReorderBlocks]);

  // P5: Section handlers for StructureView
  const handleDissolveSection = useCallback((sectionId: string) => {
    if (!pageData) return;
    const newBlocks = dissolveSection(pageData.blocks, sectionId);
    onReorderBlocks(newBlocks);
    removeSectionMeta(sectionId);
    trackEditorAction('section_dissolved', { source: 'structure' });
  }, [pageData, onReorderBlocks, removeSectionMeta]);

  const handleDeleteSection = useCallback((sectionId: string) => {
    if (!pageData) return;
    const newBlocks = deleteSection(pageData.blocks, sectionId);
    onReorderBlocks(newBlocks);
    removeSectionMeta(sectionId);
    trackEditorAction('section_deleted', { source: 'structure' });
  }, [pageData, onReorderBlocks, removeSectionMeta]);

  const handleDuplicateSection = useCallback((sectionId: string) => {
    if (!pageData) return;
    const result = duplicateSection(pageData.blocks, sectionId);
    onReorderBlocks(result.blocks);
    const originalMeta = sectionMeta.get(sectionId);
    if (originalMeta) {
      setSectionMeta(result.newSectionId, {
        ...originalMeta,
        id: result.newSectionId,
        label: `${originalMeta.label} (copy)`,
        createdAt: Date.now(),
      });
    }
    trackEditorAction('section_duplicated', { source: 'structure' });
  }, [pageData, onReorderBlocks, sectionMeta, setSectionMeta]);

  const handleRenameSection = useCallback((sectionId: string, label: string) => {
    const existing = sectionMeta.get(sectionId);
    if (existing) {
      setSectionMeta(sectionId, { ...existing, label });
    } else {
      setSectionMeta(sectionId, { id: sectionId, label, collapsed: false, createdAt: Date.now() });
    }
  }, [sectionMeta, setSectionMeta]);

  // P5: Review mode toggle
  const toggleReviewMode = useCallback((mode: 'problematic' | 'cta_contact') => {
    setReviewMode(reviewMode === mode ? 'normal' : mode);
    trackEditorAction(reviewMode === mode ? 'review_mode_exited' : 'review_mode_entered', { source: 'toolbar' });
  }, [reviewMode, setReviewMode]);

  // Friction action handler
  const handleFrictionAction = useCallback(() => {
    if (!frictionSignal) return;
    acceptFriction();
    if (frictionSignal.suggestedActionKey === 'open_structure_view') {
      setStructureOpen(true);
    } else if (frictionSignal.suggestedActionKey === 'review_mode') {
      setReviewMode('problematic');
    }
  }, [frictionSignal, acceptFriction, setReviewMode]);

  // P5: Editor Activation Checklist
  const activation = useActivationChecklist({
    pageData,
    onOpenEditor: () => {}, // No-op, we're already in it
    onShare,
    pageId: pageData?.id,
    telegramChatId: user?.user_metadata?.telegram_chat_id,
    leadsCount: 0, // In the editor, this visual isn't meant to track leads deeply, just the publishing steps
    onNavigate: (tabId) => {
      // Optional: Handle top-level navigation, or let users figure it out
    }
  });

  const isPublished = pageData?.isPublished || false;
  const blockCount = pageData?.blocks.length || 0;
  const hasContent = (pageData?.blocks.length || 0) > 1 ||
    ((pageData?.blocks.length || 0) === 1 && pageData?.blocks[0].type !== 'profile');

  const onboardingHints = useMemo(() => {
    const hints = [] as Array<{ id: string; title: string; description: string; ctaLabel: string; onCta: () => void }>;

    if (!hasContent) {
      hints.push({
        id: 'add-first-block',
        title: t('editor.onboarding.addBlockTitle', 'Добавьте первый блок'),
        description: t('editor.onboarding.addBlockDesc', 'Начните с оффера, ссылки или формы — это первый шаг к лидам.'),
        ctaLabel: t('editor.onboarding.addBlockCta', 'Добавить блок'),
        onCta: () => {
          const addBlockButton = document.querySelector('[data-onboarding="add-block"]') as HTMLButtonElement | null;
          addBlockButton?.click();
        },
      });
    }

    if (hasContent && !isPublished) {
      hints.push({
        id: 'publish-page',
        title: t('editor.onboarding.publishTitle', 'Опубликуйте страницу'),
        description: t('editor.onboarding.publishDesc', 'После публикации можно делиться ссылкой и получать первого лида.'),
        ctaLabel: t('editor.onboarding.publishCta', 'Опубликовать'),
        onCta: onShare,
      });
    }

    return hints.filter((hint) => !dismissedOnboardingHints.includes(hint.id));
  }, [dismissedOnboardingHints, hasContent, isPublished, onShare, t]);

  const dismissOnboardingHint = useCallback((hintId: string) => {
    setDismissedOnboardingHints((prev) => {
      if (prev.includes(hintId)) return prev;
      const next = [...prev, hintId];
      storage.set('editor_onboarding_hints_dismissed', next);
      return next;
    });
  }, []);
  const contextualTips = useMemo(() => {
    const tips = [
      {
        id: 'add-block',
        title: t('editor.contextTips.addBlock.title', 'Добавьте первый блок с оффером'),
        description: t('editor.contextTips.addBlock.desc', 'Откройте палитру команд и выберите блок «Кнопка», «Товар» или «Форма».'),
        actionLabel: t('editor.contextTips.addBlock.action', 'Открыть палитру'),
        onAction: () => onOpenTemplates(),
      },
      {
        id: 'publish',
        title: t('editor.contextTips.publish.title', 'Опубликуйте страницу'),
        description: t('editor.contextTips.publish.desc', 'После публикации ссылка станет доступна клиентам.'),
        actionLabel: t('editor.contextTips.publish.action', 'Опубликовать'),
        onAction: () => onShare(),
      },
      {
        id: 'first-lead',
        title: t('editor.contextTips.firstLead.title', 'Поставьте ловушку на первый лид'),
        description: t('editor.contextTips.firstLead.desc', 'Добавьте форму или кнопку контакта, чтобы собирать обращения.'),
        actionLabel: t('editor.contextTips.firstLead.action', 'Перейти в активность'),
        href: '/dashboard/activity?action=first-lead',
      },
    ];

    return tips.filter((tip) => !disabledTips.includes(tip.id));
  }, [disabledTips, onOpenTemplates, onShare, t]);

  const primaryTip = useMemo(() => {
    if (!deepLinkAction) return contextualTips[0];
    return contextualTips.find((tip) => tip.id === deepLinkAction) || contextualTips[0];
  }, [contextualTips, deepLinkAction]);

  const dismissTip = useCallback((tipId: string) => {
    const next = [...disabledTips, tipId];
    setDisabledTips(next);
    storage.set('editor_context_tips_disabled', next);
  }, [disabledTips]);

  if (loading || !pageData) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen safe-area-top">
      {/* Header with actions */}
      <div className="sticky top-0 z-40 bg-background border-b border-border/10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Title */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black text-gradient truncate">
                {t('dashboard.editor.title', 'Редактор')}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                  {blockCount} {t('dashboard.editor.blocks', 'блоков')}
                </p>
              </div>
            </div>

            {/* Center: Undo/Redo */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-11 w-11 p-0 rounded-2xl md:h-9 md:w-9 md:rounded-xl"
                onClick={handleUndoWithFriction}
                disabled={!canUndo}
              >
                <Undo2 className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-11 w-11 p-0 rounded-2xl md:h-9 md:w-9 md:rounded-xl"
                onClick={handleRedoWithFriction}
                disabled={!canRedo}
              >
                <Redo2 className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-11 w-11 p-0 rounded-2xl md:h-9 md:w-9 md:rounded-xl"
                onClick={onPreview}
              >
                <Eye className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
              <Button
                size="sm"
                className={cn(
                  "h-11 md:h-9 rounded-2xl md:rounded-xl font-black text-xs uppercase tracking-widest px-5 md:px-4",
                  !isPublished && "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                )}
                onClick={onShare}
              >
                <Share2 className="h-4 w-4 md:h-3.5 md:w-3.5 mr-2 md:mr-1.5" />
                {isPublished ? t('editor.share', 'Поделиться') : t('editor.publish', 'Опубликовать')}
              </Button>
            </div>
          </div>
        </div>

        {/* Quick tools bar */}
        <div className="px-4 py-2.5 flex gap-2.5 overflow-x-auto scrollbar-hide border-t border-border/10 bg-card">
          {/* Show templates only for pages without content */}
          {!hasContent && (
            <Button
              variant="outline"
              size="sm"
              className="h-11 rounded-xl shrink-0 gap-2 px-5 shadow-sm border-border/10"
              onClick={onOpenTemplates}
            >
              <LayoutTemplate className="h-4 w-4" />
              <span className="text-xs font-black uppercase tracking-widest">{t('editor.templates', 'Шаблоны')}</span>
            </Button>
          )}

          {/* Show version history for pages with content */}
          {hasContent && onOpenVersions && (
            <Button
              variant="outline"
              size="sm"
              className="h-11 rounded-xl shrink-0 gap-2 px-5 shadow-sm border-border/10"
              onClick={onOpenVersions}
            >
              <History className="h-4 w-4" />
              <span className="text-xs font-black uppercase tracking-widest">{t('editor.versions', 'История')}</span>
            </Button>
          )}

          {/* P5: Structure View button */}
          {hasContent && (
            <Button
              variant="outline"
              size="sm"
              className="h-11 rounded-xl shrink-0 gap-2 px-5 shadow-sm border-border/10"
              onClick={() => setStructureOpen(true)}
            >
              <Layers className="h-4 w-4" />
              <span className="text-xs font-black uppercase tracking-widest">{t('editor.structure', 'Структура')}</span>
            </Button>
          )}

          {/* P5: Review mode filter chips */}
          {hasContent && (
            <>
              <Button
                variant={reviewMode === 'problematic' ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  "h-11 rounded-xl shrink-0 gap-2 px-5 shadow-sm transition-all",
                  reviewMode === 'problematic' ? "bg-red-500 text-white border-none" : "border-border/20 bg-card"
                )}
                onClick={() => toggleReviewMode('problematic')}
              >
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs font-black uppercase tracking-widest">{t('editor.problematic', 'Проблемные')}</span>
              </Button>
              <Button
                variant={reviewMode === 'cta_contact' ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  "h-11 rounded-xl shrink-0 gap-2 px-5 shadow-sm transition-all",
                  reviewMode === 'cta_contact' ? "bg-emerald-500 text-white border-none" : "border-border/20 bg-card"
                )}
                onClick={() => toggleReviewMode('cta_contact')}
              >
                <MousePointerClick className="h-4 w-4" />
                <span className="text-xs font-black uppercase tracking-widest">{t('editor.cta', 'CTA')}</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Single priority banner — max 1 at a time */}
      {(() => {
        // Priority: Activation > Celebration > Friction > Intelligence > Tips > Onboarding
        if (activation.isVisible) {
          return (
            <div className="mx-4 mt-4 animate-fade-in">
              <ActivationChecklist
                steps={activation.steps}
                completedCount={activation.completedCount}
                totalCount={activation.totalCount}
                progress={activation.progress}
                canDismiss={activation.canDismiss}
                onDismiss={activation.dismiss}
                onStepClick={activation.handleStepClick}
              />
            </div>
          );
        }
        if (activation.showCelebration) {
          return (
            <div className="mx-4 mt-4 animate-fade-in zoom-in-95 duration-500">
              <ActivationCelebration onDismiss={activation.dismissCelebration} />
            </div>
          );
        }
        if (frictionSignal) {
          return (
            <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2">
              <Lightbulb className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-xs text-foreground/80 flex-1">
                {t(`friction.${frictionSignal.suggestedActionKey}`, frictionSignal.suggestedAction)}
              </span>
              <Button type="button" variant="link" size="sm" onClick={handleFrictionAction} className="h-auto px-0 py-0 text-xs font-semibold text-primary hover:underline shrink-0">
                {t('friction.try', 'Попробовать')}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={dismissFriction} className="p-0.5 h-auto shrink-0">
                <X className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          );
        }
        if (intelligence && intelligence.nextActions.length > 0) {
          const top = intelligence.nextActions.find((a) => a.id !== dismissedHint);
          if (top) {
            return (
              <div className="mx-4 mt-4 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3.5 shadow-sm">
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Lightbulb className="h-4.5 w-4.5 text-primary" />
                </div>
                <span className="text-xs font-medium text-foreground/80 flex-1 leading-relaxed">
                  {t(top.titleKey, top.actionType.replace(/_/g, ' '))}
                </span>
                <Badge variant="outline" className="text-xs font-black uppercase tracking-widest shrink-0 border-primary/20 bg-primary/5 text-primary">
                  {top.priority}
                </Badge>
                <Button type="button" variant="ghost" size="icon" onClick={() => setDismissedHint(top.id)} className="h-10 w-10 rounded-xl hover:bg-white/10 text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          }
        }
        if (primaryTip) {
          return (
            <div className="mx-4 mt-3 flex items-start gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
              <Lightbulb className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold">{primaryTip.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{primaryTip.description}</p>
                <div className="mt-2">
                  {primaryTip.href ? (
                    <Link to={primaryTip.href} className="text-xs font-semibold text-primary hover:underline">{primaryTip.actionLabel}</Link>
                  ) : (
                    <button onClick={primaryTip.onAction} className="text-xs font-semibold text-primary hover:underline">{primaryTip.actionLabel}</button>
                  )}
                </div>
              </div>
              <button onClick={() => dismissTip(primaryTip.id)} className="p-1 rounded hover:bg-white/10">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          );
        }
        if (onboardingHints.length > 0) {
          const hint = onboardingHints[0]; // Show only the first hint
          return (
            <div className="mx-4 mt-3 flex items-start gap-3 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3">
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black uppercase tracking-wider">{hint.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{hint.description}</p>
              </div>
              <Button size="sm" className="h-11 px-5 rounded-xl text-xs font-black uppercase tracking-wider" onClick={hint.onCta}>
                {hint.ctaLabel}
              </Button>
              <button className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground" onClick={() => dismissOnboardingHint(hint.id)} aria-label={t('common.dismiss', 'Скрыть')}>
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        }
        return null;
      })()}

      {/* Grid Editor */}
      <div className="pt-4">
      <RenderContextProvider value="editor">
        <Suspense fallback={<EditorCanvasSkeleton />}>
          <GridEditor
            blocks={pageData.blocks}
            isPremium={isPremium}
            currentTier={currentTier}
            premiumTier={premiumTier}
            gridConfig={pageData.gridConfig}
            pageNiche={pageData.niche}
            onInsertBlock={handleInsertBlockWithFriction}
            onEditBlock={onEditBlock}
            onDeleteBlock={handleDeleteBlockWithFriction}
            onUpdateBlock={onUpdateBlock}
            onReorderBlocks={onReorderBlocks}
            onDuplicateBlock={onDuplicateBlock}
            onInsertPreset={handleInsertPresetWithFriction}
          />
        </Suspense>
      </RenderContextProvider>

      {/* P5: Structure View 2.0 */}
      {structureOpen && (
        <Suspense fallback={null}>
          <StructureView
            open={structureOpen}
            onOpenChange={setStructureOpen}
            blocks={pageData.blocks}
            onBlockSelect={(blockId) => {
              setStructureOpen(false);
              onEditBlock(pageData.blocks.find(b => b.id === blockId) || pageData.blocks[0]);
            }}
            onBlockDuplicate={onDuplicateBlock}
            onBlockDelete={handleDeleteBlockWithFriction}
            onBlockMoveUp={handleBlockMoveUp}
            onBlockMoveDown={handleBlockMoveDown}
            sectionMeta={sectionMeta}
            collapsedSections={collapsedSections}
            onToggleSectionCollapse={toggleSectionCollapse}
            onDissolveSection={handleDissolveSection}
            onDeleteSection={handleDeleteSection}
            onDuplicateSection={handleDuplicateSection}
            onRenameSection={handleRenameSection}
            blockQuality={intelligence?.blockQuality}
            reviewMode={reviewMode}
            onSetReviewMode={setReviewMode}
          />
        </Suspense>
      )}
    </div>
  );
});
