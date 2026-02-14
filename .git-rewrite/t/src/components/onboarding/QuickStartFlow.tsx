/**
 * QuickStartFlow - Simplified onboarding for new users
 * 3-step flow: Choose niche → Enter details → AI generates page
 */
import { useState, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Dialog, 
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  Wand2,
  User,
  Zap,
  Layout,
} from 'lucide-react';
import { supabase } from '@/platform/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { NICHES, NICHE_ICONS, type Niche } from '@/lib/niches';
import type { Block } from '@/types/page';

interface QuickStartFlowProps {
  open: boolean;
  onClose: () => void;
  onComplete: (data: {
    profile: { name: string; bio: string };
    blocks: Block[];
    niche: Niche;
  }) => void;
}

type Step = 'intro' | 'niche' | 'details' | 'generating' | 'complete';

// Niche gradient colors for visual appeal
const NICHE_GRADIENTS: Record<Niche, string> = {
  beauty: 'from-pink-500/20 to-rose-500/20',
  fitness: 'from-green-500/20 to-emerald-500/20',
  food: 'from-amber-500/20 to-yellow-500/20',
  education: 'from-yellow-500/20 to-amber-500/20',
  art: 'from-indigo-500/20 to-violet-500/20',
  music: 'from-red-500/20 to-rose-500/20',
  tech: 'from-blue-500/20 to-cyan-500/20',
  business: 'from-teal-500/20 to-green-500/20',
  health: 'from-purple-500/20 to-pink-500/20',
  fashion: 'from-pink-400/20 to-fuchsia-500/20',
  travel: 'from-sky-500/20 to-blue-500/20',
  realestate: 'from-orange-500/20 to-red-500/20',
  events: 'from-violet-500/20 to-purple-500/20',
  services: 'from-gray-500/20 to-slate-500/20',
  other: 'from-gray-400/20 to-gray-500/20',
};

