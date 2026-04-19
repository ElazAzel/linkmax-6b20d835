/**
 * AIBuilderWizard — deterministic smart page builder
 * Step 1: User info (name, bio, contacts, services, socials, media links)
 * Step 2: Niche selection
 * Step 3: Business input
 * Step 4: deterministic generation (no AI / no edge function)
 * Step 5: Complete
 */
import { useState, useCallback, useEffect } from 'react';
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
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Check from 'lucide-react/dist/esm/icons/check';
import Share2 from 'lucide-react/dist/esm/icons/share-2';
import Wand2 from 'lucide-react/dist/esm/icons/wand-2';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/utils';
import type { Block } from '@/types/page';
import { NICHES, NICHE_ICONS, ONBOARDING_GOALS, GOAL_ICONS, type Niche, type OnboardingGoal } from '@/lib/niches';
import { storage } from '@/lib/storage';
import { buildSmartPage, type SmartBuilderUserInfo } from '@/lib/onboarding/smart-page-builder';

interface AIBuilderWizardProps {
  open: boolean;
  onClose: () => void;
  /** Called with generated blocks (to be APPENDED to existing) and optional profile */
  onComplete: (profile: { name: string; bio: string }, blocks: Block[], niche: Niche) => void;
  /** If true, this is first-time onboarding popup */
  isOnboarding?: boolean;
}

type UserInfo = SmartBuilderUserInfo;

type Step = 'goal' | 'niche' | 'description' | 'generating' | 'complete';

const STEPS: Step[] = ['goal', 'niche', 'description', 'generating', 'complete'];

function getStepProgress(step: Step): number {
  const idx = STEPS.indexOf(step);
  return Math.round(((idx + 1) / STEPS.length) * 100);
}

