/**
 * AIBuilderWizard — 5-step stepper wizard
 * Step 1: User info (name, bio, contacts, services, socials, media links)
 * Step 2: Niche selection (from templates DB categories)
 * Step 3: Template carousel (admin templates from DB)
 * Step 4: AI generating (fills template with personalized content)
 * Step 5: Complete
 */
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Check from 'lucide-react/dist/esm/icons/check';
import Share2 from 'lucide-react/dist/esm/icons/share-2';
import Send from 'lucide-react/dist/esm/icons/send';
import Wand2 from 'lucide-react/dist/esm/icons/wand-2';
import LayoutTemplate from 'lucide-react/dist/esm/icons/layout-template';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import { supabase } from '@/platform/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/utils';
import { createBlock as createBaseBlock } from '@/lib/blocks/block-factory';
import { generateBlocksFromTemplate } from '@/lib/blocks/internal-builder';
import type { Block } from '@/types/page';
import { NICHES, NICHE_ICONS, ONBOARDING_GOALS, GOAL_ICONS, type Niche, type OnboardingGoal } from '@/lib/niches';
import { useFreemiumLimits } from '@/hooks/user/useFreemiumLimits';
import { storage } from '@/lib/storage';
import {
  trackWizardCompleted,
  trackWizardNicheSelected,
  trackWizardStarted,
} from '@/lib/activation-events';

// Whitelist of block types supported by the editor (must match block-factory.ts)
const KNOWN_BLOCK_TYPES = new Set([
  'profile', 'link', 'button', 'text', 'image', 'socials', 'product', 'video',
  'carousel', 'messenger', 'form', 'testimonial', 'separator', 'catalog',
  'faq', 'countdown', 'pricing', 'booking',
]);

const AI_TIMEOUT_MS = 25000;
const MAX_REGENERATE_RETRIES = 2;

type TemplateBlockDraft = Record<string, unknown> & { type: string };
type TemplateBlocksInput = Parameters<typeof generateBlocksFromTemplate>[0];

interface AIProfileDraft {
  name?: string;
  bio?: string;
}

interface AIContentPayload {
  profile?: AIProfileDraft | null;
  blocks?: unknown;
}

interface AIContentResponse extends AIContentPayload {
  result?: AIContentPayload;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasTemplateBlockType(value: unknown): value is TemplateBlockDraft {
  return isRecord(value) && typeof value.type === 'string';
}

function isKnownTemplateBlock(value: unknown): value is TemplateBlockDraft {
  return hasTemplateBlockType(value) && KNOWN_BLOCK_TYPES.has(value.type);
}

function getTemplateBlockPreviews(value: unknown): TemplateBlockDraft[] {
  return Array.isArray(value) ? value.filter(hasTemplateBlockType) : [];
}

function getKnownTemplateBlockDrafts(value: unknown): TemplateBlockDraft[] {
  return Array.isArray(value) ? value.filter(isKnownTemplateBlock) : [];
}

function getTemplateBlocksInput(value: unknown): TemplateBlocksInput {
  return Array.isArray(value) ? value as TemplateBlocksInput : [];
}

interface AIBuilderWizardProps {
  open: boolean;
  onClose: () => void;
  /** Called with generated blocks (to be APPENDED to existing) and optional profile */
  onComplete: (profile: { name: string; bio: string }, blocks: Block[], niche: Niche) => void;
  /** If true, this is first-time onboarding popup */
  isOnboarding?: boolean;
  /** Niche captured from signup source, e.g. /auth?niche=beauty */
  initialNiche?: Niche;
  /** Current page id for activation analytics. Optional so settings flow can stay independent. */
  pageId?: string;
  signupContext?: {
    from?: string;
    refSlug?: string;
    desiredSlug?: string;
  };
}

interface DBTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  blocks: unknown;
  preview_image: string | null;
  is_premium: boolean | null;
}

interface UserInfo {
  name: string;
  bio: string;
  goal?: OnboardingGoal;
  contacts: string;
  services: string;
  socials: string;
  mediaLinks: string;
  expertGoal?: string;
  expertOffer?: string;
  expertChannel?: 'telegram' | 'email';
}