export const QuickStartFlow = memo(function QuickStartFlow({
  open,
  onClose,
  onComplete,
}: QuickStartFlowProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('intro');
  const [selectedNiche, setSelectedNiche] = useState<Niche | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [generating, setGenerating] = useState(false);

  const progress = 
    step === 'intro' ? 0 :
    step === 'niche' ? 33 : 
    step === 'details' ? 66 : 100;

  const handleSelectNiche = (niche: Niche) => {
    setSelectedNiche(niche);
    setStep('details');
  };

  const handleBack = () => {
    if (step === 'details') setStep('niche');
    if (step === 'niche') setStep('intro');
  };

  const handleGenerate = useCallback(async () => {
    if (!selectedNiche || !name.trim()) {
      toast.error(t('onboarding.enterName', 'Введите ваше имя'));
      return;
    }

    setStep('generating');
    setGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-content-generator', {
        body: {
          type: 'niche-builder',
          input: {
            niche: selectedNiche,
            name: name.trim(),
            details: description.trim(),
          },
        },
      });

      if (error) throw error;

      const { profile, blocks } = data.result;
      
      const formattedBlocks: Block[] = blocks.map((block: any, index: number) => ({
        id: `${block.type}-${Date.now()}-${index}`,
        ...block,
      }));

      setStep('complete');
      
      setTimeout(() => {
        toast.success(t('onboarding.pageGenerated', 'Страница создана! 🎉'));
        onComplete({ profile, blocks: formattedBlocks, niche: selectedNiche });
        localStorage.setItem('linkmax_onboarding_completed', 'true');
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Generation error:', error);
      toast.error(t('onboarding.generationFailed', 'Ошибка генерации. Попробуйте ещё раз'));
      setStep('details');
    } finally {
      setGenerating(false);
    }
  }, [selectedNiche, name, description, t, onComplete, onClose]);

  const handleSkip = () => {
    localStorage.setItem('linkmax_onboarding_completed', 'true');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-xl max-h-[90vh] overflow-hidden p-0 gap-0 rounded-[28px] border-0 bg-card/98 backdrop-blur-3xl [&>button]:hidden">
        {/* Accessible but visually hidden title for screen readers */}
        <VisuallyHidden.Root>
          <DialogTitle>{t('quickStart.title', 'Quick Start')}</DialogTitle>
          <DialogDescription>{t('quickStart.description', 'Create your page quickly with AI assistance')}</DialogDescription>
        </VisuallyHidden.Root>
        {/* Progress bar */}
        {step !== 'intro' && (
          <div className="px-6 pt-5">
            <Progress value={progress} className="h-1 rounded-full" />
          </div>
        )}

        {/* Step: Intro */}
        {step === 'intro' && (
          <div className="p-6 pt-10 pb-8 animate-fade-in text-center">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-[24px] bg-gradient-to-br from-primary/20 to-violet-500/20 mb-6">
              <Zap className="h-10 w-10 text-primary" />
            </div>
            
            <h2 className="text-2xl font-black mb-3">
              {t('quickStart.welcomeTitle', 'Создайте страницу за 60 секунд')}
            </h2>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
              {t('quickStart.welcomeDescription', 'AI сгенерирует персональную страницу на основе вашей ниши и описания')}
            </p>

            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full h-14 rounded-2xl text-base font-bold shadow-xl shadow-primary/25"
                onClick={() => setStep('niche')}
              >
                <Wand2 className="h-5 w-5 mr-2" />
                {t('quickStart.startWithAI', 'Создать с AI')}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              
              <Button
                variant="ghost"
                className="w-full h-12 rounded-2xl text-muted-foreground"
                onClick={handleSkip}
              >
                {t('quickStart.skipToEditor', 'Пропустить и создать вручную')}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Niche Selection */}
        {step === 'niche' && (
          <div className="p-5 pt-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleBack}
                className="h-11 w-11 rounded-xl shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-xl font-black">
                  {t('quickStart.nicheTitle', 'Выберите нишу')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t('quickStart.nicheDescription', 'AI подберёт дизайн и блоки')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 max-h-[50vh] overflow-y-auto pb-4 scrollbar-hide">
              {NICHES.map((niche) => (
                <button
                  key={niche}
                  onClick={() => handleSelectNiche(niche)}
                  className={cn(
                    "p-4 rounded-2xl border-2 border-transparent transition-all duration-200",
                    `bg-gradient-to-br ${NICHE_GRADIENTS[niche]}`,
                    "hover:scale-[1.02] active:scale-[0.98]",
                    selectedNiche === niche && "ring-2 ring-primary ring-offset-2"
                  )}
                >
                  <div className="text-2xl mb-2">{NICHE_ICONS[niche]}</div>
                  <p className="font-bold text-xs text-center leading-tight">
                    {t(`niches.${niche}`, niche)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Details Input */}
        {step === 'details' && selectedNiche && (
          <div className="p-5 pt-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleBack}
                className="h-11 w-11 rounded-xl shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-xl font-black">
                  {t('quickStart.detailsTitle', 'Расскажите о себе')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t('quickStart.detailsDescription', 'AI персонализирует страницу')}
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  {t('quickStart.yourName', 'Ваше имя')} *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('quickStart.namePlaceholder', 'Как вас зовут?')}
                  className="h-13 rounded-xl text-base px-4"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-500" />
                  {t('quickStart.additionalDetails', 'Описание (опционально)')}
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('quickStart.detailsPlaceholder', 'Чем занимаетесь? Какие услуги предоставляете?')}
                  className="min-h-[100px] rounded-xl text-base p-4 resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {t('quickStart.detailsHint', 'Чем подробнее - тем лучше результат')}
                </p>
              </div>
            </div>

            <div className="pt-6 flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleSkip}
                className="flex-1 h-13 rounded-xl font-bold"
              >
                {t('common.skip', 'Пропустить')}
              </Button>
              <Button 
                onClick={handleGenerate} 
                disabled={!name.trim()}
                className="flex-[2] h-13 rounded-xl font-bold shadow-lg shadow-primary/25"
              >
                <Wand2 className="h-5 w-5 mr-2" />
                {t('quickStart.generate', 'Создать')}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Generating */}
        {step === 'generating' && (
          <div className="p-6 py-16 text-center animate-fade-in">
            <div className="relative mx-auto w-24 h-24 mb-8">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-violet-500 to-pink-500 animate-spin" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-2 rounded-full bg-background flex items-center justify-center">
                <Wand2 className="h-8 w-8 text-primary animate-pulse" />
              </div>
            </div>
            <h3 className="text-xl font-black mb-2">
              {t('quickStart.generatingTitle', 'AI создаёт страницу')}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t('quickStart.generatingDescription', 'Подбираем блоки и контент специально для вас')}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('common.pleaseWait', 'Пожалуйста, подождите...')}
            </div>
          </div>
        )}

        {/* Step: Complete */}
        {step === 'complete' && (
          <div className="p-6 py-16 text-center animate-scale-in">
            <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
              <Check className="h-10 w-10 text-emerald-500" />
            </div>
            <h3 className="text-xl font-black mb-2">
              {t('quickStart.completeTitle', 'Готово! 🎉')}
            </h3>
            <p className="text-muted-foreground">
              {t('quickStart.completeDescription', 'Страница создана и готова к редактированию')}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});