export function AIBuilderWizard({ open, onClose, onComplete, isOnboarding = false }: AIBuilderWizardProps) {
  const { t } = useTranslation();

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
  const [generatedBlocks, setGeneratedBlocks] = useState<Block[]>([]);
  const [generatedProfile, setGeneratedProfile] = useState<{ name: string; bio: string } | null>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep('goal');
      setSelectedGoal(null);
      setSelectedNiche(null);
      setGeneratedBlocks([]);
      setGeneratedProfile(null);
    }
  }, [open]);


  const handleSelectGoal = (goal: OnboardingGoal) => {
    setSelectedGoal(goal);
    setUserInfo(p => ({ ...p, goal }));
    setStep('niche');
  };

  const handleSelectNiche = (niche: Niche) => {
    setSelectedNiche(niche);
    setStep('description');
  };

  const handleBackToGoal = () => {
    setStep('goal');
  };

  const handleBackToNiche = () => {
    setStep('niche');
  };

  const handleGenerate = useCallback(async () => {
    if (!selectedNiche) {
      toast.error(t('aiBuilder.selectTemplate', 'Select a business category'));
      return;
    }

    setStep('generating');

    try {
      const result = buildSmartPage({
        userInfo: { ...userInfo, goal: selectedGoal ?? userInfo.goal },
        niche: selectedNiche,
        goal: selectedGoal,
      });

      await new Promise(resolve => setTimeout(resolve, 700));

      setGeneratedBlocks(result.blocks);
      setGeneratedProfile(result.profile);
      setStep('complete');
    } catch (err) {
      console.error('Smart Builder error:', err);
      toast.error(t('aiBuilder.error', 'Could not build the page. Try again.'));
      setStep('description');
    }
  }, [selectedNiche, userInfo, selectedGoal, t]);
  const handleSkip = () => {
    storage.set('niche_onboarding_completed', 'true');
    storage.set('onboarding_completed', 'true');
    onClose();
  };


  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[95vh] overflow-hidden p-0 gap-0 rounded-[24px] border-0 bg-card/98 backdrop-blur-3xl">
        <DialogTitle className="sr-only">Умный конструктор LinkMAX</DialogTitle>
        <DialogDescription className="sr-only">
          Алгоритмы LinkMAX собирают страницу без AI и внешних генераторов.
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
                Что должна сделать страница?
              </h2>
              <p className="text-muted-foreground text-sm">
                Выберите главный результат, а конструктор подберёт структуру.
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
                <h2 className="text-xl font-black mb-0.5">Дайте алгоритму факты</h2>
                <p className="text-muted-foreground text-sm">
                  Чем точнее оффер и контакты, тем ближе страница к публикации.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4 bg-muted/30 p-5 rounded-[32px] border border-border/50 shadow-inner">
                <div className="space-y-2">
                  <Label className="text-base font-bold ml-1">Имя или название <span className="text-destructive">*</span></Label>
                  <Input
                    value={userInfo.name}
                    onChange={(e) => setUserInfo(p => ({ ...p, name: e.target.value }))}
                    placeholder="Например: Алия, психолог-консультант"
                    className="h-14 rounded-2xl bg-background/80 border-border/30 focus:border-primary/50 text-lg"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-bold ml-1">Кто вы и чем помогаете</Label>
                  <Textarea
                    value={userInfo.bio}
                    onChange={(e) => setUserInfo(p => ({ ...p, bio: e.target.value }))}
                    placeholder="Коротко: для кого вы, какой результат даёте, чем отличаетесь."
                    className="rounded-2xl min-h-[120px] bg-background/80 border-border/30 focus:border-primary/50 text-base resize-none leading-relaxed"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-bold ml-1">Услуги или продукты</Label>
                  <Textarea
                    value={userInfo.services}
                    onChange={(e) => setUserInfo(p => ({ ...p, services: e.target.value }))}
                    placeholder="Консультация 15000 тг, сопровождение 80000 тг, аудит 45000 тг"
                    className="rounded-2xl min-h-[96px] bg-background/80 border-border/30 focus:border-primary/50 text-base resize-none leading-relaxed"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-base font-bold ml-1">Контакты</Label>
                    <Input
                      value={userInfo.contacts}
                      onChange={(e) => setUserInfo(p => ({ ...p, contacts: e.target.value }))}
                      placeholder="+7 777 000 00 00, @telegram"
                      className="h-12 rounded-2xl bg-background/80 border-border/30 focus:border-primary/50 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-bold ml-1">Соцсети</Label>
                    <Input
                      value={userInfo.socials}
                      onChange={(e) => setUserInfo(p => ({ ...p, socials: e.target.value }))}
                      placeholder="instagram.com/name, t.me/name"
                      className="h-12 rounded-2xl bg-background/80 border-border/30 focus:border-primary/50 text-base"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleGenerate}
                  disabled={!userInfo.name.trim()}
                  className="w-full h-16 rounded-[24px] font-black text-xl shadow-glass-lg transition-all duration-300 hover:scale-[1.02] active:scale-95 group relative overflow-hidden bg-primary"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-transparent animate-shimmer" />
                  <Sparkles className="h-6 w-6 mr-3 group-hover:rotate-12 transition-transform" />
                  Собрать страницу
                </Button>
                <p className="text-center text-xs text-muted-foreground mt-4 px-8">
                  Без AI: скоринг оффера, выбор revenue-flow, CTA, доверие, контакты и адаптивная сетка.
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
                  {userInfo.socials ? 'Подключение соцсетей...' : 'Сборка контактов...'}
                </div>
                <div className="h-12 w-full bg-primary/40 rounded-lg animate-in fade-in slide-in-from-bottom duration-500 delay-200 flex items-center justify-center text-xs text-primary/80 font-medium overflow-hidden px-2 whitespace-nowrap">
                  {userInfo.services ? `Парсинг услуг: ${userInfo.services.slice(0, 15)}...` : 'Настройка блоков...'}
                </div>
                <div className="h-16 w-full bg-primary/60 rounded-lg animate-in fade-in slide-in-from-bottom duration-500 delay-100 flex items-center justify-center text-sm text-primary-foreground font-bold shadow-md overflow-hidden px-2 whitespace-nowrap">
                  {userInfo.name ? userInfo.name : 'Гидратация профиля...'}
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-black mb-3">
              Алгоритм собирает страницу
            </h3>
            <p className="text-muted-foreground mb-6">
              Подбираем revenue-flow, порядок блоков, CTA и быстрые действия.
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
                    onComplete(
                      generatedProfile ?? { name: userInfo.name, bio: userInfo.bio || '' },
                      generatedBlocks,
                      selectedNiche!
                    );
                    storage.set('ai_builder_used', 'true');
                    storage.set('smart_builder_used', 'true');
                    storage.set('niche_onboarding_completed', 'true');
                    storage.set('onboarding_completed', 'true');
                    storage.set('wizard_wants_publish', 'true');
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
                    onComplete(
                      generatedProfile ?? { name: userInfo.name, bio: userInfo.bio || '' },
                      generatedBlocks,
                      selectedNiche!
                    );
                    storage.set('ai_builder_used', 'true');
                    storage.set('smart_builder_used', 'true');
                    storage.set('niche_onboarding_completed', 'true');
                    storage.set('onboarding_completed', 'true');
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
