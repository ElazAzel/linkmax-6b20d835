/**
 * Deterministic page builder wizard.
 *
 * The filename/export are kept for compatibility with existing dashboard
 * imports. Page generation itself is entirely local: niche recipes, parsers,
 * block factory and layout rules are the only generation dependencies.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import Check from 'lucide-react/dist/esm/icons/check';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import LayoutTemplate from 'lucide-react/dist/esm/icons/layout-template';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Send from 'lucide-react/dist/esm/icons/send';
import Share2 from 'lucide-react/dist/esm/icons/share-2';
import Wand2 from 'lucide-react/dist/esm/icons/wand-2';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils/utils';
import { getAlgorithmicTemplateForNiche } from '@/lib/blocks/algorithmic-templates';
import { generateBlocksFromTemplate } from '@/lib/blocks/internal-builder';
import { trackWizardCompleted, trackWizardNicheSelected, trackWizardStarted } from '@/lib/activation-events';
import { NICHES, NICHE_ICONS, ONBOARDING_GOALS, GOAL_ICONS, type Niche, type OnboardingGoal } from '@/lib/niches';
import { storage } from '@/lib/storage';
import { trackCurrentUserProductEvent } from '@/services/product-analytics';
import type { Block } from '@/types/page';

interface AlgorithmicTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  blocks: ReturnType<typeof getAlgorithmicTemplateForNiche>;
  preview_image: string | null;
  is_premium: boolean;
}

interface UserInfo {
  name: string;
  bio: string;
  goal?: OnboardingGoal;
  contacts: string;
  services: string;
  socials: string;
  mediaLinks: string;
}

interface AIBuilderWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: (profile: { name: string; bio: string }, blocks: Block[], niche: Niche) => void;
  isOnboarding?: boolean;
  initialNiche?: Niche;
  pageId?: string;
  signupContext?: { from?: string; refSlug?: string; desiredSlug?: string };
}

type Step = 'goal' | 'niche' | 'description' | 'generating' | 'complete';
const STEPS: Step[] = ['goal', 'niche', 'description', 'generating', 'complete'];
const MAX_REGENERATE_RETRIES = 2;

function getStepProgress(step: Step): number {
  return Math.round(((STEPS.indexOf(step) + 1) / STEPS.length) * 100);
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
  const [step, setStep] = useState<Step>('goal');
  const [selectedGoal, setSelectedGoal] = useState<OnboardingGoal | null>(null);
  const [selectedNiche, setSelectedNiche] = useState<Niche | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<AlgorithmicTemplate | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: '', bio: '', contacts: '', services: '', socials: '', mediaLinks: '',
  });
  const [generatedBlocks, setGeneratedBlocks] = useState<Block[]>([]);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const startTrackedForOpenRef = useRef(false);

  const templateBlockTypes = useMemo(
    () => selectedTemplate?.blocks.map((block) => block.type) ?? [],
    [selectedTemplate],
  );

  useEffect(() => {
    if (!open) {
      startTrackedForOpenRef.current = false;
      return;
    }
    setStep('goal');
    setSelectedGoal(null);
    setSelectedNiche(initialNiche ?? null);
    setSelectedTemplate(null);
    setGeneratedBlocks([]);
    setRetryCount(0);
    setGenerationError(null);
    if (pageId && !startTrackedForOpenRef.current) {
      trackWizardStarted(pageId);
      startTrackedForOpenRef.current = true;
    }
  }, [initialNiche, open, pageId]);

  const selectNiche = useCallback((niche: Niche) => {
    setSelectedNiche(niche);
    setSelectedTemplate({
      id: `algorithmic-${niche}`,
      name: t('algorithmBuilder.templateName', 'Алгоритмический шаблон'),
      description: t('algorithmBuilder.templateDescription', 'Структура подбирается по сфере и цели'),
      category: niche,
      blocks: getAlgorithmicTemplateForNiche(niche),
      preview_image: null,
      is_premium: false,
    });
    if (pageId) trackWizardNicheSelected(pageId, niche);
    setStep('description');
  }, [pageId, t]);

  const handleSelectGoal = (goal: OnboardingGoal) => {
    setSelectedGoal(goal);
    setUserInfo((previous) => ({ ...previous, goal }));
    if (initialNiche) {
      selectNiche(initialNiche);
    } else {
      setStep('niche');
    }
  };

  const runGeneration = useCallback(async () => {
    if (!selectedNiche || !selectedTemplate) return;
    setStep('generating');
    setGenerationError(null);
    await Promise.resolve();

    try {
      const blocks = generateBlocksFromTemplate(selectedTemplate.blocks, userInfo);
      if (blocks.length === 0) throw new Error('algorithm-produced-empty-page');
      setGeneratedBlocks(blocks);
      setStep('complete');
      if (pageId) {
        void trackCurrentUserProductEvent('page_generated', {
          pageId,
          metadata: {
            niche: selectedNiche,
            goal: selectedGoal ?? undefined,
            blocksCount: blocks.length,
            templateId: selectedTemplate.id,
            generationMode: 'algorithmic',
          },
        });
      }
    } catch (error) {
      console.error('Deterministic page generation failed', error);
      setGenerationError(t('algorithmBuilder.error', 'Не удалось собрать страницу. Проверьте введённые данные.'));
      setStep('description');
    }
  }, [pageId, selectedGoal, selectedNiche, selectedTemplate, t, userInfo]);

  const finishWizard = (options?: { publish?: boolean; nextAction?: 'connect_telegram' }) => {
    if (!selectedNiche) return;
    if (options?.publish) storage.set('wizard_wants_publish', 'true');
    if (options?.nextAction) storage.set('wizard_next_action', options.nextAction);
    if (pageId) trackWizardCompleted(pageId, selectedNiche);
    onComplete({ name: userInfo.name, bio: userInfo.bio }, generatedBlocks, selectedNiche);
    toast.success(t('algorithmBuilder.success', 'Страница собрана по алгоритму'));
  };

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) onClose(); }}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[95vh] overflow-hidden p-0 gap-0 rounded-[24px] border-0 bg-card/98 backdrop-blur-3xl">
        <DialogTitle className="sr-only">{t('algorithmBuilder.title', 'Конструктор страницы')}</DialogTitle>
        <DialogDescription className="sr-only">{t('algorithmBuilder.description', 'Создайте страницу по алгоритму')}</DialogDescription>
        <div className="px-6 pt-6">
          <Progress value={getStepProgress(step)} className="h-1.5 rounded-full" />
          <div className="mt-2 text-xs text-muted-foreground">{t('aiBuilder.step', 'Шаг')} {STEPS.indexOf(step) + 1}/{STEPS.length}</div>
        </div>

        {step === 'goal' && (
          <div className="p-6 pt-4 text-center sm:text-left">
            <h2 className="mb-1 text-2xl font-black">{t('aiBuilder.goals.title', 'Что должна делать страница?')}</h2>
            <p className="mb-6 text-sm text-muted-foreground">{t('aiBuilder.goals.subtitle', 'Алгоритм подберёт структуру под вашу задачу')}</p>
            <div className="grid grid-cols-1 gap-3 pb-4 sm:grid-cols-2">
              {ONBOARDING_GOALS.map((goal) => (
                <button key={goal} onClick={() => handleSelectGoal(goal)} className="group flex items-center gap-4 rounded-3xl border-2 border-border/50 bg-card/40 p-5 text-left transition-all hover:scale-[1.02] hover:border-primary/50">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-3xl">{GOAL_ICONS[goal]}</div>
                  <div><p className="text-lg font-bold leading-tight">{t(`aiBuilder.goals.${goal}`, goal)}</p><p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{t(`aiBuilder.goals.${goal}Desc`, '')}</p></div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'niche' && (
          <div className="p-6 pt-4">
            <div className="mb-6 flex items-center gap-3"><Button variant="ghost" size="icon" onClick={() => setStep('goal')}><ArrowLeft className="h-5 w-5" /></Button><div><h2 className="text-xl font-black">{t('aiBuilder.nicheTitle', 'Выберите сферу')}</h2><p className="text-sm text-muted-foreground">{t('aiBuilder.nicheDesc', 'Подберём структуру под вашу деятельность')}</p></div></div>
            <ScrollArea className="max-h-[55vh]"><div className="grid grid-cols-2 gap-3 pb-4 px-1 sm:grid-cols-3">
              {NICHES.map((niche) => <button key={niche} onClick={() => selectNiche(niche)} className="flex flex-col items-center gap-2 rounded-3xl border-2 border-border/50 bg-card/20 p-4 transition-all hover:scale-[1.02] hover:border-primary/40"><span className="text-3xl">{NICHE_ICONS[niche]}</span><p className="text-center text-xs font-semibold">{t(`niches.${niche}`, niche)}</p></button>)}
            </div></ScrollArea>
          </div>
        )}

        {step === 'description' && (
          <div className="flex flex-col p-6 pt-4">
            <div className="mb-6 flex items-center gap-3"><Button variant="ghost" size="icon" onClick={() => setStep(initialNiche ? 'goal' : 'niche')}><ArrowLeft className="h-5 w-5" /></Button><div><h2 className="text-xl font-black">{t('algorithmBuilder.descriptionTitle', 'Заполните основу страницы')}</h2><p className="text-sm text-muted-foreground">{t('algorithmBuilder.descriptionHint', 'Алгоритм извлечёт услуги, контакты, цены и ссылки')}</p></div></div>
            <ScrollArea className="max-h-[60vh]"><div className="space-y-4 pr-2">
              {selectedTemplate && <div className="rounded-2xl border border-border/50 bg-muted/20 p-4"><div className="mb-2 flex items-center gap-2"><LayoutTemplate className="h-4 w-4 text-primary" /><p className="text-sm font-bold">{selectedTemplate.name}</p></div><p className="mb-3 text-xs text-muted-foreground">{selectedTemplate.description} · {templateBlockTypes.length} блоков</p><div className="flex flex-wrap gap-1.5">{templateBlockTypes.map((type) => <span key={type} className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">{type}</span>)}</div></div>}
              <div className="space-y-4 rounded-[32px] border border-border/50 bg-muted/30 p-5 shadow-inner">
                <div className="space-y-2"><Label>{t('aiBuilder.name', 'Имя или название')}</Label><Input value={userInfo.name} onChange={(event) => setUserInfo((p) => ({ ...p, name: event.target.value }))} placeholder={t('aiBuilder.namePlaceholder', 'Например, LinkMAX Studio')} className="h-14 rounded-2xl bg-background/80 text-lg" autoFocus /></div>
                <div className="space-y-2"><Label>{t('aiBuilder.descStep.label', 'О вас и вашем предложении')}</Label><Textarea value={userInfo.bio} onChange={(event) => setUserInfo((p) => ({ ...p, bio: event.target.value }))} placeholder={t('aiBuilder.descStep.placeholder', 'Коротко расскажите, чем вы полезны')} className="min-h-[100px] rounded-2xl bg-background/80 text-base" /></div>
                <Collapsible open={showMoreDetails} onOpenChange={setShowMoreDetails}><CollapsibleTrigger asChild><button type="button" className="flex items-center gap-2 text-sm font-semibold text-primary"><ChevronDown className={cn('h-4 w-4 transition-transform', showMoreDetails && 'rotate-180')} />{t('algorithmBuilder.moreDetails', 'Добавить услуги, контакты и ссылки')}</button></CollapsibleTrigger><CollapsibleContent className="space-y-4 pt-3"><Textarea value={userInfo.services} onChange={(event) => setUserInfo((p) => ({ ...p, services: event.target.value }))} placeholder={t('aiBuilder.servicesPlaceholder', 'Маникюр — 5000 тг\nПедикюр — 7000 тг')} /><Input value={userInfo.contacts} onChange={(event) => setUserInfo((p) => ({ ...p, contacts: event.target.value }))} placeholder={t('aiBuilder.contactsPlaceholder', 'Instagram @nick, t.me/user, +77001234567')} /><Input value={userInfo.socials} onChange={(event) => setUserInfo((p) => ({ ...p, socials: event.target.value }))} placeholder={t('algorithmBuilder.socialsPlaceholder', 'Instagram: @brand')} /><Input value={userInfo.mediaLinks} onChange={(event) => setUserInfo((p) => ({ ...p, mediaLinks: event.target.value }))} placeholder={t('algorithmBuilder.mediaPlaceholder', 'Ссылки на видео или изображения через запятую')} /></CollapsibleContent></Collapsible>
              </div>
              {generationError && <p className="text-sm text-destructive">{generationError}</p>}
              <Button disabled={!userInfo.name.trim()} onClick={() => void runGeneration()} className="h-16 w-full rounded-[24px] text-xl font-black"><Wand2 className="mr-3 h-6 w-6" />{t('algorithmBuilder.generate', 'Собрать страницу')}</Button>
              <p className="text-center text-xs text-muted-foreground">{t('algorithmBuilder.generatingDesc', 'Работает локальный алгоритм: без AI, ожидания внешнего сервиса и скрытых вызовов')}</p>
            </div></ScrollArea>
          </div>
        )}

        {step === 'generating' && <div className="flex flex-col items-center p-6 py-16 text-center"><div className="mb-8 flex h-40 w-full max-w-sm items-end justify-center rounded-2xl border-2 border-dashed border-primary/20 bg-muted/30 pb-4"><div className="flex flex-col items-center gap-3"><Wand2 className="h-8 w-8 animate-bounce text-primary" /><Loader2 className="h-5 w-5 animate-spin text-primary" /></div></div><h3 className="mb-3 text-2xl font-black">{t('algorithmBuilder.generating', 'Собираем страницу по алгоритму…')}</h3><p className="text-muted-foreground">{t('algorithmBuilder.generatingDesc', 'Извлекаем данные, создаём блоки и выстраиваем порядок')}</p></div>}

        {step === 'complete' && <div className="relative flex min-h-[400px] flex-col items-center justify-center overflow-hidden p-6 py-12 text-center"><div className="relative z-10 w-full max-w-sm"><div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 ring-4 ring-emerald-500/20"><Check className="h-8 w-8 text-emerald-500" /></div><h2 className="mb-2 text-2xl font-black">{t('algorithmBuilder.completeTitle', 'Страница готова')}</h2><p className="mb-2 text-muted-foreground">{t('algorithmBuilder.completeDesc', 'Блоки собраны. Перед публикацией их можно отредактировать.')}</p><p className="mb-6 text-xs font-semibold text-primary">{generatedBlocks.length} {t('algorithmBuilder.blocksCreated', 'блоков создано алгоритмом')}</p><Card className="mb-4 rounded-2xl border-border/50 bg-background/70 p-3 text-left"><div className="flex items-start gap-3"><Send className="mt-1 h-4 w-4 text-sky-500" /><p className="text-xs text-muted-foreground">{t('algorithmBuilder.nextStep', 'После сохранения вы сможете проверить страницу в preview и опубликовать её.')}</p></div></Card><div className="space-y-3"><Button size="lg" className="h-14 w-full rounded-2xl bg-emerald-500 text-lg font-black text-white hover:bg-emerald-600" onClick={() => finishWizard({ publish: true })}><Share2 className="mr-2 h-5 w-5" />{t('aiBuilder.complete.publishNow', 'Опубликовать сейчас')}</Button><Button variant="outline" className="h-12 w-full rounded-xl" onClick={() => finishWizard({ nextAction: 'connect_telegram' })}><Send className="mr-2 h-4 w-4" />{t('aiBuilder.telegramNext.cta', 'Подключить Telegram')}</Button><Button variant="ghost" className="h-12 w-full rounded-xl text-muted-foreground" onClick={() => finishWizard()}>{t('aiBuilder.complete.editFirst', 'Сначала отредактировать')}</Button>{retryCount < MAX_REGENERATE_RETRIES && <Button variant="outline" className="h-11 w-full rounded-xl text-sm" onClick={() => { setRetryCount((count) => count + 1); void runGeneration(); }}><RefreshCw className="mr-2 h-4 w-4" />{t('algorithmBuilder.regenerate', 'Пересобрать по алгоритму')}</Button>}</div></div></div>}
      </DialogContent>
    </Dialog>
  );
}
