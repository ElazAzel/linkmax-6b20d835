/**
 * AIBuilderWizard — 5-step stepper wizard
 * Step 1: User info (name, bio, contacts, services, socials, media links)
 * Step 2: Niche selection (from templates DB categories)
 * Step 3: Template carousel (admin templates from DB)
 * Step 4: AI generating (fills template with personalized content)
 * Step 5: Complete
 */
import { useState, useCallback, useEffect, useMemo } from 'react';
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
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Check from 'lucide-react/dist/esm/icons/check';
import Share2 from 'lucide-react/dist/esm/icons/share-2';
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

// Whitelist of block types supported by the editor (must match block-factory.ts)
const KNOWN_BLOCK_TYPES = new Set([
  'profile', 'link', 'button', 'text', 'image', 'socials', 'product', 'video',
  'carousel', 'messenger', 'form', 'testimonial', 'separator', 'catalog',
  'faq', 'countdown', 'pricing', 'booking',
]);

const AI_TIMEOUT_MS = 25000;
const MAX_REGENERATE_RETRIES = 2;

interface AIBuilderWizardProps {
  open: boolean;
  onClose: () => void;
  /** Called with generated blocks (to be APPENDED to existing) and optional profile */
  onComplete: (profile: { name: string; bio: string }, blocks: Block[], niche: Niche) => void;
  /** If true, this is first-time onboarding popup */
  isOnboarding?: boolean;
}

interface DBTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  blocks: any;
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