type Step = 'goal' | 'niche' | 'description' | 'generating' | 'complete';

const STEPS: Step[] = ['goal', 'niche', 'description', 'generating', 'complete'];

function getStepProgress(step: Step): number {
  const idx = STEPS.indexOf(step);
  return Math.round(((idx + 1) / STEPS.length) * 100);
}

export function AIBuilderWizard({
  open,
  onClose,
  onComplete,
  initialNiche,
  pageId,
  signupContext,
}: AIBuilderWizardProps) {
  const { t } = useTranslation();
  const { canUseAIPageGeneration, incrementAIPageGeneration } = useFreemiumLimits();

  const [step, setStep] = useState<Step>('goal');
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: '',
    bio: '',
    goal: undefined,
    contacts: '',
    services: '',
    socials: '',
    mediaLinks: '',
    expertGoal: '',
    expertOffer: '',
    expertChannel: 'telegram',
  });
  const [selectedGoal, setSelectedGoal] = useState<OnboardingGoal | null>(null);
  const [selectedNiche, setSelectedNiche] = useState<Niche | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<DBTemplate | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [generatedBlocks, setGeneratedBlocks] = useState<Block[]>([]);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [genPhase, setGenPhase] = useState<'template' | 'ai' | 'layout'>('template');
  const [usedAI, setUsedAI] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const startTrackedForOpenRef = useRef(false);
  const selectedTemplateBlocks = useMemo(
    () => getTemplateBlockPreviews(selectedTemplate?.blocks),
    [selectedTemplate?.blocks]
  );

  useEffect(() => {
    if (!open) {
      startTrackedForOpenRef.current = false;
      return;
    }

    if (pageId && !startTrackedForOpenRef.current) {
      trackWizardStarted(pageId);
      startTrackedForOpenRef.current = true;
    }
  }, [open, pageId]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep('goal');
      setSelectedGoal(null);
      setSelectedNiche(initialNiche ?? null);
      setSelectedTemplate(null);
      setShowMoreDetails(false);
      setUsedAI(false);
      setRetryCount(0);
    }
  }, [initialNiche, open]);

  const loadTemplateForNiche = useCallback(async (niche: Niche) => {
    // Pick the first template for the niche (all 16 niches now have templates)
    setLoadingTemplates(true);
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('id, name, description, category, blocks, preview_image, is_premium')
        .eq('category', niche)
        .eq('is_public', true)
        .order('sort_order', { ascending: true })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        setSelectedTemplate(data[0]);
      } else {
        // Should not happen now (all niches seeded), but keep a minimal safe fallback
        setSelectedTemplate({
          id: 'basic-niche-template',
          name: t(`niches.${niche}`, niche),
          description: null,
          category: niche,
          blocks: [
            { type: 'profile' },
            { type: 'text', content: 'Расскажите о себе' },
            { type: 'messenger' },
            { type: 'socials' }
          ],
          preview_image: null,
          is_premium: false,
        });
      }
    } catch (err) {
      console.error('Failed to auto-select template:', err);
    } finally {
      setLoadingTemplates(false);
    }
  }, [t]);

  const handleSelectGoal = async (goal: OnboardingGoal) => {
    setSelectedGoal(goal);
    setUserInfo(p => ({ ...p, goal }));

    if (initialNiche) {
      setSelectedNiche(initialNiche);
      if (pageId) trackWizardNicheSelected(pageId, initialNiche);
      await loadTemplateForNiche(initialNiche);
      setStep('description');
      return;
    }

    setStep('niche');
  };

  const handleSelectNiche = async (niche: Niche) => {
    setSelectedNiche(niche);
    if (pageId) trackWizardNicheSelected(pageId, niche);
    await loadTemplateForNiche(niche);

    setStep('description');
  };

  const handleBackToGoal = () => {
    setStep('goal');
  };

  const handleBackToNiche = () => {
    setStep('niche');
  };

  const handleBackToTemplate = () => {
    setStep('niche');
  };

  const runGeneration = useCallback(async () => {
    if (!selectedNiche || !selectedTemplate) return;

    setStep('generating');
    setGenPhase('template');

    let finalBlocks: Block[] = [];
    let aiProfile: { name?: string; bio?: string } | null = null;
    let aiSucceeded = false;

    // 1) Try real AI generation via niche-builder edge function with timeout
    try {
      setGenPhase('ai');
      const details = [
        userInfo.bio,
        userInfo.services ? `Услуги: ${userInfo.services}` : '',
        userInfo.contacts ? `Контакты: ${userInfo.contacts}` : '',
        userInfo.socials ? `Соцсети: ${userInfo.socials}` : '',
      ].filter(Boolean).join('\n');

      const aiCall = supabase.functions.invoke<AIContentResponse>('ai-content-generator', {
        body: {
          type: 'niche-builder',
          input: {
            niche: selectedNiche,
            name: userInfo.name,
            details,
            goal: selectedGoal || undefined,
          },
        },
      });
      const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: new Error('ai-timeout') }), AI_TIMEOUT_MS)
      );

      const { data, error } = await Promise.race([aiCall, timeoutPromise]);
      if (error) throw error;

      // Edge function wraps response in `result`: { result: { profile, blocks } }
      const payload = data?.result ?? data ?? null;
      const aiBlocks = getKnownTemplateBlockDrafts(payload?.blocks);

      if (aiBlocks.length > 0) {
        setGenPhase('layout');
        // Filter unknown block types and normalize through factory
        finalBlocks = aiBlocks
          .map((b) => {
            try {
              const base = createBaseBlock(b.type);
              const { type: _type, ...blockOverrides } = b;
              return { ...base, ...blockOverrides } as Block;
            } catch {
              return null;
            }
          })
          .filter(Boolean) as Block[];
        aiProfile = payload?.profile || null;
        if (finalBlocks.length > 0) aiSucceeded = true;
      }
    } catch (err) {
      console.warn('niche-builder failed, falling back to template:', err);
    }

    // 2) Fallback to deterministic template if AI failed or returned empty
    if (finalBlocks.length === 0) {
      setGenPhase('layout');
      finalBlocks = generateBlocksFromTemplate(
        getTemplateBlocksInput(selectedTemplate.blocks),
        { ...userInfo, bio: userInfo.bio }
      );
    }

    incrementAIPageGeneration();

    // Update profile bio from AI if user left it empty
    if (aiProfile?.bio && !userInfo.bio) {
      setUserInfo(p => ({ ...p, bio: aiProfile!.bio! }));
    }

    setGeneratedBlocks(finalBlocks);
    setUsedAI(aiSucceeded);
    setStep('complete');
  }, [selectedNiche, selectedTemplate, userInfo, selectedGoal, incrementAIPageGeneration]);

  const handleGenerate = useCallback(async () => {
    if (!selectedNiche || !selectedTemplate) {
      toast.error(t('aiBuilder.selectTemplate', 'Выберите шаблон'));
      return;
    }
    if (!canUseAIPageGeneration()) {
      toast.error(t('freemium.aiLimitReached', 'Лимит AI генераций исчерпан'));
      return;
    }
    await runGeneration();
  }, [selectedNiche, selectedTemplate, canUseAIPageGeneration, runGeneration, t]);

  const handleRegenerate = useCallback(async () => {
    if (retryCount >= MAX_REGENERATE_RETRIES) {
      toast.info(t('aiBuilder.regenerateLimit', 'Достигнут лимит перегенераций'));
      return;
    }
    setRetryCount(c => c + 1);
    await runGeneration();
  }, [retryCount, runGeneration, t]);

  const finishWizard = (options?: { publish?: boolean; nextAction?: 'connect_telegram' }) => {
    if (!selectedNiche) return;
    if (options?.publish) storage.set('wizard_wants_publish', 'true');
    if (options?.nextAction) storage.set('wizard_next_action', options.nextAction);
    if (pageId) trackWizardCompleted(pageId, selectedNiche);

    onComplete(
      { name: userInfo.name, bio: userInfo.bio || '' },
      generatedBlocks,
      selectedNiche
    );
    toast.success(t('aiBuilder.success', '✨ Страница создана!'));
  };


  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[95vh] overflow-hidden p-0 gap-0 rounded-[24px] border-0 bg-card/98 backdrop-blur-3xl">
        <DialogTitle className="sr-only">{t('aiBuilder.title', 'AI Builder')}</DialogTitle>
        <DialogDescription className="sr-only">
          {t('aiBuilder.description', 'Create your page with AI')}
        </DialogDescription>

        {/* Progress */}
        <div className="px-6 pt-6">
          <Progress value={getStepProgress(step)} className="h-1.5 rounded-full" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{t('aiBuilder.step', 'Шаг')} {STEPS.indexOf(step) + 1}/{STEPS.length}</span>
          </div>
        </div>



        {/* Step 1: Goal Selection */}
        {step === 'goal' && (
          <div className="p-6 pt-4 animate-fade-in text-center sm:text-left">
            <div className="mb-6">
              <h2 className="text-2xl font-black mb-1">
                {t('aiBuilder.goals.title')}
              </h2>
              <p className="text-muted-foreground text-sm">
                {t('aiBuilder.goals.subtitle')}
              </p>
              {initialNiche && (
                <div className="mt-3 inline-flex flex-wrap items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                  <span>{t('aiBuilder.signupContext.niche', 'Сфера уже подставлена:')}</span>
                  <span>{NICHE_ICONS[initialNiche]} {t(`niches.${initialNiche}`, initialNiche)}</span>
                  {signupContext?.desiredSlug && (
                    <span className="text-primary/80">lnkmx.my/{signupContext.desiredSlug}</span>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
              {ONBOARDING_GOALS.map((goal) => (
                <button
                  key={goal}
                  onClick={() => void handleSelectGoal(goal)}
                  className={cn(
                    "group p-5 rounded-3xl border-2 border-border/50 bg-card/40 backdrop-blur-xl transition-all duration-300",
                    "hover:scale-[1.02] hover:border-primary/50 hover:bg-card/80 hover:shadow-glass-lg",
                    "active:scale-[0.98]",
                    "flex items-center gap-4 text-left"
                  )}
                >
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                    {GOAL_ICONS[goal]}
                  </div>
                  <div>
                    <p className="font-bold text-lg leading-tight">
                      {t(`aiBuilder.goals.${goal}`)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {t(`aiBuilder.goals.${goal}Desc`)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Niche Selection */}
        {step === 'niche' && (
          <div className="p-6 pt-4 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <Button variant="ghost" size="icon" onClick={handleBackToGoal} className="h-10 w-10 rounded-xl shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-xl font-black">
                  {t('aiBuilder.nicheTitle', 'Выберите сферу')}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {t('aiBuilder.nicheDesc', 'Подберём оформление под вашу деятельность')}
                </p>
              </div>
            </div>

            <ScrollArea className="max-h-[55vh]">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-4 px-1">
                {NICHES.map((niche) => (
                  <button
                    key={niche}
                    onClick={() => handleSelectNiche(niche)}
                    className={cn(
                      "p-4 rounded-3xl border-2 border-border/50 bg-card/20 backdrop-blur-md transition-all duration-200",
                      "hover:scale-[1.02] hover:border-primary/40 hover:bg-card/40",
                      "active:scale-[0.98]",
                      "flex flex-col items-center gap-2"
                    )}
                  >
                    <span className="text-3xl">{NICHE_ICONS[niche]}</span>
                    <p className="font-semibold text-xs text-center">
                      {t(`niches.${niche}`, niche)}
                    </p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Step 3: Description + Template Preview + Optional Details */}
        {step === 'description' && (
          <div className="p-6 pt-4 animate-fade-in flex flex-col">
            <div className="flex items-center gap-3 mb-6 shrink-0">
              <Button variant="ghost" size="icon" onClick={handleBackToNiche} className="h-10 w-10 rounded-xl shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-xl font-black mb-0.5">{t('aiBuilder.descStep.title')} ✨</h2>
                <p className="text-muted-foreground text-sm">
                  {t('aiBuilder.descStep.hint')}
                </p>
                {selectedNiche && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      {NICHE_ICONS[selectedNiche]} {t(`niches.${selectedNiche}`, selectedNiche)}
                    </span>
                    {initialNiche && (
                      <button
                        type="button"
                        onClick={handleBackToTemplate}
                        className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      >
                        {t('aiBuilder.changeNiche', 'Изменить сферу')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-2">
              {/* Template Preview Card */}
              {selectedTemplate && (
                <div className="p-4 rounded-2xl border border-border/50 bg-muted/20">
                  <div className="flex items-center gap-2 mb-2">
                    <LayoutTemplate className="h-4 w-4 text-primary" />
                    <p className="text-sm font-bold">
                      {t('aiBuilder.previewTitle', 'Будущая структура страницы')}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {selectedTemplate.name} · {selectedTemplateBlocks.length} {t('aiBuilder.blocks', 'блоков')}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTemplateBlocks.slice(0, 8).map((b, i) => (
                      <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                        {b.type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4 bg-muted/30 p-5 rounded-[32px] border border-border/50 shadow-inner">
                <div className="space-y-2">
                  <Label className="text-base font-bold ml-1">{t('aiBuilder.name')} <span className="text-destructive">*</span></Label>
                  <Input
                    value={userInfo.name}
                    onChange={(e) => setUserInfo(p => ({ ...p, name: e.target.value }))}
                    placeholder={t('aiBuilder.namePlaceholder')}
                    className="h-14 rounded-2xl bg-background/80 border-border/30 focus:border-primary/50 text-lg"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-bold ml-1">{t('aiBuilder.descStep.label')}</Label>
                  <Textarea
                    value={userInfo.bio}
                    onChange={(e) => setUserInfo(p => ({ ...p, bio: e.target.value }))}
                    placeholder={t('aiBuilder.descStep.placeholder')}
                    className="rounded-2xl min-h-[100px] bg-background/80 border-border/30 focus:border-primary/50 text-base resize-none leading-relaxed"
                  />
                </div>

                {/* Optional Details (Collapsible) */}
                <Collapsible open={showMoreDetails} onOpenChange={setShowMoreDetails}>
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      <ChevronDown className={cn("h-4 w-4 transition-transform", showMoreDetails && "rotate-180")} />
                      {t('aiBuilder.moreDetailsToggle', 'Добавить детали (необязательно)')}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold ml-1">{t('aiBuilder.servicesLabel', 'Услуги (по строке)')}</Label>
                      <Textarea
                        value={userInfo.services}
                        onChange={(e) => setUserInfo(p => ({ ...p, services: e.target.value }))}
                        placeholder={t('aiBuilder.servicesPlaceholder', 'Маникюр - 5000 тг\nПедикюр - 7000 тг')}
                        className="rounded-2xl min-h-[80px] bg-background/80 border-border/30 text-sm resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold ml-1">{t('aiBuilder.contactsLabel', 'Контакты')}</Label>
                      <Input
                        value={userInfo.contacts}
                        onChange={(e) => setUserInfo(p => ({ ...p, contacts: e.target.value }))}
                        placeholder={t('aiBuilder.contactsPlaceholder', 'Instagram @nick, t.me/user, +77001234567')}
                        className="h-12 rounded-2xl bg-background/80 border-border/30 text-sm"
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleGenerate}
                  disabled={!userInfo.name.trim() || loadingTemplates}
                  className="w-full h-16 rounded-[24px] font-black text-xl shadow-glass-lg transition-all duration-300 hover:scale-[1.02] active:scale-95 group relative overflow-hidden bg-primary"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-transparent animate-shimmer" />
                  <Sparkles className="h-6 w-6 mr-3 group-hover:rotate-12 transition-transform" />
                  {t('aiBuilder.nicheQuestions.generateBtn', 'Сгенерировать магию ✨')}
                </Button>
                <p className="text-center text-xs text-muted-foreground mt-4 px-8">
                  {t('aiBuilder.generatingDesc')}
                </p>
              </div>
            </div>
            </ScrollArea>
          </div>
        )}

        {/* Step 4: Generating */}
        {step === 'generating' && (
          <div className="p-6 py-12 text-center animate-fade-in flex flex-col items-center">
            <div className="relative w-full max-w-sm h-48 mx-auto mb-8 bg-muted/30 rounded-2xl border-2 border-dashed border-primary/20 overflow-hidden flex items-end justify-center pb-4">
              <div className="absolute top-4 inset-x-0 flex justify-center animate-bounce">
                <Wand2 className="h-8 w-8 text-primary drop-shadow-lg" />
              </div>
              <div className="flex flex-col-reverse items-center gap-3 w-full px-8">
                <div className="h-8 w-full bg-primary/20 rounded-lg flex items-center justify-center text-xs text-primary/70 px-2 whitespace-nowrap overflow-hidden">
                  {t('aiBuilder.gen.footer', 'Сборка футера...')}
                </div>
                <div className="h-12 w-full bg-primary/40 rounded-lg flex items-center justify-center text-xs text-primary-foreground font-medium px-2 whitespace-nowrap overflow-hidden">
                  {t('aiBuilder.gen.blocks', 'Настройка блоков...')}
                </div>
                <div className="h-16 w-full bg-primary/60 rounded-lg flex items-center justify-center text-sm text-primary-foreground font-bold shadow-md px-2 whitespace-nowrap overflow-hidden">
                  {userInfo.name || t('aiBuilder.gen.profile', 'Гидратация профиля...')}
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-black mb-3">
              {genPhase === 'template' && t('aiBuilder.phaseTemplate', 'Подбираем шаблон…')}
              {genPhase === 'ai' && t('aiBuilder.phaseAI', 'Спрашиваем у AI…')}
              {genPhase === 'layout' && t('aiBuilder.phaseLayout', 'Раскладываем блоки…')}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t('aiBuilder.generatingDesc', 'Подбираем шаблон, заполняем профиль и раскладываем блоки')}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              {t('common.pleaseWait', 'Пожалуйста, подождите...')}
            </div>
          </div>
        )}

        {/* Step 5: Complete */}
        {step === 'complete' && (
          <div className="p-6 py-12 text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-emerald-500/10 pointer-events-none" />

            <div className="relative z-10 animate-in zoom-in duration-700 max-w-sm w-full text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 ring-4 ring-emerald-500/20">
                <Check className="h-8 w-8 text-emerald-500" />
              </div>

              <h2 className="text-2xl font-black mb-2">
                {t('aiBuilder.complete.title', '✨ Страница готова!')}
              </h2>
              <p className="text-muted-foreground mb-2">
                {t('aiBuilder.complete.desc', 'Опубликуйте её, чтобы получить ссылку и первых посетителей')}
              </p>
              <p className="text-xs text-primary font-semibold mb-6">
                {usedAI
                  ? t('aiBuilder.aiSucceeded', '✓ AI сгенерировал контент')
                  : t('aiBuilder.fallbackUsed', '✓ Шаблон применён')}
              </p>

              <Card className="mb-4 p-3 text-left bg-background/70 border-border/50 rounded-2xl">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-9 w-9 shrink-0 rounded-xl bg-sky-500/10 flex items-center justify-center">
                    <Send className="h-4 w-4 text-sky-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold">
                      {t('aiBuilder.telegramNext.title', 'Следующий шаг: заявки в Telegram')}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t('aiBuilder.telegramNext.desc', 'Подключите уведомления, чтобы сразу видеть новые заявки и записи.')}
                    </p>
                  </div>
                </div>
              </Card>

              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full h-14 rounded-2xl font-black text-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/25"
                  onClick={() => finishWizard({ publish: true })}
                >
                  <Share2 className="h-5 w-5 mr-2" />
                  {t('aiBuilder.complete.publishNow', 'Опубликовать сейчас')}
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-xl"
                  onClick={() => finishWizard({ nextAction: 'connect_telegram' })}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {t('aiBuilder.telegramNext.cta', 'Подключить Telegram')}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full h-12 rounded-xl text-muted-foreground"
                  onClick={() => finishWizard()}
                >
                  {t('aiBuilder.complete.editFirst', 'Сначала отредактировать')}
                </Button>
                {retryCount < MAX_REGENERATE_RETRIES && (
                  <Button
                    variant="outline"
                    className="w-full h-11 rounded-xl text-sm"
                    onClick={handleRegenerate}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t('aiBuilder.regenerate', 'Перегенерировать')}
                    {retryCount > 0 && ` (${MAX_REGENERATE_RETRIES - retryCount})`}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