export function AIBuilderWizard({ open, onClose, onComplete, isOnboarding = false }: AIBuilderWizardProps) {
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

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep('goal');
      setSelectedGoal(null);
      setSelectedNiche(null);
      setSelectedTemplate(null);
      setShowMoreDetails(false);
      setUsedAI(false);
      setRetryCount(0);
    }
  }, [open]);


  const handleSelectGoal = (goal: OnboardingGoal) => {
    setSelectedGoal(goal);
    setUserInfo(p => ({ ...p, goal }));
    setStep('niche');
  };

  const handleSelectNiche = async (niche: Niche) => {
    setSelectedNiche(niche);
    
    // Automatically pick the first template for the niche to reduce friction
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
        // Fallback for niches without templates
        setSelectedTemplate({
          id: 'basic-niche-template',
          name: t(`niches.${niche}`, niche),
          description: null,
          category: niche,
          blocks: [
            { type: 'profile' },
            { type: 'catalog' },
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

    setStep('description');
  };

  const handleBackToGoal = () => {
    setStep('goal');
  };

  const handleBackToNiche = () => {
    setStep('niche');
  };

  const handleBackToTemplate = () => {
    setStep('niche'); // Since we skip template selection, back from description goes to niche
  };

  const handleGenerate = useCallback(async () => {
    if (!selectedNiche || !selectedTemplate) {
      toast.error(t('aiBuilder.selectTemplate', 'Выберите шаблон'));
      return;
    }

    if (!canUseAIPageGeneration()) {
      toast.error(t('freemium.aiLimitReached', 'Лимит AI генераций исчерпан'));
      return;
    }

    setStep('generating');

    let finalBlocks: Block[] = [];
    let aiProfile: { name?: string; bio?: string } | null = null;

    // 1) Try real AI generation via niche-builder edge function
    try {
      const details = [
        userInfo.bio,
        userInfo.services ? `Услуги: ${userInfo.services}` : '',
        userInfo.contacts ? `Контакты: ${userInfo.contacts}` : '',
        userInfo.socials ? `Соцсети: ${userInfo.socials}` : '',
        selectedGoal ? `Цель: ${t(`aiBuilder.goals.${selectedGoal}`, selectedGoal)}` : '',
      ].filter(Boolean).join('\n');

      const { data, error } = await supabase.functions.invoke('ai-content-generator', {
        body: {
          type: 'niche-builder',
          input: {
            niche: selectedNiche,
            name: userInfo.name,
            details,
          },
        },
      });

      if (error) throw error;
      const aiBlocks = Array.isArray(data?.blocks) ? data.blocks : null;
      if (aiBlocks && aiBlocks.length > 0) {
        // Normalize AI blocks through createBaseBlock to ensure ids/positions
        finalBlocks = aiBlocks.map((b: any, idx: number) => {
          const base = createBaseBlock(b.type || 'text');
          return { ...base, ...b, position: idx } as Block;
        });
        aiProfile = data?.profile || null;
      }
    } catch (err) {
      console.warn('niche-builder failed, falling back to template:', err);
    }

    // 2) Fallback to deterministic template if AI failed or returned empty
    if (finalBlocks.length === 0) {
      finalBlocks = generateBlocksFromTemplate(
        Array.isArray(selectedTemplate.blocks) ? selectedTemplate.blocks : [],
        { ...userInfo, bio: userInfo.bio }
      );
    }

    incrementAIPageGeneration();

    // Update profile bio from AI if user left it empty
    if (aiProfile?.bio && !userInfo.bio) {
      setUserInfo(p => ({ ...p, bio: aiProfile!.bio! }));
    }

    setGeneratedBlocks(finalBlocks);
    setStep('complete');
  }, [selectedNiche, selectedTemplate, userInfo, selectedGoal, canUseAIPageGeneration, incrementAIPageGeneration, t]);

  const handleSkip = () => {
    storage.set('onboarding_completed', 'true');
    onClose();
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
              {ONBOARDING_GOALS.map((goal) => (
                <button
                  key={goal}
                  onClick={() => handleSelectGoal(goal)}
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

        {/* Step 3: Simplified Description */}
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
              </div>
            </div>

            <div className="space-y-6">
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
                    className="rounded-2xl min-h-[120px] bg-background/80 border-border/30 focus:border-primary/50 text-base resize-none leading-relaxed"
                  />
                </div>
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
          </div>
        )}

        {/* Step 4: Generating */}
        {step === 'generating' && (
          <div className="p-6 py-12 text-center animate-fade-in flex flex-col items-center">
            {/* Animation Container */}
            <div className="relative w-full max-w-sm h-48 mx-auto mb-8 bg-muted/30 rounded-2xl border-2 border-dashed border-primary/20 overflow-hidden flex items-end justify-center pb-4">
              {/* Magic Wand hovering */}
              <div className="absolute top-4 inset-x-0 flex justify-center animate-bounce">
                <Wand2 className="h-8 w-8 text-primary shadow-primary/50 drop-shadow-lg" />
              </div>

              {/* Simulated blocks building up */}
              <div className="flex flex-col-reverse items-center gap-3 w-full px-8">
                <div className="h-8 w-full bg-primary/20 rounded-lg animate-in fade-in slide-in-from-bottom duration-500 delay-300 flex items-center justify-center text-xs text-primary/70 overflow-hidden px-2 whitespace-nowrap">
                  {userInfo.socials ? t('aiBuilder.gen.socials', 'Подключение соцсетей...') : t('aiBuilder.gen.footer', 'Сборка футера...')}
                </div>
                <div className="h-12 w-full bg-primary/40 rounded-lg animate-in fade-in slide-in-from-bottom duration-500 delay-200 flex items-center justify-center text-xs text-primary/80 font-medium overflow-hidden px-2 whitespace-nowrap">
                  {userInfo.services ? `${t('aiBuilder.gen.services', 'Парсинг услуг:')} ${userInfo.services.slice(0, 15)}...` : t('aiBuilder.gen.blocks', 'Настройка блоков...')}
                </div>
                <div className="h-16 w-full bg-primary/60 rounded-lg animate-in fade-in slide-in-from-bottom duration-500 delay-100 flex items-center justify-center text-sm text-primary-foreground font-bold shadow-md overflow-hidden px-2 whitespace-nowrap">
                  {userInfo.name ? userInfo.name : t('aiBuilder.gen.profile', 'Гидратация профиля...')}
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-black mb-3">
              {t('aiBuilder.generatingTitle', 'AI собирает вашу страницу')}
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

        {/* Step 5: Complete (Gamified Certificate) */}
        {step === 'complete' && (
          <div className="p-6 py-12 text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-emerald-500/10 pointer-events-none" />

            <div className="relative z-10 animate-in zoom-in duration-700 max-w-sm w-full text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 ring-4 ring-emerald-500/20">
                <Check className="h-8 w-8 text-emerald-500" />
              </div>

              <h2 className="text-2xl font-black mb-2">
                {t('aiBuilder.complete.title', '✨ Страница готова!')}
              </h2>
              <p className="text-muted-foreground mb-6">
                {t('aiBuilder.complete.desc', 'Опубликуйте её, чтобы получить ссылку и первых посетителей')}
              </p>

              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full h-14 rounded-2xl font-black text-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/25"
                  onClick={() => {
                    storage.set('onboarding_completed', 'true');
                    storage.set('wizard_wants_publish', 'true');
                    onComplete(
                      { name: userInfo.name, bio: userInfo.bio || '' },
                      generatedBlocks,
                      selectedNiche!
                    );
                    toast.success(t('aiBuilder.success', '✨ Страница создана!'));
                    onClose();
                  }}
                >
                  <Share2 className="h-5 w-5 mr-2" />
                  {t('aiBuilder.complete.publishNow', 'Опубликовать сейчас')}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full h-12 rounded-xl text-muted-foreground"
                  onClick={() => {
                    storage.set('onboarding_completed', 'true');
                    onComplete(
                      { name: userInfo.name, bio: userInfo.bio || '' },
                      generatedBlocks,
                      selectedNiche!
                    );
                    onClose();
                  }}
                >
                  {t('aiBuilder.complete.editFirst', 'Сначала отредактировать')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
